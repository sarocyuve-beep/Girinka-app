export interface DistributionEntry {
  year: number;
  source: string;
  status: 'Received' | 'Pending' | 'Returned';
  notes?: string;
}

export interface Beneficiary {
  id: string;
  fullName: string;
  nationalId: string;
  sector: string;
  cell: string;
  village: string;
  phone?: string;
  cattleReceived: number;
  distributionHistory: DistributionEntry[];
}
