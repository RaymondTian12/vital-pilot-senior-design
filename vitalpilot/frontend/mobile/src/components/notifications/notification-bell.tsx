import {
    Pressable,
    StyleSheet,
    Text,
    View,
  } from 'react-native';
  
  import { VitalPilotColors } from '@/constants/vitalpilot';
  
  type NotificationBellProps = {
    count: number;
    onPress: () => void;
  };
  
  export function NotificationBell({
    count,
    onPress,
  }: NotificationBellProps) {
    const displayCount =
      count > 99 ? '99+' : String(count);
  
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={
          count > 0
            ? `${count} unread notifications`
            : 'Notifications'
        }
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.bell}>
          ♢
        </Text>
  
        {count > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {displayCount}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  }
  
  const styles = StyleSheet.create({
    button: {
      width: 46,
      height: 46,
  
      borderRadius: 23,
  
      backgroundColor: '#FFFFFF',
  
      borderWidth: 1,
      borderColor: '#E4E7EC',
  
      alignItems: 'center',
      justifyContent: 'center',
  
      position: 'relative',
    },
  
    bell: {
      color: VitalPilotColors.title,
  
      fontSize: 25,
      fontWeight: '700',
    },
  
    badge: {
      position: 'absolute',
  
      top: -3,
      right: -3,
  
      minWidth: 20,
      height: 20,
  
      paddingHorizontal: 5,
  
      borderRadius: 10,
  
      backgroundColor: '#D92D20',
  
      alignItems: 'center',
      justifyContent: 'center',
  
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
  
    badgeText: {
      color: '#FFFFFF',
  
      fontSize: 9,
      fontWeight: '900',
    },
  
    pressed: {
      opacity: 0.65,
    },
  });