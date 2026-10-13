import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'vitalpilot.access-token';
let webToken: string | null = null;

export const session = {
  get: () => Platform.OS === 'web' ? Promise.resolve(webToken) : SecureStore.getItemAsync(KEY),
  async set(token: string) {
    if (Platform.OS === 'web') webToken = token;
    else await SecureStore.setItemAsync(KEY, token);
  },
  async clear() {
    if (Platform.OS === 'web') webToken = null;
    else await SecureStore.deleteItemAsync(KEY);
  },
};
