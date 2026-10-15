export function sanitizeName(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_');
}

export function identitySlug(name, isMaster) {
  return isMaster ? 'master' : `user-${sanitizeName(name)}`;
}

export function resolveIdentity(users, assignee) {
  const entry = assignee ? users.users?.[assignee] : undefined;
  if (entry) {
    return { name: assignee, slug: identitySlug(assignee, false), isMaster: false, creds: entry, fallbackReason: null };
  }
  return {
    name: users.master.jiraUser,
    slug: identitySlug('master', true),
    isMaster: true,
    creds: users.master,
    fallbackReason: assignee ? `assignee ${assignee} is not onboarded` : 'the ticket is unassigned',
  };
}
