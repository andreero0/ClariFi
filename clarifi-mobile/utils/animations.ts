import { Animated, Easing, ViewStyle } from 'react-native';

// Standard Animation Durations (in milliseconds)
export const animationDurations = {
  short: 150,
  medium: 300,
  long: 500,
};

// Common Easing Functions
export const easings = {
  linear: Easing.linear,
  easeInQuad: Easing.quad,
  easeOutQuad: Easing.out(Easing.quad),
  easeInOutQuad: Easing.inOut(Easing.quad),
  easeInCubic: Easing.cubic,
  easeOutCubic: Easing.out(Easing.cubic),
  easeInOutCubic: Easing.inOut(Easing.cubic),
  easeInSine: Easing.sin,
  easeOutSine: Easing.out(Easing.sin),
  easeInOutSine: Easing.inOut(Easing.sin),
  spring: (config?: Animated.SpringAnimationConfig) =>
    Animated.spring(new Animated.Value(0), {
      toValue: 1,
      useNativeDriver: true,
      ...config,
    }),
};

/**
 * Creates a simple fade-in animation.
 * @param duration - The duration of the animation in milliseconds.
 * @returns An Animated.Value for opacity and a function to start the animation.
 */
export const useFadeIn = (duration: number = animationDurations.medium) => {
  const opacity = new Animated.Value(0);

  const fadeIn = (callback?: Animated.EndCallback) => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing: easings.easeInOutSine,
      useNativeDriver: true,
    }).start(callback);
  };

  const animatedStyle: Animated.WithAnimatedValue<ViewStyle> = {
    opacity,
  };

  return { opacity, fadeIn, animatedStyle };
};

/**
 * Creates a simple slide-in animation from the bottom.
 * @param duration - The duration of the animation.
 * @param initialY - The initial Y offset (how far down it starts).
 * @returns An Animated.Value for translateY and a function to start the animation.
 */
export const useSlideInFromBottom = (
  duration: number = animationDurations.medium,
  initialY: number = 50
) => {
  const translateY = new Animated.Value(initialY);

  const slideIn = (callback?: Animated.EndCallback) => {
    Animated.timing(translateY, {
      toValue: 0,
      duration,
      easing: easings.easeOutCubic,
      useNativeDriver: true,
    }).start(callback);
  };

  const animatedStyle: Animated.WithAnimatedValue<ViewStyle> = {
    transform: [{ translateY }],
  };

  return { translateY, slideIn, animatedStyle };
};

// TODO: Define common transition configurations for screen navigations if using react-navigation
// For example:
// export const screenTransitionConfigs = {
//   slideFromRight: {
//     ...TransitionPresets.SlideFromRightIOS,
//   },
//   modalPresentation: {
//     ...TransitionPresets.ModalPresentationIOS,
//   },
// };

// Guidelines for animations and transitions would typically be documented in a markdown file
// or a design system documentation site, covering aspects like:
// - When to use animations (e.g., for feedback, state changes, drawing attention).
// - Performance considerations (useNativeDriver: true, avoiding expensive computations on the JS thread).
// - Accessibility (respecting `reduceMotion` settings, providing alternatives for critical info).
// - Consistency in timing and easing across the app.
