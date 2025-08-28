import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../database/firebase';

const SettingsScreen = ({ navigation }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้');
      console.error('Logout error:', error);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'ยืนยันการออกจากระบบ',
      'คุณต้องการออกจากระบบใช่หรือไม่?',
      [
        {
          text: 'ยกเลิก',
          style: 'cancel',
        },
        {
          text: 'ออกจากระบบ',
          style: 'destructive',
          onPress: handleLogout,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ตั้งค่า</Text>

      {/* Add more settings options here */}

      <View style={styles.logoutContainer}>
        <Button
          title="ออกจากระบบ"
          onPress={confirmLogout}
          color="#ff4444"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  logoutContainer: {
    marginTop: 'auto',
    marginBottom: 50,
  },
});

export default SettingsScreen;
