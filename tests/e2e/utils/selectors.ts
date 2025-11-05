export const selectors = {
  auth: {
    email: '[name="email"]',
    password: '[name="password"]',
    submit: '[data-testid="auth-submit"]',
  },
  nav: {
    hub: '[data-testid="nav-hub"]',
    academy: '[data-testid="nav-academy"]',
    hidra: '[data-testid="nav-hidra"]',
    cybervault: '[data-testid="nav-cybervault"]',
    admin: '[data-testid="nav-admin"]',
  },
  hub: {
    home: '[data-testid="hub-home"]',
    saasCarousel: '[data-testid="hub-saas-carousel"]',
    metricsOverview: '[data-testid="hub-metrics-overview"]',
    metricTotal: '[data-testid="hub-metric-mensagens-totais"]',
    metricDelivered: '[data-testid="hub-metric-entregues"]',
  },
  academy: {
    courseCard: (slug: string) => `[data-testid="course-card-${slug}"]`,
    growthPlaybookShortcut: '[data-testid="course-card-growth-playbook"]',
    lessonComplete: '[data-testid="lesson-complete"]',
    progressPercentage: '[data-testid="course-progress-percentage"]',
  },
  hidra: {
    dashboard: '[data-testid="hidra-dashboard"]',
    configureEvolution: '[data-testid="hidra-configure-evolution"]',
    urlInput: '[name="evolutionUrl"]',
    apiKeyInput: '[name="apiKey"]',
    configSubmit: '[data-testid="hidra-config-submit"]',
    createCampaign: '[data-testid="hidra-create-campaign"]',
    nameInput: '[name="name"]',
    saveCampaign: '[data-testid="hidra-save-campaign"]',
    campaignRow: (name: string) => `[data-testid="hidra-campaign-row-${name}"]`,
  },
  cybervault: {
    library: '[data-testid="cybervault-library"]',
    searchInput: '[data-testid="cybervault-search"]',
    filterTag: (tag: string) => `[data-testid="cybervault-filter-tag-${tag}"]`,
    downloadButton: (slug: string) => `[data-testid="cybervault-download-${slug}"]`,
    toast: '[data-testid="cybervault-download-toast"]',
  },
  admin: {
    dashboard: '[data-testid="admin-dashboard"]',
    members: '[data-testid="admin-members"]',
  },
};
