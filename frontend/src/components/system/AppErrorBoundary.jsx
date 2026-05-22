import React from 'react';

const APP_BASE = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');

function toAppHref(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${ path }`;
  return `${ APP_BASE }${ normalized }` || '/';
}

function isFrontendDebugEnabled() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search || '');
  const flag = String(params.get('dtb_frontend_debug') || '').toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes' || flag === 'on';
}

/**
 * frontend/src/components/system/AppErrorBoundary.jsx
 *
 * Production ecommerce global error boundary.
 *
 * Captures catastrophic render/runtime failures and prevents total storefront
 * unmounts during:
 * - checkout
 * - cart mutations
 * - product rendering
 * - account workflows
 */

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Centralized logging hook.
    // Future integrations:
    // - Sentry
    // - Datadog
    // - NewRelic
    // - internal telemetry endpoint
    if (typeof window !== 'undefined') {
      console.error('[DTB Frontend Error Boundary]', {
        error,
        errorInfo,
        path: window.location.pathname,
        href: window.location.href,
      });
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center text-2xl font-black mb-5">
            !
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-950 mb-3">
            Something went wrong
          </h1>

          <p className="text-sm leading-6 text-slate-500 mb-8">
            The storefront encountered an unexpected error while rendering this page.
            You can safely retry or return to the products catalog.
          </p>

          { isFrontendDebugEnabled() && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-800">
                Debug Details
              </p>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-amber-900">
                { JSON.stringify( {
                  message: this.state.error?.message || null,
                  stack: this.state.error?.stack || null,
                  componentStack: this.state.errorInfo?.componentStack || null,
                  path: typeof window !== 'undefined' ? window.location.pathname : null,
                  href: typeof window !== 'undefined' ? window.location.href : null,
                }, null, 2 ) }
              </pre>
            </div>
          ) }

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
            >
              Reload Page
            </button>

            <a
              href={toAppHref('/products/brands')}
              className="px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
            >
              Browse Products
            </a>
          </div>
        </div>
      </div>
    );
  }
}
