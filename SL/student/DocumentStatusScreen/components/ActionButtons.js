import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ActionButtons = ({ 
  onRefresh, 
  onHome, 
  onDelete, 
  refreshing = false, 
  showDelete = true 
}) => {
  return (
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
        onPress={onHome}
      >
        <Ionicons name="home-outline" size={20} color="#ffffff" />
        <Text style={styles.homeButtonText}>กลับไปหน้าหลัก</Text>
      </TouchableOpacity>

      {showDelete && (
        <TouchableOpacity
          style={[styles.homeButton, styles.deleteButton]}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.homeButtonText}>ลบเอกสารทั้งหมด</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  actionSection: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 30,
  },
  refreshButton: {
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
    // Add rotation animation if needed
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 12,
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  homeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ActionButtons;
