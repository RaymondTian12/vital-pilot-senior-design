import type { PropsWithChildren } from 'react';
import {
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';

import { VitalPilotColors } from '@/constants/vitalpilot';

type VitalCardProps = PropsWithChildren<ViewProps>;

export function VitalCard({
  children,
  style,
  ...props
}: VitalCardProps) {
  return (
    <View
      {...props}
      style={[styles.card, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: VitalPilotColors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: VitalPilotColors.border,
    padding: 18,
    gap: 8,
  },
});