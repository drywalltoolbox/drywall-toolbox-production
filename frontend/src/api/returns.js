import { apiClient } from './client.js';

export async function getCustomerReturns(page = 1, perPage = 20) {
  const params = new URLSearchParams({ page, per_page: perPage }).toString();
  return apiClient(`/wp-json/dtb/v1/returns/mine?${params}`);
}
