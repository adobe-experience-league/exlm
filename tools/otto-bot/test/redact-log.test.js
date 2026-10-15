import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRedactor, SECRET_LINE_PATTERNS } from '../lib/redact.js';
import { createLogger } from '../lib/log.js';
import { tempDir } from './helpers.js';

test('redacts literal secrets and token-shaped strings', () => {
  const redact = createRedactor(['supersecretvalue', 'short']);
  const out = redact(
    'a supersecretvalue b short github_pat_abcdefghijklmnopqrstuvwxyz ghp_abcdefghijklmnopqrstuvwxyz0123 Authorization: ******',
  );
  assert.ok(!out.includes('supersecretvalue'));
  assert.ok(out.includes('short'), 'secrets shorter than 8 chars are not treated as literals');
  assert.ok(!out.includes('github_pat_abc'));
  assert.ok(!out.includes('ghp_abc'));
  assert.ok(out.includes('******'));
});

test('redactor tolerates null and non-strings', () => {
  const redact = createRedactor([]);
  assert.equal(redact(null), '');
  assert.equal(redact(42), '42');
});

test('SECRET_LINE_PATTERNS flag real tokens but not template-literal auth headers', () => {
  const templated = ['Authorization: `Bearer ', '$', '{token}`'].join('');
  assert.equal(
    SECRET_LINE_PATTERNS.some((re) => re.test(templated)),
    false,
  );
  assert.equal(
    SECRET_LINE_PATTERNS.some((re) => re.test(`const t = 'github_pat_${'a'.repeat(30)}';`)),
    true,
  );
  assert.equal(
    SECRET_LINE_PATTERNS.some((re) => re.test('-----BEGIN RSA PRIVATE KEY-----')),
    true,
  );
});

test('logger writes redacted JSON lines to stdout sink and attached files', async () => {
  const lines = [];
  const log = createLogger({ redact: createRedactor(['supersecretvalue']), write: (line) => lines.push(line) });
  const file = path.join(await tempDir(), 'otto.log');
  log.attachFile(file);
  log.info('hello', { token: 'supersecretvalue' });
  const parsed = JSON.parse(lines[0]);
  assert.equal(parsed.level, 'info');
  assert.equal(parsed.msg, 'hello');
  assert.equal(parsed.token, '[REDACTED]');
  assert.equal(await fs.readFile(file, 'utf8'), lines[0]);
});
