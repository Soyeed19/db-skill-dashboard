import React, { useState } from 'react';
import {
  X,
  Scan,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Camera,
  UploadCloud
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Candidate } from '../../types';
import { DlExpiredAlertModal } from '../dashboards/DlExpiredAlertModal';

interface CandidateRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CandidateRegistrationModal: React.FC<CandidateRegistrationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { addCandidate, activeCenter, batches, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'manual' | 'ocr'>('manual');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    dateOfBirth: '1992-06-15',
    gender: 'Male' as Candidate['gender'],
    mobileNumber: '',
    idCardNumber: '',
    abhaNumber: '',
    dlNumber: '',
    dlExpiryDate: '2029-12-31',
    vehicleClass: 'TRANS' as Candidate['vehicleClass'],
    address: '',
    city: activeCenter.city,
    state: activeCenter.state,
    pincode: '342005',
    batchId: batches[0]?.id || '',
    tshirtSize: 'L' as 'M' | 'L' | 'XL' | 'XXL',
    kitIssued: true
  });

  // OCR Wizard State
  const [ocrFrontId, setOcrFrontId] = useState<string | null>(null);
  const [ocrBackId, setOcrBackId] = useState<string | null>(null);
  const [ocrFrontDl, setOcrFrontDl] = useState<string | null>(null);
  const [ocrBackDl, setOcrBackDl] = useState<string | null>(null);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrExtracted, setOcrExtracted] = useState(false);

  // Live validation errors
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isDlExpiredModalOpen, setIsDlExpiredModalOpen] = useState(false);

  // DL Expiry Validation Handler
  const handleDlExpiryChange = (dateVal: string) => {
    setFormData(prev => ({ ...prev, dlExpiryDate: dateVal }));
    if (!dateVal) return;

    const selectedDate = new Date(dateVal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setIsDlExpiredModalOpen(true);
    }
  };

  if (!isOpen) return null;

  // Validation rules
  const isMobileValid = /^[6-9]\d{9}$/.test(formData.mobileNumber);
  const isIdValid = /^\d{12}$/.test(formData.idCardNumber);
  const isAbhaValid = formData.abhaNumber === '' || /^\d{14}$/.test(formData.abhaNumber);
  const isDlValid = formData.dlNumber.trim().length >= 8;
  const isNameValid = formData.fullName.trim().length >= 3;

  const isFormValid = isMobileValid && isIdValid && isAbhaValid && isDlValid && isNameValid;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleRunOcrExtraction = () => {
    setIsScanningOcr(true);
    setTimeout(() => {
      setIsScanningOcr(false);
      setOcrExtracted(true);
      // Pre-fill extracted fields with realistic extracted data
      setFormData(prev => ({
        ...prev,
        fullName: 'Rajendra Singh Bhati',
        fatherName: 'Guman Singh Bhati',
        dateOfBirth: '1988-08-24',
        gender: 'Male',
        mobileNumber: '9829104822',
        idCardNumber: '674190823415',
        abhaNumber: '14889201475623',
        dlNumber: 'RJ19 20150044812',
        dlExpiryDate: '2030-08-20',
        vehicleClass: 'HMV',
        address: 'House 54, Sector 7, Kudi Housing Board, Jodhpur Rural',
        city: 'Jodhpur',
        state: 'Rajasthan',
        pincode: '342005'
      }));
      setOcrFrontId('https://images.unsplash.com/photo-1589330694653-dad6bc0140fa?auto=format&fit=crop&w=600&q=80');
      setOcrBackId('https://images.unsplash.com/photo-1589330694653-dad6bc0140fa?auto=format&fit=crop&w=600&q=80');
      setOcrFrontDl('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80');
      setOcrBackDl('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80');
      showToast('OCR extraction completed! Fields populated with 99.4% confidence score.');
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      showToast('Please fix all field validation errors before submitting.');
      setTouched({
        fullName: true,
        mobileNumber: true,
        idCardNumber: true,
        abhaNumber: true,
        dlNumber: true
      });
      return;
    }

    // DL Expiry Validation: Block submission if expired
    if (!formData.dlExpiryDate) {
      showToast('Please enter the Driving Licence Expiry Date.');
      return;
    }
    const selectedExpiry = new Date(formData.dlExpiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedExpiry < today) {
      setIsDlExpiredModalOpen(true);
      showToast("Enrollment blocked: Candidate's Driving Licence has expired.");
      return;
    }

    addCandidate({
      ...formData,
      centerId: activeCenter.id,
      idFrontUrl: ocrFrontId || undefined,
      idBackUrl: ocrBackId || undefined,
      dlFrontUrl: ocrFrontDl || undefined,
      dlBackUrl: ocrBackDl || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-[#0d5c63] to-teal-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <UserPlus className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  OSE Enrollment Wizard
                </span>
                <span className="text-white/40">•</span>
                <span className="text-xs text-white/80">{activeCenter.name}</span>
              </div>
              <h3 className="text-lg font-bold">Commercial Vehicle Driver Registration</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'manual'
                  ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-teal-700" />
              Fast Manual Enrollment
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ocr')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'ocr'
                  ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scan className="w-4 h-4 text-teal-700" />
              OCR Document Scan Wizard
              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                Auto-Fill
              </span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Validation Rules: 12-digit ID • 10-digit Phone • 14-digit ABHA
          </span>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'ocr' && (
            <div className="mb-6 p-4 rounded-xl bg-teal-50/60 border border-teal-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  <h4 className="text-sm font-bold text-teal-950">
                    Smart Optical Character Recognition (OCR) Scanner
                  </h4>
                </div>
                <span className="text-xs text-teal-700">Supported: Aadhaar Card & Commercial Driving Licence</span>
              </div>

              {/* Document Slots */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border-2 border-dashed border-teal-300 rounded-xl p-3 text-center bg-white/70 hover:bg-white transition-all flex flex-col items-center justify-center h-28 cursor-pointer">
                  <Camera className="w-5 h-5 text-teal-600 mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-700">Gov ID Front</span>
                  <span className="text-[10px] text-slate-400">
                    {ocrFrontId ? '✓ Loaded' : 'Tap to scan/upload'}
                  </span>
                </div>

                <div className="border-2 border-dashed border-teal-300 rounded-xl p-3 text-center bg-white/70 hover:bg-white transition-all flex flex-col items-center justify-center h-28 cursor-pointer">
                  <Camera className="w-5 h-5 text-teal-600 mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-700">Gov ID Back</span>
                  <span className="text-[10px] text-slate-400">
                    {ocrBackId ? '✓ Loaded' : 'Tap to scan/upload'}
                  </span>
                </div>

                <div className="border-2 border-dashed border-teal-300 rounded-xl p-3 text-center bg-white/70 hover:bg-white transition-all flex flex-col items-center justify-center h-28 cursor-pointer">
                  <UploadCloud className="w-5 h-5 text-teal-600 mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-700">DL Card Front</span>
                  <span className="text-[10px] text-slate-400">
                    {ocrFrontDl ? '✓ Loaded' : 'Tap to scan/upload'}
                  </span>
                </div>

                <div className="border-2 border-dashed border-teal-300 rounded-xl p-3 text-center bg-white/70 hover:bg-white transition-all flex flex-col items-center justify-center h-28 cursor-pointer">
                  <UploadCloud className="w-5 h-5 text-teal-600 mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-700">DL Card Back</span>
                  <span className="text-[10px] text-slate-400">
                    {ocrBackDl ? '✓ Loaded' : 'Tap to scan/upload'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleRunOcrExtraction}
                  disabled={isScanningOcr}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-800 text-white hover:bg-teal-900 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isScanningOcr ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Scanning ID & DL via Vision Model...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      Run Automatic OCR Extraction
                    </>
                  )}
                </button>

                {ocrExtracted && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Data auto-populated into form fields below!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Core Form Fields with Live Format Check */}
          <form id="candidate-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Identity & Mandatory Government ID */}
            <div>
              <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-700" />
                1. Government Identification & Contact Numbers
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 12-Digit ID */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Gov ID / Aadhaar No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="idCardNumber"
                    maxLength={12}
                    placeholder="12-digit numeric ID"
                    value={formData.idCardNumber}
                    onChange={handleChange}
                    onBlur={() => handleBlur('idCardNumber')}
                    className={`w-full text-xs font-mono px-3 py-2 rounded-xl border transition-all ${
                      touched.idCardNumber && !isIdValid
                        ? 'border-rose-400 bg-rose-50/50 focus:outline-rose-500'
                        : isIdValid
                        ? 'border-emerald-400 bg-emerald-50/30 focus:outline-emerald-500'
                        : 'border-slate-300 focus:outline-teal-600'
                    }`}
                  />
                  {touched.idCardNumber && !isIdValid ? (
                    <p className="text-[10px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Must be exactly 12 numeric digits
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">12 digits without spaces</p>
                  )}
                </div>

                {/* 10-Digit Mobile */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">+91</span>
                    <input
                      type="text"
                      name="mobileNumber"
                      maxLength={10}
                      placeholder="9829012345"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      onBlur={() => handleBlur('mobileNumber')}
                      className={`w-full text-xs font-mono pl-10 pr-3 py-2 rounded-xl border transition-all ${
                        touched.mobileNumber && !isMobileValid
                          ? 'border-rose-400 bg-rose-50/50 focus:outline-rose-500'
                          : isMobileValid
                          ? 'border-emerald-400 bg-emerald-50/30 focus:outline-emerald-500'
                          : 'border-slate-300 focus:outline-teal-600'
                      }`}
                    />
                  </div>
                  {touched.mobileNumber && !isMobileValid && (
                    <p className="text-[10px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Valid 10-digit Indian mobile starting with 6-9
                    </p>
                  )}
                </div>

                {/* 14-Digit ABHA */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ABHA Health ID No. (14 Digits)
                  </label>
                  <input
                    type="text"
                    name="abhaNumber"
                    maxLength={14}
                    placeholder="14-digit ABHA number"
                    value={formData.abhaNumber}
                    onChange={handleChange}
                    onBlur={() => handleBlur('abhaNumber')}
                    className={`w-full text-xs font-mono px-3 py-2 rounded-xl border transition-all ${
                      touched.abhaNumber && !isAbhaValid
                        ? 'border-rose-400 bg-rose-50/50 focus:outline-rose-500'
                        : isAbhaValid && formData.abhaNumber.length === 14
                        ? 'border-emerald-400 bg-emerald-50/30 focus:outline-emerald-500'
                        : 'border-slate-300 focus:outline-teal-600'
                    }`}
                  />
                  {touched.abhaNumber && !isAbhaValid && (
                    <p className="text-[10px] text-rose-600 mt-1">Must be 14 digits numeric</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Personal Bio */}
            <div>
              <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-700" />
                2. Trainee Personal Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Full Candidate Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('fullName')}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600"
                  />
                  {touched.fullName && !isNameValid && (
                    <p className="text-[10px] text-rose-600 mt-1">Name is required</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Father's / Guardian's Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    placeholder="e.g. Ramdev Kumar"
                    value={formData.fatherName}
                    onChange={handleChange}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Commercial Driving Licence */}
            <div>
              <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-700" />
                3. Commercial Driving Licence & Fleet Credentials
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Driving Licence No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="dlNumber"
                    placeholder="RJ19 20180012345"
                    value={formData.dlNumber}
                    onChange={handleChange}
                    onBlur={() => handleBlur('dlNumber')}
                    className="w-full text-xs font-mono uppercase px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600"
                  />
                  {touched.dlNumber && !isDlValid && (
                    <p className="text-[10px] text-rose-600 mt-1">Valid DL number required</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Vehicle Class Endorsement <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="vehicleClass"
                    value={formData.vehicleClass}
                    onChange={handleChange}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600 bg-white"
                  >
                    <option value="TRANS">TRANS - Commercial Heavy Transport</option>
                    <option value="HMV">HMV - Heavy Motor Vehicle (Multi-Axle)</option>
                    <option value="HGMV">HGMV - Heavy Goods Motor Vehicle</option>
                    <option value="LMV-TR">LMV-TR - Light Commercial Transport</option>
                    <option value="3W-CAB">3W-CAB - Commercial Three-Wheeler</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>
                      DL Validity / Expiry Date <span className="text-rose-500">*</span>
                    </span>
                    {Boolean(formData.dlExpiryDate && new Date(formData.dlExpiryDate) < new Date(new Date().setHours(0, 0, 0, 0))) && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        Expired
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    name="dlExpiryDate"
                    required
                    value={formData.dlExpiryDate}
                    onChange={(e) => handleDlExpiryChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600"
                  />
                  {Boolean(formData.dlExpiryDate && new Date(formData.dlExpiryDate) < new Date(new Date().setHours(0, 0, 0, 0))) && (
                    <p className="text-[10px] text-rose-600 font-bold mt-1">
                      Licence expired. Enrollment blocked.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Residential Address & Kit Logistics */}
            <div>
              <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-700" />
                4. Residence Address & Driver Kit Allotment
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Permanent Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Village / Ward / Street details"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Assigned Training Batch
                  </label>
                  <select
                    name="batchId"
                    value={formData.batchId}
                    onChange={handleChange}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600 bg-white"
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.batchCode} ({b.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Driver T-Shirt Size
                  </label>
                  <select
                    name="tshirtSize"
                    value={formData.tshirtSize}
                    onChange={handleChange}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600 bg-white"
                  >
                    <option value="M">Medium (M)</option>
                    <option value="L">Large (L)</option>
                    <option value="XL">Extra Large (XL)</option>
                    <option value="XXL">Double Extra Large (XXL)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.kitIssued}
                      onChange={e => setFormData(prev => ({ ...prev, kitIssued: e.target.checked }))}
                      className="w-4 h-4 rounded text-teal-700 focus:ring-teal-600"
                    />
                    Issue Welcome Kit (Bag, Cap, T-Shirt)
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            Enrolled candidates move directly to{' '}
            <span className="font-semibold text-teal-800">Pending PO Review</span> stage.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="candidate-form"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#0d5c63] text-white hover:bg-teal-800 transition-colors shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete Registration & Compile Dossier
            </button>
          </div>
        </div>
      </div>

      {/* DRIVING LICENCE EXPIRED WARNING MODAL */}
      <DlExpiredAlertModal
        isOpen={isDlExpiredModalOpen}
        onClose={() => setIsDlExpiredModalOpen(false)}
        dlNumber={formData.dlNumber}
        dlExpiryDate={formData.dlExpiryDate}
      />
    </div>
  );
};
