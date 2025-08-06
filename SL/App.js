import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from "@expo/vector-icons";

// นำเข้าคอมโพเนนต์หน้าต่างๆ ที่เราสร้างไว้
import HomeScreen from "./student/HomeScreen";
import UploadScreen from "./student/UploadScreen";
import SettingsScreen from "./student/SettingScreen";
import DocRecScreen from "./student/DocRecScreen";

// สร้าง Tab Navigator
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      {/* ใช้ Stack Navigator เป็นคอนเทนเนอร์หลัก */}
      <Stack.Navigator>
        {/* หน้าหลักและหน้าส่งเอกสารใน Tab Navigator */}
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        {/* หน้าสำหรับทำแบบสอบถาม */}
        <Stack.Screen name="Document Reccomment" component={DocRecScreen} options={{ headerShown: true}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false, // ซ่อน Header bar ด้านบนของแต่ละหน้า
      tabBarActiveTintColor: "#007AFF", // สีของไอคอนและข้อความเมื่อ Tab ถูกเลือก
      tabBarInactiveTintColor: "gray", // สีเมื่อ Tab ไม่ถูกเลือก
      tabBarStyle: {
        paddingVertical: 5, // เพิ่ม padding แนวตั้ง
        height: 60, // กำหนดความสูงของ Tab bar
      },
      tabBarLabelStyle: {
        fontSize: 12, // ขนาดตัวอักษรของ Label
        marginBottom: 5, // ระยะห่างจากไอคอน
      },
      tabBarIcon: ({ color, size }) => {
        let iconName;

        if (route.name === "หน้าหลัก") {
          iconName = "home-outline"; // ไอคอนสำหรับหน้าหลัก
        } else if (route.name === "ส่งเอกสาร") {
          iconName = "document-text-outline"; // ไอคอนสำหรับหน้าส่งเอกสาร
        } else if (route.name === "ตั้งค่า") {
          iconName = "settings-outline"; // ไอคอนสำหรับหน้าตั้งค่า
        }

        // คืนค่าคอมโพเนนต์ไอคอน
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="หน้าหลัก"
      component={HomeScreen}
      options={{
        title: "หน้าหลัก", // ชื่อที่จะแสดงบน Tab bar
      }}
    />
    <Tab.Screen
      name="ส่งเอกสาร"
      component={UploadScreen}
      options={{
        title: "ส่งเอกสาร",
      }}
    />
    <Tab.Screen
      name="ตั้งค่า"
      component={SettingsScreen}
      options={{
        title: "ตั้งค่า",
      }}
    />
  </Tab.Navigator>
);

export default App;
