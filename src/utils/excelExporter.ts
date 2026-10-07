import * as XLSX from 'xlsx';
import { Candidate, Center } from '../types';

export interface ExportCandidateOptions {
  candidates: Candidate[];
  center: Center;
  batchCode?: string;
  exportedBy?: string;
  filterLabel?: string;
}

/**
 * Generates and triggers download of a standardized Excel workbook (.xlsx)
 * for candidate rosters and center reporting.
 */
export function exportCandidatesToExcel({
  candidates,
  center,
  batchCode = 'All Batches',
  exportedBy = 'Operations Support Executive',
  filterLabel = 'All'
}: ExportCandidateOptions): string {
  // 1. Prepare Main Roster Rows
  const rosterData = candidates.map((c, index) => {
    // Queries summary
    const openQueries = c.queries.filter(q => q.status === 'Open');
    const queriesText = openQueries.length > 0 
      ? `${openQueries.length} Open (${openQueries.map(q => q.field).join(', ')})`
      : 'None (Clean)';

    return {
      'S.No.': index + 1,
      'Registration ID': c.registrationNumber || `DBS-${center.code}-${c.id.slice(-4)}`,
      'Driver Full Name': c.fullName,
      "Father's Name": c.fatherName,
      "Mother's Name": c.motherName || 'N/A',
      'Gender': c.gender,
      'Date of Birth': c.dateOfBirth,
      'Marital Status': c.maritalStatus || 'N/A',
      'Religion': c.religion || 'N/A',
      'Caste Category': c.casteCategory || 'N/A',
      'Annual Family Income': c.familyIncome || 'N/A',
      'Mobile Number': `+91 ${c.mobileNumber}`,
      'Govt ID / Aadhaar': c.idCardNumber ? `${c.idCardNumber.slice(0, 4)} ${c.idCardNumber.slice(4, 8)} ${c.idCardNumber.slice(8, 12)}` : 'N/A',
      'ABHA Health ID': c.abhaNumber || 'N/A',
      'Driving Licence No': c.dlNumber,
      'DL Expiry Date': c.dlExpiryDate,
      'Vehicle Authorization Class': c.vehicleClass,
      'Residential Address': c.address,
      'City': c.city,
      'State': c.state,
      'PIN Code': c.pincode,
      'Training Center Name': center.name,
      'Center Code': center.code,
      'Batch Reference': batchCode,
      'Aadhaar Ingestion Channel': c.aadhaarIngestionMethod || 'Live Camera Snapshot + Optical Extraction',
      'Enrolled Timestamp': c.enrolledAt ? new Date(c.enrolledAt).toLocaleString('en-IN') : 'N/A',
      'Verification Status': c.status,
      '1-Day Training Attendance': c.attendanceStatus || 'Present',
      'Pre-Test Score (%)': c.preTestScore !== undefined ? `${c.preTestScore}%` : 'N/A',
      'Post-Test Score (%)': c.postTestScore !== undefined ? `${c.postTestScore}%` : 'N/A',
      'Kit Issued': c.kitIssued ? `Yes (${c.tshirtSize || 'L'})` : 'No',
      'Certificate Number': c.certificateNumber || 'Pending Certification',
      'Audit Queries Status': queriesText,
      'Green Signal By': c.greenSignalBy ? `${c.greenSignalBy} (${c.greenSignalAt ? new Date(c.greenSignalAt).toLocaleDateString('en-IN') : ''})` : 'Pending PO Review',
      'APM QC Passed By': c.apmApprovedBy ? `${c.apmApprovedBy} (${c.apmApprovedAt ? new Date(c.apmApprovedAt).toLocaleDateString('en-IN') : ''})` : 'Pending QC'
    };
  });

  // Create worksheet for Master Roster
  const wsRoster = XLSX.utils.json_to_sheet(rosterData);

  // Set explicit column widths for readability
  const rosterColWidths = [
    { wch: 6 },  // S.No
    { wch: 22 }, // Reg ID
    { wch: 24 }, // Driver Name
    { wch: 24 }, // Father Name
    { wch: 20 }, // Mother Name
    { wch: 10 }, // Gender
    { wch: 13 }, // DOB
    { wch: 14 }, // Marital
    { wch: 12 }, // Religion
    { wch: 14 }, // Caste
    { wch: 26 }, // Income
    { wch: 16 }, // Mobile
    { wch: 18 }, // Aadhaar
    { wch: 20 }, // ABHA
    { wch: 20 }, // DL Number
    { wch: 14 }, // DL Expiry
    { wch: 16 }, // Vehicle Class
    { wch: 36 }, // Address
    { wch: 14 }, // City
    { wch: 14 }, // State
    { wch: 10 }, // PIN
    { wch: 32 }, // Center Name
    { wch: 12 }, // Center Code
    { wch: 18 }, // Batch
    { wch: 30 }, // Ingestion Channel
    { wch: 22 }, // Enrolled At
    { wch: 24 }, // Status
    { wch: 15 }, // Attendance
    { wch: 18 }, // Pre-Test
    { wch: 18 }, // Post-Test
    { wch: 14 }, // Kit
    { wch: 26 }, // Certificate
    { wch: 24 }, // Queries
    { wch: 24 }, // Green Signal
    { wch: 24 }  // APM QC
  ];
  wsRoster['!cols'] = rosterColWidths;

  // 2. Prepare Summary & Compliance Metrics Sheet
  const totalCount = candidates.length;
  const statusCounts = candidates.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const presentCount = candidates.filter(c => c.attendanceStatus === 'Present').length;
  const kitsIssuedCount = candidates.filter(c => c.kitIssued).length;
  const certifiedCount = candidates.filter(c => c.status === 'Certified & Dispatched').length;

  const validScores = candidates.filter(c => c.postTestScore !== undefined);
  const avgPostScore = validScores.length > 0 
    ? (validScores.reduce((sum, c) => sum + (c.postTestScore || 0), 0) / validScores.length).toFixed(1)
    : 'N/A';

  const summaryData = [
    { 'Metric Category': 'TRAINING CENTER PROFILE', 'Attribute': 'Center Name', 'Value / Statistic': center.name },
    { 'Metric Category': 'TRAINING CENTER PROFILE', 'Attribute': 'Center Code', 'Value / Statistic': center.code },
    { 'Metric Category': 'TRAINING CENTER PROFILE', 'Attribute': 'City / State', 'Value / Statistic': `${center.city}, ${center.state}` },
    { 'Metric Category': 'TRAINING CENTER PROFILE', 'Attribute': 'Batch Reference', 'Value / Statistic': batchCode },
    { 'Metric Category': 'EXPORT AUDIT LOG', 'Attribute': 'Export Generated At', 'Value / Statistic': new Date().toLocaleString('en-IN') },
    { 'Metric Category': 'EXPORT AUDIT LOG', 'Attribute': 'Exported By', 'Value / Statistic': exportedBy },
    { 'Metric Category': 'EXPORT AUDIT LOG', 'Attribute': 'Filtered Scope', 'Value / Statistic': filterLabel },
    { 'Metric Category': 'CANDIDATE VOLUMETRICS', 'Attribute': 'Total Drivers in Report', 'Value / Statistic': totalCount },
    { 'Metric Category': 'CANDIDATE VOLUMETRICS', 'Attribute': 'Pending PO Audit', 'Value / Statistic': statusCounts['Pending PO Review'] || 0 },
    { 'Metric Category': 'CANDIDATE VOLUMETRICS', 'Attribute': 'Active Queries Raised', 'Value / Statistic': statusCounts['Query Raised'] || 0 },
    { 'Metric Category': 'CANDIDATE VOLUMETRICS', 'Attribute': 'Green Signal Cleared', 'Value / Statistic': statusCounts['Green Signal (Video Call)'] || 0 },
    { 'Metric Category': 'CANDIDATE VOLUMETRICS', 'Attribute': 'APM QC Approved', 'Value / Statistic': statusCounts['APM QC Passed'] || 0 },
    { 'Metric Category': 'CANDIDATE VOLUMETRICS', 'Attribute': 'Certified & Dispatched', 'Value / Statistic': certifiedCount },
    { 'Metric Category': 'TRAINING METRICS', 'Attribute': 'Attendance Rate (Present)', 'Value / Statistic': totalCount > 0 ? `${presentCount}/${totalCount} (${Math.round((presentCount / totalCount) * 100)}%)` : '0%' },
    { 'Metric Category': 'TRAINING METRICS', 'Attribute': 'Driver Kits Distributed', 'Value / Statistic': totalCount > 0 ? `${kitsIssuedCount}/${totalCount} (${Math.round((kitsIssuedCount / totalCount) * 100)}%)` : '0%' },
    { 'Metric Category': 'TRAINING METRICS', 'Attribute': 'Average Post-Test Evaluation Score', 'Value / Statistic': `${avgPostScore}%` }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 28 }, // Metric Category
    { wch: 32 }, // Attribute
    { wch: 40 }  // Value
  ];

  // 3. Assemble Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsRoster, 'Candidate Roster');
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Center Summary & Audit');

  // 4. Generate Filename & Trigger Browser Download
  const dateStr = new Date().toISOString().split('T')[0];
  const sanitizedCenter = center.code.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `${sanitizedCenter}_Candidates_Roster_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fileName);

  return fileName;
}

export interface NationalLeagueItem {
  code: string;
  name: string;
  city: string;
  state: string;
  region: string;
  poName: string;
  apmName: string;
  targetDrivers: number;
  enrolledDrivers: number;
  certifiedDrivers: number;
  targetPercent: number;
  openDefects: number;
  staffPresence: string;
  staffPresencePercent: number;
  auditReadiness: string;
  auditScore: number;
  performanceStatus: 'Target Met' | 'Near Target' | 'Underperforming';
}

export interface ExportNationalDossierOptions {
  leagueData: NationalLeagueItem[];
  nationalMetrics: {
    activeCentersCount: number;
    statesCount: number;
    totalCertifiedMtd: number;
    trainingPassRate: number;
    monthlyExpenseBurn: number;
    quarter: string;
    stateFilter: string;
  };
  exportedBy?: string;
}

/**
 * Generates and triggers download of the official National Master Audit Dossier (.xlsx)
 * for Executive CEO Command.
 */
export function exportNationalMasterAuditDossier({
  leagueData,
  nationalMetrics,
  exportedBy = 'Col. Ajay Bakshi (Retd.) (CEO / Managing Director)'
}: ExportNationalDossierOptions): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('en-IN');

  // Sheet 1: National Executive Summary
  const summaryRows = [
    { 'National Metric': 'REPORT TITLE', 'Details / Value': 'DB SKILLS NATIONAL MASTER AUDIT & PERFORMANCE DOSSIER', 'Classification': 'Executive Command (Level 1)' },
    { 'National Metric': 'Generation Timestamp', 'Details / Value': `${dateStr} ${timeStr}`, 'Classification': 'Audit Timestamp' },
    { 'National Metric': 'Authorized By', 'Details / Value': exportedBy, 'Classification': 'Executive Authority' },
    { 'National Metric': 'Audit Quarter Scope', 'Details / Value': nationalMetrics.quarter, 'Classification': 'Temporal Scope' },
    { 'National Metric': 'State / Regional Filter', 'Details / Value': nationalMetrics.stateFilter, 'Classification': 'Geographic Scope' },
    { 'National Metric': 'Total Active Certified Centers', 'Details / Value': `${nationalMetrics.activeCentersCount} Hubs Across ${nationalMetrics.statesCount} States`, 'Classification': 'Operational Infrastructure' },
    { 'National Metric': 'Total Drivers Certified (MTD)', 'Details / Value': `${nationalMetrics.totalCertifiedMtd.toLocaleString()} Commercial Drivers`, 'Classification': 'Trainee Throughput' },
    { 'National Metric': 'National Training Pass Yield', 'Details / Value': `${nationalMetrics.trainingPassRate}% Qualification Yield`, 'Classification': 'Quality & Curriculum Standard' },
    { 'National Metric': 'Operational Expense Burn (MTD)', 'Details / Value': `INR ${nationalMetrics.monthlyExpenseBurn.toLocaleString('en-IN')}`, 'Classification': 'GM Sanctioned Financials' },
    { 'National Metric': 'National Regulatory Compliance', 'Details / Value': '100% MoRTH & NSDC Commercial Driver Standards', 'Classification': 'Statutory Governance' }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 32 },
    { wch: 55 },
    { wch: 30 }
  ];

  // Sheet 2: Centers League Table
  const leagueRows = leagueData.map((item, idx) => ({
    'National Rank': `#${idx + 1}`,
    'Center Code': item.code,
    'Training Hub Name': item.name,
    'City': item.city,
    'State': item.state,
    'Region': item.region,
    'Target Fulfillment (%)': `${item.targetPercent}%`,
    'Performance Evaluation': item.performanceStatus,
    'Drivers Enrolled': item.enrolledDrivers,
    'Monthly Target Quota': item.targetDrivers,
    'Drivers Certified MTD': item.certifiedDrivers,
    'Open Facility Defects': item.openDefects === 0 ? '0 (Pristine)' : `${item.openDefects} Open Issues`,
    'Staff Attendance Status': item.staffPresence,
    'Staff GPS Presence (%)': `${item.staffPresencePercent}%`,
    'Audit Readiness Rating': item.auditReadiness,
    'Audit Compliance Score': `${item.auditScore}/100`,
    'Assigned Program Officer': item.poName,
    'Assigned Senior Manager': item.apmName
  }));

  const wsLeague = XLSX.utils.json_to_sheet(leagueRows);
  wsLeague['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 36 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 },
    { wch: 30 },
    { wch: 22 },
    { wch: 28 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 }
  ];

  // Sheet 3: Compliance & Defect Matrix
  const defectRows = leagueData.map(item => ({
    'Center Code': item.code,
    'Center Name': item.name,
    'State': item.state,
    'Defects Count': item.openDefects,
    'Facility Status': item.openDefects === 0 ? 'Operational Normal' : 'Active Tickets Under Remediation',
    'Audit Recommendation': item.performanceStatus === 'Target Met' ? 'Full Operational Green Signal' : item.performanceStatus === 'Near Target' ? 'Monitoring Required' : 'Action Directives Issued',
    'Auditor Review Status': item.auditReadiness
  }));

  const wsDefects = XLSX.utils.json_to_sheet(defectRows);
  wsDefects['!cols'] = [
    { wch: 14 },
    { wch: 36 },
    { wch: 16 },
    { wch: 16 },
    { wch: 32 },
    { wch: 32 },
    { wch: 28 }
  ];

  // Create Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Executive Summary');
  XLSX.utils.book_append_sheet(workbook, wsLeague, 'Pan-India League Table');
  XLSX.utils.book_append_sheet(workbook, wsDefects, 'Facility & Audit Status');

  const fileName = `DB_Skills_National_Master_Audit_Dossier_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);

  return fileName;
}
