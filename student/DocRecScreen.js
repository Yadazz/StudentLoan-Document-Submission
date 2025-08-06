import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';

const DocRecScreen = () => {
  const [step, setStep] = useState(1);
  const [familyStatus, setFamilyStatus] = useState('');
  const [livingWith, setLivingWith] = useState('');
  const [fatherIncome, setFatherIncome] = useState('');
  const [motherIncome, setMotherIncome] = useState('');
  const [legalStatus, setLegalStatus] = useState('');
  const [singleParentIncome, setSingleParentIncome] = useState('');
  const [guardianIncome, setGuardianIncome] = useState('');
  const [parentLegalStatus, setParentLegalStatus] = useState('');

  // Function to get step navigation based on family status and current values
  const getNavigationSteps = () => {
    let steps = [1]; // Always start with step 1
    
    if (familyStatus === 'ก') {
      steps.push(2); // Father income question
      if (fatherIncome) steps.push(3); // Mother income question
      if (motherIncome) steps.push(4); // Results
    } else if (familyStatus === 'ข') {
      steps.push(5); // Living with question
      if (livingWith) steps.push(6); // Legal status question
      if (legalStatus) steps.push(7); // Single parent income question
      if (singleParentIncome) steps.push(8); // Results
    } else if (familyStatus === 'ค') {
      steps.push(9); // Guardian income question
      if (guardianIncome) steps.push(10); // Parent legal status question
      if (parentLegalStatus) steps.push(11); // Results
    }
    
    return steps;
  };

  // Function to build the final document list
  const getDocuments = () => {
    let documents = [];

    // Common documents for all cases
    documents.push(
      "- แบบฟอร์ม กยศ. 101 (กรอกข้อมูลตามจริงให้ครบถ้วน)",
      "- เอกสารจิตอาสา (กิจกรรมในปีการศึกษา 2567 อย่างน้อย 1 รายการ)"
    );

    if (familyStatus === "ก") {
      documents.push(
        "- หนังสือยินยอมเปิดเผยข้อมูล ของ บิดา มารดา และผู้กู้ (คนละ 1 แผ่น)",
        "- สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้อง ของ บิดา มารดา และผู้กู้ (คนละ 1 แผ่น)"
      );
      if (fatherIncome === "มี") {
        documents.push(
          "- หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของบิดา (เอกสารอายุไม่เกิน 3 เดือน)"
        );
      } else {
        documents.push(
          "- หนังสือรับรองรายได้ กยศ. 102 ของบิดา พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)"
        );
      }
      if (motherIncome === "มี") {
        documents.push(
          "- หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของมารดา (เอกสารอายุไม่เกิน 3 เดือน)"
        );
      } else {
        documents.push(
          "- หนังสือรับรองรายได้ กยศ. 102 ของมารดา พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)"
        );
      }
    } else if (familyStatus === "ข") {
      let parent = livingWith === "บิดา" ? "บิดา" : "มารดา";
      documents.push(
        `- หนังสือยินยอมเปิดเผยข้อมูล ของ ${parent} และผู้กู้ (คนละ 1 แผ่น)`,
        `- สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้อง ของ ${parent} และผู้กู้ (คนละ 1 แผ่น)`
      );
      if (legalStatus === "มี") {
        documents.push(
          "- สำเนาใบหย่า (กรณีหย่าร้าง) หรือ สำเนาใบมรณบัตร (กรณีเสียชีวิต)"
        );
      } else {
        documents.push(
          "- หนังสือรับรองสถานภาพครอบครัว พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)"
        );
      }
      if (singleParentIncome === "มี") {
        documents.push(
          `- หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของ${parent} (เอกสารอายุไม่เกิน 3 เดือน)`
        );
      } else {
        documents.push(
          `- หนังสือรับรองรายได้ กยศ. 102 ของ${parent} พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)`
        );
      }
    } else if (familyStatus === "ค") {
        documents.push(
          "- หนังสือยินยอมเปิดเผยข้อมูล ของ ผู้ปกครองและผู้กู้ (คนละ 1 แผ่น)",
          "- สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้อง ของ ผู้ปกครองและผู้กู้ (คนละ 1 แผ่น)"
        );
        if (guardianIncome === "มี") {
          documents.push(
            "- หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของผู้ปกครอง (เอกสารอายุไม่เกิน 3 เดือน)"
          );
        } else {
          documents.push(
            "- หนังสือรับรองรายได้ กยศ. 102 ของผู้ปกครอง พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)"
          );
        }
        if (parentLegalStatus === "มี") {
            documents.push(
                "- สำเนาใบหย่า (กรณีหย่าร้าง) หรือ สำเนาใบมรณบัตร (กรณีเสียชีวิต)"
            );
        }
        documents.push(
            "- หนังสือรับรองสถานภาพครอบครัว พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)"
        );
    }
    
    return documents;
  };

  const handleRestart = () => {
    setStep(1);
    setFamilyStatus('');
    setLivingWith('');
    setFatherIncome('');
    setMotherIncome('');
    setLegalStatus('');
    setSingleParentIncome('');
    setGuardianIncome('');
    setParentLegalStatus('');
  };

  const handleBack = () => {
    const steps = getNavigationSteps();
    const currentIndex = steps.indexOf(step);
    
    if (currentIndex > 0) {
      const previousStep = steps[currentIndex - 1];
      
      // Reset state based on which step we're going back to
      if (step === 4 && familyStatus === 'ก') {
        setMotherIncome('');
      } else if (step === 3 && familyStatus === 'ก') {
        setFatherIncome('');
      } else if (step === 8 && familyStatus === 'ข') {
        setSingleParentIncome('');
      } else if (step === 7 && familyStatus === 'ข') {
        setLegalStatus('');
      } else if (step === 6 && familyStatus === 'ข') {
        setLivingWith('');
      } else if (step === 11 && familyStatus === 'ค') {
        setParentLegalStatus('');
      } else if (step === 10 && familyStatus === 'ค') {
        setGuardianIncome('');
      } else if (step === 5 || step === 9) {
        setFamilyStatus('');
      }
      
      setStep(previousStep);
    }
  };

  const canGoBack = () => {
    const steps = getNavigationSteps();
    const currentIndex = steps.indexOf(step);
    return currentIndex > 0;
  };

  const getStepProgress = () => {
    let totalSteps = 1; // Always has step 1
    let currentStepNum = 1;
    
    if (familyStatus === 'ก') {
      totalSteps = 4;
      if (step >= 2) currentStepNum = 2;
      if (step >= 3) currentStepNum = 3;
      if (step >= 4) currentStepNum = 4;
    } else if (familyStatus === 'ข') {
      totalSteps = 4;
      if (step >= 5) currentStepNum = 2;
      if (step >= 6) currentStepNum = 3;
      if (step >= 7) currentStepNum = 4;
      if (step >= 8) currentStepNum = 4;
    } else if (familyStatus === 'ค') {
      totalSteps = 4;
      if (step >= 9) currentStepNum = 2;
      if (step >= 10) currentStepNum = 3;
      if (step >= 11) currentStepNum = 4;
    }
    
    return { current: currentStepNum, total: totalSteps };
  };

  const renderProgressBar = () => {
    const progress = getStepProgress();
    const percentage = (progress.current / progress.total) * 100;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress.current}/{progress.total}</Text>
      </View>
    );
  };

  const renderContent = () => {
    const isResultStep = (familyStatus === 'ก' && step === 4) || 
                        (familyStatus === 'ข' && step === 8) || 
                        (familyStatus === 'ค' && step === 11);

    switch (step) {
      case 1:
        return (
          <View style={styles.card}>
            <Text style={styles.stepIndicator}>ขั้นตอนที่ 1</Text>
            <Text style={styles.question}>สถานภาพครอบครัวของคุณตรงกับข้อใด?</Text>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => { setFamilyStatus('ก'); setStep(2); }}
            >
              <Text style={styles.buttonText}>ก. บิดาและมารดาอยู่ด้วยกันตามปกติ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => { setFamilyStatus('ข'); setStep(5); }}
            >
              <Text style={styles.buttonText}>ข. บิดาหรือมารดาหย่าร้าง/เลิกร้าง/เสียชีวิต หรือไม่สามารถติดต่อได้</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => { setFamilyStatus('ค'); setStep(9); }}
            >
              <Text style={styles.buttonText}>ค. บิดามารดาเสียชีวิต/ไม่สามารถติดต่อได้ และมีผู้ปกครองที่ไม่ใช่บิดามารดาดูแล</Text>
            </TouchableOpacity>
          </View>
        );

      case 2: // Father income (Scenario A)
        return (
          <View style={styles.card}>
            <Text style={styles.stepIndicator}>ขั้นตอนที่ 2</Text>
            <Text style={styles.question}>บิดาของคุณมีรายได้ประจำหรือไม่?</Text>
            <TouchableOpacity 
              style={[styles.button, styles.successButton]} 
              onPress={() => { setFatherIncome('มี'); setStep(3); }}
            >
              <Text style={styles.buttonText}>มี</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.warningButton]} 
              onPress={() => { setFatherIncome('ไม่มี'); setStep(3); }}
            >
              <Text style={styles.buttonText}>ไม่มี</Text>
            </TouchableOpacity>
          </View>
        );

      case 3: // Mother income (Scenario A)
        return (
          <View style={styles.card}>
            <Text style={styles.stepIndicator}>ขั้นตอนที่ 3</Text>
            <Text style={styles.question}>มารดาของคุณมีรายได้ประจำหรือไม่?</Text>
            <TouchableOpacity 
              style={[styles.button, styles.successButton]} 
              onPress={() => { setMotherIncome('มี'); setStep(4); }}
            >
              <Text style={styles.buttonText}>มี</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.warningButton]} 
              onPress={() => { setMotherIncome('ไม่มี'); setStep(4); }}
            >
              <Text style={styles.buttonText}>ไม่มี</Text>
            </TouchableOpacity>
          </View>
        );

      case 5: // Living with (Scenario B)
        return (
          <View style={styles.card}>
            <Text style={styles.stepIndicator}>ขั้นตอนที่ 2</Text>
            <Text style={styles.question}>คุณอาศัยอยู่กับใคร?</Text>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => { setLivingWith('บิดา'); setStep(6); }}
            >
              <Text style={styles.buttonText}>บิดา</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => { setLivingWith('มารดา'); setStep(6); }}
            >
              <Text style={styles.buttonText}>มารดา</Text>
            </TouchableOpacity>
          </View>
        );

      case 6: // Legal status (Scenario B)
        return (
          <View style={styles.card}>
            <Text style={styles.stepIndicator}>ขั้นตอนที่ 3</Text>
            <Text style={styles.question}>คุณมีสำเนาใบหย่า หรือ สำเนาใบมรณบัตร หรือไม่?</Text>
            <TouchableOpacity 
              style={[styles.button, styles.successButton]} 
              onPress={() => { setLegalStatus('มี'); setStep(7); }}
            >
              <Text style={styles.buttonText}>มี</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.warningButton]} 
              onPress={() => { setLegalStatus('ไม่มี'); setStep(7); }}
            >
              <Text style={styles.buttonText}>ไม่มี</Text>
            </TouchableOpacity>
          </View>
        );

      case 7: // Single parent income (Scenario B)
        let parent = livingWith === "บิดา" ? "บิดา" : "มารดา";
        return (
          <View style={styles.card}>
            <Text style={styles.stepIndicator}>ขั้นตอนที่ 4</Text>
            <Text style={styles.question}>{parent} ของคุณมีรายได้ประจำหรือไม่?</Text>
            <TouchableOpacity 
              style={[styles.button, styles.successButton]} 
              onPress={() => { setSingleParentIncome('มี'); setStep(8); }}
            >
              <Text style={styles.buttonText}>มี</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.warningButton]} 
              onPress={() => { setSingleParentIncome('ไม่มี'); setStep(8); }}
            >
              <Text style={styles.buttonText}>ไม่มี</Text>
            </TouchableOpacity>
          </View>
        );

      case 9: // Guardian income (Scenario C)
        return (
          <View style={styles.card}>
            <Text style={styles.stepIndicator}>ขั้นตอนที่ 2</Text>
            <Text style={styles.question}>ผู้ปกครองของคุณมีรายได้ประจำหรือไม่?</Text>
            <TouchableOpacity 
              style={[styles.button, styles.successButton]} 
              onPress={() => { setGuardianIncome('มี'); setStep(10); }}
            >
              <Text style={styles.buttonText}>มี</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.warningButton]} 
              onPress={() => { setGuardianIncome('ไม่มี'); setStep(10); }}
            >
              <Text style={styles.buttonText}>ไม่มี</Text>
            </TouchableOpacity>
          </View>
        );

      case 10: // Parent legal status (Scenario C)
        return (
          <View style={styles.card}>
            <Text style={styles.stepIndicator}>ขั้นตอนที่ 3</Text>
            <Text style={styles.question}>คุณมีสำเนาใบหย่า หรือ สำเนาใบมรณบัตร ของบิดามารดาหรือไม่?</Text>
            <TouchableOpacity 
              style={[styles.button, styles.successButton]} 
              onPress={() => { setParentLegalStatus('มี'); setStep(11); }}
            >
              <Text style={styles.buttonText}>มี</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.warningButton]} 
              onPress={() => { setParentLegalStatus('ไม่มี'); setStep(11); }}
            >
              <Text style={styles.buttonText}>ไม่มี</Text>
            </TouchableOpacity>
          </View>
        );

      case 4:
      case 8:
      case 11: // Results
        return (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>🎉 รายการเอกสารที่ต้องจัดเตรียม</Text>
            <View style={styles.documentsContainer}>
              {getDocuments().map((doc, index) => (
                <View key={index} style={styles.documentRow}>
                  <Text style={styles.documentBullet}>•</Text>
                  <Text style={styles.documentItem}>{doc.replace('- ', '')}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ระบบแนะนำเอกสาร กยศ.</Text>
        <Text style={styles.subtitle}>ตรวจสอบเอกสารที่จำเป็นสำหรับการสมัครกู้ยืม</Text>
      </View>
      
      {familyStatus && renderProgressBar()}
      
      {renderContent()}
      
      <View style={styles.navigationContainer}>
        {canGoBack() && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← ย้อนกลับ</Text>
          </TouchableOpacity>
        )}
        
        {((familyStatus === 'ก' && step === 4) || 
          (familyStatus === 'ข' && step === 8) || 
          (familyStatus === 'ค' && step === 11)) && (
          <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
            <Text style={styles.restartButtonText}>🔄 เริ่มต้นใหม่</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    minWidth: 30,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    color: '#1e293b',
    lineHeight: 28,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#059669',
    textAlign: 'center',
  },
  documentsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 10,
  },
  documentBullet: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 2,
    minWidth: 10,
  },
  documentItem: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    flex: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  restartButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  restartButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DocRecScreen;
