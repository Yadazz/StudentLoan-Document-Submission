import { useState } from 'react';

const useSurveyLogic = () => {
  // State สำหรับแบบสอบถาม
  const [step, setStep] = useState(1);
  const [familyStatus, setFamilyStatus] = useState('');
  const [livingWith, setLivingWith] = useState('');
  const [fatherIncome, setFatherIncome] = useState('');
  const [motherIncome, setMotherIncome] = useState('');
  const [legalStatus, setLegalStatus] = useState('');
  const [guardianIncome, setGuardianIncome] = useState('');
  const [parentLegalStatus, setParentLegalStatus] = useState('');

  // ฟังก์ชันรีเซ็ตค่าที่เกี่ยวข้อง
  const resetRelatedValues = () => {
    setLivingWith('');
    setFatherIncome('');
    setMotherIncome('');
    setLegalStatus('');
    setGuardianIncome('');
    setParentLegalStatus('');
  };

  // กำหนดขั้นตอนการนำทาง
  const getNavigationSteps = () => {
    let steps = [1];
    
    if (familyStatus === 'ก') {
      steps.push(2);
      if (fatherIncome !== '') steps.push(3);
    } else if (familyStatus === 'ข') {
      steps.push(2);
      if (livingWith !== '') steps.push(3);
      if (legalStatus !== '') steps.push(4);
    } else if (familyStatus === 'ค') {
      steps.push(2);
      if (guardianIncome !== '') steps.push(3);
    }
    
    steps.push('summary');
    return steps;
  };

  // ตรวจสอบว่าสามารถไปขั้นตอนถัดไปได้หรือไม่
  const isNextButtonEnabled = () => {
    switch (step) {
      case 1: return familyStatus !== '';
      case 2:
        if (familyStatus === 'ก') return fatherIncome !== '';
        if (familyStatus === 'ข') return livingWith !== '';
        if (familyStatus === 'ค') return guardianIncome !== '';
        return false;
      case 3:
        if (familyStatus === 'ก') return motherIncome !== '';
        if (familyStatus === 'ข') return legalStatus !== '';
        if (familyStatus === 'ค') return parentLegalStatus !== '';
        return false;
      case 4:
        if (familyStatus === 'ข') {
          const income = livingWith === "บิดา" ? fatherIncome : motherIncome;
          return income !== '';
        }
        return false;
      case 'summary': return true;
      default: return false;
    }
  };

  // สร้างข้อมูลสำหรับบันทึก
  const getSurveyData = () => ({
    familyStatus,
    livingWith,
    fatherIncome,
    motherIncome,
    legalStatus,
    guardianIncome,
    parentLegalStatus
  });

  return {
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
  };
};

export default useSurveyLogic;
