// UploadProgress.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UploadProgress = ({ stats }) => {
  const progressPercentage = Math.round((stats.uploadedRequired / stats.required) * 100);
  return (
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
            { width: `${progressPercentage}%` }
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {progressPercentage}% เสร็จสิ้น
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default UploadProgress;