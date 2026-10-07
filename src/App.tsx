import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './components/home/HomePage';
import { CandidateList } from './components/candidates/CandidateList';
import { InventoryManagement } from './components/inventory/InventoryManagement';
import { LeaveManagement } from './components/leaves/LeaveManagement';
import { EmployeeDirectory } from './components/employees/EmployeeDirectory';
import { TourExpenseManagement } from './components/travel/TourExpenseManagement';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { CeoLeadershipDashboard } from './components/dashboards/CeoLeadershipDashboard';
import { CeoDashboard } from './components/dashboards/CeoDashboard';
import { OseDashboard } from './components/dashboards/OseDashboard';
import { PoDashboard } from './components/dashboards/PoDashboard';
import { ApmDashboard } from './components/dashboards/ApmDashboard';
import { TrainerDashboard } from './components/dashboards/TrainerDashboard';
import { SelfAttendanceView } from './components/attendance/SelfAttendanceView';
import { ClassroomTrainingModal } from './components/training/ClassroomTrainingModal';
import { BatchAttendanceModal } from './components/training/BatchAttendanceModal';
import { ShieldCheck, Info } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    isLoggedIn,
    currentPersona,
    activeCenter,
    toastMessage,
    batches
  } = useApp();

  // Set default tab based on logged-in role
  const getDefaultTabForRole = (role?: string) => {
    if (role === 'CEO') return 'ceo_national_console';
    if (role === 'GM') return 'ceo_dashboard';
    if (role === 'Senior Manager') return 'apm_regional_console';
    if (role === 'PO') return 'po_audit_desk';
    if (role === 'OSE') return 'ose_workspace';
    if (role === 'Trainer') return 'trainer_workspace';
    return 'candidates';
  };

  const [currentTab, setCurrentTab] = useState<string>(() => getDefaultTabForRole(currentPersona?.role));
  const [isClassroomOpen, setIsClassroomOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  // Sync tab when persona switches
  useEffect(() => {
    if (currentPersona?.role) {
      setCurrentTab(getDefaultTabForRole(currentPersona.role));
    }
  }, [currentPersona?.role]);

  // If user is not logged in / at initial root view, render the Enterprise Public Landing Page
  if (!isLoggedIn) {
    return <HomePage />;
  }

  const currentBatch = batches.find(b => b.centerId === activeCenter.id) || batches[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-700 selection:text-white">
      {/* Top Navigation & Persona Switcher */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenClassroom={() => setIsClassroomOpen(true)}
        onOpenAttendance={() => setIsAttendanceOpen(true)}
      />

      {/* Role Context Notification Bar */}
      <div className="bg-gradient-to-r from-dbs-green-dark to-dbs-green text-white py-2 px-4 text-xs">
        <div className="w-full max-w-[98%] xl:max-w-[1850px] mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-dbs-growth animate-pulse" />
            <span className="font-semibold">Logged in as: {currentPersona.role}</span>
            <span className="text-emerald-300 font-mono font-bold">[{currentPersona.level}]</span>
            <span className="text-white/40">•</span>
            <span className="text-white/80">{currentPersona.name} ({currentPersona.title}) at {activeCenter.name}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-teal-200">
            <span>Daily Batch: <strong className="text-white font-mono">{currentBatch?.batchCode}</strong></span>
            <span>•</span>
            <span>Target: {currentBatch?.enrolledCount}/{currentBatch?.targetCount}</span>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-[98%] xl:max-w-[1850px] mx-auto px-3 sm:px-4 py-3">
        {/* CEO National Command Console (Executive Level 1) */}
        {(currentTab === 'ceo_national_console' || currentTab === 'ceo-command') && <CeoDashboard />}

        {/* CEO Leadership / GM Dashboard with Deep Drilldown & Employee Onboarding */}
        {(currentTab === 'ceo_dashboard' || currentTab === 'ops-drilldown') && <CeoLeadershipDashboard />}

        {/* Senior Manager Regional Console: QC Master Export, Expense Gatekeeper, Leaves & Staff Mobilisation */}
        {currentTab === 'apm_regional_console' && <ApmDashboard />}

        {/* PO Program Officer Compliance & Verification Split-View */}
        {currentTab === 'po_audit_desk' && <PoDashboard />}

        {/* OSE Single-Center Workspace with 3-Way Aadhaar Ingestion */}
        {(currentTab === 'ose_workspace' || currentTab === 'candidate-reg') && <OseDashboard />}

        {/* Trainer Read-Only Desk & 1-Day Training Classroom Console */}
        {currentTab === 'trainer_workspace' && <TrainerDashboard />}

        {/* Candidate List & Document Audit Pipeline */}
        {(currentTab === 'candidates' || currentTab === 'master-pipeline' || currentTab === 'pipeline') && <CandidateList />}

        {/* Center Inventory & Consumables */}
        {(currentTab === 'inventory' || currentTab === 'consumables') && <InventoryManagement />}

        {/* Leaves & Comp-Off Ledger */}
        {(currentTab === 'leaves' || currentTab === 'leaves-governance') && <LeaveManagement />}

        {/* Employee Self-Attendance System (Zero Supervisor / Manual Intervention) */}
        {currentTab === 'attendance' && <SelfAttendanceView />}

        {/* Employee Directory / Staff Roster */}
        {(currentTab === 'employees' || currentTab === 'staff-roster') && <EmployeeDirectory />}

        {/* Official Tour & Expense Reimbursements */}
        {(currentTab === 'tours' || currentTab === 'tours-finance') && <TourExpenseManagement />}

        {/* General Management HQ Board */}
        {(currentTab === 'executive' || currentTab === 'hq-board') && (
          <ExecutiveDashboard
            onNavigateToCandidates={() => setCurrentTab('candidates')}
            onNavigateToInventory={() => setCurrentTab('inventory')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-12">
        <div className="w-full max-w-[98%] xl:max-w-[1850px] mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-dbs-green flex items-center justify-center text-white text-[10px] font-bold">
              DB
            </div>
            <p className="font-semibold text-slate-700">
              DB Skills Multi-Center Commercial Vehicle Driver Training & Verification System
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Version 4.2 Enterprise Release</span>
            <span>•</span>
            <span>National Skill Development Standards Compliance</span>
          </div>
        </div>
      </footer>

      {/* Classroom Training Interactive Slide Deck Modal */}
      <ClassroomTrainingModal
        isOpen={isClassroomOpen}
        onClose={() => setIsClassroomOpen(false)}
        batchCode={currentBatch?.batchCode || 'DBS-RJ01-2609-B1'}
        trainerName={currentBatch?.trainerName || 'Vikram Singh Rathore'}
      />

      {/* Batch Attendance & Live Photo Evidence Modal */}
      <BatchAttendanceModal
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        batchId={currentBatch?.id || ''}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
