export default function buildHeadlessSearchEngine(module, coveoToken) {
  return module.buildSearchEngine({
    configuration: {
      organizationId: 'adobesystemsincorporatednonprod1',
      organizationEndpoints: module.getOrganizationEndpoints('adobesystemsincorporatednonprod1'),
      accessToken: coveoToken,
    },
  });
}
