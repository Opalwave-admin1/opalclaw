/**
 * OpalWave Airtable Integration
 * Reusable query utility for any Airtable base/table.
 */

import { readEnvFile } from '../env.js';
import { logger } from '../logger.js';

const AIRTABLE_API = 'https://api.airtable.com/v0';

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

function getApiKey(): string {
  const env = readEnvFile(['AIRTABLE_API_KEY']);
  if (!env.AIRTABLE_API_KEY) {
    throw new Error('AIRTABLE_API_KEY not set in .env');
  }
  return env.AIRTABLE_API_KEY;
}

export async function queryTable(
  baseId: string,
  tableName: string,
  opts: {
    filterFormula?: string;
    fields?: string[];
    maxRecords?: number;
    view?: string;
  } = {},
): Promise<AirtableRecord[]> {
  const apiKey = getApiKey();
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    if (opts.filterFormula) params.set('filterByFormula', opts.filterFormula);
    if (opts.view) params.set('view', opts.view);
    if (opts.maxRecords) params.set('maxRecords', String(opts.maxRecords));
    if (opts.fields) {
      for (const f of opts.fields) params.append('fields[]', f);
    }
    if (offset) params.set('offset', offset);

    const url = `${AIRTABLE_API}/${baseId}/${encodeURIComponent(tableName)}?${params}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as AirtableResponse;
    records.push(...data.records);
    offset = data.offset;
  } while (offset && (!opts.maxRecords || records.length < opts.maxRecords));

  logger.debug(
    { base: baseId, table: tableName, count: records.length },
    'Airtable query complete',
  );

  return records;
}

export async function getRecord(
  baseId: string,
  tableName: string,
  recordId: string,
): Promise<AirtableRecord | null> {
  const apiKey = getApiKey();
  const url = `${AIRTABLE_API}/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Airtable error ${res.status}`);
  return (await res.json()) as AirtableRecord;
}
