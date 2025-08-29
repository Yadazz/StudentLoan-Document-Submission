// NoSurveyCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const NoSurveyCard = ({ onStartSurvey }) => {
  return (
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
      <TouchableOpacity style={styles.primaryButton} onPress={onStartSurvey}>
        <Text style={styles.primaryButtonText}>เริ่มทำแบบสอบถาม</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    marginTop: 55,
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
});

export default NoSurveyCard;