// UploadScreen.js (Main Component)
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, Platform, Dimensions, Image, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db, auth } from '../database/firebase';
import { doc, getDocs, collection, query, deleteDoc } from 'firebase/firestore';

// Import refactored components
import NoSurveyCard from './components/NoSurveyCard';
import UploadHeader from './components/UploadHeader';
import UploadProgress from './components/UploadProgress';
import DocumentList from './components/DocumentList';
import FileDetailModal from './components/FileDetailModal';

import { InsertForm101 } from './documents/InsertForm101';

const { width, height } = Dimensions.get('window');

const UploadScreen = ({ navigation, route }) => {
  const [surveyData, setSurveyData] = useState(null);
  const [surveyDocId, setSurveyDocId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploads, setUploads] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocTitle, setSelectedDocTitle] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentType, setContentType] = useState('');
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        setIsLoading(true);
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.log("No user logged in, cannot fetch survey data.");
          setSurveyData(null);
          setIsLoading(false);
          return;
        }

        const surveyCollectionRef = collection(db, 'users', currentUser.uid, 'survey');
        const q = query(surveyCollectionRef);
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          console.log("Survey data fetched:", docSnap.data());
          setSurveyData(docSnap.data());
          setSurveyDocId(docSnap.id);
        } else {
          console.log("No survey data found for this user.");
          setSurveyData(null);
          setSurveyDocId(null);
        }
      } catch (error) {
        console.error("Error fetching survey data: ", error);
        Alert.alert("Error", "Failed to load survey data.");
        setSurveyData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurveyData();
  }, []);

  const deleteSurveyData = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !surveyDocId) {
      console.log("No user or survey data to delete.");
      return;
    }
    try {
      const surveyDocRef = doc(db, 'users', currentUser.uid, 'survey', surveyDocId);
      await deleteDoc(surveyDocRef);
      console.log("Survey data successfully deleted from Firestore!");
    } catch (error) {
      console.error("Error deleting survey data: ", error);
      Alert.alert("Error", "Failed to delete old survey data.");
    }
  };

  // ฟังก์ชันใหม่สำหรับจัดการการดาวน์โหลดเอกสาร เดี๋ยวต้องมาแก้ตรงนี้ถ้าทำเอกสารเพิ่มแล้ว
  const handleDownloadDocument = (docId, downloadUrl) => {
    if (docId === 'form_101') {
      // สำหรับแบบฟอร์ม กยศ.101 ให้เรียกใช้ฟังก์ชันสร้าง PDF
      InsertForm101();
    } else if (downloadUrl) {
      // สำหรับเอกสารอื่นๆ ที่มีลิงก์ ให้เปิดลิงก์นั้น
      Linking.openURL(downloadUrl).catch(() =>
        Alert.alert("ไม่สามารถดาวน์โหลดไฟล์ได้")
      );
    } else {
      Alert.alert("ไม่พบไฟล์", "ไม่สามารถดาวน์โหลดไฟล์นี้ได้ในขณะนี้");
    }
  };

  const generateDocumentsList = (data) => {
    if (!data) return [];
    let documents = [];
    documents.push(
      { id: 'form_101', title: 'แบบฟอร์ม กยศ. 101', description: 'กรอกข้อมูลตามจริงให้ครบถ้วน', required: true },
      { id: 'volunteer_doc', title: 'เอกสารจิตอาสา', description: 'กิจกรรมในปีการศึกษา 2567 อย่างน้อย 1 รายการ', required: true },
      { id: 'consent_student_form', title: 'หนังสือยินยอมเปิดเผยข้อมูลของผู้กู้', downloadUrl: 'https://drive.google.com/file/d/1ZpgUsagMjrxvyno7Jwu1LO3r9Y82GAv4/view?usp=sharing', required: true },
      { id: 'id_copies_student', title: 'สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของผู้กู้', required: true }
    );
    if (data.familyStatus === "ก") {
      documents.push(
        { id: 'consent_fahter_form', title: 'หนังสือยินยอมเปิดเผยข้อมูลของบิดา', downloadUrl: 'https://drive.google.com/file/d/1ZpgUsagMjrxvyno7Jwu1LO3r9Y82GAv4/view?usp=sharing', required: true },
        { id: 'id_copies_father', title: 'สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของบิดา', required: true },
        { id: 'consent_mother_form', title: 'หนังสือยินยอมเปิดเผยข้อมูลของมารดา', downloadUrl: 'https://drive.google.com/file/d/1ZpgUsagMjrxvyno7Jwu1LO3r9Y82GAv4/view?usp=sharing', required: true },
        { id: 'id_copies_mother', title: 'สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของมารดา', required: true },
      );
      if (data.fatherIncome === "มี") {
        documents.push({ id: 'father_income', title: 'หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของบิดา', description: '(เอกสารอายุไม่เกิน 3 เดือน)', required: true });
      } else {
        documents.push(
          { id: 'father_income_cert', title: 'หนังสือรับรองรายได้ กยศ. 102 ของบิดา', downloadUrl: 'https://drive.google.com/file/d/1ylB6AxaPg4qgvBqWWMwQ54LiLCkFTw1-/view?usp=drive_link', required: true },
          { id: 'fa_id_copies_gov', title: 'สำเนาบัตรข้าราชการผู้รับรอง', description: 'สำหรับรับรองรายได้ เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น', required: true }
        );
      }
      if (data.motherIncome === "มี") {
        documents.push({ id: 'mother_income', title: 'หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของมารดา', description: 'เอกสารอายุไม่เกิน 3 เดือน', required: true });
      } else {
        documents.push(
          { id: 'mother_income_cert', title: 'หนังสือรับรองรายได้ กยศ. 102 ของมารดา', downloadUrl: 'https://drive.google.com/file/d/1ylB6AxaPg4qgvBqWWMwQ54LiLCkFTw1-/view?usp=drive_link', required: true },
          { id: 'ma_id_copies_gov', title: 'สำเนาบัตรข้าราชการผู้รับรอง', description: 'สำหรับรับรองรายได้ เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น', required: true }
        );
      }
    } else if (data.familyStatus === "ข") {
      let parent = data.livingWith === "บิดา" ? "บิดา" : "มารดา";
      documents.push(
        { id: 'consent_form_single_parent', title: `หนังสือยินยอมเปิดเผยข้อมูลของ ${parent}`, downloadUrl: 'https://drive.google.com/file/d/1ZpgUsagMjrxvyno7Jwu1LO3r9Y82GAv4/view?usp=sharing', required: true },
        { id: 'id_copies_single_parent', title: `สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของ ${parent}`, required: true }
      );
      if (data.legalStatus === "มี") {
        documents.push({ id: 'legal_status', title: 'สำเนาใบหย่า (กรณีหย่าร้าง) หรือ สำเนาใบมรณบัตร (กรณีเสียชีวิต)', required: true });
      } else {
        documents.push(
          { id: 'family_status_cert', title: 'หนังสือรับรองสถานภาพครอบครัว', downloadUrl: 'https://drive.google.com/file/d/1m98sSlZqAi_YK3PQ2-a9FMIEri1RlENB/view?usp=drive_link', required: true },
          { id: 'fam_id_copies_gov', title: 'สำเนาบัตรข้าราชการผู้รับรอง', description: 'สำหรับรับรองสถานภาพครอบครัว เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น', required: true }
        );
      }
      const hasIncome = (data.livingWith === "บิดา" && data.fatherIncome === "มีรายได้ประจำ") || (data.livingWith === "มารดา" && data.motherIncome === "มีรายได้ประจำ");
      if (hasIncome) {
        documents.push({ id: 'single_parent_income', title: `หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของ${parent}`, description: 'เอกสารอายุไม่เกิน 3 เดือน', required: true });
      } else {
        documents.push(
          { id: 'single_parent_income_cert', title: `หนังสือรับรองรายได้ กยศ. 102 ของ${parent}`, downloadUrl: 'https://drive.google.com/file/d/1ylB6AxaPg4qgvBqWWMwQ54LiLCkFTw1-/view?usp=drive_link', required: true },
          { id: '102_id_copies_gov', title: 'สำเนาบัตรข้าราชการผู้รับรอง', description: `สำหรับรับรองรายได้ของ${parent}  เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น`, required: true }
        );
      }
    } else if (data.familyStatus === "ค") {
      documents.push(
        { id: 'guardian_consent', title: 'หนังสือยินยอมเปิดเผยข้อมูล ของผู้ปกครอง', downloadUrl: 'https://drive.google.com/file/d/1ZpgUsagMjrxvyno7Jwu1LO3r9Y82GAv4/view?usp=sharing', required: true },
        { id: 'guardian_id_copies', title: 'สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้อง ของผู้ปกครอง', required: true }
      );
      if (data.guardianIncome === "มี") {
        documents.push({ id: 'guardian_income', title: 'หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของผู้ปกครอง', description: '(เอกสารอายุไม่เกิน 3 เดือน)', required: true });
      } else {
        documents.push(
          { id: 'guardian_income_cert', title: 'หนังสือรับรองรายได้ กยศ. 102 ของผู้ปกครอง', downloadUrl: 'https://drive.google.com/file/d/1ylB6AxaPg4qgvBqWWMwQ54LiLCkFTw1-/view?usp=drive_link', required: true },
          { id: 'guar_id_copies_gov', title: 'สำเนาบัตรข้าราชการผู้รับรอง', description: 'สำหรับรับรองรายได้ เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น', required: true }
        );
      }
      if (data.parentLegalStatus === "มี") {
        documents.push({ id: 'parent_legal_status', title: 'สำเนาใบหย่า (กรณีหย่าร้าง) หรือ สำเนาใบมรณบัตร (กรณีเสียชีวิต)', description: '', required: true });
      }
      documents.push(
        { id: 'family_status_required', title: 'หนังสือรับรองสถานภาพครอบครัว', required: true },
        { id: 'fam_id_copies_gov', title: 'สำเนาบัตรข้าราชการผู้รับรอง', description: 'สำหรับรับรองสถานภาพครอบครัว เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น', required: true }
      );
    }
    return documents;
  };

  const handleOpenUploadedFile = async (file) => {
    try {
      if (!file?.uri) return;
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("ไม่สามารถเปิดไฟล์ได้", "อุปกรณ์ของคุณไม่รองรับการเปิดไฟล์นี้");
        return;
      }
      await Sharing.shareAsync(file.uri);
    } catch (error) {
      console.error(error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเปิดไฟล์นี้ได้");
    }
  };

  const handleStartSurvey = () => {
    navigation.navigate('Document Reccommend', { onSurveyComplete: (data) => { setSurveyData(data); } });
  };

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

  const loadFileContent = async (file) => {
    try {
      const mimeType = file.mimeType?.toLowerCase() || '';
      const fileName = file.filename?.toLowerCase() || '';
      if (mimeType.startsWith('image/') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.gif') || fileName.endsWith('.bmp') || fileName.endsWith('.webp')) {
        setContentType('image');
        setFileContent(file.uri);
      } else if (mimeType.includes('text/') || mimeType.includes('json') || fileName.endsWith('.txt') || fileName.endsWith('.json')) {
        setContentType('text');
        const content = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8, });
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
        [docId]: { filename: file.name, uri: file.uri, mimeType: file.mimeType, size: file.size, uploadDate: new Date().toLocaleString("th-TH"), status: "completed", },
      }));
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเลือกไฟล์ได้");
      console.error(error);
    }
  };

  const handleRemoveFile = (docId) => {
    Alert.alert("ลบไฟล์", "คุณต้องการลบไฟล์นี้หรือไม่?", [{ text: "ยกเลิก", style: "cancel" }, { text: "ลบ", style: "destructive", onPress: () => { setUploads(prev => { const newUploads = { ...prev }; delete newUploads[docId]; return newUploads; }); handleCloseModal(); } }]);
  };

  const handleSubmitDocuments = () => {
    const documents = generateDocumentsList(surveyData);
    const requiredDocs = documents.filter(doc => doc.required);
    const uploadedRequiredDocs = requiredDocs.filter(doc => uploads[doc.id]);
    if (uploadedRequiredDocs.length < requiredDocs.length) {
      Alert.alert("เอกสารไม่ครบ", `คุณยังอัพโหลดเอกสารไม่ครบ (${uploadedRequiredDocs.length}/${requiredDocs.length})`, [{ text: "ตกลง" }]);
      return;
    }
    Alert.alert("ส่งเอกสารสำเร็จ", "เอกสารของคุณได้ถูกส่งเรียบร้อยแล้ว", [{ text: "ตกลง", onPress: () => { setSurveyData(null); setUploads({}); setUploadProgress({}); } }]);
  };

  const handleRetakeSurvey = () => {
    Alert.alert(
      "ทำแบบสอบถามใหม่",
      "การทำแบบสอบถามใหม่จะลบข้อมูลและไฟล์ที่อัพโหลดทั้งหมด\nคุณแน่ใจหรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ตกลง",
          style: "destructive",
          onPress: async () => {
            await deleteSurveyData();
            setSurveyData(null);
            setUploads({});
            setUploadProgress({});
          }
        }
      ]
    );
  };

  const getUploadStats = () => {
    const documents = generateDocumentsList(surveyData);
    const requiredDocs = documents.filter(doc => doc.required);
    const uploadedDocs = documents.filter(doc => uploads[doc.id]);
    const uploadedRequiredDocs = requiredDocs.filter(doc => uploads[doc.id]);
    return { total: documents.length, required: requiredDocs.length, uploaded: uploadedDocs.length, uploadedRequired: uploadedRequiredDocs.length };
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#475569' }}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  if (!surveyData) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <NoSurveyCard onStartSurvey={handleStartSurvey} />
      </ScrollView>
    );
  }

  const documents = generateDocumentsList(surveyData);
  const stats = getUploadStats();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <UploadHeader surveyData={surveyData} onRetakeSurvey={handleRetakeSurvey} />
      <UploadProgress stats={stats} />
      <DocumentList
        documents={documents}
        uploads={uploads}
        uploadProgress={uploadProgress}
        handleFileUpload={handleFileUpload}
        handleRemoveFile={handleRemoveFile}
        handleShowFileModal={handleShowFileModal}
        handleDownloadDocument={handleDownloadDocument} 
      />
      <TouchableOpacity
        style={[styles.submitButton, stats.uploadedRequired < stats.required && styles.submitButtonDisabled]}
        onPress={handleSubmitDocuments}
        disabled={stats.uploadedRequired < stats.required}
      >
        <Text style={styles.submitButtonText}>
          {stats.uploadedRequired >= stats.required ? 'ส่งเอกสาร' : `ส่งเอกสาร (${stats.uploadedRequired}/${stats.required})`}
        </Text>
      </TouchableOpacity>
      <FileDetailModal
        visible={showFileModal}
        onClose={handleCloseModal}
        selectedFile={selectedFile}
        selectedDocTitle={selectedDocTitle}
        fileContent={fileContent}
        contentType={contentType}
        isLoadingContent={isLoadingContent}
        formatFileSize={formatFileSize}
        handleOpenUploadedFile={handleOpenUploadedFile}
        handleRemoveFile={handleRemoveFile}
        imageZoom={imageZoom}
        setImageZoom={setImageZoom}
        setImagePosition={setImagePosition}
        loadFileContent={loadFileContent}
      />
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
});

export default UploadScreen;
