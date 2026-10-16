/**
 * ErrorBoundary – catches JavaScript errors thrown while rendering any
 * component inside it and shows a fallback UI instead of a blank page.
 *
 * Error boundaries are one of the few things that STILL require a class
 * component: there is no hook equivalent of getDerivedStateFromError.
 *
 *   <ErrorBoundary>
 *     <SomethingThatMightCrash />
 *   </ErrorBoundary>
 *
 *   // or with a custom fallback:
 *   <ErrorBoundary fallback={(error, reset) => <button onClick={reset}>Retry</button>}>
 */
import { Component } from 'react';
import { CircleAlert } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  // 1. Called during rendering when a child throws → update state to show fallback.
  static getDerivedStateFromError(error) {
    return { error };
  }

  // 2. Called after the error – a good place to log it to a monitoring service.
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    const { fallback, children } = this.props;

    if (error) {
      if (typeof fallback === 'function') return fallback(error, this.reset);
      if (fallback) return fallback;
      return (
        <div className="alert alert-danger" role="alert">
          <CircleAlert size={20} />
          <div className="stack-sm">
            <strong>Something went wrong.</strong>
            <span className="small mono">{error.message}</span>
            <div>
              <button type="button" className="btn btn-sm" onClick={this.reset}>
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}
