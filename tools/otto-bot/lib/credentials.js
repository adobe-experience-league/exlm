import { StageError } from './errors.js';
import { GithubError } from './github.js';
import { JiraError } from './jira.js';

function permissionReason(service, error) {
  const httpError =
    (service === 'jira' && error instanceof JiraError) || (service === 'github' && error instanceof GithubError);
  if (httpError && [401, 403].includes(error.status)) {
    if (/rate.?limit|abuse detection|retry.after|organization.*policy/i.test(error.message) || error.rateLimited)
      return null;
    return `HTTP ${error.status} permission denied`;
  }
  if (error instanceof StageError && error.permissionDenied === true) return 'authentication or entitlement denied';
  return null;
}

export function createCredentialContext({ identity, master, log, requestedUser = identity.name, onFallback }) {
  const accounts = {};
  const warnings = [];
  const account = (service) => accounts[service] || identity;
  return {
    account,
    warnings,
    async run(service, operation) {
      try {
        return await operation(account(service));
      } catch (error) {
        const reason = permissionReason(service, error);
        if (!reason || !master || account(service).isMaster) throw error;
        const warning = { service, requestedUser, effectiveUser: master.jiraUser, reason };
        warnings.push(warning);
        log.warn('master credential fallback requested', warning);
        if (onFallback) {
          try {
            await onFallback(warning);
          } catch (auditError) {
            throw new StageError('reporting', 'Could not persist credential fallback warning', auditError.message);
          }
        }
        accounts[service] = { name: master.jiraUser, slug: 'master', isMaster: true, creds: master };
        return operation(account(service));
      }
    },
  };
}
