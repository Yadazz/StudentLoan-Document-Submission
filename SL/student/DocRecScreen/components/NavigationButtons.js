import { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const NavigationButtons = ({ 
  canGoBack, 
  canGoNext, 
  onBack, 
  onNext, 
  isLastStep = false 
}) => {
  const [countdown, setCountdown] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isLastStep && countdown === 0 && !isCompleted) {
      setCountdown(10); // Start countdown when reaching the last step
    }

    if (isLastStep && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prevCountdown => {
          if (prevCountdown === 1) {
            clearInterval(timer);  // Clear the interval when countdown reaches 0
            setIsCompleted(true);  // Enable the "เสร็จสิ้น" button after countdown
          }
          return prevCountdown - 1;
        });
      }, 1000);

      return () => clearInterval(timer);  // Clean up the timer on component unmount
    }
  }, [countdown, isLastStep, isCompleted]);

  const handleNext = () => {
    if (isLastStep && isCompleted) {
      onNext();  // Go to the next screen after countdown is complete
    } else {
      onNext(); // If not last step, proceed to the next screen immediately
    }
  };

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
        style={[styles.nextButton, !canGoNext && styles.nextButtonDisabled]} 
        onPress={handleNext} 
        disabled={!canGoNext || (isLastStep && countdown > 0)}
      >
        <Text style={styles.nextButtonText}>
          {isLastStep ? (countdown > 0 ? `เสร็จสิ้น (${countdown}s)` : "เสร็จสิ้น") : "ถัดไป"}
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
