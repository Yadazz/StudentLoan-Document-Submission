// components/HeaderSection.js
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const HeaderSection = ({ surveyData, onRetakeSurvey }) => {
  const familyStatusText = surveyData.familyStatus === 'ก'
    ? 'บิดามารดาอยู่ด้วยกัน'
    : surveyData.familyStatus === 'ข'
      ? 'บิดาหรือมารดาหย่าร้าง หรือเสียชีวิต หรือไม่สามารถติดต่อได้'
      : 'มีผู้ปกครอง ที่ไม่ใช่บิดามารดาดูแล';

  return (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <Ionicons name="cloud-upload" size={32} color="#2563eb" />
      </View>
      <Text style={styles.title}>อัปโหลดเอกสาร</Text>
      <Text style={styles.headerSubtitle}>
              <Text style={{ fontWeight: 'bold', color: '#3b82f6' }}>สถานภาพครอบครัว:</Text>{" "}
              {familyStatusText}
            </Text>
      <TouchableOpacity style={styles.retakeButton} onPress={onRetakeSurvey}>
        <Ionicons name="refresh-outline" size={16} color="#6b7280" />
        <Text style={styles.retakeButtonText}>ทำแบบสอบถามใหม่</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
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
    marginBottom: 8,
    textAlign: "center",
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  retakeButtonText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  }
});
export default HeaderSection;
