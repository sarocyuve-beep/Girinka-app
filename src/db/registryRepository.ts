import { Beneficiary } from '../types/registry';

export const cyuveBeneficiaries: Beneficiary[] = [
  {
    id: 'b-001',
    fullName: 'Mugisha Jean',
    nationalId: '1198471234567890',
    sector: 'Cyuve',
    cell: 'Ruhanga',
    village: 'Kigarama',
    phone: '+250788000001',
    cattleReceived: 1,
    distributionHistory: [
      { year: 2024, source: 'District program', status: 'Received', notes: 'Approved and received one cow' },
    ],
  },
  {
    id: 'b-002',
    fullName: 'Uwase Aline',
    nationalId: '1198471234567891',
    sector: 'Cyuve',
    cell: 'Nyabubare',
    village: 'Muvumba',
    phone: '+250788000002',
    cattleReceived: 2,
    distributionHistory: [
      { year: 2023, source: 'Sector office', status: 'Received', notes: 'Two cows distributed' },
      { year: 2025, source: 'District program', status: 'Pending', notes: 'Awaiting approval' },
    ],
  },
  {
    id: 'b-003',
    fullName: 'Niyonsaba Ernest',
    nationalId: '1198471234567892',
    sector: 'Cyuve',
    cell: 'Muko',
    village: 'Tetero',
    phone: '+250788000003',
    cattleReceived: 1,
    distributionHistory: [
      { year: 2024, source: 'Guarded by sector', status: 'Returned', notes: 'Cow returned for breeding review' },
    ],
  },
];

export const beneficiaries: Beneficiary[] = [...cyuveBeneficiaries];

export function importCyuveBeneficiariesIfNeeded() {
  if (beneficiaries.length === 0) {
    beneficiaries.push(...cyuveBeneficiaries);
  }

  return beneficiaries;
}

export function searchBeneficiaries(query: string) {
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) {
    return beneficiaries;
  }

  return beneficiaries.filter((beneficiary) =>
    beneficiary.fullName.toLowerCase().includes(cleanQuery) ||
      beneficiary.sector.toLowerCase().includes(cleanQuery) ||
      beneficiary.village.toLowerCase().includes(cleanQuery) ||
      beneficiary.nationalId.includes(cleanQuery)
  );
}
