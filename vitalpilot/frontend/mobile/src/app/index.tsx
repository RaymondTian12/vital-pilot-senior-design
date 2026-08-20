import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        VitalPilot Router Test
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  text: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000000',
  },
});