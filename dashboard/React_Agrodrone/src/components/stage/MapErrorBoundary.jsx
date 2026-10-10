import { Component } from 'react';

export default class MapErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Map rendering failed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="map-shell active map-error" role="alert">
          <strong>Map view unavailable</strong>
          <span>The map service failed to load. Other dashboard controls remain available.</span>
          <button type="button" onClick={this.props.onShowFpv}>Switch to FPV</button>
        </div>
      );
    }

    return this.props.children;
  }
}
