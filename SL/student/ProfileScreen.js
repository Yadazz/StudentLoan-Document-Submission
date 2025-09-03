import { useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, ActivityIndicator, ScrollView, 
  TouchableOpacity, Alert, Modal, TextInput, Pressable 
} from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../database/firebase";

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigation.navigate("LoginScreen");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        Alert.alert("Error", "Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigation]);

  const openEditModal = (section, field, currentValue) => {
    setEditingSection(section);
    setEditingField(field);
    setNewValue(currentValue || "");
    setModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editingField) return;
    try {
      const user = auth.currentUser;
      const userRef = doc(db, "users", user.uid);

      let updateData = {};
      if (editingSection) {
        updateData[`${editingSection}.${editingField}`] = newValue;
      } else {
        updateData[editingField] = newValue;
      }

      await updateDoc(userRef, updateData);

      setUserData(prev => {
        if (editingSection) {
          return {
            ...prev,
            [editingSection]: {
              ...prev[editingSection],
              [editingField]: newValue
            }
          };
        }
        return {
          ...prev,
          [editingField]: newValue
        };
      });

      Alert.alert("สำเร็จ", "อัพเดทข้อมูลเรียบร้อยแล้ว");
    } catch (error) {
      Alert.alert("Error", "Failed to update data");
    } finally {
      setModalVisible(false);
    }
  };

  const renderField = (label, value, section = null, field = null) => (
    <TouchableOpacity 
      style={styles.fieldContainer}
      onPress={() => openEditModal(section, field || label, value)}
    >
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "-"}</Text>
    </TouchableOpacity>
  );

  const renderAddress = (address, sectionPath, label) => {
    if (!address) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{label}</Text>
        {renderField("บ้านเลขที่", address.house_no, sectionPath, "house_no")}
        {renderField("หมู่", address.moo, sectionPath, "moo")}
        {renderField("หมู่บ้าน", address.village, sectionPath, "village")}
        {renderField("ซอย", address.soi, sectionPath, "soi")}
        {renderField("ถนน", address.road, sectionPath, "road")}
        {renderField("ตำบล/แขวง", address.sub_district, sectionPath, "sub_district")}
        {renderField("อำเภอ/เขต", address.district, sectionPath, "district")}
        {renderField("จังหวัด", address.province, sectionPath, "province")}
        {renderField("รหัสไปรษณีย์", address.zipcode, sectionPath, "zipcode")}
      </View>
    );
  };

  const renderParentInfo = (info, title) => {
    if (!info) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {renderField("ชื่อ-นามสกุล", info.name, title, "name")}
        {renderField("เลขบัตรประชาชน", info.citizen_id, title, "citizen_id")}
        {renderField("เบอร์โทรศัพท์", info.phone_number, title, "phone_number")}
        {renderField("ระดับการศึกษา", info.education_level, title, "education_level")}
        {info.email && renderField("อีเมล", info.email, title, "email")}
        {renderAddress(info.address_current, `${title}.address_current`, "ข้อมูลที่อยู่")}
      </View>
    );
  };

  // render survey section
  const renderSurvey = (survey) => {
    if (!survey) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ข้อมูลแบบสอบถาม</Text>
        {renderField("สถานภาพครอบครัว", survey.familyStatus, "survey", "familyStatus")}
        {renderField("รายได้บิดา", survey.fatherIncome, "survey", "fatherIncome")}
        {renderField("รายได้มารดา", survey.motherIncome, "survey", "motherIncome")}
        {renderField("รายได้ผู้ปกครอง", survey.guardianIncome, "survey", "guardianIncome")}
        {renderField("สถานะทางกฎหมาย", survey.legalStatus, "survey", "legalStatus")}
        {renderField("ผู้ที่อาศัยอยู่ด้วย", survey.livingWith, "survey", "livingWith")}
        {renderField("เอกสารทางกฎหมายของบิดามารดา", survey.parentLegalStatus, "survey", "parentLegalStatus")}
        <Text style={styles.timestamp}>
          อัปเดตล่าสุด: {survey.timestamp ? survey.timestamp.toString() : "-"}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.containerCenter}>
        <Text>ไม่พบข้อมูลผู้ใช้</Text>
      </View>
    );
  }

  return (
    <View style={{flex:1}}>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลส่วนตัว</Text>
          {renderField("ชื่อ-นามสกุล", userData.name, null, "name")}
          {renderField("ชื่อเล่น", userData.nickname, null, "nickname")}
          {renderField("รหัสนักศึกษา", userData.student_id, null, "student_id")}
          {renderField("เลขบัตรประชาชน", userData.citizen_id, null, "citizen_id")}
          {renderField("เบอร์โทรศัพท์", userData.phone_num, null, "phone_num")}
          {renderField("อีเมล", userData.email, null, "email")}
          {renderField("สำนักวิชา", userData.school, null, "school")}
          {renderField("สาขาวิชา", userData.major, null, "major")}
          {renderField("จำนวนพี่น้อง", userData.siblings_count, null, "siblings_count")}
        </View>

        {renderAddress(userData.address_current, "address_current", "ที่อยู่ปัจจุบัน")}
        {renderAddress(userData.address_perm, "address_perm", "ที่อยู่ตามทะเบียนบ้าน")}
        {renderParentInfo(userData.father_info, "father_info")}
        {renderParentInfo(userData.mother_info, "mother_info")}
        {renderParentInfo(userData.guardian_info, "guardian_info")}

        {/* survey section */}
        {renderSurvey(userData.survey)}
      </ScrollView>

      {/* Modal สำหรับแก้ไข */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>แก้ไข {editingField}</Text>
            <TextInput
              value={newValue}
              onChangeText={setNewValue}
              style={styles.input}
              placeholder="กรอกข้อมูลใหม่"
              placeholderTextColor="#aaa"
            />
            <View style={styles.modalButtons}>
              <Pressable style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>ยกเลิก</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.saveButton]} onPress={saveEdit}>
                <Text style={styles.buttonText}>บันทึก</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  containerCenter: {
    flex: 1,
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"#F9FAFB"
  },
  section: {
    backgroundColor: "white",
    margin: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1E3A8A",
  },
  fieldContainer: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  fieldLabel: {
    flex: 1,
    fontWeight: "600",
    color: "#374151",
  },
  fieldValue: {
    flex: 2,
    color: "#111827",
    textAlign: "right",
  },
  modalBackground: {
    flex:1,
    backgroundColor:"rgba(0,0,0,0.5)",
    justifyContent:"center",
    alignItems:"center"
  },
  modalContainer: {
    width:"85%",
    backgroundColor:"white",
    padding:20,
    borderRadius:12,
    shadowColor:"#000",
    shadowOpacity:0.2,
    shadowRadius:6,
    elevation:5
  },
  modalTitle: {
    fontSize:18,
    fontWeight:"bold",
    marginBottom:15,
    color:"#1E3A8A"
  },
  input: {
    borderWidth:1,
    borderColor:"#D1D5DB",
    padding:12,
    marginBottom:20,
    borderRadius:8,
    fontSize:16,
    color:"#111827"
  },
  modalButtons: {
    flexDirection:"row",
    justifyContent:"flex-end",
    gap:10
  },
  button: {
    paddingVertical:10,
    paddingHorizontal:18,
    borderRadius:8
  },
  cancelButton: {
    backgroundColor:"#9CA3AF",
  },
  saveButton: {
    backgroundColor:"#3B82F6",
  },
  buttonText: {
    color:"white",
    fontWeight:"bold"
  },
  timestamp: {
    marginTop: 10,
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  }
});

export default ProfileScreen;
