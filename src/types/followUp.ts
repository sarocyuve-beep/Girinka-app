export type FollowUpType = 'Health' | 'Breeding' | 'Production' | 'Vaccination' | 'Inspection';

export type FollowUpRecord = {
  id: string;
  beneficiaryId: string;
  type: FollowUpType;
  date: string;
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Pending';
};
