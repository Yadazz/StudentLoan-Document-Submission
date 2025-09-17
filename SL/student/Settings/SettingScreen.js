import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../../database/firebase";

const SettingsScreen = ({ navigation }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginScreen" }],
      });
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถออกจากระบบได้");
      console.error("Logout error:", error);
    }
  };

  const confirmLogout = () => {
    Alert.alert("ยืนยันการออกจากระบบ", "คุณต้องการออกจากระบบใช่หรือไม่?", [
      {
        text: "ยกเลิก",
        style: "cancel",
      },
      {
        text: "ออกจากระบบ",
        style: "destructive",
        onPress: handleLogout,
      },
    ]);
  };

  const navigateToProfile = () => {
    navigation.navigate("ProfileScreen");
  };

  const navigateToDocumentsHistoryScreen = () => {
    navigation.navigate("DocumentsHistoryScreen");
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ตั้งค่า</Text>

      {/* Settings Options */}
      <View style={styles.settingsContainer}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={navigateToProfile}
        >
          <Text style={styles.settingText}>ข้อมูลส่วนตัว</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Add more settings options here */}
      </View>

      {/* Settings Options */}
      <View style={styles.settingsContainer}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={navigateToDocumentsHistoryScreen}
        >
          <Text style={styles.settingText}>ประวัติเอกสาร</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Add more settings options here */}
      </View>

      <View style={styles.logoutContainer}>
        <Button title="ออกจากระบบ" onPress={confirmLogout} color="#ff4444" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f2f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  settingsContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  arrow: {
    fontSize: 20,
    color: "#ccc",
    fontWeight: "bold",
  },
  logoutContainer: {
    marginTop: "auto",
    marginBottom: 50,
  },
});

export default SettingsScreen;
