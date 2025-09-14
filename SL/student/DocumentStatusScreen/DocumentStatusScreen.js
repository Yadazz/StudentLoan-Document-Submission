import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import { db, auth, storage } from "../../database/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  ref as storageRef,
  deleteObject,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { mergeImagesToPdf } from "../UploadScreen/utils/pdfMerger";

// Import all components
import LoadingScreen from "./components/LoadingScreen";
import ErrorScreen from "./components/ErrorScreen";
import HeaderSection from "./components/HeaderSection";
import StatusOverview from "./components/StatusOverview";
import DocumentCard from "./components/DocumentCard";
import ActionButtons from "./components/ActionButtons";

// แก้ไขฟังก์ชัน isReuploadAllowed ให้เช็คสถานะที่ถูกต้อง
const isReuploadAllowed = (docId, submissionData) => {
  if (!submissionData) {
    return false;
  }

  // เช็คจาก documentStatuses ก่อน (รูปแบบใหม่)
  if (submissionData.documentStatuses && submissionData.documentStatuses[docId]) {
    const status = submissionData.documentStatuses[docId].status;
    return status === "rejected";
  }

  // เช็คจาก uploads (รูปแบบเก่า) สำหรับ backward compatibility
  if (submissionData.uploads && submissionData.uploads[docId]) {
    const filesData = submissionData.uploads[docId];
    const files = Array.isArray(filesData) ? filesData : [filesData];
    // ถ้ามีไฟล์ที่มีสถานะ rejected
    return files.some(file => file.status === "rejected");
  }

  // เช็คจากรูปแบบเก่า (submissionData[docId])
  if (submissionData[docId]) {
    const status = submissionData[docId].status;
    return status === "rejected";
  }

  return false;
};

const DocumentStatusScreen = ({ route, navigation }) => {
  const [submissionData, setSubmissionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appConfig, setAppConfig] = useState(null);
  const [availableTerms, setAvailableTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConvertingToPDF, setIsConvertingToPDF] = useState({});
  const [storageUploadProgress, setStorageUploadProgress] = useState({});

  // เพิ่มฟังก์ชันตรวจสอบว่าไฟล์เป็นรูปภาพหรือไม่
  const isImageFile = (mimeType, fileName) => {
    if (mimeType) {
      return mimeType.startsWith('image/');
    }
    if (fileName) {
      const ext = fileName.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
    }
    return false;
  };

  // เพิ่มฟังก์ชันอัพโหลดไฟล์ไปยัง Storage
  // Fix for the uploadFileToStorage function
const uploadFileToStorage = async (file, docId, fileIndex, userId, studentName, appConfig) => {
  try {
    const fileExtension = getFileExtension(file.filename || file.name || 'unknown');
    const timestamp = Date.now();
    const academicYear = appConfig?.academicYear || "2567";
    const term = appConfig?.term || "1";
    
    // Sanitize the student name for use in file paths
    const sanitizedStudentName = studentName.replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, '_');
    
    const fileName = `${sanitizedStudentName}_${docId}_${timestamp}_${fileIndex}.${fileExtension}`;
    const filePath = `student_documents/${sanitizedStudentName}/${academicYear}/term_${term}/${docId}_${fileIndex}_${timestamp}.${fileExtension}`;
    
    const fileRef = storageRef(storage, filePath);
    
    // Read file and convert to blob
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
    // Create upload task
    const uploadTask = uploadBytesResumable(fileRef, blob);
    
    // Monitor upload progress
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setStorageUploadProgress(prev => ({
          ...prev,
          [fileName]: progress
        }));
      },
      (error) => {
        console.error('Upload error:', error);
        throw error;
      }
    );
    
    // Wait for upload to complete
    await uploadTask;
    
    // Get download URL
    const downloadURL = await getDownloadURL(fileRef);
    
    // Clear progress when upload is complete
    setStorageUploadProgress(prev => {
      const newState = { ...prev };
      delete newState[fileName];
      return newState;
    });
    
    return {
      originalFileName: file.filename || file.name || 'unknown',
      storagePath: filePath,
      downloadURL: downloadURL,
      mimeType: file.mimeType || 'application/octet-stream',
      fileSize: file.size || 0,
      uploadedAt: new Date().toISOString(),
      convertedFromImage: file.convertedFromImage || false,
      originalImageName: file.originalImageName || null,
      originalImageType: file.originalImageType || null,
    };
    
  } catch (error) {
    console.error('Error uploading file to storage:', error);
    throw error;
  }
};

  const getFileExtension = (fileName) => {
    return fileName.split(".").pop().toLowerCase();
  };

  const convertImageToPDF = async (imageFile, docId, fileIndex) => {
    try {
      setIsConvertingToPDF((prev) => ({
        ...prev,
        [`${docId}_${fileIndex}`]: true,
      }));

      const base64Image = await FileSystem.readAsStringAsync(imageFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const mimeType = imageFile.mimeType || "image/jpeg";
      const base64DataUri = `data:${mimeType};base64,${base64Image}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page {
              margin: 0;
              size: A4;
            }
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${base64DataUri}" />
        </body>
        </html>
      `;

      const { uri: pdfUri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      const pdfInfo = await FileSystem.getInfoAsync(pdfUri);
      const originalName = imageFile.filename || imageFile.name || "image";
      const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, "");

      const pdfFile = {
        filename: `${nameWithoutExtension}_converted.pdf`,
        uri: pdfUri,
        mimeType: "application/pdf",
        size: pdfInfo.size,
        uploadDate: new Date().toLocaleString("th-TH"),
        status: "pending",
        ocrValidated: docId === "form_101",
        fileIndex: fileIndex,
        convertedFromImage: true,
        originalImageName: imageFile.filename ?? null,
        originalImageType: imageFile.mimeType ?? null,
      };

      return pdfFile;
    } catch (error) {
      console.error("Error converting image to PDF:", error);
      throw new Error(`ไม่สามารถแปลงรูปภาพเป็น PDF ได้: ${error.message}`);
    } finally {
      setIsConvertingToPDF((prev) => {
        const newState = { ...prev };
        delete newState[`${docId}_${fileIndex}`];
        return newState;
      });
    }
  };

  const uploadFiles = async (docId, selectedFiles, latestSubmissionData) => {
    const newFileMetadata = [];
    try {
      const userId = auth.currentUser.uid;
      const oldFiles = latestSubmissionData[docId]?.files || [];
      for (const oldFile of oldFiles) {
        if (oldFile.path) {
          const fileRef = storageRef(storage, oldFile.path);
          try {
            await deleteObject(fileRef);
            console.log(`Deleted old file: ${oldFile.path}`);
          } catch (error) {
            console.error(`Error deleting old file: ${oldFile.path}`, error);
          }
        }
      }

      for (const [index, file] of selectedFiles.entries()) {
        let fileToUpload = file;
        if (['jpg', 'jpeg', 'png'].includes(getFileExtension(file.name))) {
          if (docId === 'form101') {
            const mergedPdfUri = await mergeImagesToPdf(selectedFiles.map(f => f.uri));
            fileToUpload = {
              uri: mergedPdfUri,
              name: `merged_form101_${Date.now()}.pdf`,
              type: 'application/pdf',
              convertedFromImage: true,
            };
          } else {
            fileToUpload = await convertImageToPDF(file, docId, index);
          }
        }

        const uploadedFileMetadata = await uploadFileToStorage(
          fileToUpload,
          docId,
          index,
          userId,
          studentName,
          appConfig,
          setStorageUploadProgress
        );
        newFileMetadata.push(uploadedFileMetadata);
      }

      return newFileMetadata;
    } catch (error) {
      console.error("Error in uploadFiles function:", error);
      throw error;
    }
  };
  
  //ฟังก์ชันนี้ไม่ต้องเปลี่ยนแล้ว
  const findAvailableTerms = async (userId) => {
    try {
      const terms = [];
      const possibleYears = ['2566', '2567', '2568', '2569', '2570'];
      const possibleTerms = ['1', '2', '3'];
      
      for (const year of possibleYears) {
        for (const term of possibleTerms) {
          try {
            const termId = `${year}_${term}`;
            const collectionName = `document_submissions_${termId}`;
            const userDocRef = doc(db, collectionName, userId);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              terms.push({
                id: termId,
                year: year,
                term: term,
                collectionName: collectionName,
                displayName: `ปี ${year} เทอม ${term}`,
                data: userDoc.data()
              });
            }
          } catch (error) {
            continue;
          }
        }
      }
      
      setAvailableTerms(terms);
      return terms;
    } catch (error) {
      console.error("Error finding available terms:", error);
      return [];
    }
  };

  // ฟังก์ชันดึง config และ term ที่มีอยู่
  const fetchAppConfig = async () => {
    try {
      const configRef = doc(db, 'DocumentService', 'config');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const config = configDoc.data();
        setAppConfig(config);
        const currentTerm = `${config.academicYear}_${config.term}`;
        setSelectedTerm(currentTerm);
        return config;
      } else {
        const defaultConfig = {
          academicYear: "2567",
          term: "1",
          isEnabled: true
        };
        setAppConfig(defaultConfig);
        setSelectedTerm("2567_1");
        return defaultConfig;
      }
    } catch (error) {
      console.error("Error fetching app config:", error);
      return null;
    }
  };

  // ฟังก์ชันดึงข้อมูลหลัก
  const fetchSubmissionData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("เกิดข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้");
        navigation.goBack();
        return;
      }

      const config = await fetchAppConfig();
      if (!config) return;

      const terms = await findAvailableTerms(currentUser.uid);
      
      if (terms.length === 0) {
        // ลองดูใน collection เดิม
        const oldSubmissionRef = doc(db, 'document_submissions', currentUser.uid);
        const oldSubmissionDoc = await getDoc(oldSubmissionRef);
        
        if (oldSubmissionDoc.exists()) {
          setSubmissionData(oldSubmissionDoc.data());
        } else {
          // ใช้ข้อมูลจาก route params ถ้ามี
          const { submissionData: routeSubmissionData } = route.params || {};
          if (routeSubmissionData) {
            setSubmissionData(routeSubmissionData);
          } else {
            Alert.alert("ไม่พบข้อมูล", "ไม่พบข้อมูลการส่งเอกสาร");
            navigation.goBack();
            return;
          }
        }
      } else {
        // ใช้ข้อมูลจาก term ปัจจุบันหรือ term ล่าสุด
        const currentTermId = `${config.academicYear}_${config.term}`;
        const currentTermData = terms.find(t => t.id === currentTermId);
        
        if (currentTermData) {
          setSubmissionData(currentTermData.data);
          setSelectedTerm(currentTermId);
        } else {
          const latestTerm = terms[terms.length - 1];
          setSubmissionData(latestTerm.data);
          setSelectedTerm(latestTerm.id);
        }
      }
    } catch (error) {
      console.error("Error fetching submission data:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionData();
  }, []);

  // ฟังก์ชัน Pull to Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubmissionData();
    setRefreshing(false);
  };

  // ฟังก์ชันสำหรับเปิดไฟล์จาก Storage
  const handleOpenStorageFile = async (file) => {
    try {
      if (file.downloadURL) {
        const canOpen = await Linking.canOpenURL(file.downloadURL);
        if (canOpen) {
          await Linking.openURL(file.downloadURL);
        } else {
          Alert.alert("ไม่สามารถเปิดไฟล์ได้", "ไม่สามารถเปิดลิงก์ไฟล์นี้ได้");
        }
      } else if (file.uri) {
        const Sharing = await import("expo-sharing");
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert("ไม่สามารถเปิดไฟล์ได้", "อุปกรณ์ของคุณไม่รองรับการเปิดไฟล์นี้");
          return;
        }
        await Sharing.shareAsync(file.uri);
      } else {
        Alert.alert("ไม่พบไฟล์", "ไม่สามารถเข้าถึงไฟล์นี้ได้");
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเปิดไฟล์นี้ได้");
    }
  };

  // แก้ไข handleReupload ให้ใช้การตรวจสอบล่าสุด
  const handleReupload = async (docId, documentName) => {
    if (isUploading) return;

    try {
      // Fetch latest data before re-upload check
      const userId = auth.currentUser.uid;
      const collectionName = selectedTerm ? `document_submissions_${selectedTerm}` : 'document_submissions_2568_1';
      const docRef = doc(db, collectionName, userId);
      const docSnap = await getDoc(docRef);
      const latestSubmissionData = docSnap.exists() ? docSnap.data() : {};
      setSubmissionData(latestSubmissionData);

      // ใช้ฟังก์ชัน isReuploadAllowed ที่แก้ไขแล้ว
      if (!isReuploadAllowed(docId, latestSubmissionData)) {
        Alert.alert(
          "ไม่สามารถอัพโหลดได้",
          "สามารถอัพโหลดใหม่ได้เฉพาะเอกสารที่มีสถานะ 'ถูกปฏิเสธ' เท่านั้น"
        );
        return;
      }
    } catch (error) {
      console.error("Error fetching latest data:", error);
      Alert.alert(
        "ข้อผิดพลาด",
        `ไม่สามารถดึงข้อมูลล่าสุดได้: ${error.message}`
      );
      return;
    }

    Alert.alert(
      "อัพโหลดเอกสารใหม่",
      `คุณต้องการอัพโหลด "${documentName}" ใหม่หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "เลือกไฟล์",
          onPress: () => showFilePickerOptions(docId, documentName),
        },
      ]
    );
  };

  // Show file picker options
  const showFilePickerOptions = (docId, documentName) => {
    Alert.alert(
      "เลือกไฟล์",
      "คุณต้องการอัพโหลดไฟล์จากแหล่งใด?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ถ่ายรูป",
          onPress: () => pickImage(docId, documentName)
        },
        {
          text: "เลือกจากแกลเลอรี่",
          onPress: () => pickFromGallery(docId, documentName)
        },
        {
          text: "เลือกเอกสาร",
          onPress: () => pickDocument(docId, documentName)
        }
      ]
    );
  };

  // Pick image from camera
  const pickImage = async (docId, documentName) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('ต้องการสิทธิ์การใช้กล้อง', 'กรุณาอนุญาตให้ใช้กล้องเพื่อถ่ายรูปเอกสาร');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleFileUpload(docId, documentName, result.assets);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถถ่ายรูปได้');
    }
  };

  // Pick from gallery
  const pickFromGallery = async (docId, documentName) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('ต้องการสิทธิ์การใช้แกลเลอรี่', 'กรุณาอนุญาตให้เข้าถึงแกลเลอรี่');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleFileUpload(docId, documentName, result.assets);
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเลือกรูปภาพได้');
    }
  };

  // Pick document
  const pickDocument = async (docId, documentName) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleFileUpload(docId, documentName, result.assets);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเลือกเอกสารได้');
    }
  };

  // Updated file upload handler with multiple files and PDF conversion
  const handleFileUpload = async (docId, documentName, files) => {
    if (!files || files.length === 0) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลไฟล์');
      return;
    }

    setIsUploading(true);

    try {
      // Delete old files from storage first
      if (submissionData.uploads && submissionData.uploads[docId]) {
        const oldFiles = Array.isArray(submissionData.uploads[docId]) 
          ? submissionData.uploads[docId] 
          : [submissionData.uploads[docId]];

        for (const oldFile of oldFiles) {
          if (oldFile.storagePath) {
            try {
              await deleteObject(storageRef(storage, oldFile.storagePath));
              console.log(`Deleted old file: ${oldFile.storagePath}`);
            } catch (err) {
              console.warn(`Failed to delete old file: ${oldFile.storagePath}`, err);
            }
          }
        }
      }

      const processedFiles = [];
      let studentName = "Unknown_Student";
      
      // Get student name
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            studentName = userData.profile?.student_name || userData.name || userData.nickname || "Unknown_Student";
          }
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }

      // Process files similar to UploadScreen logic
      if (docId === 'form_101') {
        if (files.length > 4) {
          Alert.alert("ข้อผิดพลาด", "เอกสาร Form 101 สามารถอัพโหลดได้สูงสุด 4 ไฟล์เท่านั้น");
          setIsUploading(false);
          return;
        }
        
        const imagesToProcess = files.filter(file => isImageFile(file.mimeType, file.name));
        const otherFiles = files.filter(file => !isImageFile(file.mimeType, file.name));

        // Process non-image files
        for (const file of otherFiles) {
          processedFiles.push({
            filename: file.name,
            uri: file.uri,
            mimeType: file.mimeType,
            size: file.size,
            uploadDate: new Date().toLocaleString("th-TH"),
            status: "pending",
          });
        }

        // Merge images to PDF if any
        if (imagesToProcess.length > 0) {
          setIsConvertingToPDF(prev => ({
            ...prev,
            [`${docId}_merge`]: true
          }));
          
          try {
            const mergedPdfFile = await mergeImagesToPdf(imagesToProcess, docId);
            processedFiles.push(mergedPdfFile);
          } catch (error) {
            console.error("Error merging images to PDF:", error);
            Alert.alert("ข้อผิดพลาด", `ไม่สามารถรวมรูปภาพเป็น PDF ได้: ${error.message}`);
            setIsConvertingToPDF(prev => {
              const newState = { ...prev };
              delete newState[`${docId}_merge`];
              return newState;
            });
            setIsUploading(false);
            return;
          } finally {
            setIsConvertingToPDF(prev => {
              const newState = { ...prev };
              delete newState[`${docId}_merge`];
              return newState;
            });
          }
        }
      } else {
        // Process other document types
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          let processedFile = file;

          // Convert images to PDF
          if (isImageFile(file.mimeType, file.name)) {
            try {
              const convertedPdf = await convertImageToPDF(file, docId, i);
              processedFile = {
                ...file,
                ...convertedPdf,
                filename: convertedPdf.filename,
                mimeType: 'application/pdf',
              };
            } catch (conversionError) {
              console.error('PDF conversion failed:', conversionError);
              Alert.alert("การแปลงล้มเหลว", `ไม่สามารถแปลงไฟล์ "${file.name}" เป็น PDF ได้ จะใช้ไฟล์ต้นฉบับแทน`);
              processedFile = file;
            }
          }

          const fileWithMetadata = {
            filename: processedFile.filename || processedFile.name || `file_${Date.now()}`,
            uri: processedFile.uri || null,
            mimeType: processedFile.mimeType || 'application/octet-stream',
            size: processedFile.size || 0,
            uploadDate: new Date().toLocaleString("th-TH"),
            status: "pending",
          };

          // Only add conversion metadata if they exist
          if (processedFile.convertedFromImage) {
            fileWithMetadata.convertedFromImage = true;
            if (processedFile.originalImageName) {
              fileWithMetadata.originalImageName = processedFile.originalImageName;
            }
            if (processedFile.originalImageType) {
              fileWithMetadata.originalImageType = processedFile.originalImageType;
            }
          }

          processedFiles.push(fileWithMetadata);
        }
      }

      // Upload files to storage
      const uploadedFiles = [];
      for (let fileIndex = 0; fileIndex < processedFiles.length; fileIndex++) {
        const file = processedFiles[fileIndex];
        try {
          const storageData = await uploadFileToStorage(
            file,
            docId,
            fileIndex,
            submissionData.userId,
            studentName,
            appConfig
          );

          uploadedFiles.push({
            filename: storageData.originalFileName,
            mimeType: storageData.mimeType,
            size: storageData.fileSize,
            downloadURL: storageData.downloadURL,
            storagePath: storageData.storagePath,
            uploadedAt: storageData.uploadedAt,
            status: "pending",
            convertedFromImage: storageData.convertedFromImage || false,
            originalImageName: storageData.originalImageName,
            originalImageType: storageData.originalImageType,
          });

        } catch (error) {
          console.error(`Failed to upload file ${file.filename}:`, error);
          Alert.alert(
            "ข้อผิดพลาดในการอัพโหลด",
            `ไม่สามารถอัพโหลดไฟล์ ${file.filename} ได้: ${error.message}`
          );
          setIsUploading(false);
          return;
        }
      }

      // Update Firestore
      const collectionName = selectedTerm ? `document_submissions_${selectedTerm}` : `document_submissions_2568_1`;
      const docRef = doc(db, collectionName, submissionData.userId);

      const updatedUploads = {
        ...submissionData.uploads,
        [docId]: uploadedFiles
      };

      const updatedDocumentStatuses = {
        ...submissionData.documentStatuses,
        [docId]: {
          status: "pending",
          comments: "",
          updatedAt: new Date().toISOString(),
          fileCount: uploadedFiles.length
        }
      };

      await updateDoc(docRef, {
        uploads: updatedUploads,
        documentStatuses: updatedDocumentStatuses,
        lastUpdatedAt: new Date().toISOString()
      });

      // Update local state
      setSubmissionData(prev => ({
        ...prev,
        uploads: updatedUploads,
        documentStatuses: updatedDocumentStatuses
      }));

      const totalFiles = uploadedFiles.length;
      const convertedFiles = uploadedFiles.filter(file => file.convertedFromImage).length;

      let successMessage = `อัพโหลด "${documentName}" ใหม่เรียบร้อยแล้ว\nจำนวนไฟล์: ${totalFiles} ไฟล์`;
      if (convertedFiles > 0) {
        successMessage += `\nไฟล์ที่แปลงเป็น PDF: ${convertedFiles} ไฟล์`;
      }

      Alert.alert("สำเร็จ", successMessage);

    } catch (error) {
      console.error('Error uploading files:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถอัพโหลดไฟล์ได้');
    } finally {
      setIsUploading(false);
    }
  };

  // ฟังก์ชันลบเอกสารออกจาก Storage และ Firestore
  const handleDeleteSubmission = async () => {
    Alert.alert(
      "ลบเอกสารทั้งหมด",
      "คุณต้องการลบเอกสารทั้งหมดและทำใหม่หรือไม่? เอกสารจะถูกลบออกจากระบบทันที",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบทั้งหมด",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // ลบไฟล์ใน Storage
              if (submissionData?.uploads) {
                for (const [docId, files] of Object.entries(submissionData.uploads)) {
                  const fileList = Array.isArray(files) ? files : [files];
                  
                  for (const file of fileList) {
                    if (file.storagePath) {
                      try {
                        await deleteObject(storageRef(storage, file.storagePath));
                        console.log(`Deleted file: ${file.storagePath}`);
                      } catch (err) {
                        console.warn(`Failed to delete file: ${file.storagePath}`, err);
                      }
                    }
                  }
                }
              }
              
              // ลบ document submission ใน Firestore
              const collectionName = selectedTerm ? `document_submissions_${selectedTerm}` : `document_submissions_${submissionData?.academicYear || "2567"}_${submissionData?.term || "1"}`;
              await deleteDoc(doc(db, collectionName, submissionData.userId));
              
              // อัพเดท users collection
              await updateDoc(doc(db, 'users', submissionData.userId), {
                hasSubmittedDocuments: false,
                uploads: {},
                lastSubmissionAt: null,
                lastSubmissionTerm: null
              });
              
              Alert.alert("ลบสำเร็จ", "คุณสามารถทำรายการใหม่ได้แล้ว");
              navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
              
            } catch (error) {
              console.error("Error deleting submission:", error);
              Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถลบเอกสารได้");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // ฟังก์ชันนำทางกลับหน้าหลัก
  const handleGoHome = () => {
    navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
  };

  // ฟังก์ชันแสดงรายการเอกสารที่อัพโหลด
  const renderUploadedDocs = () => {
    if (!submissionData?.uploads || Object.keys(submissionData.uploads).length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyStateText}>ยังไม่มีเอกสารที่อัพโหลด</Text>
        </View>
      );
    }

    return Object.entries(submissionData.uploads).map(([docId, filesData]) => (
      <DocumentCard
        key={docId}
        docId={docId}
        filesData={filesData}
        submissionData={submissionData}
        onFilePress={handleOpenStorageFile}
        onReupload={handleReupload}
        isReuploadAllowed={isReuploadAllowed(docId, submissionData)} // แก้ไขตรงนี้ - ส่ง submissionData เข้าไปด้วย
        isUploading={isUploading}
        storageUploadProgress={storageUploadProgress}
        isConvertingToPDF={isConvertingToPDF}
      />
    ));
  };

  // คำนวดสถิติเอกสาร
  const getDocumentStats = () => {
    if (!submissionData?.documentStatuses && !submissionData?.uploads) {
      return { pending: 0, approved: 0, rejected: 0, uploaded: 0, total: 0, totalFiles: 0 };
    }

    let statuses = [];
    let totalFiles = 0;

    if (submissionData.documentStatuses) {
      statuses = Object.values(submissionData.documentStatuses);
    } else if (submissionData.uploads) {
      statuses = Object.values(submissionData.uploads).map(filesData => {
        const files = Array.isArray(filesData) ? filesData : [filesData];
        totalFiles += files.length;
        return { status: files[0]?.status || "pending" };
      });
    }

    // นับไฟล์ทั้งหมดถ้ายังไม่ได้นับ
    if (totalFiles === 0 && submissionData.uploads) {
      totalFiles = Object.values(submissionData.uploads).reduce((sum, filesData) => {
        const files = Array.isArray(filesData) ? filesData : [filesData];
        return sum + files.length;
      }, 0);
    }

    // Count converted files
    let convertedFiles = 0;
    if (submissionData.uploads) {
      convertedFiles = Object.values(submissionData.uploads)
        .flat()
        .filter(file => file.convertedFromImage).length;
    }

    return {
      pending: statuses.filter(doc => doc.status === "pending" || doc.status === "under_review").length,
      approved: statuses.filter(doc => doc.status === "approved").length,
      rejected: statuses.filter(doc => doc.status === "rejected").length,
      uploaded: statuses.filter(doc => doc.status === "uploaded_to_storage").length,
      total: statuses.length,
      totalFiles: totalFiles,
      convertedFiles: convertedFiles
    };
  };

  // แสดง Loading Screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // แสดง Error Screen
  if (!submissionData) {
    return (
      <ErrorScreen 
        onButtonPress={() => navigation.goBack()}
      />
    );
  }

  const stats = getDocumentStats();

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <HeaderSection submissionData={submissionData} />

      {/* Overall Status */}
      <StatusOverview stats={stats} />

      {/* Upload Progress Indicator */}
      {(isUploading || Object.keys(storageUploadProgress).length > 0 || Object.keys(isConvertingToPDF).length > 0) && (
        <View style={styles.uploadingIndicator}>
          <Ionicons name="cloud-upload-outline" size={24} color="#3b82f6" />
          <Text style={styles.uploadingText}>
            {isUploading && "กำลังประมวลผลไฟล์..."}
            {Object.keys(isConvertingToPDF).length > 0 && "กำลังแปลงรูปภาพเป็น PDF..."}
            {Object.keys(storageUploadProgress).length > 0 && "กำลังอัพโหลดไฟล์ใหม่..."}
          </Text>
          {Object.keys(storageUploadProgress).length > 0 && (
            <Text style={styles.progressText}>
              {Math.round(Object.values(storageUploadProgress).reduce((sum, progress) => sum + progress, 0) / Object.keys(storageUploadProgress).length)}%
            </Text>
          )}
        </View>
      )}

      {/* Document List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>รายละเอียดเอกสาร</Text>
        {renderUploadedDocs()}
      </View>

      {/* Action Buttons */}
      <ActionButtons
        onRefresh={onRefresh}
        onHome={handleGoHome}
        onDelete={handleDeleteSubmission}
        refreshing={refreshing}
        disabled={isUploading || Object.keys(storageUploadProgress).length > 0}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1e293b",
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 12,
  },
  uploadingIndicator: {
    backgroundColor: "#dbeafe",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: "#1e40af",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  progressText: {
    color: "#1e40af",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 20,
  },
});

export default DocumentStatusScreen;
