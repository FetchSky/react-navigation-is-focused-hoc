import React from 'react';
import PropTypes from 'prop-types';

// subscribed components update functions
const subscribedComponents = [];
let stackSize = 1;

function getCurrentRouteKey(navigationState) {
  if (!navigationState) return null;
  const route = navigationState.routes[navigationState.index];
  if (route.routes) return getCurrentRouteKey(route);
  return route.key;
}

function updateFocus(currentState) {
  const currentRouteKey = getCurrentRouteKey(currentState);
  subscribedComponents.forEach(f => f(currentRouteKey));
  if (currentState && currentState.routes) {
    stackSize = currentState.routes.length;
  }
}

function getStackSize() {
  return stackSize;
}

function withNavigationFocus(WrappedComponent) {
  class WithNavigationFocus extends React.Component {
    static propTypes = {
      navigation: PropTypes.object.isRequired,
    };

    static navigationOptions = props => {
      if (typeof WrappedComponent.navigationOptions === 'function') {
        return WrappedComponent.navigationOptions(props);
      }
      return { ...WrappedComponent.navigationOptions };
    };

    constructor(props) {
      super(props);
      this.state = {
        isFocused: true,
        focusedRouteKey: props.navigation.state.key,
      };
      this.isFocused = true;
    }

    componentDidMount() {
      subscribedComponents.push(this._handleNavigationChange);
    }

    componentWillUnmount() {
      for (var i = 0; i < subscribedComponents.length; i++) {
        if (subscribedComponents[i] === this._handleNavigationChange) {
          subscribedComponents.splice(i, 1);
          break;
        }
      }
    }

    _handleNavigationChange = routeKey => {
      // update state only when isFocused changes
      const currentScreenKey = this.props.navigation.state.key;

      // when handling a navigation action that has nested actions, this method
      // will be called twice or more. in this case, a later call may not see a
      // change to this.state.isFocused even if this.setState already ran, since
      // React batches updates. so we need to check a local variable that
      // immediately reflects any changes.
      if (this.isFocused !== (currentScreenKey === routeKey)) {
        this.setState({
          isFocused: !this.isFocused,
          focusedRouteKey: routeKey,
        });
        this.isFocused = !this.isFocused;
      }
    };

    render() {
      return (
        <WrappedComponent
          isFocused={this.state.isFocused}
          focusedRouteKey={this.state.focusedRouteKey}
          {...this.props}
        />
      );
    }
  }
  WithNavigationFocus.displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  return WithNavigationFocus;
}

export { getCurrentRouteKey, withNavigationFocus, updateFocus, getStackSize };
