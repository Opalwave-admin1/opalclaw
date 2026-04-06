/**
 * OpalWave Outreach Drafter
 * Generates personalized cold emails in Jeff's voice.
 * High-value leads (score >= 8) trigger the pause system.
 */

import { WebClient } from '@slack/web-api';

import { readEnvFile } from '../../env.js';
import { logger } from '../../logger.js';
import { interceptOutgoingMessage } from '../../security/watchdog.js';
import type { Lead } from './lead-scout.js';

export function buildOutreachPrompt(lead: Lead): string {
  const issues = lead.siteIssues.join(', ');

  return `
Draft a cold outreach email to ${lead.company} from Jeff at OpalWave Digital.

Lead context:
- Company: ${lead.company}
- Site: ${lead.url}
- Funding: ${lead.fundingStage}, ${lead.fundingAmount}
- Founder: ${lead.founderName || 'the founder'}
- Site issues identified: ${issues || 'generic design, unclear value prop'}

Jeff's voice rules:
- Bold. Specific. Non-corporate.
- Open with ONE concrete observation about their site (not vague praise)
- Reference their funding (shows you did research)
- Mention OpalWave and 2-3 week delivery
- Offer a 15-minute call, no strings attached
- Max 150 words in body

Return JSON:
{
  "subject": "...",
  "body": "...",
  "leadScore": ${lead.leadScore},
  "isHighValue": ${lead.leadScore >= 8}
}
`.trim();
}

export async function postOutreachDraft(
  lead: Lead,
  draft: { subject: string; body: string; isHighValue: boolean },
): Promise<void> {
  const env = readEnvFile(['SLACK_BOT_TOKEN', 'SLACK_CHANNEL_SALES']);
  if (!env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL_SALES) {
    logger.warn('Slack sales channel not configured');
    return;
  }

  // Scan for secrets before posting
  const bodyCheck = await interceptOutgoingMessage(
    'outreach-drafter',
    draft.body,
    env.SLACK_CHANNEL_SALES,
  );
  if (!bodyCheck.allowed) return;

  const flag = draft.isHighValue
    ? ':fire: *HIGH VALUE — Jeff review before sending*'
    : ':email: *Outreach draft — skim and approve*';

  const text = [
    `${flag}`,
    `*To:* ${lead.company} (${lead.founderName || 'founder'})`,
    `*Subject:* ${draft.subject}`,
    '',
    draft.body,
  ].join('\n');

  const slack = new WebClient(env.SLACK_BOT_TOKEN);
  await slack.chat.postMessage({
    channel: env.SLACK_CHANNEL_SALES,
    text,
  });

  logger.info(
    { company: lead.company, isHighValue: draft.isHighValue },
    'Outreach draft posted',
  );
}
