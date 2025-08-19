import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const DocRecScreen = () => {
  // ตัวแปรเก็บสถานะ
  const [step, setStep] = useState(1); // เก็บขั้นตอนปัจจุบัน
  const [familyStatus, setFamilyStatus] = useState(''); // สถานะครอบครัว (ก, ข, ค)
  const [livingWith, setLivingWith] = useState(''); // อาศัยอยู่กับใคร (บิดา/มารดา)
  const [fatherIncome, setFatherIncome] = useState(''); // รายได้บิดา (มี/ไม่มี)
  const [motherIncome, setMotherIncome] = useState(''); // รายได้มารดา (มี/ไม่มี)
  const [legalStatus, setLegalStatus] = useState(''); // สถานะทางกฎหมาย (มี/ไม่มี)
  const [guardianIncome, setGuardianIncome] = useState(''); // รายได้ผู้ปกครong
  const [parentLegalStatus, setParentLegalStatus] = useState(''); // สถานะกฎหมายผู้ปกครอง
  const navigation = useNavigation();
  const route = useRoute();

  // === ฟังก์ชันกำหนดเส้นทางการนำทาง ===
  const getNavigationSteps = () => {
    let steps = [1]; // เริ่มต้นที่ขั้นตอน 1 เสมอ
    
    // กรณี ก: บิดามารดาอยู่ด้วยกันปกติ
    if (familyStatus === 'ก') {
      steps.push(2); // ถามรายได้บิดา
      if (fatherIncome) steps.push(3); // ถามรายได้มารดา
      if (motherIncome) steps.push(4); // แสดงผลลัพธ์
    } 
    // กรณี ข: บิดา/มารดาหย่าร้าง/เลิกร้าง/เสียชีวิต
    else if (familyStatus === 'ข') {
      steps.push(5); // ถามว่าอาศัยอยู่กับใคร
      if (livingWith) steps.push(6); // ถามสถานะทางกฎหมาย
      if (legalStatus) steps.push(7); // ถามรายได้พ่อ/แม่เดี่ยว
      if (
        (livingWith === "บิดา" && fatherIncome) ||
        (livingWith === "มารดา" && motherIncome)
      ) steps.push(8); // แสดงผลลัพธ์
    } 
    // กรณี ค: มีผู้ปกครองที่ไม่ใช่บิดามารดา
    else if (familyStatus === 'ค') {
      steps.push(9); // ถามรายได้ผู้ปกครอง
      if (guardianIncome) steps.push(10); // ถามสถานะกฎหมายของบิดามารดา
      if (parentLegalStatus) steps.push(11); // แสดงผลลัพธ์
    }
    
    return steps;
  };

  // === ฟังก์ชันสร้างรายการเอกสารที่ต้องใช้ ===
  const getDocuments = () => {
    let documents = [];

    // เอกสารพื้นฐานที่ต้องใช้ทุกกรณี
    documents.push(
      "- แบบฟอร์ม กยศ. 101 (กรอกข้อมูลตามจริงให้ครบถ้วน)",
      "- เอกสารจิตอาสา (กิจกรรมในปีการศึกษา 2567 อย่างน้อย 1 รายการ)"
    );

    // กรณี ก: ครอบครัวปกติ
    if (familyStatus === "ก") {
      documents.push(
        "- หนังสือยินยอมเปิดเผยข้อมูล ของ บิดา มารดา และผู้กู้ (คนละ 1 แผ่น)",
        "- สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้อง ของ บิดา มารดา และผู้กู้ (คนละ 1 แผ่น)"
      );
      
      // ถ้าบิดามีรายได้
      if (fatherIncome === "มี") {
        documents.push(
          "- หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของบิดา (เอกสารอายุไม่เกิน 3 เดือน)"
        );
      } else {
        documents.push(
          "- หนังสือรับรองรายได้ กยศ. 102 ของบิดา พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)"
        );
      }
      
      // ถ้ามารดามีรายได้
      if (motherIncome === "มี") {
        documents.push(
          "- หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของมารดา (เอกสารอายุไม่เกิน 3 เดือน)"
        );
      } else {
        documents.push(
          "- หนังสือรับรองรายได้ กยศ. 102 ของมารดา พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)"
        );
      }
    } 
    // กรณี ข: พ่อแม่หย่าร้าง/เลิกร้าง/เสียชีวิต
    else if (familyStatus === "ข") {
      let parent = livingWith === "บิดา" ? "บิดา" : "มารดา";
      documents.push(
        `- หนังสือยินยอมเปิดเผยข้อมูล ของ ${parent} และผู้กู้ (คนละ 1 แผ่น)`,
        `- สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้อง ของ ${parent} และผู้กู้ (คนละ 1 แผ่น)`
      );
      
      // เอกสารแสดงสถานะทางกฎหมาย
      if (legalStatus === "มี") {
        documents.push(
          "- สำเนาใบหย่า (กรณีหย่าร้าง) หรือ สำเนาใบมรณบัตร (กรณีเสียชีวิต)"
        );
      } else {
        documents.push(
          "- หนังสือรับรองสถานภาพครอบครัว พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)"
        );
      }
      
      // เอกสารรายได้ของพ่อ/แม่เดี่ยว
      if (
        (livingWith === "บิดา" && fatherIncome === "มี") ||
        (livingWith === "มารดา" && motherIncome === "มี")
      ) {
        documents.push(
          `- หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของ${parent} (เอกสารอายุไม่เกิน 3 เดือน)`
        );
      } else {
        documents.push(
          `- หนังสือรับรองรายได้ กยศ. 102 ของ${parent} พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)`
        );
      }
    } 
    // กรณี ค: มีผู้ปกครอง
    else if (familyStatus === "ค") {
        documents.push(
          "- หนังสือยินยอมเปิดเผยข้อมูล ของ ผู้ปกครองและผู้กู้ (คนละ 1 แผ่น)",
          "- สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้อง ของ ผู้ปกครองและผู้กู้ (คนละ 1 แผ่น)"
        );
        
        // เอกสารรายได้ผู้ปกครอง
        if (guardianIncome === "มี") {
          documents.push(
            "- หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของผู้ปกครอง (เอกสารอายุไม่เกิน 3 เดือน)"
          );
        } else {
          documents.push(
            "- หนังสือรับรองรายได้ กยศ. 102 ของผู้ปกครอง พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)"
          );
        }
        
        // เอกสารสถานะกฎหมายของบิดามารดา
        if (parentLegalStatus === "มี") {
            documents.push(
                "- สำเนาใบหย่า (กรณีหย่าร้าง) หรือ สำเนาใบมรณบัตร (กรณีเสียชีวิต)"
            );
        }
        
        // เอกสารแสดงสถานภาพครอบครัว (บังคับสำหรับกรณี ค)
        documents.push(
            "- หนังสือรับรองสถานภาพครอบครัว พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)"
        );
    }
    
    return documents;
  };

  // === ฟังก์ชันเริ่มต้นใหม่ ===
  const handleRestart = () => {
    setStep(1);
    setFamilyStatus('');
    setLivingWith('');
    setFatherIncome('');
    setMotherIncome('');
    setLegalStatus('');
    setGuardianIncome('');
    setParentLegalStatus('');
  };

  // === ฟังก์ชันย้อนกลับ ===
  const handleBack = () => {
    const steps = getNavigationSteps();
    const currentIndex = steps.indexOf(step);
    
    if (currentIndex > 0) {
      const previousStep = steps[currentIndex - 1];
      
      // รีเซ็ตค่าที่เกี่ยวข้องเมื่อย้อนกลับ
      if (step === 4 && familyStatus === 'ก') {
        setMotherIncome(''); // ลบคำตอบรายได้มารดา
      } else if (step === 3 && familyStatus === 'ก') {
        setFatherIncome(''); // ลบคำตอบรายได้บิดา
      } else if (step === 8 && familyStatus === 'ข') {
        if (livingWith === "บิดา") {
          setFatherIncome('');
        } else if (livingWith === "มารดา") {
          setMotherIncome('');
        }
      } else if (step === 7 && familyStatus === 'ข') {
        setLegalStatus(''); // ลบคำตอบสถานะกฎหมาย
      } else if (step === 6 && familyStatus === 'ข') {
        setLivingWith(''); // ลบคำตอบว่าอาศัยกับใคร
      } else if (step === 11 && familyStatus === 'ค') {
        setParentLegalStatus(''); // ลบคำตอบสถานะกฎหมายบิดามารดา
      } else if (step === 10 && familyStatus === 'ค') {
        setGuardianIncome(''); // ลบคำตอบรายได้ผู้ปกครอง
      } else if (step === 5 || step === 9) {
        setFamilyStatus(''); // ลบคำตอบสถานะครอบครัว
      }
      
      setStep(previousStep);
    }
  };

  // === ฟังก์ชันตรวจสอบว่าสามารถย้อนกลับได้หรือไม่ ===
  const canGoBack = () => {
    const steps = getNavigationSteps();
    const currentIndex = steps.indexOf(step);
    return currentIndex > 0;
  };

  // === ฟังก์ชันคำนวณความคืบหน้า ===
  const getStepProgress = () => {
    let totalSteps = 1; // มีขั้นตอน 1 เสมอ
    let currentStepNum = 1;
    
    if (familyStatus === 'ก') {
      totalSteps = 4; // กรณี ก มี 4 ขั้นตอน
      if (step >= 2) currentStepNum = 2;
      if (step >= 3) currentStepNum = 3;
      if (step >= 4) currentStepNum = 4;
    } else if (familyStatus === 'ข') {
      totalSteps = 4; // กรณี ข มี 4 ขั้นตอน
      if (step >= 5) currentStepNum = 2;
      if (step >= 6) currentStepNum = 3;
      if (step >= 7) currentStepNum = 4;
      if (step >= 8) currentStepNum = 4;
    } else if (familyStatus === 'ค') {
      totalSteps = 4; // กรณี ค มี 4 ขั้นตอน
      if (step >= 9) currentStepNum = 2;
      if (step >= 10) currentStepNum = 3;
      if (step >= 11) currentStepNum = 4;
    }
    
    return { current: currentStepNum, total: totalSteps };
  };

  // === คอมโพเนนต์แสดง Progress Bar ===
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

  // === ฟังก์ชันแสดงเนื้อหาตามขั้นตอน ===
  const renderContent = () => {
    // ตรวจสอบว่าเป็นขั้นตอนแสดงผลลัพธ์หรือไม่
    const isResultStep = (familyStatus === 'ก' && step === 4) || 
                        (familyStatus === 'ข' && step === 8) || 
                        (familyStatus === 'ค' && step === 11);

    switch (step) {
      case 1: // ขั้นตอนแรก - เลือกสถานะครอบครัว
        return (
          <View style={styles.card}>
            <Text style={styles.stepIndicator}>ขั้นตอนที่ 1</Text>
            <Text style={styles.question}>สถานภาพครอบครัวของคุณตรงกับข้อใด?</Text>
            {/* ปุ่มเลือกตัวเลือกต่างๆ */}
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => { setFamilyStatus('ก'); setStep(2); }}
            >
              <Text style={styles.buttonText}>บิดาและมารดาอยู่ด้วยกันตามปกติ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => { setFamilyStatus('ข'); setStep(5); }}
            >
              <Text style={styles.buttonText}>บิดาหรือมารดาหย่าร้าง/เลิกร้าง/เสียชีวิต หรือไม่สามารถติดต่อได้</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => { setFamilyStatus('ค'); setStep(9); }}
            >
              <Text style={styles.buttonText}>บิดามารดาเสียชีวิต/ไม่สามารถติดต่อได้ และมีผู้ปกครองที่ไม่ใช่บิดามารดาดูแล</Text>
            </TouchableOpacity>
          </View>
        );

      case 2: // กรณี ก - ถามรายได้บิดา
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
      case 3: // กรณี ก - ถามรายได้มารดา  
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
      case 5: // กรณี ข - ถามว่าอาศัยกับใคร
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

      case 6: // กรณี ข - ถามสถานะทางกฎหมาย
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

      case 7: // กรณี ข - ถามรายได้พ่อ/แม่เดี่ยว
        let parent = livingWith === "บิดา" ? "บิดา" : "มารดา";
        return (
          <View style={styles.card}>
            <Text style={styles.stepIndicator}>ขั้นตอนที่ 4</Text>
            <Text style={styles.question}>{parent} ของคุณมีรายได้ประจำหรือไม่?</Text>
            <TouchableOpacity 
              style={[styles.button, styles.successButton]} 
              onPress={() => { 
                if (livingWith === "บิดา") {
                  setFatherIncome('มี'); 
                } else {
                  setMotherIncome('มี');
                }
                setStep(8); 
              }}
            >
              <Text style={styles.buttonText}>มี</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.warningButton]} 
              onPress={() => { 
                if (livingWith === "บิดา") {
                  setFatherIncome('ไม่มี'); 
                } else {
                  setMotherIncome('ไม่มี');
                }
                setStep(8); 
              }}
            >
              <Text style={styles.buttonText}>ไม่มี</Text>
            </TouchableOpacity>
          </View>
        );


      case 9: // กรณี ค - ถามรายได้ผู้ปกครอง
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

      case 10: // กรณี ค - ถามสถานะกฎหมายบิดามารดา
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

      case 4: // ผลลัพธ์กรณี ก
      case 8: // ผลลัพธ์กรณี ข  
      case 11: // ผลลัพธ์กรณี ค
        // เตรียมข้อมูล surveyData
        const surveyData = {
          familyStatus,
          livingWith,
          fatherIncome,
          motherIncome,
          legalStatus,
          guardianIncome,
          parentLegalStatus,
        };
        return (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>🎉 รายการเอกสารที่ต้องจัดเตรียม</Text>
            <View style={styles.documentsContainer}>
              {/* แสดงรายการเอกสารที่ต้องใช้ */}
              {getDocuments().map((doc, index) => (
                <View key={index} style={styles.documentRow}>
                  <Text style={styles.documentBullet}>•</Text>
                  <Text style={styles.documentItem}>{doc.replace('- ', '')}</Text>
                </View>
              ))}
            </View>
            {/* ปุ่มไปหน้าอัพโหลดเอกสาร */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { marginTop: 20 }]}
              onPress={() => {
                if (route?.params?.onSurveyComplete) {
                  // ส่งข้อมูลกลับไปหน้า UploadScreen
                  route.params.onSurveyComplete(surveyData);
                  navigation.goBack();
                } else {
                  // fallback: ไปหน้าอัพโหลดเอกสารแบบเดิม
                  navigation.navigate('ส่งเอกสาร', { surveyData });
                }
              }}
            >
              <Text style={styles.buttonText}>ไปอัพโหลดเอกสาร</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  // === ส่วน Render หลัก ===
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ส่วนหัว */}
      <View style={styles.header}>
        <Text style={styles.title}>ระบบแนะนำเอกสาร กยศ.</Text>
        <Text style={styles.subtitle}>ตรวจสอบเอกสารที่จำเป็นสำหรับการสมัครกู้ยืม</Text>
      </View>
      
      {/* แสดง Progress Bar เมื่อเลือกสถานะครอบครัวแล้ว */}
      {familyStatus && renderProgressBar()}
      
      {/* แสดงเนื้อหาตามขั้นตอน */}
      {renderContent()}
      
      {/* ปุ่มนำทาง */}
      <View style={styles.navigationContainer}>
        {/* ปุ่มย้อนกลับ */}
        {canGoBack() && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← ย้อนกลับ</Text>
          </TouchableOpacity>
        )}
        
        {/* ปุ่มเริ่มต้นใหม่ (แสดงเมื่ออยู่ในขั้นตอนผลลัพธ์) */}
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