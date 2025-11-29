import { CaseData } from './types';
import { RAW_DATA_TSV } from './constants';

const getDcPercentage = (referrer: string): number => {
  // Default rate is 30% based on data analysis
  // Can be customized per doctor if needed
  return 0.3; 
};

export const parseData = (): CaseData[] => {
  const lines = RAW_DATA_TSV.trim().split('\n');
  // Skip header
  const dataRows = lines.slice(1);

  return dataRows.map(line => {
    const columns = line.split('\t');
    
    if (columns.length < 5) return null;

    // Indices based on the provided dataset structure:
    // 0: Id, 1: RegNo, 2: UHID, 3: DailyCaseNo, 4: CaseType, 5: Date, 
    // 6: Patient, 7: Age, 8: Mobile, 9: Address, 10: Referrer, 
    // 11: Investigations, 12: Center, 13: Total, 14: Paid, 15: Due, 
    // 16: Discount, 17: DiscType, 18: Agent, 19: Canceled

    const id = columns[0];
    const regNo = columns[1];
    const caseType = columns[4];
    let date = columns[5]; // e.g., 10/1/2025
    
    // Normalize date to DD MM YYYY if possible for display
    try {
      const parts = date.split('/');
      if (parts.length === 3) {
        // Assuming Input is M/D/YYYY based on 10/1/2025 = Oct 1st
        // Output format in screenshot is 24 10 2025 (DD MM YYYY)
        // So: Month=parts[0], Day=parts[1], Year=parts[2]
        date = `${parts[1].padStart(2, '0')} ${parts[0].padStart(2, '0')} ${parts[2]}`;
      }
    } catch (e) {
      // keep original if parse fails
    }

    const patientName = columns[6]?.trim();
    const patientAge = columns[7]?.trim();
    const referrer = columns[10]?.trim() || "Unknown";
    const investigations = columns[11]?.trim();
    const totalFee = parseFloat(columns[13]) || 0;
    const feePaid = parseFloat(columns[14]) || 0;
    const feeDue = parseFloat(columns[15]) || 0;
    const discount = parseFloat(columns[16]) || 0;
    const discountType = columns[17]?.trim();
    const canceled = columns[19]?.trim().toUpperCase() === 'TRUE';

    const dcRate = getDcPercentage(referrer);
    
    // DC Calculation Logic: (Gross * 30%) - Discount
    // If result is negative, clamp to 0.
    let dcAmount = Math.round((totalFee * dcRate) - discount);
    if (dcAmount < 0) dcAmount = 0;

    // Remark Logic
    let remark = "C/O nan";
    if (discount > 0) {
      // If discount exists, usually "LESS BY DR" or similar
      // Or if discount type is present, use that
      // Screenshot shows "LESS BY DR" for some, "C/O nan" for others.
      // We'll default to "LESS BY DR" if discount > 0 for visual consistency with common practices
      // unless discountType overrides
       remark = "LESS BY DR";
    }

    return {
      id,
      regNo,
      caseType,
      date,
      patientName: `${patientName} ${patientAge}`,
      patientAge,
      referrer,
      investigations,
      totalFee,
      feePaid,
      feeDue,
      discount,
      discountType,
      canceled,
      dcAmount,
      remark
    };
  }).filter((item): item is CaseData => item !== null);
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'decimal', // Just number for table cells mostly, but allow currency symbol elsewhere
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string) => {
    return dateString;
};