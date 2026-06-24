(function () {
  var content = {
    400: ['Request error', 'We could not process that request', 'Some of the information sent with this request was not valid. Please go back and try again.'],
    401: ['Sign in required', 'Please sign in to continue', 'Your session may have expired, or this page requires a Drywall Toolbox account.'],
    403: ['Access restricted', 'You do not have access to this page', 'This area may require a different account or a secure link sent directly to you.'],
    404: ['Page not found', 'We could not find that page', 'The link may be outdated, or the page may have moved. You can return home or browse our tools.'],
    405: ['Action unavailable', 'That action is not supported here', 'Return to the previous page and try the action again from its original location.'],
    408: ['Request timed out', 'That took longer than expected', 'Your connection may have been interrupted. Refresh the page to safely try again.'],
    409: ['Update conflict', 'This information changed', 'The record was updated elsewhere. Refresh the page before trying again.'],
    410: ['Link expired', 'This page is no longer available', 'The link may have expired or the requested resource may have been removed.'],
    413: ['Upload too large', 'That file is too large', 'Choose a smaller file and try the upload again.'],
    414: ['Address too long', 'That link could not be opened', 'Return to the previous page and use the original link or navigation.'],
    415: ['File type not supported', 'We cannot use that file type', 'Choose a supported file format and try again.'],
    422: ['Check your information', 'A few details need attention', 'Review the information you entered, correct any highlighted fields, and try again.'],
    429: ['Too many requests', 'Please wait a moment', 'We received several requests in a short period. Wait briefly, then try again.'],
    500: ['Unexpected error', 'Something went wrong on our side', 'Your information is safe. Refresh the page, or return to the store while we recover.'],
    501: ['Feature unavailable', 'This action is not available yet', 'Return to the previous page or contact support if you need assistance.'],
    502: ['Service interruption', 'A connected service is unavailable', 'We could not reach one of our services. Please refresh in a moment.'],
    503: ['Temporarily unavailable', 'We will be back shortly', 'Drywall Toolbox is temporarily unavailable or undergoing maintenance. Please try again soon.'],
    504: ['Service timeout', 'The service took too long to respond', 'Please refresh the page. If the issue continues, our support team can help.']
  };

  var code = Number(document.body.getAttribute('data-error-code')) || 500;
  var selected = content[code] || content[500];
  var path = window.location.pathname || '/';
  var match = path.match(/^\/(staging\/\d+|drywall-toolbox)(?:\/|$)/);
  var base = match ? '/' + match[1] : '';
  var linkMap = { home: '/', products: '/products', contact: '/contact' };

  document.querySelector('[data-error-eyebrow]').textContent = selected[0];
  document.querySelector('[data-error-title]').textContent = selected[1];
  document.querySelector('[data-error-message]').textContent = selected[2];
  document.title = code + ' | Drywall Toolbox';

  document.querySelectorAll('[data-link]').forEach(function (link) {
    link.href = base + linkMap[link.getAttribute('data-link')];
  });
  if (code === 401) {
    var primary = document.querySelector('.error-button--primary');
    primary.href = base + '/login';
    primary.textContent = 'Sign in';
  }
  document.querySelector('[data-retry]').addEventListener('click', function () {
    window.location.reload();
  });
  document.querySelector('[data-back]').addEventListener('click', function () {
    if (window.history.length > 1) window.history.back();
    else window.location.assign(base + '/');
  });
}());
