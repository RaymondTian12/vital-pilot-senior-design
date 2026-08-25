import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

type VitalPilotLogoProps = {
  size?: number;
};

export function VitalPilotLogo({
  size = 64,
}: VitalPilotLogoProps) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Image
        source={require('../../../assets/images/vitalpilot/logo_green.png')}
        style={styles.image}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
  },
});