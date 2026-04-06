/**
 * OpalWave Cookie Vault
 * AES-256-GCM encrypted storage for session cookies.
 * Decrypted data never touches disk — in-memory only.
 * Key stored in security/vault-key.env (separate from .env).
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const KEY_FILE = path.resolve('security/vault-key.env');
const VAULT_FILE = path.resolve('security/cookie-vault.enc');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

interface VaultEntry {
  iv: string; // hex
  tag: string; // hex
  data: string; // hex ciphertext
}

type VaultStore = Record<string, VaultEntry>;

// ── Key management ─────────────────────────────────────────────────────────

function getOrCreateKey(): Buffer {
  if (fs.existsSync(KEY_FILE)) {
    const raw = fs.readFileSync(KEY_FILE, 'utf-8').trim();
    return Buffer.from(raw, 'hex');
  }
  const key = crypto.randomBytes(32);
  fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true });
  fs.writeFileSync(KEY_FILE, key.toString('hex'), { mode: 0o600 });
  return key;
}

// ── Vault I/O ───────────────────────────────────────────────────────────────

function readVault(): VaultStore {
  if (!fs.existsSync(VAULT_FILE)) return {};
  try {
    const raw = fs.readFileSync(VAULT_FILE, 'utf-8');
    return JSON.parse(raw) as VaultStore;
  } catch {
    return {};
  }
}

function writeVault(store: VaultStore): void {
  fs.mkdirSync(path.dirname(VAULT_FILE), { recursive: true });
  fs.writeFileSync(VAULT_FILE, JSON.stringify(store, null, 2), {
    mode: 0o600,
  });
}

// ── Encrypt / Decrypt ───────────────────────────────────────────────────────

function encrypt(plaintext: string, key: Buffer): VaultEntry {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf-8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted.toString('hex'),
  };
}

function decrypt(entry: VaultEntry, key: Buffer): string {
  const iv = Buffer.from(entry.iv, 'hex');
  const tag = Buffer.from(entry.tag, 'hex');
  const data = Buffer.from(entry.data, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data).toString('utf-8') + decipher.final('utf-8');
}

// ── Public API ──────────────────────────────────────────────────────────────

export function storeCookies(site: string, cookieJson: object): void {
  const key = getOrCreateKey();
  const store = readVault();
  store[site] = encrypt(JSON.stringify(cookieJson), key);
  writeVault(store);
}

export function getCookies(site: string): object | null {
  const key = getOrCreateKey();
  const store = readVault();
  const entry = store[site];
  if (!entry) return null;
  try {
    return JSON.parse(decrypt(entry, key)) as object;
  } catch {
    return null;
  }
}

export function listSites(): string[] {
  return Object.keys(readVault());
}

export function deleteCookies(site: string): void {
  const store = readVault();
  delete store[site];
  writeVault(store);
}

export function rotateKey(): void {
  const oldKey = getOrCreateKey();
  const store = readVault();

  // Decrypt all entries with old key
  const decrypted: Record<string, string> = {};
  for (const [site, entry] of Object.entries(store)) {
    decrypted[site] = decrypt(entry, oldKey);
  }

  // Generate new key
  const newKey = crypto.randomBytes(32);
  fs.writeFileSync(KEY_FILE, newKey.toString('hex'), { mode: 0o600 });

  // Re-encrypt with new key
  const newStore: VaultStore = {};
  for (const [site, plaintext] of Object.entries(decrypted)) {
    newStore[site] = encrypt(plaintext, newKey);
  }
  writeVault(newStore);
  console.log('Key rotated. All cookies re-encrypted.');
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const isDirectRun =
  process.argv[1] &&
  new URL(import.meta.url).pathname ===
    new URL(`file://${process.argv[1]}`).pathname;

if (isDirectRun) {
  const [, , command, ...args] = process.argv;

  switch (command) {
    case 'store': {
      const fileIdx = args.indexOf('--file');
      const siteIdx = args.indexOf('--site');
      if (fileIdx === -1 || siteIdx === -1) {
        console.error(
          'Usage: cookie-vault.ts store --file cookies.json --site webflow',
        );
        process.exit(1);
      }
      const filepath = args[fileIdx + 1];
      const site = args[siteIdx + 1];
      const json = JSON.parse(fs.readFileSync(filepath, 'utf-8')) as object;
      storeCookies(site, json);
      console.log(`Stored cookies for site: ${site}`);
      break;
    }
    case 'list':
      console.log('Stored sites:', listSites().join(', ') || '(none)');
      break;
    case 'rotate-key':
      rotateKey();
      break;
    case 'purge': {
      const siteIdx = args.indexOf('--site');
      if (siteIdx === -1) {
        console.error('Usage: cookie-vault.ts purge --site webflow');
        process.exit(1);
      }
      const site = args[siteIdx + 1];
      deleteCookies(site);
      console.log(`Purged cookies for site: ${site}`);
      break;
    }
    default:
      console.error('Commands: store, list, rotate-key, purge');
      process.exit(1);
  }
}
