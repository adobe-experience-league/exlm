export function formatFallbackWarnings(warnings = []) {
  return warnings
    .map(
      ({ service, requestedUser, effectiveUser, reason }) =>
        `${service}: ${requestedUser} -> master account ${effectiveUser} (${reason})`,
    )
    .join('\n');
}

export function withFallbackWarnings(body, warnings = []) {
  const details = formatFallbackWarnings(warnings);
  return details ? `${body}\n\n## Credential fallback warning\n\n${details}\n` : body;
}
