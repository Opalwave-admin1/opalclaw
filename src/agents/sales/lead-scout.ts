/**
 * OpalWave Lead Scout
 * Finds recently funded startups and scores them as OpalWave prospects.
 * Trigger: Monday 8 AM PST | Manual: @Opal /find-leads [industry]
 */

import { WebClient } from '@slack/web-api';

import { readEnvFile } from '../../env.js';
import { logger } from '../../logger.js';

export interface Lead {
  company: string;
  url: string;
  fundingAmount: string;
  fundingStage: string;
  founderName: string;
  siteIssues: string[];
  leadScore: number; // 1-10
  source: string;
}

/**
 * Formats lead results as a Slack message.
 * Actual lead discovery is done by the container agent via WebSearch/WebFetch.
 */
export function formatLeadsMessage(leads: Lead[], industry: string): string {
  if (leads.length === 0) {
    return `:mag: *Lead Scout — ${industry}*\n\nNo leads found this run. Try a different industry or check back Monday.`;
  }

  const lines = [`:mag: *Lead Scout — ${industry}*`, ''];

  for (const lead of leads) {
    const scoreBar =
      lead.leadScore >= 8
        ? ':fire: HIGH VALUE'
        : lead.leadScore >= 6
          ? ':large_yellow_circle: Medium'
          : ':white_circle: Low';

    lines.push(`*${lead.company}* — ${scoreBar} (${lead.leadScore}/10)`);
    lines.push(`  <${lead.url}|${lead.url}>`);
    lines.push(`  ${lead.fundingStage}: ${lead.fundingAmount}`);
    if (lead.founderName) lines.push(`  Founder: ${lead.founderName}`);
    if (lead.siteIssues.length > 0) {
      lines.push(`  Site issues:`);
      for (const issue of lead.siteIssues) {
        lines.push(`  • ${issue}`);
      }
    }
    lines.push('');
  }

  const highValue = leads.filter((l) => l.leadScore >= 8);
  if (highValue.length > 0) {
    lines.push(
      `:fire: *${highValue.length} high-value lead(s) flagged for Jeff's review.*`,
    );
  }

  return lines.join('\n');
}

export async function postLeadsToSlack(
  leads: Lead[],
  industry: string,
): Promise<void> {
  const env = readEnvFile(['SLACK_BOT_TOKEN', 'SLACK_CHANNEL_SALES']);
  if (!env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL_SALES) {
    logger.warn('Slack sales channel not configured');
    return;
  }

  const slack = new WebClient(env.SLACK_BOT_TOKEN);
  await slack.chat.postMessage({
    channel: env.SLACK_CHANNEL_SALES,
    text: formatLeadsMessage(leads, industry),
  });

  logger.info({ count: leads.length, industry }, 'Leads posted to #opal-sales');
}

/**
 * The prompt the container agent uses to find leads.
 * Called by the scheduler or when @Opal /find-leads is triggered.
 */
export function buildLeadScoutPrompt(industry: string): string {
  return `
You are the OpalWave Lead Scout. Find recently funded startups in the "${industry}" space that need a professional website.

Search these sources:
1. Search: "${industry} startup seed funding ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}"
2. Search: "betakit ${industry} funding announcement"
3. Fetch: https://fundup.ai (parse startup listings)

For each lead found (aim for 5-10):
- Check their website for: template/placeholder? mobile responsive? clear hero value prop?
- Score 1-10 (10 = perfect fit: small team, recently funded, generic/no site)

Return JSON array:
[{
  "company": "...",
  "url": "...",
  "fundingAmount": "...",
  "fundingStage": "seed|series-a|...",
  "founderName": "...",
  "siteIssues": ["hero unclear", "not mobile", ...],
  "leadScore": 7,
  "source": "betakit|crunchbase|fundup"
}]

Leads with score >= 8 are high-value — flag them clearly.
`.trim();
}
