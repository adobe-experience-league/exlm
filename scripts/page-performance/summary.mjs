function fmt(value, digits = 0) {
  if (value == null || Number.isNaN(value)) return '—';
  return typeof value === 'number' ? value.toFixed(digits) : String(value);
}

function sanitizeMdCell(text) {
  return String(text).replace(/\r?\n/g, ' ').replace(/\|/g, '/');
}

export function buildSummaryMarkdown(rows, generatedAt) {
  const lines = [
    '# Page performance report',
    '',
    `Generated: ${generatedAt}`,
    '',
    '| URL | Device | Status | Score | LCP (ms) | CLS | TBT (ms) | TTFB (ms) | Bytes |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const row of rows) {
    if (row.status !== 'ok') {
      lines.push(
        `| ${row.url} | ${row.formFactor} | ERROR: ${sanitizeMdCell(row.error || 'failed')} | — | — | — | — | — | — |`,
      );
      continue;
    }
    lines.push(
      `| ${row.url} | ${row.formFactor} | ok | ${fmt(row.score)} | ${fmt(row.lcpMs)} | ${fmt(row.cls, 3)} | ${fmt(
        row.tbtMs,
      )} | ${fmt(row.ttfbMs)} | ${fmt(row.totalByteWeight)} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

export function mergeShardSummaries(shards) {
  const ordered = [...shards].sort((a, b) => a.shard - b.shard);
  return {
    rows: ordered.flatMap((s) => s.rows || []),
  };
}
