/**
 * OpalWave Security Watchdog
 * Scans outgoing messages for secrets before any channel delivery.
 * Incidents are logged to security/incident-log.json (never the secret itself).
 */

import fs from 'fs';
import path from 'path';
import { WebClient } from '@slack/web-api';

import { readEnvFile } from '../env.js';
import { logger } from '../logger.js';

export interface ScanResult {
  blocked: boolean;
  matchType: string | null;
}

const SECRET_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /sk-ant-[a-zA-Z0-9]{20,}/g, label: 'Anthropic API key' },
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, label: 'Generic API key' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/g, label: 'GitHub token' },
  { pattern: /xoxb-[0-9]+-[a-zA-Z0-9-]+/g, label: 'Slack bot token' },
  { pattern: /xapp-[0-9]+-[a-zA-Z0-9-]+/g, label: 'Slack app token' },
  { pattern: /AKIA[0-9A-Z]{16}/g, label: 'AWS access key' },
  {
    pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g,
    label: 'Private key',
  },
  { pattern: /mongodb\+srv:\/\/[^\s]+/g, label: 'MongoDB connection string' },
  { pattern: /postgres:\/\/[^\s]+/g, label: 'Postgres connection string' },
];

const INCIDENT_LOG_PATH = path.resolve('security/incident-log.json');

function appendIncident(
  agentName: string,
  matchType: string,
  channel: string,
): void {
  const incident = {
    timestamp: new Date().toISOString(),
    agent: agentName,
    matchType,
    channel,
    // NEVER log the message content or secret value
  };

  let log: unknown[] = [];
  if (fs.existsSync(INCIDENT_LOG_PATH)) {
    try {
      log = JSON.parse(fs.readFileSync(INCIDENT_LOG_PATH, 'utf-8'));
    } catch {
      log = [];
    }
  }

  log.push(incident);

  try {
    fs.mkdirSync(path.dirname(INCIDENT_LOG_PATH), { recursive: true });
    fs.writeFileSync(INCIDENT_LOG_PATH, JSON.stringify(log, null, 2));
  } catch (err) {
    logger.error({ err }, 'Failed to write incident log');
  }
}

function getSlackClient(): WebClient | null {
  try {
    const env = readEnvFile(['SLACK_BOT_TOKEN']);
    if (!env.SLACK_BOT_TOKEN) return null;
    return new WebClient(env.SLACK_BOT_TOKEN);
  } catch {
    return null;
  }
}

function getAlertsChannel(): string | null {
  try {
    const env = readEnvFile(['SLACK_CHANNEL_ALERTS']);
    return env.SLACK_CHANNEL_ALERTS || null;
  } catch {
    return null;
  }
}

export function scanForSecrets(text: string): ScanResult {
  for (const { pattern, label } of SECRET_PATTERNS) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return { blocked: true, matchType: label };
    }
  }
  return { blocked: false, matchType: null };
}

export async function interceptOutgoingMessage(
  agentName: string,
  message: string,
  channelContext: string,
): Promise<{ allowed: boolean }> {
  const scan = scanForSecrets(message);

  if (!scan.blocked) {
    return { allowed: true };
  }

  logger.warn(
    { agentName, matchType: scan.matchType, channel: channelContext },
    'SECRET LEAK BLOCKED — message held',
  );

  appendIncident(agentName, scan.matchType!, channelContext);

  // Post alert to #opal-alerts
  const slack = getSlackClient();
  const alertsChannel = getAlertsChannel();

  if (slack && alertsChannel) {
    try {
      await slack.chat.postMessage({
        channel: alertsChannel,
        text: `:rotating_light: *SECRET LEAK BLOCKED* — Agent *${agentName}* attempted to output a *${scan.matchType}*. Message held.`,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to post watchdog alert to Slack');
    }
  }

  return { allowed: false };
}

export function scanFile(filepath: string): ScanResult[] {
  const results: ScanResult[] = [];
  let lines: string[];

  try {
    lines = fs.readFileSync(filepath, 'utf-8').split('\n');
  } catch {
    return results;
  }

  for (const line of lines) {
    const result = scanForSecrets(line);
    if (result.blocked) {
      results.push(result);
    }
  }

  return results;
}
