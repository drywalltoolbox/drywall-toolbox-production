export const CUSTOMER_ERROR_CONTENT = {
  400: {
    eyebrow: 'Request error',
    title: 'We could not process that request',
    message: 'Some of the information sent with this request was not valid. Please go back and try again.',
  },
  401: {
    eyebrow: 'Sign in required',
    title: 'Please sign in to continue',
    message: 'Your session may have expired, or this page requires a Drywall Toolbox account.',
  },
  403: {
    eyebrow: 'Access restricted',
    title: 'You do not have access to this page',
    message: 'This area may require a different account or a secure link sent directly to you.',
  },
  404: {
    eyebrow: 'Page not found',
    title: 'We could not find that page',
    message: 'The link may be outdated, or the page may have moved. You can return home or browse our tools.',
  },
  405: {
    eyebrow: 'Action unavailable',
    title: 'That action is not supported here',
    message: 'Return to the previous page and try the action again from its original location.',
  },
  408: {
    eyebrow: 'Request timed out',
    title: 'That took longer than expected',
    message: 'Your connection may have been interrupted. Refresh the page to safely try again.',
  },
  409: {
    eyebrow: 'Update conflict',
    title: 'This information changed',
    message: 'The record was updated elsewhere. Refresh the page before trying again.',
  },
  410: {
    eyebrow: 'Link expired',
    title: 'This page is no longer available',
    message: 'The link may have expired or the requested resource may have been removed.',
  },
  413: {
    eyebrow: 'Upload too large',
    title: 'That file is too large',
    message: 'Choose a smaller file and try the upload again.',
  },
  422: {
    eyebrow: 'Check your information',
    title: 'A few details need attention',
    message: 'Review the information you entered, correct any highlighted fields, and try again.',
  },
  429: {
    eyebrow: 'Too many requests',
    title: 'Please wait a moment',
    message: 'We received several requests in a short period. Wait briefly, then try again.',
  },
  500: {
    eyebrow: 'Unexpected error',
    title: 'Something went wrong on our side',
    message: 'Your information is safe. Refresh the page, or return to the store while we recover.',
  },
  502: {
    eyebrow: 'Service interruption',
    title: 'A connected service is unavailable',
    message: 'We could not reach one of our services. Please refresh in a moment.',
  },
  503: {
    eyebrow: 'Temporarily unavailable',
    title: 'We will be back shortly',
    message: 'Drywall Toolbox is temporarily unavailable or undergoing maintenance. Please try again soon.',
  },
  504: {
    eyebrow: 'Service timeout',
    title: 'The service took too long to respond',
    message: 'Please refresh the page. If the issue continues, our support team can help.',
  },
  offline: {
    eyebrow: 'Connection lost',
    title: 'You appear to be offline',
    message: 'Check your internet connection, then try loading the page again.',
  },
};

export function normalizeCustomerErrorCode(code = 500) {
  if (String(code).toLowerCase() === 'offline') return 'offline';
  const numericCode = Number.parseInt(code, 10);
  return numericCode >= 400 && numericCode <= 599 ? numericCode : 500;
}

export function getCustomerErrorContent(code) {
  const normalizedCode = normalizeCustomerErrorCode(code);
  const fallback = typeof normalizedCode === 'number' && normalizedCode < 500
    ? {
        eyebrow: 'Request error',
        title: 'We could not complete that request',
        message: 'Return to the previous page or contact support if you continue to see this message.',
      }
    : CUSTOMER_ERROR_CONTENT[500];
  return {
    code: normalizedCode,
    ...(CUSTOMER_ERROR_CONTENT[normalizedCode] || fallback),
  };
}
