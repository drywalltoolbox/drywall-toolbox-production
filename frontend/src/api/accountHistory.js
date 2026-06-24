import { apiClient } from './client.js';

export async function getAccountHistory({ perPage = 50 } = {}) {
  const params = new URLSearchParams({ per_page: String(perPage) });
  return apiClient(`/wp-json/dtb/v1/account/history?${params.toString()}`);
}
