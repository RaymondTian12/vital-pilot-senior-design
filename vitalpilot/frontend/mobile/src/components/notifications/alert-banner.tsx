import {
    Pressable,
    StyleSheet,
    Text,
    View,
  } from 'react-native';
  
  import type {
    NotificationSeverity,
  } from '@/types/notification';
  
  type AlertBannerProps = {
    visible: boolean;
  
    title: string;
    message: string;
  
    severity: NotificationSeverity;
  
    onDismiss: () => void;
    onPress?: () => void;
  };
  
  export function AlertBanner({
    visible,
    title,
    message,
    severity,
    onDismiss,
    onPress,
  }: AlertBannerProps) {
    if (!visible) {
      return null;
    }
  
    const theme =
      getSeverityTheme(severity);
  
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor:
              theme.background,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor:
                theme.iconBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.icon,
              {
                color: theme.color,
              },
            ]}
          >
            {theme.icon}
          </Text>
        </View>
  
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          style={styles.content}
        >
          <Text
            style={[
              styles.title,
              {
                color: theme.color,
              },
            ]}
          >
            {title}
          </Text>
  
          <Text style={styles.message}>
            {message}
          </Text>
  
          {onPress ? (
            <Text
              style={[
                styles.viewText,
                {
                  color: theme.color,
                },
              ]}
            >
              View details →
            </Text>
          ) : null}
        </Pressable>
  
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          style={styles.dismissButton}
        >
          <Text style={styles.dismissText}>
            ×
          </Text>
        </Pressable>
      </View>
    );
  }
  
  function getSeverityTheme(
    severity: NotificationSeverity
  ) {
    switch (severity) {
      case 'success':
        return {
          icon: '✓',
  
          color: '#137A53',
          background: '#ECF8F2',
          border: '#B7E4CE',
          iconBackground: '#D7F1E4',
        };
  
      case 'warning':
        return {
          icon: '!',
  
          color: '#B54708',
          background: '#FFF7E8',
          border: '#FEDF89',
          iconBackground: '#FEEFC7',
        };
  
      case 'critical':
        return {
          icon: '!',
  
          color: '#B42318',
          background: '#FEF3F2',
          border: '#FECDCA',
          iconBackground: '#FEE4E2',
        };
  
      default:
        return {
          icon: 'i',
  
          color: '#175CD3',
          background: '#EFF4FF',
          border: '#C7D7FE',
          iconBackground: '#DCE6FF',
        };
    }
  }
  
  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
  
      top: 58,
      left: 14,
      right: 14,
  
      zIndex: 9999,
  
      flexDirection: 'row',
      alignItems: 'flex-start',
  
      padding: 13,
  
      borderRadius: 16,
  
      borderWidth: 1,
  
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.12,
      shadowRadius: 10,
  
      elevation: 8,
    },
  
    iconContainer: {
      width: 34,
      height: 34,
  
      borderRadius: 17,
  
      alignItems: 'center',
      justifyContent: 'center',
  
      marginRight: 10,
    },
  
    icon: {
      fontSize: 15,
      fontWeight: '900',
    },
  
    content: {
      flex: 1,
    },
  
    title: {
      fontSize: 13,
      fontWeight: '900',
    },
  
    message: {
      color: '#475467',
  
      fontSize: 11,
      lineHeight: 17,
  
      marginTop: 3,
    },
  
    viewText: {
      fontSize: 10,
      fontWeight: '800',
  
      marginTop: 6,
    },
  
    dismissButton: {
      width: 30,
      height: 30,
  
      alignItems: 'center',
      justifyContent: 'center',
    },
  
    dismissText: {
      color: '#667085',
  
      fontSize: 20,
    },
  });