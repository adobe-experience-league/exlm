export const REDACTED = '[REDACTED]';

export const SECRET_LINE_PATTERNS = Object.freeze([
  /github_pat_[A-Za-z0-9_]{20,}/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /Bearer\s+[A-Za-z0-9._~+/=-]{8,}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
]);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function createRedactor(secrets = []) {
  const literals = [...new Set(secrets.filter((s) => typeof s === 'string' && s.length >= 8))]
    .sort((a, b) => b.length - a.length)
    .map((s) => new RegExp(escapeRegExp(s), 'g'));
  return (value) => {
    let text = String(value ?? '');
    literals.forEach((re) => {
      text = text.replace(re, REDACTED);
    });
    return text
      .replace(/github_pat_[A-Za-z0-9_]{20,}/g, REDACTED)
      .replace(/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, REDACTED)
      .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi, `$1${REDACTED}`);
  };
}
