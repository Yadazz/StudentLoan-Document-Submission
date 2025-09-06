import { View, Text, StyleSheet } from 'react-native';

const SummaryCard = ({ surveyData }) => {
  const {
    familyStatus,
    livingWith,
    fatherIncome,
    motherIncome,
    legalStatus,
    guardianIncome,
  } = surveyData;

  const getFamilyStatusLabel = (status) => {
    switch (status) {
      case 'ก': return 'บิดามารดาอยู่ด้วยกัน';
      case 'ข': return 'บิดาหรือมารดาหย่าร้าง หรือเสียชีวิต หรือไม่สามารถติดต่อได้';
      case 'ค': return 'มีผู้ปกครอง ที่ไม่ใช่บิดามารดาดูแล';
      default: return '';
    }
  };

  const getIncomeLabel = (income) => income === 'มีรายได้ประจำ' ? 'มีรายได้ประจำ' : 'มีรายได้ไม่ประจำ';
  const getDocumentLabel = (status) => status === 'มีเอกสาร' ? 'มีเอกสาร' : 'ไม่มีเอกสาร';

  const SummaryItem = ({ label, value }) => (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}:</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  return (
    <View>
      <Text style={styles.question}>สรุปผลแบบสอบถาม</Text>
      <View style={styles.summaryCard}>
        <SummaryItem 
          label="สถานภาพครอบครัว" 
          value={getFamilyStatusLabel(familyStatus)} 
        />

        {/* กรณี ก: บิดามารดาอยู่ด้วยกัน */}
        {familyStatus === 'ก' && (
          <>
            <SummaryItem 
              label="รายได้บิดา" 
              value={getIncomeLabel(fatherIncome)} 
            />
            <SummaryItem 
              label="รายได้มารดา" 
              value={getIncomeLabel(motherIncome)} 
            />
          </>
        )}

        {/* กรณี ข: บิดาหรือมารดาหย่าร้าง/เสียชีวิต */}
        {familyStatus === 'ข' && (
          <>
            <SummaryItem 
              label="อาศัยอยู่กับ" 
              value={livingWith} 
            />
            <SummaryItem 
              label="เอกสารทางกฎหมาย" 
              value={getDocumentLabel(legalStatus)} 
            />
            <SummaryItem 
              label={`รายได้${livingWith}`}
              value={getIncomeLabel(livingWith === 'บิดา' ? fatherIncome : motherIncome)} 
            />
          </>
        )}

        {/* กรณี ค: มีผู้ปกครอง */}
        {familyStatus === 'ค' && (
          <>
            <SummaryItem 
              label="รายได้ผู้ปกครอง" 
              value={getIncomeLabel(guardianIncome)} 
            />
            <SummaryItem 
              label="เอกสารทางกฎหมาย" 
              value={getDocumentLabel(legalStatus)} 
            />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryLabel: {
    fontWeight: 'bold',
    color: '#1e293b',
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    color: '#374151',
    flexShrink: 1,
    textAlign: 'right',
  },
});

export default SummaryCard;
