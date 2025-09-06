// UploadScreen.js (Updated with Term-based Storage Structure)
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, Platform, Dimensions, Image, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db, auth } from '../database/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, deleteDoc } from 'firebase/firestore';
// เพิ่ม import สำหรับ Firebase Storage
import { storage } from '../database/firebase';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';

// Import refactored components
import NoSurveyCard from './components/NoSurveyCard';
import UploadHeader from './components/UploadHeader';
import UploadProgress from './components/UploadProgress';
import DocumentList from './components/DocumentList';
import FileDetailModal from './components/FileDetailModal';

import { InsertForm101 } from './documents/InsertForm101';
import { ConsentFrom_student } from './documents/ConsentFrom_student';
import { ConsentFrom_father } from './documents/ConsentFrom_father';
import { ConsentFrom_mother } from './documents/ConsentFrom_mother';
import { Income102 } from './documents/income102';
import { FamStatus_cert } from './documents/FamStatus_cert';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storageUploadProgress, setStorageUploadProgress] = useState({});
  
  // เพิ่ม state สำหรับข้อมูล config
  const [appConfig, setAppConfig] = useState(null);

  // ฟังก์ชันใหม่สำหรับดึงข้อมูล config
  const fetchAppConfig = async () => {
    try {
      const configRef = doc(db, 'DocumentService', 'config');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const config = configDoc.data();
        setAppConfig(config);
        console.log("App config loaded:", config);
        return config;
      } else {
        console.log("No config found, using default values");
        // ค่าเริ่มต้นถ้าไม่พบ config
        const defaultConfig = {
          academicYear: "2567",
          term: "1",
          isEnabled: true,
          immediateAccess: true
        };
        setAppConfig(defaultConfig);
        return defaultConfig;
      }
    } catch (error) {
      console.error("Error fetching app config:", error);
      return null;
    }
  };

  useEffect(() => {
    const checkSubmissionStatus = async () => {
      setIsLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      // ดึง config ก่อน
      const config = await fetchAppConfig();
      const termCollectionName = `document_submissions_${config?.academicYear || "2567"}_${config?.term || "1"}`;
      const submissionRef = doc(db, termCollectionName, currentUser.uid);
      const submissionDoc = await getDoc(submissionRef);

      if (submissionDoc.exists()) {
        // ถ้ามีเอกสารแล้ว ให้ไปหน้า DocumentStatusScreen
        navigation.replace('DocumentStatusScreen', {
          submissionData: submissionDoc.data()
        });
        setIsLoading(false);
        return;
      }

      // เรียกข้อมูล Survey ของผู้ใช้จาก Firestore
      const userSurveyRef = doc(db, 'users', currentUser.uid);
      const userSurveyDoc = await getDoc(userSurveyRef);

      if (userSurveyDoc.exists()) {
        const userData = userSurveyDoc.data();
        const surveyData = userData.survey;
        setSurveyData(surveyData);
        setSurveyDocId(userSurveyDoc.id);
        
        // โหลดข้อมูล uploads ที่มีอยู่ถ้ามี
        if (userData.uploads) {
          setUploads(userData.uploads);
        }
        
        console.log("Survey data fetched:", surveyData);
      } else {
        console.log("No survey data found for this user.");
        setSurveyData(null);
        setSurveyDocId(null);
      }
      setIsLoading(false);
    };

    checkSubmissionStatus();
  }, []);

  // ฟังก์ชันสำหรับบันทึก uploads ไป Firebase
  const saveUploadsToFirebase = async (uploadsData) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        uploads: uploadsData,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving uploads to Firebase:", error);
    }
  };

 // ฟังก์ชันใหม่สำหรับอัปโหลดไฟล์ไปยัง Firebase Storage (โครงสร้างใหม่: student_name/academic_year/term/)
const uploadFileToStorage = async (file, docId, userId, studentName, config) => {
  try {
    console.log("Starting upload for:", file.filename);
    
    // สร้าง path ใหม่ที่เริ่มต้นด้วยชื่อนักเรียนก่อน
    const sanitizedStudentName = studentName.replace(/[.#$[\]/\\]/g, '_').replace(/\s+/g, '_');
    const timestamp = new Date().getTime();
    const fileExtension = file.filename.split('.').pop();
    
    // โครงสร้างใหม่: student_name/academic_year/term/document_id_timestamp.extension
    const academicYear = config?.academicYear || "2567";
    const term = config?.term || "1";
    const storagePath = `student_documents/${sanitizedStudentName}/${academicYear}/term_${term}/${docId}_${timestamp}.${fileExtension}`;
    
    console.log("New storage path (student-first):", storagePath);
    
    // อ่านไฟล์เป็น blob
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
    console.log("File converted to blob, size:", blob.size);
    
    // สร้าง reference ใน Storage
    const storageRef = ref(storage, storagePath);
    
    // อัปโหลดพร้อมติดตาม progress
    const uploadTask = uploadBytesResumable(storageRef, blob);
    
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // คำนวณ progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload ${docId}: ${progress}% completed`);
          
          // อัปเดท progress state
          setStorageUploadProgress(prev => ({
            ...prev,
            [docId]: Math.round(progress)
          }));
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          try {
            // อัปโหลดเสร็จแล้ว ดึง download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("Upload completed, URL:", downloadURL);
            
            // ลบ progress state
            setStorageUploadProgress(prev => {
              const newState = { ...prev };
              delete newState[docId];
              return newState;
            });
            
            resolve({
              downloadURL,
              storagePath,
              uploadedAt: new Date().toISOString(),
              originalFileName: file.filename,
              fileSize: file.size,
              mimeType: file.mimeType,
              academicYear: academicYear,
              term: term,
              studentFolder: sanitizedStudentName // เพิ่มข้อมูลโฟลเดอร์นักเรียน
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error in uploadFileToStorage:", error);
    throw error;
  }
};

  const deleteSurveyData = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("No user to delete survey data.");
      return;
    }
    try {
      const userSurveyRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userSurveyRef, {
        survey: {},
        uploads: {}
      });
      console.log("Survey data successfully deleted from Firestore!");
    } catch (error) {
      console.error("Error deleting survey data: ", error);
      Alert.alert("Error", "Failed to delete survey data.");
    }
  };

  // ฟังก์ชันใหม่สำหรับจัดการการดาวน์โหลดเอกสาร เดี๋ยวต้องมาแก้ตรงนี้ถ้าทำเอกสารเพิ่มแล้ว
  const handleDownloadDocument = (docId, downloadUrl) => {
    if (docId === 'form_101') {
      // สำหรับแบบฟอร์ม กยศ.101 ให้เรียกใช้ฟังก์ชันสร้าง PDF
      InsertForm101();
    } else if (docId === 'consent_student_form') {
      ConsentFrom_student();
    } else if (docId === 'consent_father_form') {
      ConsentFrom_father();
    } else if (docId === 'consent_mother_form') {
      ConsentFrom_mother();
    } else if (docId === 'guardian_income_cert' || docId === 'father_income_cert' || docId === 'mother_income_cert' || docId === 'single_parent_income_cert' || docId === 'famo_income_cert') {
      Income102();
    } else if (docId === 'family_status_cert' || docId === 'family_status_required') {
      FamStatus_cert();
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
      { id: 'consent_student_form', title: 'หนังสือยินยอมเปิดเผยข้อมูลของผู้กู้', required: true },
      { id: 'id_copies_student', title: 'สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของผู้กู้', required: true }
    );
    if (data.familyStatus === "ก") {
      documents.push(
        { id: 'consent_father_form', title: 'หนังสือยินยอมเปิดเผยข้อมูลของบิดา', required: true },
        { id: 'id_copies_father', title: 'สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของบิดา', required: true },
        { id: 'consent_mother_form', title: 'หนังสือยินยอมเปิดเผยข้อมูลของมารดา', required: true },
        { id: 'id_copies_mother', title: 'สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของมารดา', required: true },
      );

      if (data.fatherIncome !== "มีรายได้ประจำ" && data.motherIncome !== "มีรายได้ประจำ") {
        documents.push(
          { id: 'famo_income_cert', title: 'หนังสือรับรองรายได้ กยศ. 102 ของบิดา มารดา', required: true },
          { id: 'famo_id_copies_gov', title: 'สำเนาบัตรข้าราชการผู้รับรอง', description: 'สำหรับรับรองรายได้ เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น', required: true }
        );
      } else {
        if (data.fatherIncome === "มีรายได้ประจำ") {
          documents.push({ id: 'father_income', title: 'หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของบิดา', description: 'เอกสารอายุไม่เกิน 3 เดือน', required: true });
        } else {
          documents.push(
            { id: 'father_income_cert', title: 'หนังสือรับรองรายได้ กยศ. 102 ของบิดา', required: true },
            { id: 'fa_id_copies_gov', title: 'สำเนาบัตรข้าราชการผู้รับรอง', description: 'สำหรับรับรองรายได้ เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น', required: true }
          );
        }
        if (data.motherIncome === "มีรายได้ประจำ") {
          documents.push({ id: 'mother_income', title: 'หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของมารดา', description: 'เอกสารอายุไม่เกิน 3 เดือน', required: true });
        } else {
          documents.push(
            { id: 'mother_income_cert', title: 'หนังสือรับรองรายได้ กยศ. 102 ของมารดา', required: true },
            { id: 'ma_id_copies_gov', title: 'สำเนาบัตรข้าราชการผู้รับรอง', description: 'สำหรับรับรองรายได้ เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น', required: true }
          );
        }
      }
    } else if (data.familyStatus === "ข") {
      let parent = data.livingWith === "บิดา" ? "บิดา" : "มารดา";
      let consentFormId = data.livingWith === "บิดา" ? 'consent_father_form' : 'consent_mother_form';
      
      documents.push(
        { id: consentFormId, title: `หนังสือยินยอมเปิดเผยข้อมูลของ ${parent}`, required: true },
        { id: `id_copies_${consentFormId}`, title: `สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้องของ ${parent}`, required: true }
      );
      if (data.legalStatus === "มีเอกสาร") {
        documents.push({ id: 'legal_status', title: 'สำเนาใบหย่า (กรณีหย่าร้าง) หรือ สำเนาใบมรณบัตร (กรณีเสียชีวิต)', required: true });
      } else {
        documents.push(
          { id: 'family_status_cert', title: 'หนังสือรับรองสถานภาพครอบครัว', required: true },
          { id: 'fam_id_copies_gov', title: 'สำเนาบัตรข้าราชการผู้รับรอง', description: 'สำหรับรับรองสถานภาพครอบครัว เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น', required: true }
        );
      }
      const hasIncome = (data.livingWith === "บิดา" && data.fatherIncome === "มีรายได้ประจำ") || (data.livingWith === "มารดา" && data.motherIncome === "มีรายได้ประจำ");
      if (hasIncome) {
        documents.push({ id: 'single_parent_income', title: `หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของ${parent}`, description: 'เอกสารอายุไม่เกิน 3 เดือน', required: true });
      } else {
        documents.push(
          { id: 'single_parent_income_cert', title: `หนังสือรับรองรายได้ กยศ. 102 ของ${parent}`, required: true },
          { id: '102_id_copies_gov', title: 'สำเนาบัตรข้าราชการผู้รับรอง', description: `สำหรับรับรองรายได้ของ${parent}  เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น`, required: true }
        );
      }
    } else if (data.familyStatus === "ค") {
      documents.push(
        { id: 'guardian_consent', title: 'หนังสือยินยอมเปิดเผยข้อมูล ของผู้ปกครอง', required: true },
        { id: 'guardian_id_copies', title: 'สำเนาบัตรประชาชนพร้อมรับรองสำเนาถูกต้อง ของผู้ปกครอง', required: true }
      );
      if (data.guardianIncome === "มีรายได้ประจำ") {
        documents.push({ id: 'guardian_income', title: 'หนังสือรับรองเงินเดือน หรือ สลิปเงินเดือน ของผู้ปกครอง', description: '(เอกสารอายุไม่เกิน 3 เดือน)', required: true });
      } else {
        documents.push(
          { id: 'guardian_income_cert', title: 'หนังสือรับรองรายได้ กยศ. 102 ของผู้ปกครอง', downloadUrl: 'https://drive.google.com/file/d/1ylB6AxaPg4qgvBqWWMwQ54LiLCkFTw1-/view?usp=drive_link', required: true },
          { id: 'guar_id_copies_gov', title: 'สำเนาบัตรข้าราชการผู้รับรอง', description: 'สำหรับรับรองรายได้ เอกสารจัดทำในปี พ.ศ. 2568 เท่านั้น', required: true }
        );
      }
      if (data.parentLegalStatus === "มีเอกสาร") {
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
      
      const newUploads = {
        ...uploads,
        [docId]: { 
          filename: file.name, 
          uri: file.uri, 
          mimeType: file.mimeType, 
          size: file.size, 
          uploadDate: new Date().toLocaleString("th-TH"), 
          status: "pending",
        }
      };
      
      setUploads(newUploads);
      
      // บันทึกลง Firebase
      await saveUploadsToFirebase(newUploads);
      
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเลือกไฟล์ได้");
      console.error(error);
    }
  };

  const handleRemoveFile = async (docId) => {
    Alert.alert("ลบไฟล์", "คุณต้องการลบไฟล์นี้หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" }, 
      { text: "ลบ", style: "destructive", onPress: async () => { 
        const newUploads = { ...uploads };
        delete newUploads[docId];
        setUploads(newUploads);
        
        // อัพเดทใน Firebase
        await saveUploadsToFirebase(newUploads);
        
        handleCloseModal(); 
      } }
    ]);
  };

  // ฟังก์ชันส่งเอกสารที่อัปเดตใหม่พร้อม Firebase Storage และ Term-based structure
  const handleSubmitDocuments = async () => {
    const documents = generateDocumentsList(surveyData);
    const requiredDocs = documents.filter(doc => doc.required);
    const uploadedRequiredDocs = requiredDocs.filter(doc => uploads[doc.id]);
    
    if (uploadedRequiredDocs.length < requiredDocs.length) {
      Alert.alert("เอกสารไม่ครบ", `คุณยังอัพโหลดเอกสารไม่ครบ (${uploadedRequiredDocs.length}/${requiredDocs.length})`, [{ text: "ตกลง" }]);
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("เกิดข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้");
        setIsSubmitting(false);
        return;
      }

      console.log("เริ่มต้นการอัปโหลดเอกสารไปยัง Firebase Storage...");

      // สร้าง object สำหรับเก็บข้อมูล Storage URLs
      const storageUploads = {};
      const uploadPromises = [];

      // ดึงข้อมูลผู้ใช้จาก Firebase เพื่อดึงชื่อจริง
      let studentName = "Unknown_Student"; // ค่าเริ่มต้น
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("Full user data:", userData); // Debug log
          
          // ดึงชื่อจากฟิลด์ที่มีในฐานข้อมูลของคุณ
          studentName = userData.name || 
                       userData.nickname || 
                       `${userData.firstName || ''}_${userData.lastName || ''}`.replace('_', '') ||
                       "Unknown_Student";
          console.log("Found student name from database:", studentName);
        } else {
          console.log("User document does not exist");
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
      
      console.log("Final student name for storage:", studentName);

      // อัปโหลดแต่ละไฟล์ไปยัง Storage พร้อม config
      for (const [docId, file] of Object.entries(uploads)) {
        console.log(`เตรียมอัปโหลด: ${file.filename} (${docId})`);
        
        const uploadPromise = uploadFileToStorage(file, docId, currentUser.uid, studentName, appConfig)
          .then((storageData) => {
            storageUploads[docId] = {
              ...file, // ข้อมูลเดิม
              ...storageData, // ข้อมูลจาก Storage (downloadURL, storagePath, etc.)
              storageUploaded: true,
              status: "uploaded_to_storage"
            };
            console.log(`อัปโหลดสำเร็จ: ${file.filename}`);
          })
          .catch((error) => {
            console.error(`อัปโหลดล้มเหลว: ${file.filename}`, error);
            throw new Error(`ไม่สามารถอัปโหลดไฟล์ ${file.filename} ได้: ${error.message}`);
          });
        
        uploadPromises.push(uploadPromise);
      }

      // รอให้ไฟล์ทั้งหมดอัปโหลดเสร็จ
      await Promise.all(uploadPromises);
      console.log("อัปโหลดไฟล์ทั้งหมดเสร็จสิ้น");

      // สร้างข้อมูลส่งเอกสาร พร้อมข้อมูล term และ academic year
      const submissionData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        surveyData: surveyData,
        uploads: storageUploads, // ใช้ข้อมูลที่มี Storage URLs
        submittedAt: new Date().toISOString(),
        status: "submitted",
        documentStatuses: {},
        academicYear: appConfig?.academicYear || "2567",
        term: appConfig?.term || "1",
        submissionTerm: `${appConfig?.academicYear || "2567"}_${appConfig?.term || "1"}` // เพิ่มฟิลด์นี้เพื่อง่ายต่อการ query
      };

      // กำหนดสถานะเริ่มต้นให้กับแต่ละเอกสาร
      Object.keys(storageUploads).forEach(docId => {
        submissionData.documentStatuses[docId] = {
          status: "pending", // สถานะเริ่มต้น: รอการตรวจสอบ
          reviewedAt: null,
          reviewedBy: null,
          comments: ""
        };
      });

      console.log("บันทึกข้อมูลการส่งเอกสารลงฐานข้อมูล...");

      // บันทึกข้อมูลการส่งเอกสารใน collection ใหม่ (แยกตาม term)
      const termCollectionName = `document_submissions_${appConfig?.academicYear || "2567"}_${appConfig?.term || "1"}`;
      const submissionRef = doc(collection(db, termCollectionName), currentUser.uid);
      await setDoc(submissionRef, submissionData);

      // อัพเดทสถานะในข้อมูลผู้ใช้
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        lastSubmissionAt: new Date().toISOString(),
        hasSubmittedDocuments: true,
        uploads: storageUploads, // อัปเดตข้อมูล uploads ด้วย Storage URLs
        lastSubmissionTerm: `${appConfig?.academicYear || "2567"}_${appConfig?.term || "1"}` // เก็บข้อมูลเทอมล่าสุดที่ส่ง
      });

      console.log("บันทึกข้อมูลสำเร็จ");

      Alert.alert(
        "ส่งเอกสารสำเร็จ", 
        `เอกสารของคุณได้ถูกส่งและอัปโหลดเรียบร้อยแล้ว\nปีการศึกษา: ${appConfig?.academicYear || "2567"} เทอม: ${appConfig?.term || "1"}\nคุณสามารถติดตามสถานะได้ในหน้าแสดงผล`, 
        [{ 
          text: "ดูสถานะ", 
          onPress: () => {
            // นำทางไปหน้าแสดงสถานะ
            navigation.navigate('DocumentStatusScreen', {
              surveyData: surveyData,
              uploads: storageUploads,
              submissionData: submissionData
            });
          }
        }]
      );

    } catch (error) {
      console.error("Error submitting documents:", error);
      Alert.alert("เกิดข้อผิดพลาด", `ไม่สามารถส่งเอกสารได้: ${error.message}\nกรุณาลองใหม่อีกครั้ง`);
    } finally {
      setIsSubmitting(false);
      // ล้าง storage upload progress
      setStorageUploadProgress({});
    }
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
            setStorageUploadProgress({});
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
      
      {/* แสดงข้อมูล Academic Year และ Term */}
      {appConfig && (
        <View style={styles.termInfoCard}>
          <Text style={styles.termInfoTitle}>ข้อมูลการส่งเอกสาร</Text>
          <Text style={styles.termInfoText}>
            ปีการศึกษา: {appConfig.academicYear} • เทอม: {appConfig.term}
          </Text>
        </View>
      )}
      
      <UploadProgress stats={stats} />
      
      {/* แสดง Storage Upload Progress ถ้ามี */}
      {Object.keys(storageUploadProgress).length > 0 && (
        <View style={styles.storageProgressCard}>
          <Text style={styles.storageProgressTitle}>กำลังอัปโหลดไฟล์...</Text>
          {Object.entries(storageUploadProgress).map(([docId, progress]) => (
            <View key={docId} style={styles.storageProgressItem}>
              <Text style={styles.storageProgressLabel}>{uploads[docId]?.filename || docId}</Text>
              <View style={styles.storageProgressBar}>
                <View 
                  style={[
                    styles.storageProgressFill, 
                    { width: `${progress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.storageProgressText}>{progress}%</Text>
            </View>
          ))}
        </View>
      )}

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
        style={[
          styles.submitButton, 
          (stats.uploadedRequired < stats.required || isSubmitting) && styles.submitButtonDisabled
        ]}
        onPress={handleSubmitDocuments}
        disabled={stats.uploadedRequired < stats.required || isSubmitting}
      >
        {isSubmitting ? (
          <View style={styles.submitButtonLoading}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
              {Object.keys(storageUploadProgress).length > 0 
                ? `กำลังอัปโหลด... (${Object.keys(storageUploadProgress).length} ไฟล์)`
                : 'กำลังส่งเอกสาร...'
              }
            </Text>
          </View>
        ) : (
          <Text style={styles.submitButtonText}>
            {stats.uploadedRequired >= stats.required ? 'ส่งเอกสาร' : `ส่งเอกสาร (${stats.uploadedRequired}/${stats.required})`}
          </Text>
        )}
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
  termInfoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  termInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  termInfoText: {
    fontSize: 14,
    color: '#64748b',
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
  submitButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Styles สำหรับ Storage Progress
  storageProgressCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  storageProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  storageProgressItem: {
    marginBottom: 12,
  },
  storageProgressLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  storageProgressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  storageProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  storageProgressText: {
    fontSize: 12,
    color: '#10b981',
    textAlign: 'right',
    fontWeight: '600',
  },
});

export default UploadScreen;
