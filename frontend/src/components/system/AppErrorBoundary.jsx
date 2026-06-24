import React from 'react';
import CustomerErrorPage from '../errors/CustomerErrorPage.jsx';

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

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return <CustomerErrorPage
      code={500}
      showDebug={isFrontendDebugEnabled()}
      debugDetails={{
        message: this.state.error?.message || null,
        stack: this.state.error?.stack || null,
        componentStack: this.state.errorInfo?.componentStack || null,
        path: typeof window !== 'undefined' ? window.location.pathname : null,
        href: typeof window !== 'undefined' ? window.location.href : null,
      }}
    />;
  }
}
