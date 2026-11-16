export default [
  [
    '/en/docs/experience-manager-cloud-service/content/edge-delivery/overview',
    {
      title: 'Edge Delivery Services overview',
      type: 'Documentation',
      solution: 'Experience Manager',
      description: 'Learn how to build and deliver fast experiences with Edge Delivery Services.',
    },
  ],
  [
    '/en/docs/experience-cloud-kcs/kbarticles/ka-28148',
    {
      title: 'Troubleshooting example',
      type: 'Troubleshooting',
      solution: 'Experience Cloud',
      description: 'Follow a sample troubleshooting workflow to identify and resolve an issue.',
    },
  ],
  [
    '/en/perspectives/strategic-success-guide-value-realization-for-adobe-workfront',
    {
      title: 'Value realization for Adobe Workfront',
      type: 'Perspective',
      solution: 'Workfront',
      description: 'Explore a sample strategy for measuring value and improving work management.',
    },
  ],
  [
    '/en/playlists/campaign-classic-v7-getting-started-for-business-users',
    {
      title: 'Campaign Classic getting started',
      type: 'Playlist',
      solution: 'Campaign',
      description: 'Discover a sample collection of learning resources for business users.',
    },
  ],
].map(([path, fixture]) => [
  path,
  {
    body: `<!doctype html>
      <html><head>
        <title>${fixture.title}</title>
        <meta name="description" content="${fixture.description}">
        <meta name="coveo-content-type" content="${fixture.type}">
        <meta name="solution" content="${fixture.solution}">
        <meta name="author-name" content="Example author">
        <meta name="author-type" content="Adobe">
      </head><body></body></html>`,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Preview-Fixture': 'authorable-card',
    },
  },
]);
