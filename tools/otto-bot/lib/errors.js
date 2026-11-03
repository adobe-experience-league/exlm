export const STAGES = Object.freeze([
  'claim',
  'workspace',
  'copilot',
  'blocked',
  'guardrails',
  'push',
  'pr',
  'reporting',
]);

export class StageError extends Error {
  constructor(stage, message, details = '') {
    super(message);
    this.name = 'StageError';
    this.stage = stage;
    this.details = details;
  }
}

export function commandPermissionDenied(service, output) {
  if (/rate.?limit|retry.after|organization.*policy|protected branch|repository rule/i.test(output)) return false;
  if (service === 'github') {
    return /^(?:remote: |fatal: )?(?:Permission to .+ denied to .+|Authentication failed\b|Write access to repository not granted\b|The requested URL returned error: (?:401|403)\b)/im.test(
      output,
    );
  }
  return /^(?:Error:\s*)?(?:Authentication failed\b|Not authenticated\b|No (?:valid )?(?:GitHub |Copilot )?(?:token|credentials|subscription)\b|Copilot (?:access|subscription) (?:denied|required|not found)\b|HTTP (?:401|403)\b)/im.test(
    output,
  );
}
