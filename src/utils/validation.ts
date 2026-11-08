/**
 * Rwandan Validation Rules
 */

/**
 * Validates Rwandan National ID (16 digits)
 */
export const validateNationalId = (id: string): boolean => {
  return /^\d{16}$/.test(id);
};

/**
 * Validates Rwandan Phone Number (10 digits, usually starting with 07)
 */
export const validatePhone = (phone: string): boolean => {
  return /^(07[2389])\d{7}$/.test(phone);
};

export const ID_ERROR_MESSAGE = "Indangamuntu igomba kuba ikizwi (imibare 16).";
export const PHONE_ERROR_MESSAGE = "Telefone igomba kuba imibare 10 (urugero: 078...)";
