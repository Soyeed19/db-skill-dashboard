import React, { useState } from 'react';
import {
  X,
  Camera,
  MapPin,
  Clock,
  CheckCircle,
  Users,
  Upload,
  UserCheck,
  Building
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus } from '../../types';

interface BatchAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
}

export const BatchAttendanceModal: React.FC<BatchAttendanceModalProps> = ({
  isOpen,
  onClose,
  batchId
}) => {
  const {
    batches,
    candidates,
    updateBatchAttendance,
    uploadBatchPhoto,
    activeCenter,
    currentPersona,
    showToast
  } = useApp();

  const currentBatch = batches.find(b => b.id === batchId) || batches[0];
  const batchCandidates = candidates.filter(c => c.batchId === currentBatch?.id);

  // Attendance state map
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {};
    batchCandidates.forEach(c => {
      map[c.id] = c.attendanceStatus || 'Present';
    });
    return map;
  });

  // Selected candidate for holding ID photo
  const [selectedCandidateForPhoto, setSelectedCandidateForPhoto] = useState<string>(
    batchCandidates[0]?.id || ''
  );

  // Simulated GPS watermark
  const currentTime = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' }) + ' IST';
  const gpsCoord = {
    lat: activeCenter.latitude,
    lng: activeCenter.longitude,
    locationName: `${activeCenter.name}, Hall 1`
  };

  const [classroomPreview, setClassroomPreview] = useState<string>(
    currentBatch?.classroomPhotoUrl ||
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80'
  );

  const [driverHoldingIdPreview, setDriverHoldingIdPreview] = useState<string>(
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80'
  );

  if (!isOpen || !currentBatch) return null;

  const handleStatusChange = (candidateId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [candidateId]: status }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newMap: Record<string, AttendanceStatus> = {};
    batchCandidates.forEach(c => {
      newMap[c.id] = status;
    });
    setAttendanceMap(newMap);
  };

  const handleSaveAttendance = () => {
    updateBatchAttendance(currentBatch.id, attendanceMap);
    onClose();
  };

  const handleSimulateClassroomUpload = () => {
    // We update with an active classroom photo and stamped GPS
    const samplePhotos = [
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80'
    ];
    const picked = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    setClassroomPreview(picked);
    uploadBatchPhoto(currentBatch.id, 'classroom', picked, gpsCoord);
  };

  const handleSimulateDriverIdUpload = () => {
    if (!selectedCandidateForPhoto) {
      showToast('Please select a driver from the dropdown first.');
      return;
    }
    const samplePhotos = [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'
    ];
    const picked = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    setDriverHoldingIdPreview(picked);
    uploadBatchPhoto(currentBatch.id, 'driverId', picked, gpsCoord, selectedCandidateForPhoto);
  };

  const presentCount = Object.values(attendanceMap).filter(v => v === 'Present' || v === 'Late').length;
  const absentCount = Object.values(attendanceMap).filter(v => v === 'Absent').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-dbs-green-dark to-dbs-green text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <UserCheck className="w-5 h-5 text-dbs-growth-light" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Trainer Classroom Operations
                </span>
                <span className="text-white/40">•</span>
                <span className="text-xs font-mono text-white/80">{currentBatch.batchCode}</span>
              </div>
              <h3 className="text-lg font-bold">1-Day Batch Attendance Roll-Call & Photo Evidence</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split into Attendance Table & Photo Proof Section */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Roll Call Sheet (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Physical Register Cross-Verification</h4>
                <p className="text-xs text-slate-500">
                  Verify against printed physical sheet: {presentCount} Present / {absentCount} Absent
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll('Present')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Absent')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {batchCandidates.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No candidates currently enrolled in this batch.
                  </div>
                ) : (
                  batchCandidates.map((cand, idx) => {
                    const status = attendanceMap[cand.id] || 'Present';
                    return (
                      <div
                        key={cand.id}
                        className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-400 w-5">
                            {idx + 1}.
                          </span>
                          <img
                            src={cand.photoUrl}
                            alt={cand.fullName}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{cand.fullName}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              DL: {cand.dlNumber} • Reg: {cand.registrationNumber.slice(-8)}
                            </p>
                          </div>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(cand.id, 'Present')}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                              status === 'Present'
                                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(cand.id, 'Late')}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                              status === 'Late'
                                ? 'bg-amber-500 text-white shadow-xs font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(cand.id, 'Absent')}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                              status === 'Absent'
                                ? 'bg-rose-600 text-white shadow-xs font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Attendance Summary Banner */}
            <div className="p-3 bg-teal-50/70 border border-teal-200/60 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-teal-900">
                <Users className="w-4 h-4 text-teal-700" />
                <span className="font-semibold">Batch Strength:</span>
                <span>{batchCandidates.length} Enrolled</span>
                <span className="text-teal-400">|</span>
                <span className="text-emerald-700 font-bold">{presentCount} Attending Live</span>
              </div>
              <span className="text-slate-500">Trainer: {currentPersona.name}</span>
            </div>
          </div>

          {/* Right Column: Photo Proofs with Auto-Stamped GPS & Time (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-5 border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-6 pt-4 lg:pt-0">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Live Photo Evidence Upload</h4>
              <p className="text-xs text-slate-500">
                Required audit proof with auto-stamped GPS coordinates, date, and center code.
              </p>
            </div>

            {/* Proof 1: Live Classroom Group Photo */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-teal-700" />
                  1. Live Classroom Group Photo
                </span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  GPS Auto-Stamped
                </span>
              </div>

              {/* Watermarked Preview Container */}
              <div className="relative rounded-lg overflow-hidden border border-slate-300 aspect-video bg-slate-900">
                <img
                  src={classroomPreview}
                  alt="Classroom Live Proof"
                  className="w-full h-full object-cover"
                />

                {/* Overlaid Watermark Banner (Auto-stamped as specified) */}
                <div className="absolute bottom-0 inset-x-0 bg-black/75 backdrop-blur-xs text-white p-2 text-[10px] space-y-0.5 leading-tight">
                  <div className="flex items-center justify-between text-emerald-300 font-mono font-bold">
                    <span>DB SKILLS • {activeCenter.code}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {currentTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-200">
                    <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    <span className="truncate">
                      GPS: {gpsCoord.lat.toFixed(4)}°N, {gpsCoord.lng.toFixed(4)}°E ({activeCenter.city})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateClassroomUpload}
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Capture / Upload Classroom Photo
                </button>
              </div>
            </div>

            {/* Proof 2: Driver Holding ID Card */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-teal-700" />
                  2. Driver Holding ID Card Photo
                </span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Biometric Proof
                </span>
              </div>

              {/* Candidate selector */}
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Select Driver for In-Person ID Proof:
                </label>
                <select
                  value={selectedCandidateForPhoto}
                  onChange={e => setSelectedCandidateForPhoto(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-1.5 focus:outline-teal-600"
                >
                  {batchCandidates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.dlNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-slate-300 h-32 bg-slate-900 flex items-center justify-center">
                <img
                  src={driverHoldingIdPreview}
                  alt="Driver Holding ID"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white px-2 py-1 text-[10px] flex items-center justify-between font-mono">
                  <span>DRIVER ID CHECK</span>
                  <span className="text-emerald-400">PASSED</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulateDriverIdUpload}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Camera className="w-3.5 h-3.5 text-teal-600" />
                Capture Trainee Holding Physical ID
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            Roll-call records sync directly with the central DB Skills audit logbook.
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
              type="button"
              onClick={handleSaveAttendance}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-dbs-green text-white hover:bg-dbs-green-dark transition-colors shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              Save Attendance & Photo Evidence
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
