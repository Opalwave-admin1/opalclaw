/**
 * OpalWave Model Router
 * Routes tasks through the pause system for high-stakes operations.
 * All execution goes through MiniMax M2.7 — no Claude API tier.
 */

import { readEnvFile } from '../env.js';
import { logger } from '../logger.js';
import {
  shouldPause,
  postPauseNotification,
  listenForReaction,
  waitForModification,
  PauseableTask,
} from './pause-handler.js';

export interface AgentTask {
  type: string;
  agentName: string;
  description: string;
  details?: string;
  suggestedAction?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  channelId?: string;
  payload?: unknown;
}

export interface TaskResult {
  status: 'executed' | 'cancelled' | 'modified';
  modifiedInstructions?: string;
  skippedPause?: boolean;
}

export function getMiniMaxConfig(): {
  model: string;
  baseUrl: string;
  apiKey: string;
} {
  const env = readEnvFile(['ANTHROPIC_BASE_URL', 'ANTHROPIC_API_KEY']);
  return {
    model: 'MiniMax-M2.7',
    baseUrl: env.ANTHROPIC_BASE_URL || 'https://api.minimax.io/anthropic',
    apiKey: env.ANTHROPIC_API_KEY || '',
  };
}

export async function routeTask(task: AgentTask): Promise<TaskResult> {
  if (!shouldPause(task.type)) {
    logger.info({ taskType: task.type }, 'Task routed: immediate execution');
    return { status: 'executed', skippedPause: true };
  }

  logger.info(
    { taskType: task.type, agent: task.agentName },
    'Task requires pause-for-review',
  );

  const pauseTask: PauseableTask = {
    agentName: task.agentName,
    description: task.description,
    details: task.details,
    suggestedAction: task.suggestedAction,
    riskLevel: task.riskLevel || 'medium',
    taskType: task.type,
    channelId: task.channelId,
  };

  const messageTs = await postPauseNotification(pauseTask);
  const channelId = task.channelId || '';

  const decision = await listenForReaction(
    messageTs,
    channelId,
    task.type,
    task.agentName,
  );

  if (decision === 'cancel') {
    logger.info({ taskType: task.type }, 'Task cancelled by user');
    return { status: 'cancelled' };
  }

  if (decision === 'modify') {
    logger.info({ taskType: task.type }, 'Task modification requested');
    const instructions = await waitForModification(messageTs, channelId);
    return { status: 'modified', modifiedInstructions: instructions };
  }

  logger.info({ taskType: task.type }, 'Task approved for execution');
  return { status: 'executed' };
}
