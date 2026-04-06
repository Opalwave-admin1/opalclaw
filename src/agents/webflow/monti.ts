/**
 * Monti — Webflow Page Builder
 * Takes design briefs and builds Webflow pages using OpalWave design tokens.
 * ALWAYS pauses before executing — no auto-build.
 */

import { WebClient } from '@slack/web-api';

import { readEnvFile } from '../../env.js';
import { logger } from '../../logger.js';
import { routeTask } from '../../router/model-router.js';

// OpalWave design tokens
const DESIGN_TOKENS = {
  typography: {
    body: 'DM Sans',
    heading: 'Source Serif 4',
    code: 'JetBrains Mono',
  },
  colors: {
    accent: '#C27B62', // coral
  },
};

export interface PageBrief {
  title: string;
  description: string;
  sections: string[];
  contentOutline?: string;
  siteId: string;
}

export function buildMontiPrompt(brief: PageBrief): string {
  return `
You are Monti, the OpalWave Webflow page builder.

Brief:
- Page title: ${brief.title}
- Description: ${brief.description}
- Sections needed: ${brief.sections.join(', ')}
${brief.contentOutline ? `- Content outline:\n${brief.contentOutline}` : ''}

Design system:
- Typography: ${DESIGN_TOKENS.typography.body} (body), ${DESIGN_TOKENS.typography.heading} (headings), ${DESIGN_TOKENS.typography.code} (code)
- Accent color: ${DESIGN_TOKENS.colors.accent}
- Element naming: lowercase_underscore convention

Steps:
1. Get Webflow cookies: Call opalclaw:get_webflow_cookies with site "webflow-opalwavedigital"
2. Use playwright:launch_browser to start a Chromium browser
3. Use playwright:navigate to go to https://webflow.com/designer/${brief.siteId}
4. Wait for the Designer to fully load
5. Plan page structure by examining the current state
6. Use playwright:click and playwright:fill to add elements
7. Add content using the text tools
8. Apply styles using the Designer UI

Return a build plan JSON BEFORE executing anything:
{
  "siteId": "${brief.siteId}",
  "pageTitle": "${brief.title}",
  "sections": [
    {"name": "hero_section", "type": "hero", "elements": [...], "gsapAnimations": false}
  ],
  "manualFollowUp": ["Add GSAP scroll animation on hero", "..."],
  "estimatedBuildTime": "45 minutes"
}

Flag any sections that need GSAP or Swiper.js as manual follow-up items.
DO NOT execute the build until Jeff reviews and approves.
`.trim();
}

export async function pauseAndBuild(
  brief: PageBrief,
  buildPlan: string,
  webflowChannelId: string,
): Promise<'approved' | 'cancelled' | 'modified'> {
  const result = await routeTask({
    type: 'webflow:page-build',
    agentName: 'Monti',
    description: `Build "${brief.title}" on site ${brief.siteId}`,
    details: buildPlan,
    suggestedAction:
      'Review build plan, then ✅ to execute or ✏️ to modify brief',
    riskLevel: 'high',
    channelId: webflowChannelId,
  });

  if (result.status === 'cancelled') return 'cancelled';
  if (result.status === 'modified') return 'modified';
  return 'approved';
}

export async function postMontiBrief(
  brief: PageBrief,
  buildPlan: string,
): Promise<void> {
  const env = readEnvFile(['SLACK_BOT_TOKEN', 'SLACK_CHANNEL_WEBFLOW']);
  if (!env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL_WEBFLOW) {
    logger.warn('Webflow Slack channel not configured');
    return;
  }

  const slack = new WebClient(env.SLACK_BOT_TOKEN);
  await slack.chat.postMessage({
    channel: env.SLACK_CHANNEL_WEBFLOW,
    text: [
      `*Monti — Page Build Brief* | Site: \`${brief.siteId}\``,
      `*Page:* ${brief.title}`,
      `*Sections:* ${brief.sections.join(' → ')}`,
      '',
      '*Build Plan:*',
      buildPlan,
      '',
      ":large_orange_circle: _Paused — waiting for Jeff's approval in #opal-webflow_",
    ].join('\n'),
  });
}
