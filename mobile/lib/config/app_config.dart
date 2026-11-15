const _productionApiBaseUrl = 'https://cop4431-jonathonf.online/api/auth/';

const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: _productionApiBaseUrl,
);
