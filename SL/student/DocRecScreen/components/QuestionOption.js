import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const QuestionOption = ({ question, options, selectedValue, onSelect, resetValues = () => {} }) => {
  return (
    <View>
      <Text style={styles.question}>{question}</Text>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[styles.option, selectedValue === option.value && styles.optionSelected]}
          onPress={() => {
            resetValues(); // Reset related values when option changes
            onSelect(option.value);
          }}
        >
          <Text style={styles.optionText}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optionSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  optionText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
});

export default QuestionOption;