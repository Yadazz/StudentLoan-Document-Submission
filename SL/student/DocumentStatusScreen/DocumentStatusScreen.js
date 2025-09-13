import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Alert,
  Linking
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from '../../database/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref as storageRef, deleteObject } from "firebase/storage";
import { storage } from '../../database/firebase';
import { deleteDoc, updateDoc } from 'firebase/firestore';

// Import all components
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';
import HeaderSection from './components/HeaderSection';
import StatusOverview from './components/StatusOverview';
import DocumentCard from './components/DocumentCard';
import ActionButtons from './components/ActionButtons';


const DocumentStatusScreen = ({ route, navigation }) => {
  const [submissionData, setSubmissionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appConfig, setAppConfig] = useState(null);
  const [availableTerms, setAvailableTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);

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

  // ฟังก์ชันค้นหา terms ที่มีข้อมูลผู้ใช้
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
              const collectionName = `document_submissions_${submissionData?.academicYear || "2567"}_${submissionData?.term || "1"}`;
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

  // ฟังก์ชันแสดงรายการเอกสารที่อัปโหลด
  const renderUploadedDocs = () => {
    if (!submissionData?.uploads || Object.keys(submissionData.uploads).length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyStateText}>ยังไม่มีเอกสารที่อัปโหลด</Text>
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
      />
    ));
  };

  // คำนวณสถิติเอกสาร
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

    return {
      pending: statuses.filter(doc => doc.status === "pending" || doc.status === "under_review").length,
      approved: statuses.filter(doc => doc.status === "approved").length,
      rejected: statuses.filter(doc => doc.status === "rejected").length,
      uploaded: statuses.filter(doc => doc.status === "uploaded_to_storage").length,
      total: statuses.length,
      totalFiles: totalFiles
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
});

export default DocumentStatusScreen;
