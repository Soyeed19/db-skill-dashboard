import React from 'react';
import {
  ModeBCandidateRegistrationDesk,
} from './ModeBCandidateRegistrationDesk';

export interface ExtractedDocumentData {
  // Aadhaar Fields
  fullName?: string;
  name?: string;
  fatherName?: string;
  dob?: string;          // YYYY-MM-DD
  gender?: 'Male' | 'Female' | 'Other';
  aadhaarNumber?: string;
  address?: string;
  pinCode?: string;
  city?: string;
  state?: string;

  // Driving Licence Fields
  dlNumber?: string;
  dlExpiryDate?: string; // YYYY-MM-DD
  expiryDate?: string;
  isDlExpired?: boolean;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  vehicleClass?: 'LMV-TR' | 'TRANS' | 'HMV' | 'HGMV' | '3W-CAB';
  warning?: string;
  rawText?: string;
}

export const applyExtractedDataToForm = (
  extracted: ExtractedDocumentData,
  setFormData: React.Dispatch<React.SetStateAction<any>>,
  setDlWarning: (msg: string) => void
) => {
  const expiry = extracted.dlExpiryDate || extracted.expiryDate;

  // STRICT OCR EXTRACTION SCOPE:
  // Aadhaar: ONLY the 12-digit Aadhaar number
  // DL: ONLY the DL number and DL expiry date
  // Do NOT attempt to auto-fill candidate name, father name, or address from OCR
  setFormData((prev: any) => ({
    ...prev,
    ...(extracted.aadhaarNumber && { aadhaarNumber: extracted.aadhaarNumber }),
    ...(extracted.dlNumber && { dlNumber: extracted.dlNumber }),
    ...(expiry && { dlExpiryDate: expiry })
  }));

  if (extracted.warning) {
    setDlWarning(extracted.warning);
  } else if (extracted.isDlExpired === true || extracted.isExpired === true) {
    setDlWarning(`Driving Licence is EXPIRED (${expiry}). Candidate cannot be scheduled for active batch dispatch.`);
  } else {
    setDlWarning('');
  }
};

export {
  ModeBCandidateRegistrationDesk,
  ModeBCandidateRegistrationDesk as CandidateRegistrationDesk,
  ModeBCandidateRegistrationDesk as default
};
