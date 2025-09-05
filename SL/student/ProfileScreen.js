import { useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, ActivityIndicator, ScrollView, 
  TouchableOpacity, Alert, TextInput 
} from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../database/firebase";

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // inline edit state
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

  const saveEdit = async () => {
    if (!editingField) return;
    try {
      const user = auth.currentUser;
      const userRef = doc(db, "users", user.uid);

      let updateData = {};
      updateData[editingField] = newValue;

      await updateDoc(userRef, updateData);

      setUserData(prev => {
        const updated = { ...prev };
        const keys = editingField.split(".");
        let obj = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = newValue;
        return updated;
      });
    } catch (error) {
      Alert.alert("Error", "Failed to update data");
    } finally {
      setEditingField(null);
      setEditingSection(null);
    }
  };

  const renderField = (label, value, section = null, field = null) => {
    const fieldKey = section ? `${section}.${field || label}` : field || label;
    const isEditing = editingField === fieldKey;

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {isEditing ? (
          <TextInput
            value={newValue}
            onChangeText={setNewValue}
            style={styles.inputInline}
            autoFocus
            onBlur={saveEdit} 
            returnKeyType="done"
            onSubmitEditing={saveEdit}
          />
        ) : (
          <TouchableOpacity
            style={{ flex: 2 }}
            onPress={() => {
              setEditingSection(section);
              setEditingField(fieldKey);
              setNewValue(value || "");
            }}
          >
            <Text style={styles.fieldValue}>{value || "-"}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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

        {renderSurvey(userData.survey)}
      </ScrollView>
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
  inputInline: {
    borderBottomWidth: 1,
    borderColor: "#3B82F6",
    paddingVertical: 4,
    fontSize: 16,
    color: "#111827",
    flex: 2,
    textAlign: "right"
  },
  timestamp: {
    marginTop: 10,
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  }
});

export default ProfileScreen;
