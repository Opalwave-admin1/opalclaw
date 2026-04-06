/**
 * OpalWave Pause-for-Review System
 * High-stakes tasks post to Slack and wait for emoji reaction before executing.
 * ✅ = execute  |  ✏️ = modify  |  ❌ = cancel
 */

import { WebClient } from '@slack/web-api';
import fs from 'fs';
import path from 'path';

import { readEnvFile } from '../env.js';
import { logger } from '../logger.js';

// ── Trigger list ─────────────────────────────────────────────────────────────

const HIGH_STAKES_TRIGGERS = [
  'webflow:publish',
  'webflow:batch-rename',
  'webflow:page-build',
  'email:send:client',
  'finance:calculate',
  'finance:invoice',
  'cookie-vault:access',
  'site:okfitt:write',
  'site:hon:write',
  'outreach:high-value',
];

export function shouldPause(taskType: string): boolean {
  return HIGH_STAKES_TRIGGERS.some((trigger) => taskType.startsWith(trigger));
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface PauseableTask {
  agentName: string;
  description: string;
  details?: string;
  suggestedAction?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  taskType: string;
  channelId?: string;
}

export type PauseDecision = 'execute' | 'modify' | 'cancel';

// ── Pause log ────────────────────────────────────────────────────────────────

const PAUSE_LOG_PATH = path.resolve('data/pause-log.json');

function appendPauseLog(
  agent: string,
  taskType: string,
  decision: PauseDecision,
  responseTimeMs: number,
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    agent,
    taskType,
    decision,
    responseTimeMs,
  };

  let log: unknown[] = [];
  if (fs.existsSync(PAUSE_LOG_PATH)) {
    try {
      log = JSON.parse(fs.readFileSync(PAUSE_LOG_PATH, 'utf-8'));
    } catch {
      log = [];
    }
  }

  log.push(entry);
  try {
    fs.mkdirSync(path.dirname(PAUSE_LOG_PATH), { recursive: true });
    fs.writeFileSync(PAUSE_LOG_PATH, JSON.stringify(log, null, 2));
  } catch (err) {
    logger.error({ err }, 'Failed to write pause log');
  }
}

// ── Slack helpers ────────────────────────────────────────────────────────────

function getSlackClient(): WebClient {
  const env = readEnvFile(['SLACK_BOT_TOKEN']);
  if (!env.SLACK_BOT_TOKEN) throw new Error('SLACK_BOT_TOKEN not set');
  return new WebClient(env.SLACK_BOT_TOKEN);
}

function getDefaultPauseChannel(): string {
  const env = readEnvFile(['SLACK_CHANNEL_ALERTS']);
  return env.SLACK_CHANNEL_ALERTS || '';
}

// ── Post pause notification ──────────────────────────────────────────────────

export async function postPauseNotification(
  task: PauseableTask,
): Promise<string> {
  const slack = getSlackClient();
  const channel = task.channelId || getDefaultPauseChannel();

  if (!channel) {
    throw new Error(
      'No pause channel configured. Set SLACK_CHANNEL_ALERTS in .env',
    );
  }

  const riskEmoji =
    task.riskLevel === 'high'
      ? ':red_circle:'
      : task.riskLevel === 'medium'
        ? ':large_yellow_circle:'
        : ':large_green_circle:';

  const text = [
    ':large_orange_circle: *TASK PAUSED — Needs your review*',
    '',
    `*Agent:* ${task.agentName}`,
    `*Task:* ${task.description}`,
    task.details ? `*Details:*\n${task.details}` : null,
    task.suggestedAction ? `*Suggested action:* ${task.suggestedAction}` : null,
    `*Risk level:* ${riskEmoji} ${task.riskLevel || 'medium'}`,
    '',
    "React: :white_check_mark: = Execute  |  :pencil2: = I'll modify  |  :x: = Cancel",
  ]
    .filter((l) => l !== null)
    .join('\n');

  const result = await slack.chat.postMessage({ channel, text });

  if (!result.ok || !result.ts) {
    throw new Error(`Slack postMessage failed: ${result.error}`);
  }

  logger.info(
    { agent: task.agentName, taskType: task.taskType, ts: result.ts },
    'Pause notification posted',
  );

  return result.ts;
}

// ── Wait for reaction ────────────────────────────────────────────────────────

const REACTION_POLL_MS = 5_000;
const REACTION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function listenForReaction(
  messageTs: string,
  channelId: string,
  taskType: string,
  agentName: string,
): Promise<PauseDecision> {
  const slack = getSlackClient();
  const channel = channelId || getDefaultPauseChannel();
  const startTime = Date.now();

  while (Date.now() - startTime < REACTION_TIMEOUT_MS) {
    try {
      const res = await slack.reactions.get({
        channel,
        timestamp: messageTs,
      });

      const reactions =
        (
          res.message as {
            reactions?: Array<{ name: string; count: number }>;
          }
        )?.reactions || [];

      for (const reaction of reactions) {
        if (reaction.name === 'white_check_mark') {
          appendPauseLog(
            agentName,
            taskType,
            'execute',
            Date.now() - startTime,
          );
          return 'execute';
        }
        if (reaction.name === 'pencil2') {
          appendPauseLog(agentName, taskType, 'modify', Date.now() - startTime);
          return 'modify';
        }
        if (reaction.name === 'x') {
          appendPauseLog(agentName, taskType, 'cancel', Date.now() - startTime);
          return 'cancel';
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Error polling reactions');
    }

    await new Promise((r) => setTimeout(r, REACTION_POLL_MS));
  }

  // Timeout = cancel
  appendPauseLog(agentName, taskType, 'cancel', REACTION_TIMEOUT_MS);
  return 'cancel';
}

// ── Wait for thread modification ─────────────────────────────────────────────

export async function waitForModification(
  threadTs: string,
  channelId: string,
): Promise<string> {
  const slack = getSlackClient();
  const channel = channelId || getDefaultPauseChannel();
  const startTime = Date.now();
  const timeout = 24 * 60 * 60 * 1000;

  while (Date.now() - startTime < timeout) {
    try {
      const res = await slack.conversations.replies({
        channel,
        ts: threadTs,
        oldest: threadTs,
      });

      const messages =
        (
          res as {
            messages?: Array<{ ts: string; text?: string; bot_id?: string }>;
          }
        ).messages || [];

      // Find a human reply (not the original bot message)
      const humanReply = messages.slice(1).find((m) => !m.bot_id && m.text);

      if (humanReply?.text) {
        return humanReply.text;
      }
    } catch (err) {
      logger.warn({ err }, 'Error polling thread for modification');
    }

    await new Promise((r) => setTimeout(r, REACTION_POLL_MS));
  }

  return ''; // timeout, no modification provided
}
