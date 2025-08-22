import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Linking,
  Platform,
  Modal,
  Dimensions,
  Image,
  ActivityIndicator
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

const handleOpenUploadedFile = async (file) => {
  try {
    if (!file?.uri) return;

    // ตรวจสอบว่าอุปกรณ์รองรับการแชร์ไฟล์
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("ไม่สามารถเปิดไฟล์ได้", "อุปกรณ์ของคุณไม่รองรับการเปิดไฟล์นี้");
      return;
    }

    // สำหรับไฟล์ local ที่เราอัปโหลด สามารถเปิดด้วย Sharing.shareAsync
    await Sharing.shareAsync(file.uri);
  } catch (error) {
    console.error(error);
    Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเปิดไฟล์นี้ได้");
  }
};

const UploadScreen = ({ navigation, route }) => {
  const initialSurveyData = route?.params?.surveyData || {
    familyStatus: "",
    livingWith: "",
    fatherIncome: "",
    motherIncome: "",
    legalStatus: "",
    guardianIncome: "",
    parentLegalStatus: "",
  };

  const [hasCompletedSurvey, setHasCompletedSurvey] = useState(!!route?.params?.surveyData);
  const [surveyData, setSurveyData] = useState(initialSurveyData);
  const [uploads, setUploads] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  
  // state สำหรับ modal
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocTitle, setSelectedDocTitle] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentType, setContentType] = useState('');

  // state สำหรับการ zoom รูปภาพ
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const generateDocumentsList = (data) => {
    let documents = [];

    documents.push(
      {
        id: 'form_101',
        title: 'แบบฟอร์ม กยศ. 101',
        description: '(กรอกข้อมูลตามจริงให้ครบถ้วน)',
        required: true,
        downloadUrl: 'https://drive.google.com/file/d/1ylB6AxaPg4qgvBqWWMwQ54LiLCkFTw1-/view?usp=drive_link'
      },
      {
        id: 'volunteer_doc',
        title: 'เอกสารจิตอาสา',
        description: '(กิจกรรมในปีการศึกษา 2567 อย่างน้อย 1 รายการ)',
        required: true
      },
      {
        id: 'consent_student_form',
        title: 'หนังสือยินยอมเปิดเผยข้อมูลของผู้กู้',
        downloadUrl:'https://drive.google.com/file/d/1ZpgUsagMjrxvyno7Jwu1LO3r9Y82GAv4/view?usp=sharing',
        required: true
      },
      {
        id: 'id_copies_student',
        title: 'สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของผู้กู้',
        required: true
      }
    );

    // กรณี ก: ครอบครัวปกติ
    if (data.familyStatus === "ก") {
      documents.push(
        {
          id: 'consent_fahter_form',
          title: 'หนังสือยินยอมเปิดเผยข้อมูลของบิดา',
          downloadUrl:'https://drive.google.com/file/d/1ZpgUsagMjrxvyno7Jwu1LO3r9Y82GAv4/view?usp=sharing',
          required: true
        },
        {
          id: 'id_copies_father',
          title: 'สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของบิดา',
          required: true
        },
        {
          id: 'consent_mother_form',
          title: 'หนังสือยินยอมเปิดเผยข้อมูลของมารดา',
          downloadUrl:'https://drive.google.com/file/d/1ZpgUsagMjrxvyno7Jwu1LO3r9Y82GAv4/view?usp=sharing',
          required: true
        },
        {
          id: 'id_copies_mother',
          title: 'สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของมารดา',
          required: true
        },
      );
      
      // เอกสารรายได้บิดา
      if (data.fatherIncome === "มี") {
        documents.push({
          id: 'father_income',
          title: 'หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของบิดา',
          description: '(เอกสารอายุไม่เกิน 3 เดือน)',
          required: true
        });
      } else {
        documents.push({
          id: 'father_income_cert',
          title: 'หนังสือรับรองรายได้ กยศ. 102 ของบิดา',
          description: 'พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)',
          downloadUrl: 'https://drive.google.com/file/d/1ylB6AxaPg4qgvBqWWMwQ54LiLCkFTw1-/view?usp=drive_link',
          required: true
        });
      }
      
      // เอกสารรายได้มารดา
      if (data.motherIncome === "มี") {
        documents.push({
          id: 'mother_income',
          title: 'หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของมารดา',
          description: '(เอกสารอายุไม่เกิน 3 เดือน)',
          required: true
        });
      } else {
        documents.push({
          id: 'mother_income_cert',
          title: 'หนังสือรับรองรายได้ กยศ. 102 ของมารดา',
          description: 'พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)',
          downloadUrl: 'https://drive.google.com/file/d/1ylB6AxaPg4qgvBqWWMwQ54LiLCkFTw1-/view?usp=drive_link',
          required: true
        });
      }
    } 
    // กรณี ข: พ่อแม่หย่าร้าง/เลิกร้าง/เสียชีวิต
    else if (data.familyStatus === "ข") {
      let parent = data.livingWith === "บิดา" ? "บิดา" : "มารดา";
      documents.push(
        {
          id: 'consent_form_single_parent',
          title: `หนังสือยินยอมเปิดเผยข้อมูลของ ${parent}`,
          downloadUrl:'https://drive.google.com/file/d/1ZpgUsagMjrxvyno7Jwu1LO3r9Y82GAv4/view?usp=sharing',
          required: true
        },
        {
          id: 'id_copies_single_parent',
          title: `สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของ ${parent}`,
          required: true
        }
      );
      
      // เอกสารแสดงสถานะทางกฎหมาย
      if (data.legalStatus === "มี") {
        documents.push({
          id: 'legal_status',
          title: 'สำเนาใบหย่า (กรณีหย่าร้าง) หรือ สำเนาใบมรณบัตร (กรณีเสียชีวิต)',
          required: true
        });
      } else {
        documents.push({
          id: 'family_status_cert',
          title: 'หนังสือรับรองสถานภาพครอบครัว',
          description: 'พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)',
          downloadUrl:'https://drive.google.com/file/d/1m98sSlZqAi_YK3PQ2-a9FMIEri1RlENB/view?usp=drive_link',
          required: true
        });
      }
      
      // เอกสารรายได้พ่อ/แม่เดี่ยว
      const hasIncome = (data.livingWith === "บิดา" && data.fatherIncome === "มี") ||
                       (data.livingWith === "มารดา" && data.motherIncome === "มี");
      
      if (hasIncome) {
        documents.push({
          id: 'single_parent_income',
          title: `หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของ${parent}`,
          description: '(เอกสารอายุไม่เกิน 3 เดือน)',
          required: true
        });
      } else {
        documents.push({
          id: 'single_parent_income_cert',
          title: `หนังสือรับรองรายได้ กยศ. 102 ของ${parent}`,
          description: 'พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)',
          downloadUrl: 'https://drive.google.com/file/d/1ylB6AxaPg4qgvBqWWMwQ54LiLCkFTw1-/view?usp=drive_link',
          required: true
        });
      }
    } 
    // กรณี ค: มีผู้ปกครอง
    else if (data.familyStatus === "ค") {
      documents.push(
        {
          id: 'guardian_consent',
          title: 'หนังสือยินยอมเปิดเผยข้อมูล ของผู้ปกครอง',
          downloadUrl:'https://drive.google.com/file/d/1ZpgUsagMjrxvyno7Jwu1LO3r9Y82GAv4/view?usp=sharing',
          required: true
        },
        {
          id: 'guardian_id_copies',
          title: 'สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้อง ของผู้ปกครอง',
          required: true
        }
      );
      
      // เอกสารรายได้ผู้ปกครอง
      if (data.guardianIncome === "มี") {
        documents.push({
          id: 'guardian_income',
          title: 'หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของผู้ปกครอง',
          description: '(เอกสารอายุไม่เกิน 3 เดือน)',
          required: true
        });
      } else {
        documents.push({
          id: 'guardian_income_cert',
          title: 'หนังสือรับรองรายได้ กยศ. 102 ของผู้ปกครอง',
          description: 'พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)',
          downloadUrl: 'https://drive.google.com/file/d/1ylB6AxaPg4qgvBqWWMwQ54LiLCkFTw1-/view?usp=drive_link',
          required: true
        });
      }
      
      // เอกสารสถานะกฎหมายของบิดามารดา
      if (data.parentLegalStatus === "มี") {
        documents.push({
          id: 'parent_legal_status',
          title: 'สำเนาใบหย่า (กรณีหย่าร้าง) หรือ สำเนาใบมรณบัตร (กรณีเสียชีวิต)',
          description: '',
          required: true
        });
      }
      // เอกสารแสดงสถานภาพครอบครัว (บังคับสำหรับกรณี ค)
      documents.push({
        id: 'family_status_required',
        title: 'หนังสือรับรองสถานภาพครอบครัว',
        description: 'พร้อมแนบสำเนาบัตรข้าราชการผู้รับรอง (เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น)',
        required: true
      });
    }
    
    return documents;
  };

  // ฟังก์ชันสำหรับจำลองการทำแบบสอบถาม
  const handleStartSurvey = () => {
    navigation.navigate('Document Reccommend', {
      onSurveyComplete: (data) => {
        setSurveyData(data);
        setHasCompletedSurvey(true);
      }
    });
  };

  // ฟังก์ชันแสดง modal ของไฟล์
  const handleShowFileModal = async (docId, docTitle) => {
    const file = uploads[docId];
    if (file) {
      setSelectedFile(file);
      setSelectedDocTitle(docTitle);
      setShowFileModal(true);
      setIsLoadingContent(true);
      
      try {
        await loadFileContent(file);
      } catch (error) {
        console.error('Error loading file content:', error);
        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดเนื้อหาไฟล์ได้');
      } finally {
        setIsLoadingContent(false);
      }
    }
  };

  // ฟังก์ชันโหลดเนื้อหาไฟล์ที่ปรับปรุงแล้ว
  const loadFileContent = async (file) => {
    try {
      const mimeType = file.mimeType?.toLowerCase() || '';
      const fileName = file.filename?.toLowerCase() || '';
      
      // ตรวจสอบประเภทไฟล์แบบละเอียดขึ้น
      if (mimeType.startsWith('image/') || 
          fileName.endsWith('.jpg') || 
          fileName.endsWith('.jpeg') || 
          fileName.endsWith('.png') || 
          fileName.endsWith('.gif') || 
          fileName.endsWith('.bmp') || 
          fileName.endsWith('.webp')) {
        setContentType('image');
        setFileContent(file.uri);
      } else if (mimeType.includes('text/') || 
                 mimeType.includes('json') || 
                 fileName.endsWith('.txt') ||
                 fileName.endsWith('.json')) {
        setContentType('text');
        const content = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        setFileContent(content);
      } else if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
        setContentType('pdf');
        setFileContent('ไฟล์ PDF ต้องใช้แอปพลิเคชันภายนอกในการดู คลิก "เปิดด้วยแอปภายนอก" เพื่อดูไฟล์');
      } else {
        setContentType('other');
        setFileContent(`ไฟล์ประเภท ${mimeType || 'ไม่ทราบ'} ไม่สามารถแสดงผลในแอปได้`);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      setContentType('error');
      setFileContent('ไม่สามารถอ่านไฟล์นี้ได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // ฟังก์ชันปิด modal พร้อมรีเซ็ต zoom
  const handleCloseModal = () => {
    setShowFileModal(false);
    setSelectedFile(null);
    setSelectedDocTitle('');
    setFileContent(null);
    setContentType('');
    setIsLoadingContent(false);
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // ฟังก์ชันแปลงขนาดไฟล์
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ฟังก์ชันจำลองการอัพโหลดไฟล์
  const handleFileUpload = async (docId) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      setUploads((prev) => ({
        ...prev,
        [docId]: {
          filename: file.name,
          uri: file.uri,
          mimeType: file.mimeType,
          size: file.size,
          uploadDate: new Date().toLocaleString("th-TH"),
          status: "completed",
        },
      }));
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเลือกไฟล์ได้");
      console.error(error);
    }
  };

  // ฟังก์ชันลบไฟล์ที่อัพโหลดแล้ว
  const handleRemoveFile = (docId) => {
    Alert.alert(
      "ลบไฟล์",
      "คุณต้องการลบไฟล์นี้หรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ลบ", style: "destructive", onPress: () => {
          setUploads(prev => {
            const newUploads = { ...prev };
            delete newUploads[docId];
            return newUploads;
          });
          handleCloseModal();
        }}
      ]
    );
  };

  // ฟังก์ชันส่งเอกสาร
  const handleSubmitDocuments = () => {
    const documents = generateDocumentsList(surveyData);
    const requiredDocs = documents.filter(doc => doc.required);
    const uploadedRequiredDocs = requiredDocs.filter(doc => uploads[doc.id]);
    
    if (uploadedRequiredDocs.length < requiredDocs.length) {
      Alert.alert(
        "เอกสารไม่ครบ",
        `คุณยังอัพโหลดเอกสารไม่ครบ (${uploadedRequiredDocs.length}/${requiredDocs.length})`,
        [{ text: "ตกลง" }]
      );
      return;
    }

    Alert.alert(
      "ส่งเอกสารสำเร็จ",
      "เอกสารของคุณได้ถูกส่งเรียบร้อยแล้ว",
      [
        { text: "ตกลง", onPress: () => {
          setHasCompletedSurvey(false);
          setSurveyData({});
          setUploads({});
          setUploadProgress({});
        }}
      ]
    );
  };

  // ฟังก์ชันรีเซ็ตและทำแบบสอบถามใหม่
  const handleRetakeSurvey = () => {
    Alert.alert(
      "ทำแบบสอบถามใหม่",
      "การทำแบบสอบถามใหม่จะลบข้อมูลและไฟล์ที่อัพโหลดทั้งหมด\nคุณแน่ใจหรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ตกลง", style: "destructive", onPress: () => {
          setHasCompletedSurvey(false);
          setSurveyData({});
          setUploads({});
          setUploadProgress({});
        }}
      ]
    );
  };
  
  // คำนวณสถิติการอัพโหลด
  const getUploadStats = () => {
    const documents = generateDocumentsList(surveyData);
    const requiredDocs = documents.filter(doc => doc.required);
    const uploadedDocs = documents.filter(doc => uploads[doc.id]);
    const uploadedRequiredDocs = requiredDocs.filter(doc => uploads[doc.id]);
    
    return {
      total: documents.length,
      required: requiredDocs.length,
      uploaded: uploadedDocs.length,
      uploadedRequired: uploadedRequiredDocs.length
    };
  };

  if (!hasCompletedSurvey) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>ระบบอัพโหลดเอกสาร กยศ.</Text>
          <Text style={styles.welcomeSubtitle}>
            จัดเตรียมและส่งเอกสารสำหรับการสมัครกู้ยืมเงิน กยศ. ได้ง่ายๆ ใน 3 ขั้นตอน
          </Text>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>ทำแบบสอบถามเพื่อตรวจสอบเอกสารที่จำเป็น</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>อัพโหลดเอกสารตามรายการที่ระบุ</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>ส่งเอกสารและรอการตรวจสอบ</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleStartSurvey}>
            <Text style={styles.primaryButtonText}>เริ่มทำแบบสอบถาม</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const documents = generateDocumentsList(surveyData);
  const stats = getUploadStats();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>อัพโหลดเอกสาร</Text>
        <Text style={styles.headerSubtitle}>
          <Text style={{ fontWeight: 'bold', color: '#3b82f6' }}>สถานภาพครอบครัว:</Text>{" "}
          {surveyData.familyStatus === 'ก' ? 'บิดามารดาอยู่ด้วยกัน' : 
            surveyData.familyStatus === 'ข' ? 'บิดา/มารดาหย่าร้าง/เสียชีวิต' : 
            'มีผู้ปกครองดูแล'}
        </Text>
        <TouchableOpacity style={styles.retakeButton} onPress={handleRetakeSurvey}>
          <Text style={styles.retakeButtonText}>ทำแบบสอบถามใหม่</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>สถานะการอัพโหลด</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.uploadedRequired}</Text>
            <Text style={styles.statLabel}>อัพโหลดแล้ว</Text>
          </View>
          <Text style={styles.statDivider}>/</Text>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.required}</Text>
            <Text style={styles.statLabel}>ที่ต้องส่ง</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(stats.uploadedRequired / stats.required) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((stats.uploadedRequired / stats.required) * 100)}% เสร็จสิ้น
        </Text>
      </View>

      {/* Documents List */}
      <View style={styles.documentsCard}>
        <Text style={styles.documentsTitle}>รายการเอกสารที่ต้องอัพโหลด</Text>
        {documents.map((doc, idx) => (
          <View key={doc.id} style={[
            styles.documentItem, 
            idx % 2 === 0 ? styles.documentItemEven : styles.documentItemOdd
          ]}>
            <View style={styles.documentHeader}>
              <View style={styles.documentTitleContainer}>
                <Text style={styles.documentTitle}>{doc.title}</Text>
                {doc.required && <Text style={styles.requiredBadge}>*จำเป็น</Text>}
              </View>

              {doc.downloadUrl && (
                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL(doc.downloadUrl).catch(() =>
                      Alert.alert("ไม่สามารถดาวน์โหลดไฟล์ได้")
                    );
                  }}
                  style={styles.downloadButton}
                >
                  <Text style={styles.downloadButtonText}>⬇️</Text>
                </TouchableOpacity>
              )}
            </View>

            {doc.description ? (
              <Text style={styles.documentDescription}>{doc.description}</Text>
            ) : null}

            {/* Upload Area */}
            <View style={styles.uploadArea}>
              {uploadProgress[doc.id] !== undefined ? (
                <View style={styles.uploadProgressContainer}>
                  <Text style={styles.uploadProgressText}>
                    กำลังอัพโหลด... {uploadProgress[doc.id]}%
                  </Text>
                  <View style={styles.uploadProgressBar}>
                    <View 
                      style={[
                        styles.uploadProgressFill, 
                        { width: `${uploadProgress[doc.id]}%` }
                      ]} 
                    />
                  </View>
                </View>
              ) : uploads[doc.id] ? (
                <View style={styles.uploadedContainer}>
                  <TouchableOpacity 
                    style={{ flex: 1 }}
                    onPress={() => handleShowFileModal(doc.id, doc.title)}
                  >
                    <Text style={styles.uploadedFileName}>
                      ✅ {uploads[doc.id].filename}
                    </Text>
                    <Text style={styles.uploadedDate}>
                      อัพโหลดเมื่อ: {uploads[doc.id].uploadDate}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeButton} 
                    onPress={() => handleRemoveFile(doc.id)}
                  >
                    <Text style={styles.removeButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadButton} 
                  onPress={() => handleFileUpload(doc.id)}
                >
                  <Text style={styles.uploadButtonText}>📁 เลือกไฟล์</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity 
        style={[
          styles.submitButton,
          stats.uploadedRequired < stats.required && styles.submitButtonDisabled
        ]} 
        onPress={handleSubmitDocuments}
        disabled={stats.uploadedRequired < stats.required}
      >
        <Text style={styles.submitButtonText}>
          {stats.uploadedRequired >= stats.required ? 'ส่งเอกสาร' : `ส่งเอกสาร (${stats.uploadedRequired}/${stats.required})`}
        </Text>
      </TouchableOpacity>

      {/* File Preview Modal - Enhanced */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFileModal}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>รายละเอียดไฟล์</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={handleCloseModal}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedFile && (
              <View style={styles.modalContent}>
                <View style={styles.fileInfoCard}>
                  <View style={styles.fileIcon}>
                    <Text style={styles.fileIconText}>📄</Text>
                  </View>
                  
                  <View style={styles.fileDetails}>
                    <Text style={styles.modalDocTitle}>{selectedDocTitle}</Text>
                    <Text style={styles.fileName}>{selectedFile.filename}</Text>
                    
                    <View style={styles.fileMetadata}>
                      <View style={styles.metadataItem}>
                        <Text style={styles.metadataLabel}>ขนาดไฟล์:</Text>
                        <Text style={styles.metadataValue}>
                          {formatFileSize(selectedFile.size)}
                        </Text>
                      </View>
                      
                      <View style={styles.metadataItem}>
                        <Text style={styles.metadataLabel}>ประเภท:</Text>
                        <Text style={styles.metadataValue}>
                          {selectedFile.mimeType || 'ไม่ระบุ'}
                        </Text>
                      </View>
                      
                      <View style={styles.metadataItem}>
                        <Text style={styles.metadataLabel}>อัพโหลดเมื่อ:</Text>
                        <Text style={styles.metadataValue}>
                          {selectedFile.uploadDate}
                        </Text>
                      </View>
                      
                      <View style={styles.metadataItem}>
                        <Text style={styles.metadataLabel}>สถานะ:</Text>
                        <Text style={[styles.metadataValue, styles.statusSuccess]}>
                          ✅ อัพโหลดสำเร็จ
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleOpenUploadedFile(selectedFile)}
                  >
                    <Text style={styles.actionButtonText}>📤 แชร์ไฟล์</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => {
                      const docId = Object.keys(uploads).find(
                        key => uploads[key] === selectedFile
                      );
                      if (docId) {
                        handleRemoveFile(docId);
                      }
                    }}
                  >
                    <Text style={styles.actionButtonText}>🗑️ ลบไฟล์</Text>
                  </TouchableOpacity>
                </View>

                {/* File Content Preview - Enhanced */}
                <View style={styles.filePreviewContainer}>
                  <Text style={styles.previewTitle}>ตัวอย่างไฟล์:</Text>
                  
                  {isLoadingContent ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#2563eb" />
                      <Text style={styles.loadingText}>กำลังโหลดเนื้อหาไฟล์...</Text>
                    </View>
                  ) : (
                    <View style={styles.previewContent}>
                      {contentType === 'image' && (
                        <View style={styles.imagePreviewContainer}>
                          <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            maximumZoomScale={3}
                            minimumZoomScale={0.5}
                            bouncesZoom={true}
                            contentContainerStyle={styles.imageScrollContainer}
                          >
                            <TouchableOpacity 
                              activeOpacity={1}
                              onPress={() => {
                                setImageZoom(imageZoom === 1 ? 2 : 1);
                              }}
                            >
                              <Image 
                                source={{ uri: fileContent }} 
                                style={[
                                  styles.previewImageEnhanced,
                                  {
                                    transform: [
                                      { scale: imageZoom },
                                      { translateX: imagePosition.x },
                                      { translateY: imagePosition.y }
                                    ]
                                  }
                                ]}
                                resizeMode="contain"
                                onError={(error) => {
                                  console.log('Image load error:', error);
                                  setContentType('error');
                                  setFileContent('ไม่สามารถโหลดรูปภาพได้ อาจเป็นเพราะไฟล์เสียหายหรือไม่รองรับ');
                                }}
                                onLoad={() => {
                                  console.log('Image loaded successfully');
                                }}
                              />
                            </TouchableOpacity>
                          </ScrollView>
                          
                          {/* Image Controls */}
                          <View style={styles.imageControls}>
                            <TouchableOpacity 
                              style={styles.zoomButton}
                              onPress={() => setImageZoom(Math.max(0.5, imageZoom - 0.5))}
                            >
                              <Text style={styles.zoomButtonText}>🔍−</Text>
                            </TouchableOpacity>
                            
                            <Text style={styles.zoomText}>{Math.round(imageZoom * 100)}%</Text>
                            
                            <TouchableOpacity 
                              style={styles.zoomButton}
                              onPress={() => setImageZoom(Math.min(3, imageZoom + 0.5))}
                            >
                              <Text style={styles.zoomButtonText}>🔍+</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                              style={styles.resetButton}
                              onPress={() => {
                                setImageZoom(1);
                                setImagePosition({ x: 0, y: 0 });
                              }}
                            >
                              <Text style={styles.resetButtonText}>รีเซ็ต</Text>
                            </TouchableOpacity>
                          </View>
                          
                          {/* Image Info */}
                          <View style={styles.imageInfo}>
                            <Text style={styles.imageInfoText}>
                              💡 แตะรูปภาพเพื่อซูม หรือใช้ปุ่มด้านล่าง
                            </Text>
                          </View>
                        </View>
                      )}
                      
                      {contentType === 'text' && (
                        <View style={styles.textPreviewEnhanced}>
                          <ScrollView 
                            style={styles.textPreviewContainer}
                            showsVerticalScrollIndicator={true}
                          >
                            <Text style={styles.textPreview}>{fileContent}</Text>
                          </ScrollView>
                          <Text style={styles.textInfo}>
                            📄 เอกสารข้อความ - เลื่อนเพื่อดูเนื้อหาทั้งหมด
                          </Text>
                        </View>
                      )}
                      
                      {(contentType === 'pdf' || contentType === 'other' || contentType === 'error') && (
                        <View style={styles.unsupportedContainer}>
                          <Text style={styles.unsupportedIcon}>
                            {contentType === 'pdf' ? '📄' : contentType === 'error' ? '❌' : '📁'}
                          </Text>
                          <Text style={styles.unsupportedText}>{fileContent}</Text>
                          {contentType === 'pdf' && (
                            <TouchableOpacity 
                              style={styles.openExternalButton}
                              onPress={() => handleOpenUploadedFile(selectedFile)}
                            >
                              <Text style={styles.openExternalButtonText}>🚀 เปิดด้วยแอปภายนอก</Text>
                            </TouchableOpacity>
                          )}
                          {contentType === 'error' && (
                            <TouchableOpacity 
                              style={[styles.openExternalButton, { backgroundColor: '#ef4444' }]}
                              onPress={() => {
                                setIsLoadingContent(true);
                                loadFileContent(selectedFile).finally(() => {
                                  setIsLoadingContent(false);
                                });
                              }}
                            >
                              <Text style={styles.openExternalButtonText}>🔄 ลองใหม่</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#eef2ff',
    padding: 16,
    paddingBottom: 40,
  },
  // Welcome Screen Styles
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  stepContainer: {
    width: '100%',
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Header Card Styles
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  retakeButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 6,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  retakeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Progress Card Styles
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  statDivider: {
    fontSize: 22,
    color: '#64748b',
    marginHorizontal: 4,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e7ef',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  // Documents List Styles
  documentsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  documentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  documentItem: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  documentItemEven: {
    backgroundColor: '#f1f5f9',
  },
  documentItemOdd: {
    backgroundColor: '#f8fafc',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  documentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginRight: 6,
  },
  requiredBadge: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  documentDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  uploadArea: {
    marginTop: 8,
  },
  uploadButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadProgressContainer: {
    marginTop: 4,
  },
  uploadProgressText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  uploadProgressBar: {
    height: 8,
    backgroundColor: '#e0e7ef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  uploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  uploadedFileName: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
  },
  uploadedDate: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  removeButton: {
    marginLeft: 10,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Submit Button
  submitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 30,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#a7f3d0',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  downloadButton: {
    marginLeft: 10,
    backgroundColor: '#2563eb',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: width * 0.95,
    maxHeight: height * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    backgroundColor: '#ef4444',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  fileInfoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fileIcon: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fileIconText: {
    fontSize: 24,
  },
  fileDetails: {
    flex: 1,
  },
  modalDocTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  fileMetadata: {
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  metadataValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  statusSuccess: {
    color: '#059669',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonDanger: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // File Preview Styles
  filePreviewContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  previewContent: {
    minHeight: 200,
    maxHeight: 500,
  },
  
  // Enhanced Image Preview Styles
  imagePreviewContainer: {
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 300,
    maxHeight: 500,
  },
  imageScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  previewImageEnhanced: {
    width: width * 0.8,
    height: 400,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  imageControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 15,
  },
  zoomButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  zoomText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageInfo: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  imageInfoText: {
    color: '#ffffff',
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.9,
  },
  
  // Enhanced Text Preview Styles
  textPreviewEnhanced: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
  },
  textPreviewContainer: {
    padding: 16,
    maxHeight: 350,
    backgroundColor: '#ffffff',
  },
  textPreview: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  textInfo: {
    backgroundColor: '#e0e7ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#3730a3',
    textAlign: 'center',
  },
  
  // Enhanced Unsupported Container
  unsupportedContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  unsupportedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  unsupportedText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    maxWidth: 280,
  },
  openExternalButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  openExternalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UploadScreen;
