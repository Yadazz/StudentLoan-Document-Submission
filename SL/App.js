import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

// นำเข้าคอมโพเนนต์หน้าต่างๆ ที่เราสร้างไว้
import HomeScreen from "./student/HomeScreen";
import UploadScreen from "./student/UploadScreen";
import SettingsScreen from "./student/SettingScreen";
import DocRecScreen from "./student/DocRecScreen";
import NewsContent from "./student/NewsContent";
import { SafeAreaProvider } from "react-native-safe-area-context";

// สร้าง Tab Navigator
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Document Reccommend"
            component={DocRecScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="HomeScreen"
            component={HomeScreen}
            options={{ title: "หน้าหลัก" }}
          />
          <Stack.Screen
            name="NewsContent"
            component={NewsContent}
            options={{ title: "รายละเอียดข่าว" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: "#007AFF",
      tabBarInactiveTintColor: "gray",
      tabBarStyle: {
        paddingVertical: 5,
        height: 70, // เพิ่มความสูงเพื่อเว้น gesture bar
      },
      tabBarLabelStyle: {
        fontSize: 12,
        marginBottom: 5,
      },
      tabBarIcon: ({ color, size }) => {
        let iconName;

        if (route.name === "หน้าหลัก") iconName = "home-outline";
        else if (route.name === "ส่งเอกสาร") iconName = "document-text-outline";
        else if (route.name === "ตั้งค่า") iconName = "settings-outline";

        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="หน้าหลัก"
      component={HomeScreen}
      options={{ title: "หน้าหลัก" }}
    />
    <Tab.Screen
      name="ส่งเอกสาร"
      component={UploadScreen}
      options={{ title: "ส่งเอกสาร" }}
    />
    <Tab.Screen
      name="ตั้งค่า"
      component={SettingsScreen}
      options={{ title: "ตั้งค่า" }}
    />
  </Tab.Navigator>
);

export default App;
