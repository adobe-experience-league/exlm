import fs from 'node:fs';

export function createLogger({ redact = (s) => String(s), write = (line) => process.stdout.write(line) } = {}) {
  const sinks = [write];
  const emit = (level, msg, data = {}) => {
    const line = `${redact(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...data }))}\n`;
    sinks.forEach((sink) => sink(line));
  };
  return {
    info: (msg, data) => emit('info', msg, data),
    warn: (msg, data) => emit('warn', msg, data),
    error: (msg, data) => emit('error', msg, data),
    attachFile(filePath) {
      sinks.push((line) => fs.appendFileSync(filePath, line));
    },
  };
}
