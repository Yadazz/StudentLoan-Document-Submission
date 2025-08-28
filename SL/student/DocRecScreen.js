import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../database/firebase';
import { doc, collection, setDoc, serverTimestamp } from 'firebase/firestore';

// Import Components
import QuestionOption from './components/QuestionOption';
import SummaryCard from './components/SummaryCard';
import NavigationButtons from './components/NavigationButtons';
import useSurveyLogic from './hooks/useSurveyLogic';

const DocRecScreen = () => {
  const navigation = useNavigation();
  const {
    // State
    step,
    familyStatus,
    livingWith,
    fatherIncome,
    motherIncome,
    legalStatus,
    guardianIncome,
    parentLegalStatus,
    
    // Setters
    setStep,
    setFamilyStatus,
    setLivingWith,
    setFatherIncome,
    setMotherIncome,
    setLegalStatus,
    setGuardianIncome,
    setParentLegalStatus,
    
    // Utility functions
    getNavigationSteps,
    isNextButtonEnabled,
    getSurveyData,
    resetRelatedValues
  } = useSurveyLogic();

  // คำถามและตัวเลือกสำหรับแต่ละขั้นตอน
  const getQuestionConfig = () => {
    switch (step) {
      case 1:
        return {
          question: "1. สถานภาพครอบครัวของคุณ",
          options: [
            { value: 'ก', label: 'บิดาและมารดาอยู่ด้วยกัน' },
            { value: 'ข', label: 'บิดาหรือมารดาหย่าร้าง หรือเสียชีวิต หรือไม่สามารถติดต่อได้' },
            { value: 'ค', label: 'มีผู้ปกครอง ที่ไม่ใช่บิดามารดาดูแล' }
          ],
          selectedValue: familyStatus,
          onSelect: setFamilyStatus,
          resetValues: resetRelatedValues
        };

      case 2:
        if (familyStatus === 'ก') {
          return {
            question: "2. บิดามีรายได้ประจำหรือไม่?",
            options: [
              { value: 'มีรายได้ประจำ', label: 'มีรายได้ประจำ' },
              { value: 'ไม่มีรายได้ประจำ', label: 'ไม่มีรายได้ประจำ' }
            ],
            selectedValue: fatherIncome,
            onSelect: setFatherIncome
          };
        } else if (familyStatus === 'ข') {
          return {
            question: "2. คุณอาศัยอยู่กับใคร?",
            options: [
              { value: 'บิดา', label: 'บิดา' },
              { value: 'มารดา', label: 'มารดา' }
            ],
            selectedValue: livingWith,
            onSelect: setLivingWith,
            resetValues: () => {
              setFatherIncome('');
              setMotherIncome('');
              setLegalStatus('');
            }
          };
        } else if (familyStatus === 'ค') {
          return {
            question: "2. ผู้ปกครองมีรายได้ประจำหรือไม่?",
            options: [
              { value: 'มีรายได้ประจำ', label: 'มีรายได้ประจำ' },
              { value: 'ไม่มีรายได้ประจำ', label: 'ไม่มีรายได้ประจำ' }
            ],
            selectedValue: guardianIncome,
            onSelect: setGuardianIncome
          };
        }
        break;

      case 3:
        if (familyStatus === 'ก') {
          return {
            question: "3. มารดามีรายได้ประจำหรือไม่?",
            options: [
              { value: 'มีรายได้ประจำ', label: 'มีรายได้ประจำ' },
              { value: 'ไม่มีรายได้ประจำ', label: 'ไม่มีรายได้ประจำ' }
            ],
            selectedValue: motherIncome,
            onSelect: setMotherIncome
          };
        } else if (familyStatus === 'ข') {
          return {
            question: "3. คุณมีสำเนาใบหย่า หรือ สำเนาใบมรณบัตรหรือไม่?",
            options: [
              { value: 'มี', label: 'มี' },
              { value: 'ไม่มี', label: 'ไม่มี' }
            ],
            selectedValue: legalStatus,
            onSelect: setLegalStatus
          };
        } else if (familyStatus === 'ค') {
          return {
            question: "3. คุณมีสำเนาใบหย่า หรือ สำเนาใบมรณบัตรของบิดามารดาหรือไม่?",
            options: [
              { value: 'มี', label: 'มี' },
              { value: 'ไม่มี', label: 'ไม่มี' }
            ],
            selectedValue: parentLegalStatus,
            onSelect: setParentLegalStatus
          };
        }
        break;

      case 4:
        if (familyStatus === 'ข') {
          const parent = livingWith === "บิดา" ? "บิดา" : "มารดา";
          const income = livingWith === "บิดา" ? fatherIncome : motherIncome;
          const setIncome = livingWith === "บิดา" ? setFatherIncome : setMotherIncome;
          
          return {
            question: `4. ${parent} มีรายได้ประจำหรือไม่?`,
            options: [
              { value: 'มีรายได้ประจำ', label: 'มีรายได้ประจำ' },
              { value: 'ไม่มีรายได้ประจำ', label: 'ไม่มีรายได้ประจำ' }
            ],
            selectedValue: income,
            onSelect: setIncome
          };
        }
        break;

      default:
        return null;
    }
  };

  // การนำทาง
  const navigationSteps = getNavigationSteps();
  const currentStepIndex = navigationSteps.indexOf(step);
  const totalSteps = navigationSteps.length;

  const handleNextStep = () => {
    const nextStep = navigationSteps[navigationSteps.indexOf(step) + 1];
    if (nextStep) {
      setStep(nextStep);
    } else {
      handleUploadAndSave();
    }
  };

  const handleBackStep = () => {
    const previousStep = navigationSteps[navigationSteps.indexOf(step) - 1];
    if (previousStep) {
      setStep(previousStep);
    } else {
      navigation.goBack();
    }
  };

  const handleUploadAndSave = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "User not logged in.");
        return;
      }

      const surveyData = {
        ...getSurveyData(),
        timestamp: serverTimestamp()
      };

      const surveyRef = doc(collection(db, "users", currentUser.uid, "survey"));
      await setDoc(surveyRef, surveyData);

      navigation.navigate('MainTabs', { screen: 'ส่งเอกสาร' });

    } catch (error) {
      console.error("Error saving survey data: ", error);
      Alert.alert("Error", "Failed to save survey data.");
    }
  };

  // Render เนื้อหา
  const renderContent = () => {
    if (step === 'summary') {
      return <SummaryCard surveyData={getSurveyData()} />;
    }

    const config = getQuestionConfig();
    if (!config) return null;

    return <QuestionOption {...config} />;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <View style={styles.contentCard}>
        {renderContent()}
      </View>

      <NavigationButtons
        canGoBack={step !== 1}
        canGoNext={isNextButtonEnabled()}
        onBack={handleBackStep}
        onNext={handleNextStep}
        isLastStep={step === 'summary'}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#eef2f9',
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
});

export default DocRecScreen;
