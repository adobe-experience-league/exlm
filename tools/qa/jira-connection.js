import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export default async function checkJiraConnection({ baseUrl, token, fetchImpl = fetch }) {
  if (!baseUrl?.trim()) throw new Error('The JIRA_BASE_URL Actions variable is missing.');
  if (!token?.trim()) throw new Error('The JIRA_PAT_PR_QA Actions secret is missing.');
  if (/[\r\n]/.test(token)) throw new Error('JIRA_PAT_PR_QA must not contain line breaks.');

  let base;
  try {
    base = new URL(baseUrl.trim());
  } catch {
    throw new Error('JIRA_BASE_URL must be a valid HTTPS URL.');
  }
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) {
    throw new Error('JIRA_BASE_URL must use HTTPS without embedded credentials, query parameters, or a fragment.');
  }
  const endpoint = `${base.href.replace(/\/+$/, '')}/rest/api/2/myself`;
  let response;
  try {
    response = await fetchImpl(endpoint, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token.trim()}` },
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) {
    if (['TimeoutError', 'AbortError'].includes(error.name)) {
      throw new Error('Jira request timed out. Check runner access to the corporate network.');
    }
    const code = error.cause?.code ?? error.code;
    if (['ENOTFOUND', 'EAI_AGAIN'].includes(code)) {
      throw new Error(`Jira DNS lookup failed (${code}). Check the base hostname and runner access to corporate DNS.`);
    }
    if (['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(code)) {
      throw new Error(`Jira connection timed out (${code}). Check runner routing, firewall, and proxy access.`);
    }
    if (['ECONNREFUSED', 'ECONNRESET'].includes(code)) {
      throw new Error(
        `Jira connection was refused or reset (${code}). Check runner routing, firewall, and proxy access.`,
      );
    }
    if (
      [
        'CERT_HAS_EXPIRED',
        'DEPTH_ZERO_SELF_SIGNED_CERT',
        'SELF_SIGNED_CERT_IN_CHAIN',
        'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
        'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
        'ERR_TLS_CERT_ALTNAME_INVALID',
      ].includes(code)
    ) {
      throw new Error(
        `Jira TLS verification failed (${code}). Check certificate validity, hostname, and approved corporate CA trust.`,
      );
    }
    throw new Error(
      'Unable to reach Jira. Check runner DNS, corporate network/proxy access, and trusted TLS certificates.',
    );
  }

  if (response.status === 401) throw new Error('Jira rejected the PAT (HTTP 401). Check its validity and expiration.');
  if (response.status === 403)
    throw new Error('Jira denied access (HTTP 403). Check account permissions and access policy.');
  if (response.status >= 300 && response.status < 400) {
    throw new Error(
      'Jira redirected the request. Redirects are blocked to protect the PAT; check the base URL and SSO policy.',
    );
  }
  if (response.status !== 200) {
    throw new Error(
      `Jira returned HTTP ${response.status}. Check the base URL, service availability, and access policy.`,
    );
  }
  if (!/^application\/json\b/i.test(response.headers.get('content-type') || '')) {
    throw new Error(
      'Jira returned HTTP 200 without JSON. A sign-in page or network gateway may have intercepted the request.',
    );
  }
  let user;
  try {
    user = await response.json();
  } catch {
    throw new Error('Jira returned an unreadable JSON response; authentication has not been verified.');
  }
  if (
    !user ||
    typeof user.self !== 'string' ||
    !user.self ||
    ![user.name, user.accountId].some((identifier) => typeof identifier === 'string' && identifier.trim())
  ) {
    throw new Error('Jira did not return an authenticated user record; authentication has not been verified.');
  }
  return { status: 200 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let summary;
  try {
    await checkJiraConnection({ baseUrl: process.env.JIRA_BASE_URL, token: process.env.JIRA_PAT_PR_QA });
    summary = 'Jira connectivity and PAT authentication verified. No account data was logged or saved.';
    console.log(summary);
  } catch (error) {
    summary = `Jira connectivity check failed: ${error.message}`;
    console.error(summary);
    process.exitCode = 1;
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Jira connectivity\n\n${summary}\n`);
  }
}
