export default function buildHeadlessSearchEngine(module, coveoToken) {
  return module.buildSearchEngine({
    configuration: {
      organizationId: 'adobev2prod9e382h1q',
      organizationEndpoints: module.getOrganizationEndpoints('adobev2prod9e382h1q'),
      accessToken: coveoToken,
    },
  });
}
