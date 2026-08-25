import {
  Icon,
  Label,
  NativeTabs,
} from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{
        selected: {
          color: colors.text,
        },
      }}
    >
      <NativeTabs.Trigger name="home">
        <Label>Dashboard</Label>

        <Icon
          src={require('../../assets/images/tabIcons/home.png')}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <Label>Explore</Label>

        <Icon
          src={require('../../assets/images/tabIcons/explore.png')}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="metrics">
        <Label>Vitals</Label>

        <Icon sf="plus.circle" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chatbot">
        <Label>Pilot AI</Label>

        <Icon sf="sparkles" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="reports">
        <Label>Reports</Label>

        <Icon sf="doc.text" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>

        <Icon sf="person.crop.circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}