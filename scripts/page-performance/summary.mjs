import { buildRunInsights, buildRunSuggestion, isLowScore, rowReasons, urlKey } from './metrics.mjs';

function fmt(value, digits = 0) {
  if (value == null || Number.isNaN(value)) return '—';
  return typeof value === 'number' ? value.toFixed(digits) : String(value);
}

function sanitizeMdCell(text) {
  return String(text).replace(/\r?\n/g, ' ').replace(/\|/g, '/');
}

function typeLookup(selectedByType = []) {
  return new Map((selectedByType || []).map((t) => [urlKey(t.url), t.id]));
}

export function buildSummaryMarkdown(rows, generatedAt, selectedByType = []) {
  const typeByUrl = typeLookup(selectedByType);
  const showType = typeByUrl.size > 0;
  const header = showType
    ? '| Type | URL | Device | Status | Score | FCP (ms) | LCP (ms) | CLS | TBT (ms) | SI (ms) | TTFB (ms) |'
    : '| URL | Device | Status | Score | FCP (ms) | LCP (ms) | CLS | TBT (ms) | SI (ms) | TTFB (ms) |';
  const divider = showType
    ? '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
    : '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |';
  const lines = ['# Page performance report', '', `Generated: ${generatedAt}`, '', header, divider];
  for (const row of rows) {
    const typeCell = showType ? `${typeByUrl.get(urlKey(row.url)) || '—'} | ` : '';
    if (row.status !== 'ok') {
      lines.push(
        `| ${typeCell}${row.url} | ${row.formFactor} | ERROR: ${sanitizeMdCell(
          row.error || 'failed',
        )} | — | — | — | — | — | — | — |`,
      );
      continue;
    }
    lines.push(
      `| ${typeCell}${row.url} | ${row.formFactor} | ok | ${fmt(row.score)} | ${fmt(row.fcpMs)} | ${fmt(
        row.lcpMs,
      )} | ${fmt(row.cls, 3)} | ${fmt(row.tbtMs)} | ${fmt(row.siMs)} | ${fmt(row.ttfbMs)} |`,
    );
  }
  lines.push('');
  lines.push('## Run suggestion');
  lines.push('');
  lines.push(buildRunSuggestion(rows));
  lines.push('');

  const insights = buildRunInsights(rows);
  lines.push('## Insights summary');
  lines.push('');
  if (!insights.length) {
    lines.push('No repeated Lighthouse insights on low-scoring views.');
  } else {
    for (const item of insights) {
      lines.push(`- ${item.count} view(s): ${sanitizeMdCell(item.title)}`);
    }
  }
  lines.push('');

  const low = rows.filter(isLowScore);
  lines.push('## Low scores');
  lines.push('');
  if (!low.length) {
    lines.push('None.');
  } else {
    for (const row of low) {
      const type = typeByUrl.get(urlKey(row.url));
      const label = type ? `${type} ` : '';
      lines.push(`### ${label}${row.formFactor} (${row.score})`);
      lines.push('');
      lines.push(`- ${row.url}`);
      for (const reason of rowReasons(row).slice(0, 5)) {
        lines.push(`- ${sanitizeMdCell(reason)}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function mergeShardSummaries(shards) {
  const ordered = [...shards].sort((a, b) => a.shard - b.shard);
  return {
    rows: ordered.flatMap((s) => s.rows || []),
  };
}
