import { Component } from 'react';
import CustomerErrorPage from './CustomerErrorPage.jsx';

/**
 * Top-level React error boundary.
 *
 * Catches any uncaught JavaScript errors thrown inside the component tree and
 * renders a user-friendly fallback instead of a blank white screen.  This
 * prevents production crashes from being completely invisible to the user.
 *
 * Usage: wrap the application root in <ErrorBoundary> inside main.jsx.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production webpack drops console calls, but this intentional error
    // log is preserved here so the error appears in HostGator's error log
    // if server-side logging is configured.  The guard prevents leaking info
    // in development where the React overlay is already shown.
    if (process.env.NODE_ENV === 'production') {
      // Structured log without leaking stack to browser console in prod.
      // Webpack's drop_console setting removes console.log/info — this is
      // console.error, which is preserved so monitoring tools can capture it.
      console.error('[ErrorBoundary] Unhandled render error:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return <CustomerErrorPage code={500} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
