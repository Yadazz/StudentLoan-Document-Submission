import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const NavigationButtons = ({ 
  canGoBack, 
  canGoNext, 
  onBack, 
  onNext, 
  isLastStep = false 
}) => {
  return (
    <View style={styles.navigationContainer}>
      <TouchableOpacity 
        style={[styles.backButton, !canGoBack && styles.buttonDisabled]} 
        onPress={onBack} 
        disabled={!canGoBack}
      >
        <Text style={styles.backButtonText}>ย้อนกลับ</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.nextButton, 
          !canGoNext && styles.nextButtonDisabled
        ]} 
        onPress={onNext} 
        disabled={!canGoNext}
      >
        <Text style={styles.nextButtonText}>
          {isLastStep ? "เสร็จสิ้น" : "ถัดไป"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    backgroundColor: '#64748b',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default NavigationButtons;
