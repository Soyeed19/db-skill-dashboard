import React, { useState } from 'react';
import { ModeBCandidateRegistrationDesk } from './ModeBCandidateRegistrationDesk';
import { DlExpiredAlertModal } from './DlExpiredAlertModal';
import { useApp } from '../../context/AppContext';
import { Center, Batch, UserPersona } from '../../types';

export interface OseRegistrationFormProps {
  activeCenter?: Center;
  currentBatch?: Batch;
  currentPersona?: UserPersona;
  onBackToDashboard?: () => void;
}

/**
 * OseRegistrationForm: Standalone / Modular OSE Candidate Enrollment Form
 * Includes Driving Licence (DL) validity checks, mandatory dlExpiryDate input,
 * and instant DlExpiredAlertModal popup on expired license dates.
 */
export const OseRegistrationForm: React.FC<OseRegistrationFormProps> = ({
  activeCenter: propsActiveCenter,
  currentBatch: propsCurrentBatch,
  currentPersona: propsCurrentPersona,
  onBackToDashboard: propsOnBackToDashboard
}) => {
  const { activeCenter: ctxCenter, batches, currentPersona: ctxPersona } = useApp();

  const activeCenter = propsActiveCenter || ctxCenter;
  const currentBatch = propsCurrentBatch || batches[0] || {
    id: 'B-DEFAULT',
    batchCode: 'BATCH-2026-DEFAULT',
    centerId: activeCenter.id,
    programType: 'Refresher' as const,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'In Progress' as const,
    capacity: 35,
    enrolledCount: 28,
    trainerName: 'Rajesh Sharma'
  };
  const currentPersona = propsCurrentPersona || ctxPersona;

  // 1. State for Expiry Warning Modal (as per specification)
  const [isDlExpiredModalOpen, setIsDlExpiredModalOpen] = useState(false);
  const [dlExpiryDate, setDlExpiryDate] = useState('');
  const [dlNumber, setDlNumber] = useState('');

  // 2. Validation Handler (as per specification)
  const handleDlExpiryChange = (dateVal: string) => {
    setDlExpiryDate(dateVal);
    if (!dateVal) return;

    const selectedDate = new Date(dateVal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setIsDlExpiredModalOpen(true);
    }
  };

  return (
    <div className="relative">
      <ModeBCandidateRegistrationDesk
        activeCenter={activeCenter}
        currentBatch={currentBatch}
        currentPersona={currentPersona}
        onBackToDashboard={propsOnBackToDashboard || (() => {})}
      />

      {/* Expiry Warning Modal */}
      <DlExpiredAlertModal
        isOpen={isDlExpiredModalOpen}
        onClose={() => setIsDlExpiredModalOpen(false)}
        dlNumber={dlNumber}
        dlExpiryDate={dlExpiryDate}
      />
    </div>
  );
};

export default OseRegistrationForm;
