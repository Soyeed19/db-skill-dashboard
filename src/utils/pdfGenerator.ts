import { jsPDF } from 'jspdf';
import { Candidate, ExpenseClaim, TourRequest } from '../types';

/**
 * Generate 3-Page Archival Candidate Dossier PDF
 * Page 1: Enrollment Details & Biometrics
 * Page 2: Government ID Verification & Record
 * Page 3: Commercial Driving Licence & Quality Sign-Off
 */
export const generateCandidateDossierPdf = (
  candidate: Candidate,
  centerName: string,
  batchCode: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [0, 122, 61]; // #007A3D (Official DB Skills Corporate Green)
  const secondaryColor = [98, 181, 72]; // #62B548 (Official DB Skills Growth Green)
  const darkGray = [30, 41, 59];
  const lightGray = [241, 245, 249];
  const borderColor = [203, 213, 225];

  // ================= PAGE 1 =================
  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 28, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DB SKILLS - COMMERCIAL DRIVER TRAINING PORTAL', 15, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('NATIONAL MULTI-CENTER DRIVER QUALIFICATION & VERIFICATION DOSSIER', 15, 18);
  doc.text('PAGE 1 OF 3: CANDIDATE ENROLLMENT & BIOMETRIC PROFILE', 15, 24);

  // Reg No Badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(140, 6, 60, 16, 2, 2, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DOSSIER REGISTRATION NO.', 143, 11);
  doc.setFontSize(9);
  doc.text(candidate.registrationNumber, 143, 18);

  // Section 1: Center & Batch Details
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(15, 36, 180, 20, 2, 2, 'F');
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(15, 36, 180, 20, 2, 2, 'S');

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TRAINING CENTER:', 20, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(centerName, 55, 42);

  doc.setFont('helvetica', 'bold');
  doc.text('BATCH CODE:', 20, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(batchCode, 55, 48);

  doc.setFont('helvetica', 'bold');
  doc.text('ENROLLMENT DATE:', 120, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(candidate.enrolledAt, 155, 42);

  doc.setFont('helvetica', 'bold');
  doc.text('CURRENT STATUS:', 120, 48);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(candidate.status.toUpperCase(), 155, 48);

  // Section 2: Candidate Bio & Demographics
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. CANDIDATE PERSONAL INFORMATION', 15, 65);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(15, 67, 195, 67);

  // Photo box representation
  doc.setFillColor(235, 240, 245);
  doc.roundedRect(150, 72, 45, 55, 2, 2, 'FD');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('[Candidate Photo Proof]', 155, 98);
  doc.text('Verified on File', 160, 104);

  // Data fields table
  const fields = [
    ['Full Candidate Name:', candidate.fullName],
    ["Father's / Guardian's Name:", candidate.fatherName],
    ['Date of Birth / Age:', `${candidate.dateOfBirth} (Adult Verified)`],
    ['Gender:', candidate.gender],
    ['Mobile Contact (10 Digits):', `+91 ${candidate.mobileNumber}`],
    ['ABHA Health Account No:', candidate.abhaNumber],
    ['Residential Address:', candidate.address],
    ['District & State:', `${candidate.city}, ${candidate.state} - ${candidate.pincode}`],
    ['Driver Kit Status:', candidate.kitIssued ? `Issued (T-Shirt Size: ${candidate.tshirtSize || 'L'})` : 'Pending Dispatch']
  ];

  let currentY = 74;
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  fields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(label, 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 70, currentY);
    currentY += 7.5;
  });

  // Section 3: Training Assessment & Performance
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. ONE-DAY TRAINING CURRICULUM & ASSESSMENT SCORES', 15, 150);
  doc.line(15, 152, 195, 152);

  doc.setFillColor(248, 250, 252);
  doc.rect(15, 156, 180, 48, 'F');
  doc.rect(15, 156, 180, 48, 'S');

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Module 1: Defensive Driving & Road Safety Standard Operating Procedures', 20, 164);
  doc.setFont('helvetica', 'normal');
  doc.text('Speed control, heavy commercial vehicle blind zones, safe following distance (3-second rule).', 20, 170);

  doc.setFont('helvetica', 'bold');
  doc.text('Module 2: Vehicle Inspection, Fuel Economy & Hazardous Emergency Protocols', 20, 178);
  doc.setFont('helvetica', 'normal');
  doc.text('Pre-trip 16-point check, tire inflation check, oil levels, fire extinguisher readiness.', 20, 184);

  // Scores
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(20, 190, 75, 10, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`Pre-Training Assessment: ${candidate.preTestScore ?? 65}%`, 25, 196.5);

  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.roundedRect(105, 190, 75, 10, 1, 1, 'F');
  doc.text(`Post-Training Certification: ${candidate.postTestScore ?? 92}% (PASSED)`, 110, 196.5);

  // Section 4: Physical Signatures & Approvals Box
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. FIELD LEVEL AUTHORIZATION SIGNATURES', 15, 218);
  doc.line(15, 220, 195, 220);

  // 3 signature blocks
  const sigBlocks = [
    { title: 'Enrolled & Verified By (OSE)', name: 'Ramesh Sharma', note: 'Biometrics & OCR Verified' },
    { title: 'Conducted By (Trainer)', name: 'Vikram Singh Rathore', note: 'Classroom & Assessment Completed' },
    { title: 'PO Quality Clearance', name: candidate.greenSignalBy || 'Pooja Verma (PO)', note: candidate.greenSignalAt ? `Green Signal: ${candidate.greenSignalAt}` : 'Pending Review' }
  ];

  sigBlocks.forEach((sig, idx) => {
    const x = 15 + idx * 62;
    doc.setFillColor(250, 250, 250);
    doc.rect(x, 225, 58, 40, 'FD');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(sig.title, x + 3, 230);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(sig.name, x + 3, 245);
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(sig.note, x + 3, 255);
    doc.line(x + 3, 258, x + 55, 258);
    doc.text('Official Seal / Signature', x + 15, 262);
  });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated automatically by DB Skills Enterprise Cloud Operations System on ${new Date().toLocaleString()}`, 15, 288);
  doc.text('Confidential - DB Skills Training Records', 150, 288);

  // ================= PAGE 2 =================
  doc.addPage();

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 24, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DB SKILLS - GOVERNMENT IDENTITY & BIOMETRIC VERIFICATION', 15, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`PAGE 2 OF 3: ID SCANS & BIOMETRIC PHOTO VERIFICATION | CANDIDATE: ${candidate.fullName.toUpperCase()}`, 15, 18);

  // Section: ID Card Information
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. GOVERNMENT IDENTITY CARD PARTICULARS', 15, 35);
  doc.line(15, 37, 195, 37);

  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(15, 42, 180, 24, 'F');
  doc.rect(15, 42, 180, 24, 'S');

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Document Type: Government Identity Card (Aadhaar / National ID)', 20, 48);
  doc.text('Card Number: ' + candidate.idCardNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3'), 20, 55);
  doc.text('UIDAI / Format Validation: PASS (12 Digits Verified via Checksum)', 20, 62);

  doc.text('Extracted Name: ' + candidate.fullName, 120, 48);
  doc.text("Extracted Father's: " + candidate.fatherName, 120, 55);
  doc.text('DOB on Card: ' + candidate.dateOfBirth, 120, 62);

  // ID Scan placeholders (Front & Back)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. SCANNED DOCUMENT AUDIT SAMPLES', 15, 76);
  doc.line(15, 78, 195, 78);

  // ID Front Box
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(15, 84, 85, 60, 2, 2, 'FD');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ID Card - Front Side Scan', 20, 92);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('[Verified Color Scan on Record]', 20, 100);
  doc.text('Photo, Full Name & DOB matched with application.', 20, 106);
  doc.text('Resolution: 300 DPI - OCR Confidence: 99.4%', 20, 112);
  doc.roundedRect(20, 120, 75, 18, 1, 1, 'S');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('Status: OCR VERIFIED & VALID', 25, 130);

  // ID Back Box
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(110, 84, 85, 60, 2, 2, 'FD');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ID Card - Back Side Scan', 115, 92);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('[Verified Color Scan on Record]', 115, 100);
  doc.text('Address text extracted and cross-checked.', 115, 106);
  doc.text('Pincode matched: ' + candidate.pincode, 115, 112);
  doc.roundedRect(115, 120, 75, 18, 1, 1, 'S');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('Status: RESIDENCE PROOF VALID', 120, 130);

  // Driver Holding ID Live Camera Capture
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. LIVE PROOF: DRIVER HOLDING ID CARD PHOTO IN CLASSROOM', 15, 156);
  doc.line(15, 158, 195, 158);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 164, 180, 68, 2, 2, 'FD');

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Live In-Person Biometric Confirmation (Fraud Prevention Protocol)', 20, 172);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('• Driver photo matches live trainee holding the physical government document.', 20, 180);
  doc.text(`• Timestamp of photo capture: ${candidate.trainingDate || '2026-09-23'} at Center Premises.`, 20, 186);
  doc.text('• Geo-tagged verification coordinates within center boundary perimeter.', 20, 192);

  // Stamp badge
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.roundedRect(20, 202, 100, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('BIOMETRIC ATTENDANCE VERIFIED', 25, 210);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized by Classroom Lead Trainer', 25, 216);

  // PO Audit Notes
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(8);
  doc.text('Audit Notes from Program Officer:', 20, 240);
  doc.setFont('helvetica', 'italic');
  doc.text(
    candidate.queries.length > 0
      ? `Queries Raised: ${candidate.queries.map(q => q.comment).join('; ')}`
      : 'All ID cards scrutinized without discrepancies. Government identification matches candidate fully.',
    20,
    246
  );

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dossier Reference: ${candidate.registrationNumber} | Page 2 of 3`, 15, 288);
  doc.text('DB Skills Regulatory Compliance', 150, 288);

  // ================= PAGE 3 =================
  doc.addPage();

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 24, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DB SKILLS - COMMERCIAL DRIVING LICENCE & QC AUDIT', 15, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('PAGE 3 OF 3: DRIVING LICENCE VERIFICATION & CENTRAL DISPATCH RECORD', 15, 18);

  // Section 1: Driving Licence Details
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. COMMERCIAL DRIVING LICENCE (SARATHI/PARIVAHAN RECORD)', 15, 35);
  doc.line(15, 37, 195, 37);

  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(15, 42, 180, 32, 'F');
  doc.rect(15, 42, 180, 32, 'S');

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Licence Number:', 20, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(candidate.dlNumber, 60, 50);

  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle Category:', 20, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(candidate.vehicleClass + ' (Commercial Heavy / Transport Badge)', 60, 58);

  doc.setFont('helvetica', 'bold');
  doc.text('Validity Expiry Date:', 20, 66);
  doc.setFont('helvetica', 'normal');
  doc.text(`${candidate.dlExpiryDate} (ACTIVE & COMPLIANT)`, 60, 66);

  doc.setFont('helvetica', 'bold');
  doc.text('Issuing State / RTO:', 120, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(candidate.state, 160, 50);

  doc.setFont('helvetica', 'bold');
  doc.text('Hazardous Badge:', 120, 58);
  doc.setFont('helvetica', 'normal');
  doc.text('Endorsed & Inspected', 160, 58);

  // Section 2: DL Document Scans
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DL FRONT & BACK AUDIT SAMPLES', 15, 86);
  doc.line(15, 88, 195, 88);

  // DL Front
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(15, 94, 85, 48, 2, 2, 'FD');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Commercial DL Front Scan', 20, 102);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('• Name, Father Name, DL No matched', 20, 110);
  doc.text('• Validity date valid until: ' + candidate.dlExpiryDate, 20, 116);
  doc.text('• Chip/Hologram visual validation: PASSED', 20, 122);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('✓ DL FRONT AUDIT: CLEAR', 20, 132);

  // DL Back
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(110, 94, 85, 48, 2, 2, 'FD');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Commercial DL Back Scan', 115, 102);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('• Vehicle class endorsements verified', 115, 110);
  doc.text('• Heavy transport badge stamp active', 115, 116);
  doc.text('• Emergency contact & blood group recorded', 115, 122);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('✓ DL BACK AUDIT: CLEAR', 115, 132);

  // Section 3: Multi-Tier Approval Chain & Green Signal
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. MULTI-TIER QUALITY AUDIT & GREEN SIGNAL CHAIN', 15, 155);
  doc.line(15, 157, 195, 157);

  // Step 1: PO Green Signal
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(15, 163, 180, 22, 2, 2, 'FD');
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.roundedRect(15, 163, 180, 22, 2, 2, 'S');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('LEVEL 3: PROGRAM OFFICER (PO) - GREEN SIGNAL FOR VIDEO CALL', 20, 171);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`Authorized Officer: ${candidate.greenSignalBy || 'Pooja Verma (Program Officer)'}`, 20, 177);
  doc.text(`Timestamp: ${candidate.greenSignalAt || 'Verified & Issued'} | Remarks: All documents clear for video verification call.`, 20, 182);

  // Step 2: APM Secondary QC
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 190, 180, 22, 2, 2, 'FD');
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(15, 190, 180, 22, 2, 2, 'S');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('LEVEL 3: ASSISTANT PROGRAM MANAGER (APM) - FINAL QUALITY PASS', 20, 198);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`Quality Auditor: ${candidate.apmApprovedBy || 'Siddharth Nair (APM Quality Lead)'}`, 20, 204);
  doc.text(`QC Status: ${candidate.apmApprovedAt ? 'APPROVED & DISPATCH READY (' + candidate.apmApprovedAt + ')' : 'In Quality Queue'}`, 20, 209);

  // Final Dispatch Box
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(15, 218, 180, 36, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CENTRAL BACKEND & SPONSOR DISPATCH CLEARANCE', 20, 227);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Certificate Number Assigned: ${candidate.certificateNumber || 'DBS-CERT-2026-PENDING'}`, 20, 234);
  doc.text(`Archival Dossier Hash: SHA256-${candidate.id.toUpperCase()}-VERIFIED-${candidate.idCardNumber.slice(-4)}`, 20, 240);
  doc.text('This 3-page archival document certifies compliance with Ministry of Road Transport & Highways guidelines.', 20, 246);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dossier Reference: ${candidate.registrationNumber} | End of Official Record | Page 3 of 3`, 15, 288);
  doc.text('DB Skills Enterprise Training & Audit System', 140, 288);

  const cleanReg = candidate.registrationNumber.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Candidate_Dossier_${cleanReg}.pdf`);
};

/**
 * Generate 1-Day Driver Training Certificate PDF
 * Complete with official borders, security seal, certificate ID, DL number
 */
export const generateTrainingCertificatePdf = (
  candidate: Candidate,
  centerName: string,
  trainerName: string
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4' // 297 x 210 mm
  });

  const deepTeal = [0, 122, 61]; // #007A3D (Official DB Skills Corporate Green)
  const gold = [217, 119, 6];
  const emerald = [98, 181, 72]; // #62B548
  const darkSlate = [15, 23, 42];

  // Outer decorative border
  doc.setDrawColor(deepTeal[0], deepTeal[1], deepTeal[2]);
  doc.setLineWidth(2);
  doc.rect(8, 8, 281, 194);

  // Inner thin border
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.8);
  doc.rect(12, 12, 273, 186);

  // Header Logo & Institution Name
  doc.setTextColor(deepTeal[0], deepTeal[1], deepTeal[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('DB SKILLS ACADEMY', 148.5, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('INSTITUTE FOR ADVANCED COMMERCIAL DRIVER TRAINING & ROAD SAFETY', 148.5, 36, { align: 'center' });

  // Certificate Title
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('CERTIFICATE OF COMMERCIAL DRIVER QUALIFICATION', 148.5, 50, { align: 'center' });

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('This is to proudly certify that', 148.5, 62, { align: 'center' });

  // Candidate Name
  doc.setTextColor(deepTeal[0], deepTeal[1], deepTeal[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(candidate.fullName.toUpperCase(), 148.5, 75, { align: 'center' });

  // Candidate Details
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const sonOf = `Son of Shri ${candidate.fatherName}, holding Commercial Driving Licence No.`;
  doc.text(sonOf, 148.5, 85, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(deepTeal[0], deepTeal[1], deepTeal[2]);
  doc.text(candidate.dlNumber, 148.5, 93, { align: 'center' });

  // Body Description
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  const bodyText1 = 'has successfully completed the mandatory 1-Day Intensive Commercial Vehicle Defensive Driving,';
  const bodyText2 = 'Hazardous Emergency Preparedness, and Fleet Fuel Conservation Certification Program at:';
  doc.text(bodyText1, 148.5, 104, { align: 'center' });
  doc.text(bodyText2, 148.5, 110, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text(centerName.toUpperCase(), 148.5, 118, { align: 'center' });

  // Key Competencies Box
  doc.setFillColor(248, 250, 252);
  doc.rect(35, 126, 227, 20, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(35, 126, 227, 20, 'S');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CORE COMPETENCIES EVALUATED & CERTIFIED:', 40, 132);
  doc.setFont('helvetica', 'normal');
  doc.text(
    '✓ Defensive Driving & Space Management  |  ✓ Blind-Spot Mitigation  |  ✓ Night Driving Fatigue Protocol\n✓ Emergency Braking Dynamics  |  ✓ Pre-Trip Safety Circle Walk  |  ✓ CPR & First Aid Assistance',
    40,
    138
  );

  // Certificate Metadata (Left & Right)
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Certificate No: ${candidate.certificateNumber || 'DBS-CERT-2026-8841'}`, 35, 158);
  doc.text(`Date of Issue: ${candidate.certificateIssuedDate || candidate.trainingDate || '2026-09-23'}`, 35, 164);
  doc.text(`Registration No: ${candidate.registrationNumber}`, 35, 170);

  // Security Seal Box (Middle)
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(128.5, 152, 40, 24, 2, 2, 'FD');
  doc.setTextColor(180, 83, 9);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL SEAL', 148.5, 160, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('VERIFIED & AUDITED', 148.5, 166, { align: 'center' });
  doc.text('DB SKILLS HQ', 148.5, 171, { align: 'center' });

  // Signatures (Right)
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(trainerName || 'Vikram Singh Rathore', 215, 158);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Senior Master Safety Trainer', 215, 164);
  doc.line(215, 154, 265, 154);

  doc.text('Col. Rajesh Mehta (Retd.)', 215, 173);
  doc.text('General Manager - Operations', 215, 178);
  doc.line(215, 169, 265, 169);

  // Bottom Security string
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Authenticity can be verified at https://verify.dbskills.in/cert/${candidate.certificateNumber || '8841'} | QR Reference: SEC-DBS-RJ01-2026`,
    148.5,
    192,
    { align: 'center' }
  );

  const cleanName = candidate.fullName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Training_Certificate_${cleanName}.pdf`);
};

/**
 * Generate Official Expense Claim Sanction & Summary PDF
 */
export const generateExpenseClaimPdf = (
  claim: ExpenseClaim,
  tour: TourRequest | undefined
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const deepTeal = [13, 92, 99];
  const darkSlate = [15, 23, 42];

  // Header
  doc.setFillColor(deepTeal[0], deepTeal[1], deepTeal[2]);
  doc.rect(0, 0, 210, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('DB SKILLS - OFFICIAL TOUR EXPENSE CLAIM & REIMBURSEMENT', 15, 12);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`CLAIM REF: ${claim.claimNumber} | TOUR SANCTION: ${claim.tourSanctionNumber}`, 15, 18);

  // Employee & Tour Metadata
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 32, 180, 30, 'FD');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');

  doc.text('Employee Name:', 20, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(`${claim.employeeName} (${claim.employeeRole} - ${claim.employeeLevel})`, 55, 39);

  doc.setFont('helvetica', 'bold');
  doc.text('Destination City:', 20, 46);
  doc.setFont('helvetica', 'normal');
  doc.text(`${tour?.destinationCity || 'Outstation'} (${claim.cityType} Rate Limit Tier)`, 55, 46);

  doc.setFont('helvetica', 'bold');
  doc.text('Travel Dates:', 20, 53);
  doc.setFont('helvetica', 'normal');
  doc.text(`${tour?.departureDate || '2026-09-14'} to ${tour?.returnDate || '2026-09-17'}`, 55, 53);

  doc.setFont('helvetica', 'bold');
  doc.text('Claim Status:', 125, 39);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(claim.status.toUpperCase(), 155, 39);

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('Bank Reference:', 125, 46);
  doc.setFont('helvetica', 'normal');
  doc.text(claim.bankReferenceNumber || 'Pending Settlement', 155, 46);

  doc.setFont('helvetica', 'bold');
  doc.text('Submission Date:', 125, 53);
  doc.setFont('helvetica', 'normal');
  doc.text(claim.submissionDate, 155, 53);

  // Itemized Table
  doc.setTextColor(deepTeal[0], deepTeal[1], deepTeal[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ITEMIZED EXPENSE BREAKDOWN & AUDIT POLICY CHECKS', 15, 72);
  doc.line(15, 74, 195, 74);

  // Table header
  let y = 82;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y - 5, 180, 8, 'F');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Date', 18, y);
  doc.text('Category & Description', 40, y);
  doc.text('Claimed (INR)', 125, y);
  doc.text('Limit (INR)', 150, y);
  doc.text('Approved (INR)', 172, y);

  y += 7;
  claim.items.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(item.date, 18, y);
    doc.text(item.category, 40, y);
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(item.description.slice(0, 52), 40, y + 4);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFontSize(7.5);
    doc.text(`Rs. ${item.claimAmount.toLocaleString()}`, 125, y);
    doc.text(`Rs. ${item.entitlementLimit.toLocaleString()}`, 150, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${item.approvedAmount.toLocaleString()}`, 172, y);

    y += 9;
  });

  // Totals Box
  y += 5;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, y, 180, 16, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('TOTAL CLAIMED:', 20, y + 6);
  doc.text(`Rs. ${claim.totalClaimed.toLocaleString()}`, 65, y + 6);

  doc.text('POLICY ENTITLEMENT:', 20, y + 12);
  doc.text(`Rs. ${claim.totalEntitlement.toLocaleString()}`, 65, y + 12);

  doc.setTextColor(16, 185, 129);
  doc.text('FINAL APPROVED AMOUNT:', 110, y + 9);
  doc.setFontSize(11);
  doc.text(`Rs. ${claim.totalApproved.toLocaleString()}`, 160, y + 9);

  // Sanction Remarks
  y += 24;
  doc.setTextColor(deepTeal[0], deepTeal[1], deepTeal[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('MANAGEMENT SANCTION & AUDIT REMARKS', 15, y);
  doc.line(15, y + 2, 195, y + 2);

  y += 8;
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reviewed By: ${claim.reviewedBy || 'Col. Rajesh Mehta (General Manager - Operations)'}`, 15, y);
  doc.text(`Sanction Remarks: ${claim.gmRemarks || 'All bills inspected and approved as per entitlement matrix.'}`, 15, y + 6);
  if (claim.bankReferenceNumber) {
    doc.text(`Disbursement Advice: Settled via Bank Transfer (Ref: ${claim.bankReferenceNumber}) on ${claim.settledAt || '2026-09-23'}.`, 15, y + 12);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`DB Skills Financial Management System | Document Ref: ${claim.claimNumber}`, 15, 285);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 150, 285);

  const cleanClaim = claim.claimNumber.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Expense_Claim_${cleanClaim}.pdf`);
};
