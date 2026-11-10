import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type CanvasErrorBoundaryProps = {
  children: ReactNode;
  message: string;
};

type CanvasErrorBoundaryState = {
  failed: boolean;
};

export class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  state: CanvasErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.message}>{this.props.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    color: '#F4F5F7',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
