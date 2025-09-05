import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from '../database/firebase';
import { doc, getDoc } from 'firebase/firestore';

const DocumentStatusScreen = ({ route, navigation }) => {
  const [submissionData, setSubmissionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ดึงข้อมูลจาก Firebase
  const fetchSubmissionData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("เกิดข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้");
        navigation.goBack();
        return;
      }

      const submissionRef = doc(db, 'document_submissions', currentUser.uid);
      const submissionDoc = await getDoc(submissionRef);

      if (submissionDoc.exists()) {
        const data = submissionDoc.data();
        setSubmissionData(data);
        console.log("Submission data loaded:", data);
      } else {
        // ถ้าไม่มีข้อมูลใน Firebase ให้ใช้ข้อมูลจาก route params
        const { surveyData, uploads, submissionData: routeSubmissionData } = route.params || {};
        if (routeSubmissionData) {
          setSubmissionData(routeSubmissionData);
        } else {
          Alert.alert("ไม่พบข้อมูล", "ไม่พบข้อมูลการส่งเอกสาร");
          navigation.goBack();
          return;
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

  // ฟังก์ชันกำหนดสีและไอคอนตามสถานะ
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return {
          color: "#f59e0b",
          bgColor: "#fef3c7",
          icon: "time-outline",
          text: "รอการตรวจสอบ",
          textColor: "#92400e"
        };
      case "approved":
        return {
          color: "#10b981",
          bgColor: "#d1fae5",
          icon: "checkmark-circle-outline",
          text: "อนุมัติแล้ว",
          textColor: "#065f46"
        };
      case "rejected":
        return {
          color: "#ef4444",
          bgColor: "#fee2e2",
          icon: "close-circle-outline",
          text: "ไม่อนุมัติ",
          textColor: "#991b1b"
        };
      case "under_review":
        return {
          color: "#3b82f6",
          bgColor: "#dbeafe",
          icon: "eye-outline",
          text: "กำลังตรวจสอบ",
          textColor: "#1e40af"
        };
      default:
        return {
          color: "#6b7280",
          bgColor: "#f3f4f6",
          icon: "help-circle-outline",
          text: "ไม่ทราบสถานะ",
          textColor: "#374151"
        };
    }
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

    return Object.entries(submissionData.uploads).map(([docId, file]) => {
      const docStatus = submissionData.documentStatuses?.[docId]?.status || "pending";
      const statusInfo = getStatusInfo(docStatus);
      const reviewComments = submissionData.documentStatuses?.[docId]?.comments || "";

      return (
        <View key={docId} style={styles.fileCard}>
          <View style={styles.fileHeader}>
            <View style={styles.fileInfo}>
              <Ionicons name="document-text-outline" size={24} color="#2563eb" />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={1}>{file.filename}</Text>
                <Text style={styles.fileMeta}>
                  {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "ไม่ทราบขนาด"} • 
                  {file.uploadDate || "ไม่ทราบเวลา"}
                </Text>
              </View>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <Ionicons 
                name={statusInfo.icon} 
                size={16} 
                color={statusInfo.color} 
                style={styles.statusIcon} 
              />
              <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>

          {reviewComments ? (
            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>หมายเหตุจากเจ้าหน้าที่:</Text>
              <Text style={styles.commentText}>{reviewComments}</Text>
            </View>
          ) : null}
        </View>
      );
    });
  };

  // คำนวณสถิติเอกสาร
  const getDocumentStats = () => {
    if (!submissionData?.documentStatuses) return { pending: 0, approved: 0, rejected: 0, total: 0 };

    const statuses = Object.values(submissionData.documentStatuses);
    return {
      pending: statuses.filter(doc => doc.status === "pending" || doc.status === "under_review").length,
      approved: statuses.filter(doc => doc.status === "approved").length,
      rejected: statuses.filter(doc => doc.status === "rejected").length,
      total: statuses.length
    };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  if (!submissionData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>ไม่พบข้อมูลการส่งเอกสาร</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>กลับไปหน้าก่อน</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = getDocumentStats();
  const submittedDate = submissionData.submittedAt 
    ? new Date(submissionData.submittedAt).toLocaleString('th-TH')
    : 'ไม่ทราบ';

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="document-text" size={32} color="#2563eb" />
        </View>
        <Text style={styles.title}>สถานะการส่งเอกสาร</Text>
        <Text style={styles.subtitle}>
          ส่งเมื่อ: {submittedDate}
        </Text>
      </View>

      {/* Overall Status */}
      <View style={styles.overallStatusCard}>
        <Text style={styles.overallStatusTitle}>สถานะโดยรวม</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={[styles.statusNumber, { color: "#10b981" }]}>{stats.approved}</Text>
            <Text style={styles.statusLabel}>อนุมัติแล้ว</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusNumber, { color: "#f59e0b" }]}>{stats.pending}</Text>
            <Text style={styles.statusLabel}>รอตรวจสอบ</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusNumber, { color: "#ef4444" }]}>{stats.rejected}</Text>
            <Text style={styles.statusLabel}>ไม่อนุมัติ</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusNumber, { color: "#6b7280" }]}>{stats.total}</Text>
            <Text style={styles.statusLabel}>ทั้งหมด</Text>
          </View>
        </View>
      </View>

      {/* Document List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>รายละเอียดเอกสาร</Text>
        {renderUploadedDocs()}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh-outline" 
            size={20} 
            color="#2563eb" 
            style={refreshing ? styles.spinning : null} 
          />
          <Text style={styles.refreshButtonText}>
            {refreshing ? 'กำลังอัปเดต...' : 'อัปเดตสถานะ'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] })}
        >
          <Ionicons name="home-outline" size={20} color="#ffffff" />
          <Text style={styles.homeButtonText}>กลับไปหน้าหลัก</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f8fafc",
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  headerIcon: {
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 50,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  overallStatusCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  overallStatusTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1e293b",
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusNumber: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: "#64748b",
    textAlign: 'center',
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
  fileCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderLeftWidth: 4,
    borderLeftColor: "#e2e8f0",
  },
  fileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fileInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: 12,
    color: "#64748b",
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  commentSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
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
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#eff6ff",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  refreshButtonText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  spinning: {
    // Add animation here if needed
  },
  homeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 12,
  },
  homeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default DocumentStatusScreen;
