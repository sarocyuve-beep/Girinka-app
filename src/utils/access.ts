import type { UserProfile } from '../types/user';

export function canReadBeneficiary(profile: UserProfile | null, beneficiary: {
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
}) {
  if (!profile || !beneficiary) return false;

  switch (profile.role) {
    case 'DISTRICT_ADMIN':
      return true;

    case 'SECTOR':
      return profile.district === beneficiary.district && profile.sector === beneficiary.sector;

    case 'CELL':
      return (
        profile.district === beneficiary.district &&
        profile.sector === beneficiary.sector &&
        profile.cell === beneficiary.cell
      );

    case 'VILLAGE':
      return (
        profile.district === beneficiary.district &&
        profile.sector === beneficiary.sector &&
        profile.cell === beneficiary.cell &&
        profile.village === beneficiary.village
      );

    case 'FIELD_OFFICER':
      return (
        profile.district === beneficiary.district &&
        profile.sector === beneficiary.sector
      );

    case 'VIEWER':
      return (
        profile.district === beneficiary.district &&
        profile.sector === beneficiary.sector &&
        profile.cell === beneficiary.cell
      );

    default:
      return false;
  }
}

export function canWriteBeneficiary(profile: UserProfile | null, beneficiary: {
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
}) {
  if (!profile) return false;

  switch (profile.role) {
    case 'DISTRICT_ADMIN':
      return true;

    case 'SECTOR':
      return profile.district === beneficiary.district && profile.sector === beneficiary.sector;

    case 'CELL':
      return (
        profile.district === beneficiary.district &&
        profile.sector === beneficiary.sector &&
        profile.cell === beneficiary.cell
      );

    case 'VILLAGE':
      return (
        profile.district === beneficiary.district &&
        profile.sector === beneficiary.sector &&
        profile.cell === beneficiary.cell &&
        profile.village === beneficiary.village
      );

    case 'FIELD_OFFICER':
      return (
        profile.district === beneficiary.district &&
        profile.sector === beneficiary.sector
      );

    default:
      return false;
  }
}
