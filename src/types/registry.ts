export type DistributionStatus = 'Received' | 'Pending' | 'Returned';

export type DistributionHistory = {
  year: number;
  source: string;
  status: DistributionStatus;
  notes?: string;
};

export type Beneficiary = {
  id: string;
  fullName: string;
  nationalId: string;
  sector: string;
  cell: string;
  village: string;
  phone?: string;
  cattleReceived: number;
  photoUrl?: string;
  distributionHistory: DistributionHistory[];
  district?: string;
};
