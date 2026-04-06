/**
 * OpalWave Client Status Reporter
 * Reads active projects from Airtable and posts briefing to #opal-clients.
 * Trigger: Monday 9 AM PST | Manual: @Opal /project-status
 */

import { WebClient } from '@slack/web-api';

import { readEnvFile } from '../../env.js';
import { logger } from '../../logger.js';
import { queryTable } from '../../integrations/airtable.js';

interface Project {
  name: string;
  status: string;
  nextAction: string;
  blockers: string;
  lastUpdated: string;
}

function getStatusEmoji(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('complete') || s.includes('done')) return ':white_check_mark:';
  if (s.includes('block') || s.includes('hold')) return ':red_circle:';
  if (s.includes('review')) return ':eyes:';
  return ':large_yellow_circle:';
}

export async function runStatusReport(): Promise<void> {
  const env = readEnvFile([
    'AIRTABLE_API_KEY',
    'AIRTABLE_BASE_PROJECTS',
    'SLACK_BOT_TOKEN',
    'SLACK_CHANNEL_CLIENTS',
  ]);

  if (!env.AIRTABLE_API_KEY || !env.AIRTABLE_BASE_PROJECTS) {
    logger.warn('Airtable not configured — skipping status report');
    return;
  }

  if (!env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL_CLIENTS) {
    logger.warn('Slack clients channel not configured');
    return;
  }

  const records = await queryTable(env.AIRTABLE_BASE_PROJECTS, 'Projects', {
    filterFormula: "NOT({Status} = 'Completed')",
    fields: ['Name', 'Status', 'Next Action', 'Blockers', 'Last Updated'],
  });

  const projects: Project[] = records.map((r) => ({
    name: String(r.fields['Name'] || ''),
    status: String(r.fields['Status'] || 'Unknown'),
    nextAction: String(r.fields['Next Action'] || '—'),
    blockers: String(r.fields['Blockers'] || 'None'),
    lastUpdated: String(r.fields['Last Updated'] || ''),
  }));

  if (projects.length === 0) {
    logger.info('No active projects found in Airtable');
    return;
  }

  const date = new Date().toLocaleDateString('en-CA');
  const lines = [`:briefcase: *Project Status — ${date}*`, ''];

  for (const p of projects) {
    const emoji = getStatusEmoji(p.status);
    lines.push(`${emoji} *${p.name}*`);
    lines.push(`  Status: ${p.status}`);
    lines.push(`  Next: ${p.nextAction}`);
    if (p.blockers && p.blockers !== 'None') {
      lines.push(`  :warning: Blocker: ${p.blockers}`);
    }
    lines.push('');
  }

  const slack = new WebClient(env.SLACK_BOT_TOKEN);
  await slack.chat.postMessage({
    channel: env.SLACK_CHANNEL_CLIENTS,
    text: lines.join('\n'),
  });

  logger.info({ projectCount: projects.length }, 'Status report posted');
}
