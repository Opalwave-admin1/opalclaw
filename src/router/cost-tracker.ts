/**
 * OpalWave Cost Tracker
 * Tracks MiniMax M2.7 API usage and spend against monthly budget.
 * Costs in USD: input $0.30/M tokens, output $1.20/M tokens.
 */

import fs from 'fs';
import path from 'path';
import { WebClient } from '@slack/web-api';

import { readEnvFile } from '../env.js';
import { logger } from '../logger.js';

const COST_LOG_PATH = path.resolve('data/cost-tracking.json');

// MiniMax M2.7 pricing
const INPUT_COST_PER_TOKEN = 0.3 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 1.2 / 1_000_000;

export interface CostEntry {
  timestamp: string;
  agent: string;
  agent_group: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  task_type: string;
  success: boolean;
}

function readLog(): CostEntry[] {
  if (!fs.existsSync(COST_LOG_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(COST_LOG_PATH, 'utf-8')) as CostEntry[];
  } catch {
    return [];
  }
}

function writeLog(entries: CostEntry[]): void {
  fs.mkdirSync(path.dirname(COST_LOG_PATH), { recursive: true });
  fs.writeFileSync(COST_LOG_PATH, JSON.stringify(entries, null, 2));
}

export function recordCall(opts: {
  agent: string;
  agentGroup: string;
  inputTokens: number;
  outputTokens: number;
  taskType: string;
  success: boolean;
}): CostEntry {
  const cost =
    opts.inputTokens * INPUT_COST_PER_TOKEN +
    opts.outputTokens * OUTPUT_COST_PER_TOKEN;

  const entry: CostEntry = {
    timestamp: new Date().toISOString(),
    agent: opts.agent,
    agent_group: opts.agentGroup,
    model: 'MiniMax-M2.7',
    input_tokens: opts.inputTokens,
    output_tokens: opts.outputTokens,
    cost_usd: cost,
    task_type: opts.taskType,
    success: opts.success,
  };

  const log = readLog();
  log.push(entry);
  writeLog(log);

  logger.debug(
    { agent: opts.agent, cost_usd: cost.toFixed(6) },
    'Cost recorded',
  );

  checkBudgetThresholds(entry).catch((err) =>
    logger.error({ err }, 'Budget threshold check failed'),
  );

  return entry;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function getTodayCost(): number {
  const today = new Date();
  return readLog()
    .filter((e) => isSameDay(new Date(e.timestamp), today))
    .reduce((sum, e) => sum + e.cost_usd, 0);
}

export function getMonthCost(): number {
  const now = new Date();
  return readLog()
    .filter((e) => isSameMonth(new Date(e.timestamp), now))
    .reduce((sum, e) => sum + e.cost_usd, 0);
}

export function getTodayCallCount(): number {
  const today = new Date();
  return readLog().filter((e) => isSameDay(new Date(e.timestamp), today))
    .length;
}

export function getCallCount(period: 'today' | 'month'): number {
  const now = new Date();
  const log = readLog();
  if (period === 'today') {
    return log.filter((e) => isSameDay(new Date(e.timestamp), now)).length;
  }
  return log.filter((e) => isSameMonth(new Date(e.timestamp), now)).length;
}

export function getMonthBudgetCap(): number {
  const env = readEnvFile(['MONTHLY_BUDGET_CAP_USD']);
  return parseFloat(env.MONTHLY_BUDGET_CAP_USD || '30');
}

export function getBudgetStatus(): {
  pct: number;
  exceeded: boolean;
  monthCost: number;
  cap: number;
} {
  const cap = getMonthBudgetCap();
  const monthCost = getMonthCost();
  const pct = cap > 0 ? (monthCost / cap) * 100 : 0;
  return { pct, exceeded: pct >= 100, monthCost, cap };
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

async function postToSlack(channel: string, text: string): Promise<void> {
  const slack = getSlackClient();
  if (!slack || !channel) return;
  try {
    await slack.chat.postMessage({ channel, text });
  } catch (err) {
    logger.error({ err }, 'Failed to post cost alert to Slack');
  }
}

let lastAlertPct = 0;

async function checkBudgetThresholds(entry: CostEntry): Promise<void> {
  const { pct, monthCost, cap } = getBudgetStatus();
  const env = readEnvFile(['SLACK_CHANNEL_COSTS', 'SLACK_CHANNEL_ALERTS']);
  const costsChannel = env.SLACK_CHANNEL_COSTS || '';
  const alertsChannel = env.SLACK_CHANNEL_ALERTS || '';

  if (pct >= 50 && lastAlertPct < 50) {
    lastAlertPct = 50;
    await postToSlack(
      costsChannel,
      `:information_source: *Budget at 50%* — $${monthCost.toFixed(2)} of $${cap} used this month.`,
    );
  } else if (pct >= 75 && lastAlertPct < 75) {
    lastAlertPct = 75;
    await postToSlack(
      alertsChannel,
      `:warning: *Budget at 75%* — $${monthCost.toFixed(2)} of $${cap} used. Slow down non-essential tasks.`,
    );
  } else if (pct >= 90 && lastAlertPct < 90) {
    lastAlertPct = 90;
    await postToSlack(
      alertsChannel,
      `:rotating_light: *Budget at 90%* — $${monthCost.toFixed(2)} of $${cap}. Pausing non-essential tasks.`,
    );
  } else if (pct >= 100 && lastAlertPct < 100) {
    lastAlertPct = 100;
    await postToSlack(
      alertsChannel,
      `:no_entry: *Budget EXCEEDED* — $${monthCost.toFixed(2)} of $${cap}. Only uptime checks continue.`,
    );
  }

  void entry; // used for context logging above
}

export async function postDailyCostReport(channelId: string): Promise<void> {
  const todayCost = getTodayCost();
  const monthCost = getMonthCost();
  const todayCalls = getCallCount('today');
  const { cap } = getBudgetStatus();
  const date = new Date().toLocaleDateString('en-CA');

  const text = [
    `:bar_chart: *Daily Cost Report — ${date}*`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `MiniMax M2.7:   $${todayCost.toFixed(4)} (${todayCalls} calls)`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `Total today:    $${todayCost.toFixed(4)}`,
    `Month-to-date:  $${monthCost.toFixed(4)} / $${cap.toFixed(2)} budget`,
  ].join('\n');

  const slack = getSlackClient();
  if (slack && channelId) {
    await slack.chat.postMessage({ channel: channelId, text });
  }
}
