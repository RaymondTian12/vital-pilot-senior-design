import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  const logoScale = useSharedValue(0.72);
  const logoOpacity = useSharedValue(0);
  const wordmarkOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });

    logoScale.value = withSequence(
      withTiming(1.08, {
        duration: 520,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(1, {
        duration: 170,
        easing: Easing.out(Easing.ease),
      })
    );

    wordmarkOpacity.value = withDelay(
      350,
      withTiming(1, {
        duration: 350,
      })
    );

    logoScale.value = withDelay(
      1050,
      withTiming(1.55, {
        duration: 420,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    overlayOpacity.value = withDelay(
      1180,
      withTiming(
        0,
        {
          duration: 360,
        },
        (finished) => {
          if (finished) {
            runOnJS(setVisible)(false);
          }
        }
      )
    );
  }, [
    logoOpacity,
    logoScale,
    overlayOpacity,
    wordmarkOpacity,
  ]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      {
        scale: logoScale.value,
      },
    ],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlay,
        overlayStyle,
      ]}
    >
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.logoWrapper,
            logoStyle,
          ]}
        >
          <Image
            source={require('../../assets/images/vitalpilot/logo_green.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View style={wordmarkStyle}>
          <Text style={styles.wordmark}>
            VitalPilot
          </Text>

          <Text style={styles.tagline}>
            Your health, clearly in view.
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export function AnimatedIcon() {
  return (
    <View style={styles.staticIconWrap}>
      <Image
        source={require('../../assets/images/vitalpilot/logo_green.png')}
        style={styles.staticIcon}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 9999,
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoWrapper: {
    width: 132,
    height: 132,
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  wordmark: {
    marginTop: 14,

    color: '#101828',

    fontSize: 28,
    fontWeight: '900',

    textAlign: 'center',
  },

  tagline: {
    marginTop: 5,

    color: '#667085',

    fontSize: 12,

    textAlign: 'center',
  },

  staticIconWrap: {
    width: 128,
    height: 128,

    alignItems: 'center',
    justifyContent: 'center',
  },

  staticIcon: {
    width: 86,
    height: 86,
  },
});