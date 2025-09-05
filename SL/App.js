import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./database/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, onSnapshot } from "firebase/firestore";

// Import all screens
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
import DocumentStatusScreen from "./student/DocumentStatusScreen";
import DocCooldown from "./student/components/DocCooldown";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Loading Screen Component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>กำลังตรวจสอบการเข้าสู่ระบบ...</Text>
  </View>
);

// Create Stack Navigator for each Tab
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="NewsContent" component={NewsContent} />
  </Stack.Navigator>
);

const UploadStack = () => {
  const [isEnabled, setIsEnabled] = useState(null);

  useEffect(() => {
    // Listen for changes in Firestore
    const docRef = doc(db, "DocumentService", "config");

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const config = docSnap.data();
        // Check immediateAccess and isEnabled values
        setIsEnabled(config.immediateAccess || config.isEnabled);
      } else {
        setIsEnabled(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Show loading screen while fetching data
  if (isEnabled === null) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="UploadMain"
        component={isEnabled ? UploadScreen : DocCooldown}
      />
    </Stack.Navigator>
  );
};

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
    // onAuthStateChanged runs when the login status changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(
        "Auth state changed:",
        user ? "User logged in" : "User logged out"
      );
      if (user) {
        // If user is logged in
        setIsAuthenticated(true);
      } else {
        // If user is logged out
        setIsAuthenticated(false);
      }
      setIsLoading(false); // Check is complete
    });

    // Return the unsubscribe function to clean up when the component unmounts
    return () => unsubscribe();
  }, []); // [] makes useEffect run only once on component mount

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
          <Stack.Screen
            name="Document Reccommend"
            component={DocRecScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="ProfileScreen"
            component={ProfileScreen}
            options={{ title: "โปรไฟล์", headerShown: true }}
          />
          {/* Add DocumentStatusScreen */}
          <Stack.Screen
            name="DocumentStatusScreen"
            component={DocumentStatusScreen}
            options={{
              title: "สถานะเอกสาร",
              headerShown: true,
              headerStyle: {
                backgroundColor: "#2563eb",
              },
              headerTintColor: "#ffffff",
              headerTitleStyle: {
                fontWeight: "bold",
              },
            }}
          />
          {/* Add DocCooldown screen */}
          <Stack.Screen
            name="DocCooldown"
            component={DocCooldown}
            options={{
              headerShown: true,
              title: "สถานะระบบ",
              headerLeft: null, // Prevent going back
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});

export default App;
