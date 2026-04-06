/**
 * Ross — Webflow Element Renamer
 * Proposes semantic renames for Webflow element trees.
 * Auto-executes small renames on dev sites; pauses on production or 10+ renames.
 */

import { WebClient } from '@slack/web-api';

import { readEnvFile } from '../../env.js';
import { logger } from '../../logger.js';
import { routeTask } from '../../router/model-router.js';

// Production site IDs — always pause for writes
const PRODUCTION_SITES = new Set([
  '68423937cec4fb3017df58d1', // OKFITT
  '67d5e09b16bdb8fd692518eb', // House of Noir
]);

export interface RenameProposal {
  elementId: string;
  currentName: string;
  proposedName: string;
  reason?: string;
}

export function buildRossPrompt(siteId: string, pageId?: string): string {
  return `
You are Ross, the OpalWave Webflow element renamer.

Task: Audit and rename div-block/section style names on Webflow site ${siteId}${pageId ? `, page ${pageId}` : ''}.

Steps:
1. Get Webflow cookies: Call opalclaw:get_webflow_cookies with site "webflow-opalwavedigital"
2. Use playwright:launch_browser to start a Chromium browser
3. Use playwright:navigate to go to https://webflow.com/designer/${siteId}
4. Wait for the Designer to fully load
5. Use playwright:click to open the navigator panel (usually Elements tab)
6. Use playwright:get_elements to extract all element names
7. Analyze element names — find any that use generic names (div-block-N, section-N, etc.)
8. Propose semantic renames using lowercase_underscore convention:
   - div-block-47 → hero_wrapper
   - section-3 → testimonials_section
   - image-5 → hero_background_image

For renaming:
- Use playwright:click to select an element in the navigator
- Use playwright:fill to update element name in the properties panel
- Or use the element context menu to rename

Return JSON:
{
  "siteId": "${siteId}",
  "pageId": "${pageId || ''}",
  "proposals": [
    {"elementId": "...", "currentName": "div-block-47", "proposedName": "hero_wrapper", "reason": "top-level hero container"}
  ],
  "totalElements": N,
  "isPaused": false
}

Do NOT execute any renames yet. Just return the proposals.
`.trim();
}

export async function evaluateAndRouteRenames(
  siteId: string,
  proposals: RenameProposal[],
  salesChannelId: string,
): Promise<'auto-execute' | 'paused' | 'cancelled'> {
  const isProduction = PRODUCTION_SITES.has(siteId);
  const isBulk = proposals.length >= 10;
  const needsPause = isProduction || isBulk;

  if (!needsPause) {
    logger.info(
      { siteId, count: proposals.length },
      'Ross: auto-executing renames (dev site, < 10 elements)',
    );
    return 'auto-execute';
  }

  const reason = isProduction
    ? 'production site'
    : `${proposals.length} renames (≥10)`;
  const details = proposals
    .slice(0, 10)
    .map((p) => `• ${p.currentName} → ${p.proposedName}`)
    .join('\n');
  const more =
    proposals.length > 10 ? `\n_...and ${proposals.length - 10} more_` : '';

  const result = await routeTask({
    type: 'webflow:batch-rename',
    agentName: 'Ross',
    description: `Rename ${proposals.length} Webflow elements on site ${siteId}`,
    details: `Trigger: ${reason}\n\n${details}${more}`,
    suggestedAction: 'Review each rename, then react ✅ to apply all',
    riskLevel: isProduction ? 'high' : 'medium',
    channelId: salesChannelId,
  });

  if (result.status === 'cancelled') return 'cancelled';
  return 'paused';
}

export async function postRossResults(
  siteId: string,
  proposals: RenameProposal[],
  status: 'auto-execute' | 'paused' | 'cancelled',
): Promise<void> {
  const env = readEnvFile(['SLACK_BOT_TOKEN', 'SLACK_CHANNEL_WEBFLOW']);
  if (!env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL_WEBFLOW) return;

  const slack = new WebClient(env.SLACK_BOT_TOKEN);
  const statusLine =
    status === 'auto-execute'
      ? ':white_check_mark: Auto-executed'
      : status === 'cancelled'
        ? ':x: Cancelled'
        : ':large_orange_circle: Paused for review';

  const preview = proposals
    .slice(0, 8)
    .map((p) => `• \`${p.currentName}\` → \`${p.proposedName}\``)
    .join('\n');

  await slack.chat.postMessage({
    channel: env.SLACK_CHANNEL_WEBFLOW,
    text: [
      `*Ross — Webflow Rename Report* | Site: \`${siteId}\``,
      `Status: ${statusLine}`,
      `Proposals (${proposals.length}):`,
      preview,
      proposals.length > 8 ? `_...and ${proposals.length - 8} more_` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  });
}
