import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  Users,
  Building2,
  Sparkles,
  RefreshCw,
  FileText,
  ShieldCheck,
  Plus,
  ClipboardPaste,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Candidate } from '../../types';

export interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ParsedTraineeRow {
  rowIndex: number;
  fullName: string;
  fatherName: string;
  mobileNumber: string;
  idCardNumber: string; // 12-digit Aadhaar
  dlNumber: string;
  vehicleClass: 'LMV-TR' | 'TRANS' | 'HMV' | 'HGMV' | '3W-CAB';
  dlExpiryDate: string;
  abhaNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  tshirtSize: 'M' | 'L' | 'XL' | 'XXL';
}

export interface ValidatedTraineeRow extends ParsedTraineeRow {
  isValid: boolean;
  errorList: string[];
  errors: {
    fullName?: string;
    mobileNumber?: string;
    idCardNumber?: string;
    dlNumber?: string;
    general?: string;
  };
}

const SAMPLE_CSV_CONTENT = `Name,Father Name,Phone,Aadhaar,DL Number,Vehicle Class,DL Expiry Date,ABHA Number,Gender,Date of Birth,City,State,Pincode,T-Shirt Size
Ramesh Kumar Yadav,Mahendra Singh Yadav,9829011223,458923104512,RJ14 20180045120,TRANS,2031-05-14,91234567890123,Male,1992-04-15,Jaipur,Rajasthan,302013,L
Suresh Chandra Meena,Gopal Lal Meena,9414055667,781234908765,RJ19 20190089312,HMV,2032-11-20,91876543210987,Male,1990-08-22,Jodhpur,Rajasthan,342001,XL
Mukesh Singh Rathore,Bhanwar Singh,9928033445,634512890134,DL01 20200011234,LMV-TR,2030-09-30,91567812340912,Male,1995-01-10,New Delhi,Delhi NCR,110037,L`;

const SAMPLE_MIXED_CSV_CONTENT = `Name,Father Name,Phone,Aadhaar,DL Number,Vehicle Class,DL Expiry Date,ABHA Number,Gender,Date of Birth,City,State,Pincode,T-Shirt Size
Ramesh Kumar Yadav,Mahendra Singh Yadav,9829011223,458923104512,RJ14 20180045120,TRANS,2031-05-14,91234567890123,Male,1992-04-15,Jaipur,Rajasthan,302013,L
,Gopal Lal Meena,9414055,78123490,RJ19 20190089312,HMV,2032-11-20,91876543210987,Male,1990-08-22,Jodhpur,Rajasthan,342001,XL
Mukesh Singh Rathore,Bhanwar Singh,9928033445,634512890134,DL01 20200011234,LMV-TR,2030-09-30,91567812340912,Male,1995-01-10,New Delhi,Delhi NCR,110037,L`;

// RFC-4180 compliant CSV line parser
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === ',' || ch === '\t') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeHeaderKey(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function cleanPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

function cleanAadhaarInput(raw: string): string {
  return raw.replace(/\D/g, '');
}

function normalizeVehicleClass(raw: string): 'LMV-TR' | 'TRANS' | 'HMV' | 'HGMV' | '3W-CAB' {
  const upper = (raw || '').toUpperCase().trim();
  if (upper === 'LMV-TR' || upper === 'LMV') return 'LMV-TR';
  if (upper === 'HMV') return 'HMV';
  if (upper === 'HGMV') return 'HGMV';
  if (upper === '3W-CAB' || upper === '3W') return '3W-CAB';
  return 'TRANS';
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    activeCenter,
    centers,
    candidates,
    batches,
    currentPersona,
    addCandidatesBulk,
    showToast
  } = useApp();

  const [selectedCenterId, setSelectedCenterId] = useState<string>(
    activeCenter?.id || centers[0]?.id || ''
  );
  const [initialStatus, setInitialStatus] = useState<'Pending PO Review' | 'Draft'>('Pending PO Review');
  const [parsedRows, setParsedRows] = useState<ParsedTraineeRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [rowFilter, setRowFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [parseError, setParseError] = useState<string | null>(null);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [rawPasteText, setRawPasteText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetCenter = useMemo(() => {
    return centers.find(c => c.id === selectedCenterId) || activeCenter;
  }, [centers, selectedCenterId, activeCenter]);

  // Existing Aadhaar numbers set for duplicate detection against database records
  const existingAadhaarSet = useMemo(() => {
    return new Set(
      candidates
        .map(c => cleanAadhaarInput(c.idCardNumber || ''))
        .filter(Boolean)
    );
  }, [candidates]);

  // Real-time validation engine: re-runs instantaneously on any row/cell edit or file load
  const validatedRows: ValidatedTraineeRow[] = useMemo(() => {
    const seenAadhaarInCsv = new Map<string, number>();
    parsedRows.forEach(r => {
      const cleanAadhaar = cleanAadhaarInput(r.idCardNumber);
      if (cleanAadhaar) {
        seenAadhaarInCsv.set(cleanAadhaar, (seenAadhaarInCsv.get(cleanAadhaar) || 0) + 1);
      }
    });

    return parsedRows.map(row => {
      const errors: ValidatedTraineeRow['errors'] = {};
      const errorList: string[] = [];
      const nameClean = row.fullName.trim();
      const phoneClean = cleanPhoneInput(row.mobileNumber);
      const aadhaarClean = cleanAadhaarInput(row.idCardNumber);
      const dlClean = row.dlNumber.trim();

      // 1. Mandatory Name validation
      if (!nameClean) {
        errors.fullName = 'Missing Name (Mandatory)';
        errorList.push('Full Name is required');
      } else if (nameClean.length < 2) {
        errors.fullName = 'Name too short (min 2 chars)';
        errorList.push('Full Name must be at least 2 characters');
      }

      // 2. Mandatory Phone validation (10-digit Indian mobile number)
      if (!phoneClean) {
        errors.mobileNumber = 'Missing Phone (Mandatory)';
        errorList.push('Phone number is required');
      } else if (!/^\d{10}$/.test(phoneClean)) {
        errors.mobileNumber = `Invalid Phone (${phoneClean.length}/10 digits)`;
        errorList.push(`Phone must be 10 digits (currently ${phoneClean.length})`);
      } else if (!/^[6-9]\d{9}$/.test(phoneClean)) {
        errors.mobileNumber = 'Must start with 6, 7, 8, or 9';
        errorList.push('Indian mobile number must start with 6-9');
      }

      // 3. Mandatory Aadhaar validation (12 digits + duplicate check)
      if (!aadhaarClean) {
        errors.idCardNumber = 'Missing Aadhaar (Mandatory)';
        errorList.push('12-digit Aadhaar number is required');
      } else if (!/^\d{12}$/.test(aadhaarClean)) {
        errors.idCardNumber = `Invalid Aadhaar (${aadhaarClean.length}/12 digits)`;
        errorList.push(`Aadhaar must be 12 digits (currently ${aadhaarClean.length})`);
      } else if (existingAadhaarSet.has(aadhaarClean)) {
        errors.idCardNumber = 'Duplicate in Database Roster';
        errorList.push('Aadhaar already registered in database');
      } else if ((seenAadhaarInCsv.get(aadhaarClean) || 0) > 1) {
        errors.idCardNumber = 'Duplicate in CSV Batch';
        errorList.push('Duplicate Aadhaar within this upload batch');
      }

      // 4. DL Number presence check
      if (!dlClean) {
        errors.dlNumber = 'DL Number recommended';
      }

      const isValid =
        !errors.fullName && !errors.mobileNumber && !errors.idCardNumber && !errors.general;

      return {
        ...row,
        mobileNumber: phoneClean || row.mobileNumber,
        idCardNumber: aadhaarClean || row.idCardNumber,
        isValid,
        errorList,
        errors
      };
    });
  }, [parsedRows, existingAadhaarSet]);

  const validRows = useMemo(() => validatedRows.filter(r => r.isValid), [validatedRows]);
  const invalidRows = useMemo(() => validatedRows.filter(r => !r.isValid), [validatedRows]);

  const displayedRows = useMemo(() => {
    if (rowFilter === 'valid') return validRows;
    if (rowFilter === 'invalid') return invalidRows;
    return validatedRows;
  }, [validatedRows, validRows, invalidRows, rowFilter]);

  if (!isOpen) return null;

  const parseCsvText = (csvText: string, sourceFileName: string) => {
    setParseError(null);
    const rawLines = csvText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (rawLines.length < 2) {
      setParseError('The CSV data must contain a header row and at least one trainee record row.');
      return;
    }

    const headerCells = parseCsvLine(rawLines[0]).map(normalizeHeaderKey);

    const findColIndex = (aliases: string[]): number => {
      return headerCells.findIndex(h => aliases.includes(h));
    };

    const nameIdx = findColIndex([
      'name',
      'fullname',
      'candidatename',
      'traineename',
      'drivername',
      'driverfullname',
      'trainee'
    ]);
    const fatherIdx = findColIndex([
      'fathername',
      'fathersname',
      'guardianname',
      'father',
      'so'
    ]);
    const phoneIdx = findColIndex([
      'phone',
      'phonenumber',
      'mobile',
      'mobilenumber',
      'contact',
      'contactnumber',
      'contactno',
      'mobileno'
    ]);
    const aadhaarIdx = findColIndex([
      'aadhaar',
      'aadhar',
      'aadhaarnumber',
      'aadharnumber',
      'aadhaarno',
      'aadharno',
      'idcardnumber',
      'govid',
      'uid',
      'uidai'
    ]);
    const dlIdx = findColIndex([
      'dlnumber',
      'dlno',
      'dl',
      'drivinglicense',
      'drivinglicence',
      'drivinglicensenumber',
      'drivinglicencenumber',
      'licensenumber'
    ]);
    const classIdx = findColIndex(['vehicleclass', 'class', 'dlclass', 'vehicletype']);
    const dlExpIdx = findColIndex(['dlexpirydate', 'dlexpiry', 'expirydate', 'licenseexpiry']);
    const abhaIdx = findColIndex(['abhanumber', 'abhano', 'abha', 'abhaid', 'healthid']);
    const genderIdx = findColIndex(['gender', 'sex']);
    const dobIdx = findColIndex(['dateofbirth', 'dob', 'birthdate']);
    const cityIdx = findColIndex(['city', 'district', 'town']);
    const stateIdx = findColIndex(['state', 'province']);
    const pincodeIdx = findColIndex(['pincode', 'pin', 'zipcode', 'postalcode']);
    const addressIdx = findColIndex(['address', 'residentialaddress', 'street']);
    const tshirtIdx = findColIndex(['tshirtsize', 'tshirt', 'kitsize', 'size']);

    if (nameIdx === -1 && phoneIdx === -1 && aadhaarIdx === -1) {
      setParseError(
        'Could not detect mandatory CSV headers (Name, Phone, Aadhaar). Please use the standard CSV template.'
      );
      return;
    }

    const extracted: ParsedTraineeRow[] = [];

    for (let i = 1; i < rawLines.length; i++) {
      const cells = parseCsvLine(rawLines[i]);
      if (cells.every(c => !c.trim())) continue;

      const getCell = (idx: number, fallback = ''): string =>
        idx >= 0 && idx < cells.length ? cells[idx].trim() : fallback;

      const rawGender = getCell(genderIdx, 'Male').toLowerCase();
      const gender: 'Male' | 'Female' | 'Other' =
        rawGender === 'female' || rawGender === 'f'
          ? 'Female'
          : rawGender === 'other'
          ? 'Other'
          : 'Male';

      const rawTshirt = getCell(tshirtIdx, 'L').toUpperCase();
      const tshirtSize: 'M' | 'L' | 'XL' | 'XXL' =
        rawTshirt === 'M' || rawTshirt === 'L' || rawTshirt === 'XL' || rawTshirt === 'XXL'
          ? rawTshirt
          : 'L';

      extracted.push({
        rowIndex: i,
        fullName: getCell(nameIdx),
        fatherName: getCell(fatherIdx, 'Not Specified'),
        mobileNumber: cleanPhoneInput(getCell(phoneIdx)),
        idCardNumber: cleanAadhaarInput(getCell(aadhaarIdx)),
        dlNumber: getCell(dlIdx, `RJ14 201900${String(10000 + i)}`),
        vehicleClass: normalizeVehicleClass(getCell(classIdx, 'TRANS')),
        dlExpiryDate: getCell(dlExpIdx, '2031-12-31'),
        abhaNumber: getCell(abhaIdx, `91${String(100000000000 + i * 135791)}`.slice(0, 14)),
        gender,
        dateOfBirth: getCell(dobIdx, '1993-06-15'),
        city: getCell(cityIdx, targetCenter?.city || 'Jaipur'),
        state: getCell(stateIdx, targetCenter?.state || 'Rajasthan'),
        pincode: getCell(pincodeIdx, '302001'),
        address: getCell(addressIdx, `${targetCenter?.city || 'Local'} Transport Hub Area`),
        tshirtSize
      });
    }

    if (extracted.length === 0) {
      setParseError('No non-empty trainee rows found in the uploaded CSV.');
      return;
    }

    setFileName(sourceFileName);
    setParsedRows(extracted);
    setRowFilter('all');
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setParseError('Please upload a valid .csv file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const content = String(e.target?.result || '');
      parseCsvText(content, file.name);
    };
    reader.onerror = () => {
      setParseError('Failed to read the CSV file. Please try again.');
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'DBS_Trainee_Bulk_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded DBS_Trainee_Bulk_Import_Template.csv');
  };

  const handleLoadSampleRows = (withErrors = false) => {
    if (withErrors) {
      parseCsvText(SAMPLE_MIXED_CSV_CONTENT, 'Sample_Validation_Preview.csv');
    } else {
      parseCsvText(SAMPLE_CSV_CONTENT, 'DBS_Trainee_Bulk_Import_Template.csv');
    }
  };

  const handleAddBlankRow = () => {
    const nextIndex = parsedRows.length > 0 ? Math.max(...parsedRows.map(r => r.rowIndex)) + 1 : 1;
    setParsedRows(prev => [
      ...prev,
      {
        rowIndex: nextIndex,
        fullName: '',
        fatherName: '',
        mobileNumber: '',
        idCardNumber: '',
        dlNumber: `RJ14 202100${String(10000 + nextIndex)}`,
        vehicleClass: 'TRANS',
        dlExpiryDate: '2031-12-31',
        abhaNumber: `91${String(100000000000 + nextIndex * 135791)}`.slice(0, 14),
        gender: 'Male',
        dateOfBirth: '1994-05-10',
        city: targetCenter?.city || 'Jaipur',
        state: targetCenter?.state || 'Rajasthan',
        pincode: '302001',
        address: `${targetCenter?.city || 'Local'} Transport Hub Area`,
        tshirtSize: 'L'
      }
    ]);
  };

  const handleUpdateRowField = (
    rowIndex: number,
    field: keyof ParsedTraineeRow,
    value: string
  ) => {
    setParsedRows(prev =>
      prev.map(r => {
        if (r.rowIndex !== rowIndex) return r;
        if (field === 'mobileNumber') {
          return { ...r, mobileNumber: value.replace(/[^\d]/g, '').slice(0, 10) };
        }
        if (field === 'idCardNumber') {
          return { ...r, idCardNumber: value.replace(/[^\d]/g, '').slice(0, 12) };
        }
        if (field === 'vehicleClass') {
          return { ...r, vehicleClass: normalizeVehicleClass(value) };
        }
        return { ...r, [field]: value };
      })
    );
  };

  const handleRemoveRow = (rowIndex: number) => {
    setParsedRows(prev => prev.filter(r => r.rowIndex !== rowIndex));
  };

  const handleBulkImportConfirm = async () => {
    if (validRows.length === 0) {
      showToast('No valid trainee rows ready to commit. Please fix validation errors first.');
      return;
    }

    setIsImporting(true);
    try {
      const targetBatch =
        batches.find(b => b.centerId === (targetCenter?.id || activeCenter.id)) || batches[0];

      const payloads: Partial<Candidate>[] = validRows.map(row => ({
        centerId: targetCenter?.id || activeCenter.id,
        batchId: targetBatch?.id || 'batch-1',
        fullName: row.fullName.trim(),
        fatherName: row.fatherName.trim() || 'Not Specified',
        mobileNumber: cleanPhoneInput(row.mobileNumber),
        idCardNumber: cleanAadhaarInput(row.idCardNumber),
        dlNumber: row.dlNumber.trim(),
        vehicleClass: row.vehicleClass,
        dlExpiryDate: row.dlExpiryDate,
        abhaNumber: row.abhaNumber.trim(),
        gender: row.gender,
        dateOfBirth: row.dateOfBirth,
        city: row.city.trim() || targetCenter?.city || '',
        state: row.state.trim() || targetCenter?.state || '',
        pincode: row.pincode.trim() || '302001',
        address: row.address.trim(),
        tshirtSize: row.tshirtSize,
        status: initialStatus,
        aadhaarIngestionMethod: 'File Upload'
      }));

      await addCandidatesBulk(payloads);
      setParsedRows([]);
      setFileName('');
      onClose();
    } catch (err) {
      console.error('Bulk CSV import error:', err);
      showToast('Failed to complete bulk import.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-sm shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#005C2E] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#004422]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/15 rounded-xs">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide uppercase">
                Bulk Import Trainee Profiles & Real-Time Validation Preview
              </h2>
              <p className="text-[11px] text-emerald-100/90">
                Upload a CSV roster, inspect real-time validation diagnostics, and fix any field discrepancies inline before committing to Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Top Configuration & Template Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Target Hub Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Target Training Hub / Center
                </label>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#007A3D]" />
                  {['CEO', 'GM', 'Senior Manager'].includes(currentPersona.role) && centers.length > 0 ? (
                    <select
                      value={selectedCenterId}
                      onChange={e => setSelectedCenterId(e.target.value)}
                      className="text-xs font-bold bg-white border border-slate-300 rounded-xs px-2.5 py-1.5 text-slate-800 focus:outline-[#007A3D]"
                    >
                      {centers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code}) — {c.city}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-slate-800 bg-white border border-slate-300 px-2.5 py-1 rounded-xs">
                      {targetCenter?.name} ({targetCenter?.code})
                    </span>
                  )}
                </div>
              </div>

              {/* Initial Workflow Status */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Initial Audit Stage
                </label>
                <select
                  value={initialStatus}
                  onChange={e => setInitialStatus(e.target.value as 'Pending PO Review' | 'Draft')}
                  className="text-xs font-semibold bg-white border border-slate-300 rounded-xs px-2.5 py-1.5 text-slate-800 focus:outline-[#007A3D]"
                >
                  <option value="Pending PO Review">Pending PO Review (Ready for Audit)</option>
                  <option value="Draft">Draft (Pending OSE Photo Attachment)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleLoadSampleRows(true)}
                className="px-2.5 py-1.5 rounded-xs text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Load sample rows including intentional validation errors to preview real-time error catching"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Test Validation Preview</span>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSampleRows(false)}
                className="px-2.5 py-1.5 rounded-xs text-xs font-semibold bg-emerald-50 text-[#005C2E] border border-[#007A3D]/30 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#007A3D]" />
                <span>Load Valid Sample CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPasteBox(prev => !prev)}
                className="px-2.5 py-1.5 rounded-xs text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-slate-600" />
                <span>{showPasteBox ? 'Hide Paste Box' : 'Paste CSV Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="px-3 py-1.5 rounded-xs text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#007A3D]" />
                <span>Download CSV Template</span>
              </button>
            </div>
          </div>

          {/* Optional Paste CSV Text Box */}
          {showPasteBox && (
            <div className="bg-slate-50 border border-slate-300 rounded-sm p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Paste Raw CSV or Spreadsheet Rows (with Header Line)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (rawPasteText.trim()) {
                      parseCsvText(rawPasteText, 'Pasted_CSV_Data.csv');
                      setShowPasteBox(false);
                    }
                  }}
                  className="px-3 py-1 rounded-xs text-xs font-bold bg-[#007A3D] text-white hover:bg-[#005C2E] cursor-pointer"
                >
                  Parse & Validate Pasted Rows
                </button>
              </div>
              <textarea
                rows={4}
                value={rawPasteText}
                onChange={e => setRawPasteText(e.target.value)}
                placeholder={SAMPLE_CSV_CONTENT}
                className="w-full p-2 text-xs font-mono bg-white border border-slate-300 rounded-xs focus:outline-[#007A3D]"
              />
            </div>
          )}

          {/* Upload Dropzone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              const droppedFile = e.dataTransfer.files?.[0];
              if (droppedFile) handleFileUpload(droppedFile);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-sm p-5 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-[#007A3D] bg-[#E6F4EA]/60'
                : 'border-slate-300 hover:border-[#007A3D] bg-slate-50/60 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <div className="p-2.5 rounded-full bg-[#E6F4EA] text-[#007A3D] border border-[#007A3D]/20">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {fileName
                    ? `Active Source: ${fileName} (Click or drag another .csv file to replace)`
                    : 'Click to upload a .csv file or drag and drop it here'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real-time validation checks mandatory <strong className="text-slate-700">Name</strong>,{' '}
                  <strong className="text-slate-700">10-Digit Mobile</strong>, and{' '}
                  <strong className="text-slate-700">12-Digit Unique Aadhaar</strong> before committing records.
                </p>
              </div>
            </div>
          </div>

          {/* Parse Error Banner */}
          {parseError && (
            <div className="bg-rose-50 border border-rose-200 rounded-sm p-3 flex items-center gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{parseError}</span>
            </div>
          )}

          {/* Real-Time Validation Preview Table Section */}
          <div className="space-y-3">
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-slate-300 rounded-sm p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Total Preview Rows
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {validatedRows.length}
                  </span>
                </div>
                <FileText className="w-5 h-5 text-slate-400" />
              </div>

              <div className="bg-[#E6F4EA]/60 border border-[#007A3D]/30 rounded-sm p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#005C2E] block">
                    Valid & Ready to Commit
                  </span>
                  <span className="text-lg font-bold text-[#007A3D] font-mono">
                    {validRows.length}
                  </span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#007A3D]" />
              </div>

              <div
                className={`border rounded-sm p-3 flex items-center justify-between ${
                  invalidRows.length > 0
                    ? 'bg-rose-50 border-rose-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase block ${
                      invalidRows.length > 0 ? 'text-rose-700' : 'text-slate-500'
                    }`}
                  >
                    Rows with Validation Errors
                  </span>
                  <span
                    className={`text-lg font-bold font-mono ${
                      invalidRows.length > 0 ? 'text-rose-600' : 'text-slate-600'
                    }`}
                  >
                    {invalidRows.length}
                  </span>
                </div>
                <AlertTriangle
                  className={`w-5 h-5 ${
                    invalidRows.length > 0 ? 'text-rose-600' : 'text-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Filter Tabs + Add Row / Clear Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRowFilter('all')}
                  className={`px-2.5 py-1 rounded-xs text-xs font-bold border cursor-pointer ${
                    rowFilter === 'all'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  All Preview Rows ({validatedRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRowFilter('valid')}
                  className={`px-2.5 py-1 rounded-xs text-xs font-bold border cursor-pointer ${
                    rowFilter === 'valid'
                      ? 'bg-[#007A3D] text-white border-[#005C2E]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Valid Only ({validRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRowFilter('invalid')}
                  className={`px-2.5 py-1 rounded-xs text-xs font-bold border cursor-pointer ${
                    rowFilter === 'invalid'
                      ? 'bg-rose-600 text-white border-rose-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Errors Only ({invalidRows.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddBlankRow}
                  className="px-2.5 py-1 rounded-xs text-xs font-bold text-[#005C2E] bg-[#E6F4EA] border border-[#007A3D]/30 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>

                {validatedRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRows([]);
                      setFileName('');
                    }}
                    className="px-2.5 py-1 rounded-xs text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                  >
                    Clear Table
                  </button>
                )}
              </div>
            </div>

            {/* Real-Time Validation Preview Table */}
            <div className="border border-slate-300 rounded-sm overflow-hidden">
              <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Real-Time Validation Preview Table
                </span>
                <span className="text-[11px] text-slate-500">
                  Edit any highlighted cell below to resolve errors in real time before committing
                </span>
              </div>

              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-600 sticky top-0 z-10">
                      <th className="py-2 px-2.5 w-10">#</th>
                      <th className="py-2 px-2.5">Trainee Full Name *</th>
                      <th className="py-2 px-2.5">Father Name</th>
                      <th className="py-2 px-2.5">Phone (10 Digits) *</th>
                      <th className="py-2 px-2.5">Aadhaar (12 Digits) *</th>
                      <th className="py-2 px-2.5">Commercial DL & Class</th>
                      <th className="py-2 px-2.5">Real-Time Validation Status</th>
                      <th className="py-2 px-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          {validatedRows.length === 0
                            ? 'No rows loaded yet. Upload a .csv file above, click "Test Validation Preview", or click "+ Add Row" to begin.'
                            : 'No rows match the selected validation filter.'}
                        </td>
                      </tr>
                    ) : (
                      displayedRows.map(row => (
                        <tr
                          key={row.rowIndex}
                          className={
                            row.isValid
                              ? 'bg-white hover:bg-slate-50'
                              : 'bg-rose-50/40 hover:bg-rose-50/70'
                          }
                        >
                          <td className="py-2 px-2.5 font-mono text-[11px] text-slate-500">
                            {row.rowIndex}
                          </td>

                          {/* Full Name */}
                          <td className="py-2 px-2.5">
                            <input
                              type="text"
                              value={row.fullName}
                              placeholder="Enter Trainee Name"
                              onChange={e =>
                                handleUpdateRowField(row.rowIndex, 'fullName', e.target.value)
                              }
                              className={`w-full px-2 py-1 rounded-xs border text-xs font-semibold ${
                                row.errors.fullName
                                  ? 'border-rose-400 bg-rose-50 text-rose-900 focus:outline-rose-600'
                                  : 'border-slate-300 bg-white text-slate-900 focus:outline-[#007A3D]'
                              }`}
                            />
                            {row.errors.fullName && (
                              <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                                {row.errors.fullName}
                              </span>
                            )}
                          </td>

                          {/* Father Name */}
                          <td className="py-2 px-2.5">
                            <input
                              type="text"
                              value={row.fatherName}
                              placeholder="Father's Name"
                              onChange={e =>
                                handleUpdateRowField(row.rowIndex, 'fatherName', e.target.value)
                              }
                              className="w-full px-2 py-1 rounded-xs border border-slate-300 bg-white text-xs text-slate-700 focus:outline-[#007A3D]"
                            />
                          </td>

                          {/* Mobile Number */}
                          <td className="py-2 px-2.5">
                            <input
                              type="text"
                              value={row.mobileNumber}
                              placeholder="10-digit Mobile"
                              maxLength={10}
                              onChange={e =>
                                handleUpdateRowField(row.rowIndex, 'mobileNumber', e.target.value)
                              }
                              className={`w-32 px-2 py-1 rounded-xs border text-xs font-mono font-semibold ${
                                row.errors.mobileNumber
                                  ? 'border-rose-400 bg-rose-50 text-rose-900 focus:outline-rose-600'
                                  : 'border-slate-300 bg-white text-slate-900 focus:outline-[#007A3D]'
                              }`}
                            />
                            {row.errors.mobileNumber && (
                              <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                                {row.errors.mobileNumber}
                              </span>
                            )}
                          </td>

                          {/* Aadhaar Number */}
                          <td className="py-2 px-2.5">
                            <input
                              type="text"
                              value={row.idCardNumber}
                              placeholder="12-digit Aadhaar"
                              maxLength={12}
                              onChange={e =>
                                handleUpdateRowField(row.rowIndex, 'idCardNumber', e.target.value)
                              }
                              className={`w-36 px-2 py-1 rounded-xs border text-xs font-mono font-semibold ${
                                row.errors.idCardNumber
                                  ? 'border-rose-400 bg-rose-50 text-rose-900 focus:outline-rose-600'
                                  : 'border-slate-300 bg-white text-slate-900 focus:outline-[#007A3D]'
                              }`}
                            />
                            {row.errors.idCardNumber && (
                              <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                                {row.errors.idCardNumber}
                              </span>
                            )}
                          </td>

                          {/* DL & Vehicle Class */}
                          <td className="py-2 px-2.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={row.dlNumber}
                                placeholder="DL Number"
                                onChange={e =>
                                  handleUpdateRowField(row.rowIndex, 'dlNumber', e.target.value)
                                }
                                className="w-32 px-2 py-1 rounded-xs border border-slate-300 bg-white text-xs font-mono text-slate-800"
                              />
                              <select
                                value={row.vehicleClass}
                                onChange={e =>
                                  handleUpdateRowField(row.rowIndex, 'vehicleClass', e.target.value)
                                }
                                className="px-1.5 py-1 rounded-xs border border-slate-300 bg-white text-[11px] font-mono font-bold text-slate-700"
                              >
                                <option value="TRANS">TRANS</option>
                                <option value="LMV-TR">LMV-TR</option>
                                <option value="HMV">HMV</option>
                                <option value="HGMV">HGMV</option>
                                <option value="3W-CAB">3W-CAB</option>
                              </select>
                            </div>
                          </td>

                          {/* Validation Status Badge */}
                          <td className="py-2 px-2.5">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#E6F4EA] text-[#005C2E] border border-[#007A3D]/30">
                                <CheckCircle2 className="w-3 h-3 text-[#007A3D]" />
                                Ready to Commit
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  {row.errorList.length} Error{row.errorList.length === 1 ? '' : 's'}
                                </span>
                                <p className="text-[10px] text-rose-700 leading-tight">
                                  {row.errorList.join(' • ')}
                                </p>
                              </div>
                            )}
                          </td>

                          {/* Remove Row */}
                          <td className="py-2 px-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.rowIndex)}
                              className="p-1 rounded-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove row from preview"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#007A3D] shrink-0" />
            <span>
              Real-time validation enforces: <strong>Full Name</strong>, <strong>10-digit Mobile</strong>, and{' '}
              <strong>12-digit Unique Aadhaar</strong> before database commit.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-sm text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleBulkImportConfirm}
              disabled={isImporting || validRows.length === 0}
              className="px-4 py-1.5 rounded-sm text-xs font-bold bg-[#007A3D] text-white hover:bg-[#005C2E] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Committing Records...</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    Commit {validRows.length} Valid Record{validRows.length === 1 ? '' : 's'} to Database
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
