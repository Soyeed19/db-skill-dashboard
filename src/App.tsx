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
import { ShieldCheck, Info, Wrench, Lock, Server, Clock } from 'lucide-react';
import { DbSkillsLogo } from './components/common/DbSkillsLogo';

const IS_MAINTENANCE_MODE = false;

const MaintenanceScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-[#007A3D] selection:text-white">
      {/* Top Authority Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white px-2.5 py-1 rounded-xs shadow-xs flex items-center">
              <DbSkillsLogo className="h-7 w-auto" />
            </div>
            <div className="border-l border-slate-700 pl-3">
              <p className="text-xs font-bold tracking-wider uppercase text-slate-200">
                DB Skills Operational Governance Portal
              </p>
              <p className="text-[11px] text-slate-400">
                Commercial Vehicle Driver Training &amp; Verification System
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Maintenance Active
          </div>
        </div>
      </header>

      {/* Main Maintenance Notice Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-sm shadow-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#007A3D] via-amber-500 to-[#007A3D]" />

          <div className="p-6 sm:p-8">
            <div className="w-12 h-12 rounded-sm bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
              <Wrench className="w-6 h-6" />
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400 mb-2">
              <Lock className="w-3.5 h-3.5" />
              System Gate Locked • Scheduled Upgrade
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-3">
              System Undergoing Scheduled Maintenance
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              The DB Skills National Command &amp; Center Operations Portal is currently locked for scheduled infrastructure maintenance, production database schema synchronization, and security hardening. All live candidate mutations and regional console sessions are temporarily paused.
            </p>

            {/* Operational Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xs p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-1">
                  <Server className="w-3.5 h-3.5 text-[#62B548]" />
                  <span>Cloud Database &amp; RLS</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  PostgreSQL Row-Level Security &amp; center-scoped policies protected.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xs p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Session Access</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Email OTP authentication will resume immediately post-window.
                </p>
              </div>
            </div>

            {/* Executive Contact / Technical Notice */}
            <div className="bg-slate-950 border border-slate-800 rounded-xs p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
              <div>
                <span className="font-semibold text-slate-300">Executive Administrator:</span>{' '}
                <span className="font-mono text-emerald-400">soyeed12@gmail.com</span>
              </div>
              <div className="font-mono text-[10px] text-slate-500">
                FLAG: IS_MAINTENANCE_MODE = true
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-[11px] text-slate-500">
        DB Skills Multi-Center Commercial Vehicle Driver Training &amp; Verification System • Enterprise Governance Release
      </footer>
    </div>
  );
};

const AppContent: React.FC = () => {
  const {
    isAuthLoading,
    isLoggedIn,
    authSession,
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

  // Sync tab when authenticated role resolves
  useEffect(() => {
    if (currentPersona?.role) {
      setCurrentTab(getDefaultTabForRole(currentPersona.role));
    }
  }, [currentPersona?.role]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600">
          <ShieldCheck className="w-4 h-4 text-[#007A3D] animate-pulse" />
          <span>Verifying Supabase Session...</span>
        </div>
      </div>
    );
  }

  // Strict Authentication Gate: If supabase.auth.getSession() is null, render ONLY the Login screen.
  if (!isLoggedIn || !authSession) {
    return <HomePage />;
  }

  const currentBatch = batches.find(b => b.centerId === activeCenter.id) || batches[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-700 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenClassroom={() => setIsClassroomOpen(true)}
        onOpenAttendance={() => setIsAttendanceOpen(true)}
      />

      {/* Role Context Notification Bar */}
      <div className="bg-[#007A3D] text-white py-1.5 px-4 text-xs border-b border-[#005C2E]">
        <div className="w-full max-w-[98%] xl:max-w-[1850px] mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-xs bg-[#62B548]" />
            <span className="font-semibold">Authenticated Role: {currentPersona.role}</span>
            <span className="text-emerald-200 font-mono font-bold">[{currentPersona.level}]</span>
            <span className="text-white/40">•</span>
            <span className="text-white/90">{currentPersona.name} ({currentPersona.email}) at {activeCenter.name}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-100">
            <span>Daily Batch: <strong className="text-white font-mono">{currentBatch?.batchCode || 'N/A'}</strong></span>
            <span>•</span>
            <span>Target: {currentBatch?.enrolledCount ?? 0}/{currentBatch?.targetCount ?? 30}</span>
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
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 mt-8">
        <div className="w-full max-w-[98%] xl:max-w-[1850px] mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-xs bg-[#007A3D] flex items-center justify-center text-white text-[10px] font-bold">
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
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-3.5 py-2.5 rounded-sm shadow-md border border-slate-700 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  if (IS_MAINTENANCE_MODE) {
    return <MaintenanceScreen />;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
