export type UploadedDocument = {
  id: string;
  beneficiaryId: string;
  name: string;
  type: 'ID' | 'Certificate' | 'CattleProof' | 'Other';
  url: string;
  uploadedAt: string;
};
