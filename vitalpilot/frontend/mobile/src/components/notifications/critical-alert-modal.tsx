import {
    Linking,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
  } from 'react-native';
  
  type CriticalAlertModalProps = {
    visible: boolean;
  
    title: string;
    message: string;
  
    recommendation?: string;
  
    onDismiss: () => void;
    onReviewMeasurement?: () => void;
  };
  
  export function CriticalAlertModal({
    visible,
    title,
    message,
    recommendation,
    onDismiss,
    onReviewMeasurement,
  }: CriticalAlertModalProps) {
    async function callEmergencyServices() {
      try {
        await Linking.openURL('tel:911');
      } catch {
        console.log(
          'Unable to open phone dialer.'
        );
      }
    }
  
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onDismiss}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View
              style={
                styles.criticalIcon
              }
            >
              <Text
                style={
                  styles.criticalIconText
                }
              >
                !
              </Text>
            </View>
  
            <Text style={styles.label}>
              CRITICAL HEALTH ALERT
            </Text>
  
            <Text style={styles.title}>
              {title}
            </Text>
  
            <Text style={styles.message}>
              {message}
            </Text>
  
            {recommendation ? (
              <View
                style={
                  styles.recommendationBox
                }
              >
                <Text
                  style={
                    styles.recommendationLabel
                  }
                >
                  Health guidance
                </Text>
  
                <Text
                  style={
                    styles.recommendation
                  }
                >
                  {recommendation}
                </Text>
              </View>
            ) : null}
  
            <View style={styles.emergencyNote}>
              <Text
                style={
                  styles.emergencyNoteTitle
                }
              >
                Medical emergency?
              </Text>
  
              <Text
                style={
                  styles.emergencyNoteText
                }
              >
                If you believe you are
                experiencing a medical
                emergency or severe symptoms,
                contact emergency services
                immediately.
              </Text>
            </View>
  
            <Pressable
              onPress={
                callEmergencyServices
              }
              style={
                styles.emergencyButton
              }
            >
              <Text
                style={
                  styles.emergencyButtonText
                }
              >
                Call 911
              </Text>
            </Pressable>
  
            {onReviewMeasurement ? (
              <Pressable
                onPress={
                  onReviewMeasurement
                }
                style={
                  styles.reviewButton
                }
              >
                <Text
                  style={
                    styles.reviewButtonText
                  }
                >
                  Review Measurement
                </Text>
              </Pressable>
            ) : null}
  
            <Pressable
              onPress={onDismiss}
              style={
                styles.dismissButton
              }
            >
              <Text
                style={
                  styles.dismissButtonText
                }
              >
                I Understand
              </Text>
            </Pressable>
  
            <Text style={styles.disclaimer}>
              VitalPilot provides
              informational support and does
              not replace professional medical
              judgment.
            </Text>
          </View>
        </View>
      </Modal>
    );
  }
  
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
  
      backgroundColor:
        'rgba(16, 24, 40, 0.62)',
  
      alignItems: 'center',
      justifyContent: 'center',
  
      padding: 20,
    },
  
    modal: {
      width: '100%',
      maxWidth: 420,
  
      backgroundColor: '#FFFFFF',
  
      borderRadius: 24,
  
      padding: 22,
  
      alignItems: 'center',
    },
  
    criticalIcon: {
      width: 64,
      height: 64,
  
      borderRadius: 32,
  
      backgroundColor: '#FEE4E2',
  
      alignItems: 'center',
      justifyContent: 'center',
  
      marginBottom: 14,
    },
  
    criticalIconText: {
      color: '#D92D20',
  
      fontSize: 32,
      fontWeight: '900',
    },
  
    label: {
      color: '#D92D20',
  
      fontSize: 10,
      fontWeight: '900',
  
      letterSpacing: 1,
    },
  
    title: {
      color: '#101828',
  
      fontSize: 22,
      fontWeight: '900',
  
      textAlign: 'center',
  
      marginTop: 8,
    },
  
    message: {
      color: '#475467',
  
      fontSize: 13,
      lineHeight: 20,
  
      textAlign: 'center',
  
      marginTop: 9,
    },
  
    recommendationBox: {
      width: '100%',
  
      backgroundColor: '#FEF3F2',
  
      borderWidth: 1,
      borderColor: '#FECDCA',
  
      borderRadius: 14,
  
      padding: 13,
  
      marginTop: 16,
    },
  
    recommendationLabel: {
      color: '#B42318',
  
      fontSize: 10,
      fontWeight: '900',
    },
  
    recommendation: {
      color: '#7A271A',
  
      fontSize: 12,
      lineHeight: 18,
  
      marginTop: 4,
    },
  
    emergencyNote: {
      width: '100%',
  
      backgroundColor: '#FFF8EB',
  
      borderRadius: 14,
  
      padding: 13,
  
      marginTop: 14,
    },
  
    emergencyNoteTitle: {
      color: '#B54708',
  
      fontSize: 12,
      fontWeight: '900',
    },
  
    emergencyNoteText: {
      color: '#7A2E0E',
  
      fontSize: 11,
      lineHeight: 17,
  
      marginTop: 4,
    },
  
    emergencyButton: {
      width: '100%',
  
      minHeight: 50,
  
      backgroundColor: '#D92D20',
  
      borderRadius: 14,
  
      alignItems: 'center',
      justifyContent: 'center',
  
      marginTop: 16,
    },
  
    emergencyButtonText: {
      color: '#FFFFFF',
  
      fontSize: 14,
      fontWeight: '900',
    },
  
    reviewButton: {
      width: '100%',
  
      minHeight: 48,
  
      borderWidth: 1,
      borderColor: '#D92D20',
  
      borderRadius: 14,
  
      alignItems: 'center',
      justifyContent: 'center',
  
      marginTop: 9,
    },
  
    reviewButtonText: {
      color: '#B42318',
  
      fontSize: 13,
      fontWeight: '800',
    },
  
    dismissButton: {
      minHeight: 44,
  
      alignItems: 'center',
      justifyContent: 'center',
  
      marginTop: 5,
    },
  
    dismissButtonText: {
      color: '#667085',
  
      fontSize: 12,
      fontWeight: '700',
    },
  
    disclaimer: {
      color: '#98A2B3',
  
      fontSize: 9,
      lineHeight: 14,
  
      textAlign: 'center',
  
      marginTop: 8,
    },
  });