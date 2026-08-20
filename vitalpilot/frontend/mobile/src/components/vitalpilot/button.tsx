import type { PropsWithChildren } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { VitalPilotColors } from '@/constants/vitalpilot';

type VitalButtonProps = PropsWithChildren<PressableProps> & {
  variant?: 'primary' | 'secondary';
};

export function VitalButton({
  children,
  variant = 'primary',
  style,
  ...props
}: VitalButtonProps) {
  return (
    <Pressable
      {...props}
      style={(state) => [
        styles.button,
        variant === 'primary'
          ? styles.primary
          : styles.secondary,
        state.pressed && styles.pressed,
        typeof style === 'function'
          ? style(state)
          : style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'secondary' &&
            styles.secondaryLabel,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  primary: {
    backgroundColor: VitalPilotColors.primary,
  },

  secondary: {
    backgroundColor: VitalPilotColors.white,
    borderWidth: 1,
    borderColor: VitalPilotColors.primary,
  },

  label: {
    color: VitalPilotColors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  secondaryLabel: {
    color: VitalPilotColors.primaryDark,
  },

  pressed: {
    opacity: 0.8,
  },
});