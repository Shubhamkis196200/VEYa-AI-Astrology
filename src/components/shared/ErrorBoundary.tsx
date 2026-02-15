/**
 * VEYa Error Boundary — Graceful error handling for React components
 * 
 * Uses the light premium theme for consistency with the rest of the app.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/borderRadius';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          {/* Light premium gradient background */}
          <LinearGradient
            colors={['#FDFBF7', '#F8F4EC', '#FDFBF7']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          
          {/* Error card */}
          <View style={styles.errorCard}>
            <View style={styles.emojiCircle}>
              <Text style={styles.emoji}>✨</Text>
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.props.fallbackMessage || 'The stars are realigning. Please try again.'}
            </Text>
            <Pressable 
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} 
              onPress={this.handleRetry}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Try Again</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for easier use
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallbackMessage?: string
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallbackMessage={fallbackMessage}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Hook for throwing errors that ErrorBoundary can catch
 */
export function useErrorHandler(): (error: Error) => void {
  const [, setError] = React.useState<Error>();
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emojiCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 165, 71, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.15)',
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontFamily: typography.fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontFamily: typography.fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  button: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  buttonText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
});

export default ErrorBoundary;
