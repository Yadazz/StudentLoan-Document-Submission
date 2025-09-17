import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react';

const LoanProcessStatusAdmin = () => {
  const [processStatus, setProcessStatus] = useState({
    document_collection: 'pending',
    document_organization: 'pending',
    bank_submission: 'pending',
  });

  const updateStatus = (stepId, status) => {
    setProcessStatus(prevState => ({
      ...prevState,
      [stepId]: status,
    }));
    Alert.alert("สถานะได้รับการอัปเดต", `สถานะของขั้นตอน ${stepId} เป็น ${status}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>สถานะกระบวนการเอกสาร</Text>

      <View style={styles.statusCard}>
        <Text style={styles.stepTitle}>รวบรวมเอกสาร</Text>
        <Text>สถานะปัจจุบัน: {processStatus.document_collection}</Text>
        <View style={styles.buttonContainer}>
          <Button 
            title="กำหนดสถานะ: กำลังดำเนินการ"
            onPress={() => updateStatus('document_collection', 'in_progress')}
          />
          <Button 
            title="กำหนดสถานะ: เสร็จสิ้น"
            onPress={() => updateStatus('document_collection', 'completed')}
          />
        </View>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.stepTitle}>จัดเรียงเอกสาร</Text>
        <Text>สถานะปัจจุบัน: {processStatus.document_organization}</Text>
        <View style={styles.buttonContainer}>
          <Button 
            title="กำหนดสถานะ: กำลังดำเนินการ"
            onPress={() => updateStatus('document_organization', 'in_progress')}
          />
          <Button 
            title="กำหนดสถานะ: เสร็จสิ้น"
            onPress={() => updateStatus('document_organization', 'completed')}
          />
        </View>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.stepTitle}>ส่งเอกสารไปยังธนาคาร</Text>
        <Text>สถานะปัจจุบัน: {processStatus.bank_submission}</Text>
        <View style={styles.buttonContainer}>
          <Button 
            title="กำหนดสถานะ: กำลังดำเนินการ"
            onPress={() => updateStatus('bank_submission', 'in_progress')}
          />
          <Button 
            title="กำหนดสถานะ: เสร็จสิ้น"
            onPress={() => updateStatus('bank_submission', 'completed')}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default LoanProcessStatusAdmin;
