export type CandidateStatus = 'Pending' | 'Approved' | 'Rejected';

export type Candidate = {
  id: string;
  fullName: string;
  nationalId: string;
  sector: string;
  cell: string;
  village: string;
  phone?: string;
  status: CandidateStatus;
  eligibility: Record<string, boolean>;
};

export type SelectionCampaign = {
  id: string;
  name: string;
  sector: string;
  openDate: string;
  closeDate: string;
  status: 'Open' | 'Closed';
  candidates: Candidate[];
};
