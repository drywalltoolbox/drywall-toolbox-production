import { apiClient } from './client.js';

export const RETURN_TERMINAL_STATUSES = [ 'rejected', 'refund_issued', 'exchange_sent', 'closed' ];
export const SUPPORT_TERMINAL_STATUSES = [ 'resolved', 'closed', 'spam' ];

export const RETURN_STATUS_LABELS = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Not Approved',
  awaiting_item: 'Awaiting Item',
  item_received: 'Item Received',
  refund_issued: 'Refund Issued',
  exchange_sent: 'Exchange Sent',
  closed: 'Closed',
};

export const SUPPORT_STATUS_LABELS = {
  open: 'Open',
  pending_customer: 'Waiting on You',
  pending_staff: 'Waiting on Support',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  spam: 'Closed',
};

function unwrap( response ) {
  return response?.data ?? response;
}

export async function getReturnStatus( returnId, token ) {
  const params = token ? `?token=${ encodeURIComponent( token ) }` : '';
  return unwrap(
    await apiClient( `/wp-json/dtb/v1/returns/status/${ encodeURIComponent( returnId ) }${ params }` )
  );
}

export async function getSupportStatus( ticketId, token ) {
  const params = token ? `?token=${ encodeURIComponent( token ) }` : '';
  return unwrap(
    await apiClient( `/wp-json/dtb/v1/support/tickets/${ encodeURIComponent( ticketId ) }/status/public${ params }` )
  );
}

export async function submitSupportReply( ticketId, token, message ) {
  return unwrap(
    await apiClient( `/wp-json/dtb/v1/support/tickets/${ encodeURIComponent( ticketId ) }/reply/public?token=${ encodeURIComponent( token ) }`, {
      method: 'POST',
      body: JSON.stringify( { message } ),
    } )
  );
}
