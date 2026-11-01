export type AnimalStatus =
  | 'Healthy'
  | 'Sick'
  | 'Pregnant'
  | 'InRecovery'
  | 'Transferred';

export type AnimalRecord = {
  id: string;
  beneficiaryId: string;
  tagNumber: string;
  breed: string;
  birthDate: string;
  status: AnimalStatus;
  healthNotes?: string;
  createdAt: string;
};
