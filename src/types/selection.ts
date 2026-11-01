export interface Candidate {
  id: string;
  fullName: string;
  village: string;
  sector: string;
  score: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  eligibility: {
    hasLand: boolean;
    hasHousehold: boolean;
    priorityFamily: boolean;
    noCattle: boolean;
    verified: boolean;
  };
}

export interface SelectionCampaign {
  id: string;
  name: string;
  sector: string;
  openDate: string;
  closeDate: string;
  status: 'Open' | 'Closed';
  candidates: Candidate[];
}
