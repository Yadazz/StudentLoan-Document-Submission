import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./database/firebase";
import AsyncStorage from '@react-native-async-storage/async-storage';

// นำเข้าคอมโพเนนต์หน้าต่างๆ ที่เราสร้างไว้
import HomeScreen from "./student/HomeScreen";
import UploadScreen from "./student/UploadScreen";
import SettingsScreen from "./student/SettingScreen";
import DocRecScreen from "./student/DocRecScreen";
import NewsContent from "./student/NewsContent";
import ProfileScreen from "./student/ProfileScreen";
import LoginScreen from "./LoginScreen";
import SignUpScreen from "./SignUpScreen";
import InsertForm from "./student/InsertForm";
import OCR from "./model/EasyOcr/OCR";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Loading Screen Component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>กำลังตรวจสอบการเข้าสู่ระบบ...</Text>
  </View>
);

// สร้าง Stack Navigator สำหรับแต่ละ Tab
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="NewsContent" component={NewsContent} />
  </Stack.Navigator>
);

const UploadStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="UploadMain" component={UploadScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: "#007AFF",
      tabBarInactiveTintColor: "gray",
      tabBarStyle: { paddingVertical: 5, height: 70 },
      tabBarLabelStyle: { fontSize: 12, marginBottom: 5 },
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === "หน้าหลัก") iconName = "home-outline";
        else if (route.name === "ส่งเอกสาร") iconName = "document-text-outline";
        else if (route.name === "ตั้งค่า") iconName = "settings-outline";
        else if (route.name === "กรอกเอกสาร") iconName = "create-outline";
        else if (route.name === "OCR") iconName = "eye-outline";
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="หน้าหลัก" component={HomeStack} />
    <Tab.Screen name="ส่งเอกสาร" component={UploadStack} />
    <Tab.Screen name="ตั้งค่า" component={SettingsScreen} />
    <Tab.Screen name="กรอกเอกสาร" component={InsertForm} />
    <Tab.Screen name="OCR" component={OCR} />
  </Tab.Navigator>
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged จะทำงานเมื่อสถานะการล็อกอินเปลี่ยนแปลง
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      if (user) {
        // หากผู้ใช้ล็อกอินอยู่
        setIsAuthenticated(true);
      } else {
        // หากผู้ใช้ออกจากระบบ
        setIsAuthenticated(false);
      }
      setIsLoading(false); // เสร็จสิ้นการตรวจสอบ
    });

    // คืนค่าฟังก์ชัน unsubscribe เพื่อยกเลิกการติดตามเมื่อคอมโพเนนต์ถูก unmount
    return () => unsubscribe();
  }, []); // [] ทำให้ useEffect ทำงานแค่ครั้งแรกที่คอมโพเนนต์ถูก mount

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isAuthenticated ? "MainTabs" : "LoginScreen"}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Document Reccommend" component={DocRecScreen} options={{ headerShown: true }} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: "โปรไฟล์", headerShown: true }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default App;
