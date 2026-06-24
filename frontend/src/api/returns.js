import { getAccountHistory } from './accountHistory.js';

export async function getCustomerReturns(page = 1, perPage = 20) {
  const history = await getAccountHistory({ perPage });
  return {
    returns: Array.isArray(history?.returns) ? history.returns : [],
    page,
    per_page: perPage,
    has_more: false,
  };
}
