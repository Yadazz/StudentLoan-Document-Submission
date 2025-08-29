// UploadHeader.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const UploadHeader = ({ surveyData, onRetakeSurvey }) => {
  const familyStatusText = surveyData.familyStatus === 'ก'
    ? 'บิดามารดาอยู่ด้วยกัน'
    : surveyData.familyStatus === 'ข'
      ? 'บิดาหรือมารดาหย่าร้าง หรือเสียชีวิต หรือไม่สามารถติดต่อได้'
      : 'มีผู้ปกครอง ที่ไม่ใช่บิดามารดาดูแล';

  return (
    <View style={styles.headerCard}>
      <Text style={styles.headerTitle}>อัพโหลดเอกสาร</Text>
      <Text style={styles.headerSubtitle}>
        <Text style={{ fontWeight: 'bold', color: '#3b82f6' }}>สถานภาพครอบครัว:</Text>{" "}
        {familyStatusText}
      </Text>
      <TouchableOpacity style={styles.retakeButton} onPress={onRetakeSurvey}>
        <Text style={styles.retakeButtonText}>ทำแบบสอบถามใหม่</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default UploadHeader;