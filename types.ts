export interface CaseData {
  id: string;
  regNo: string;
  caseType: string;
  date: string;
  patientName: string;
  patientAge: string;
  referrer: string;
  investigations: string;
  totalFee: number;
  feePaid: number;
  feeDue: number;
  discount: number;
  discountType: string;
  canceled: boolean;
  // Computed / UI fields
  dcAmount: number; 
  remark: string;
}

export type SortField = 'date' | 'patientName' | 'totalFee' | 'referrer';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  search: string;
  startDate: string;
  endDate: string;
  referrer: string;
}