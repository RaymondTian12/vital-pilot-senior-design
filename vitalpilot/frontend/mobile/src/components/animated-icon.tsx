import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
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
    async function startSplash() {
      await SplashScreen.hideAsync();

      /*
       * Phase 1:
       * VitalPilot logo fades into view.
       */
      logoOpacity.value = withTiming(1, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      });

      /*
       * Phase 2:
       * Logo grows slightly past its final size,
       * then settles back.
       */
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

      /*
       * Phase 3:
       * Reveal the VitalPilot name.
       */
      wordmarkOpacity.value = withDelay(
        360,
        withTiming(1, {
          duration: 360,
        })
      );

      /*
       * Phase 4:
       * Expand the logo before revealing the app.
       */
      logoScale.value = withDelay(
        1050,
        withTiming(1.6, {
          duration: 430,
          easing: Easing.inOut(Easing.cubic),
        })
      );

      /*
       * Phase 5:
       * Fade the entire splash overlay away.
       */
      overlayOpacity.value = withDelay(
        1180,
        withTiming(
          0,
          {
            duration: 360,
            easing: Easing.out(Easing.cubic),
          },
          (finished) => {
            if (finished) {
              runOnJS(setVisible)(false);
            }
          }
        )
      );
    }

    startSplash();
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
      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.logoWrap,
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
    elevation: 9999,
  },

  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoWrap: {
    width: 132,
    height: 132,

    alignItems: 'center',
    justifyContent: 'center',
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

    letterSpacing: -0.7,

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