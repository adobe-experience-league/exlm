export const STAGES = Object.freeze(['claim', 'workspace', 'copilot', 'blocked', 'guardrails', 'push', 'pr']);

export class StageError extends Error {
  constructor(stage, message, details = '') {
    super(message);
    this.name = 'StageError';
    this.stage = stage;
    this.details = details;
  }
}
