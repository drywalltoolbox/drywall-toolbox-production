import { getAccountHistory } from './accountHistory.js';

export async function getCustomerSupportTickets(page = 1, perPage = 20) {
  const history = await getAccountHistory({ perPage });
  return {
    tickets: Array.isArray(history?.tickets) ? history.tickets : [],
    page,
    per_page: perPage,
    has_more: false,
  };
}
