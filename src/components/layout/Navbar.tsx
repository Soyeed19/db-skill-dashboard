import React, { useState } from 'react';
import {
  Shield,
  Building2,
  UserCheck,
  ChevronDown,
  Layers,
  GraduationCap,
  Users,
  Package,
  CalendarDays,
  Briefcase,
  BarChart3,
  CheckCircle,
  Camera,
  LogOut,
  MapPin,
  Clock,
  Lock,
  UserPlus,
  Compass,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { EmployeeSelfAttendanceModal } from '../attendance/EmployeeSelfAttendanceModal';
import { DbSkillsLogo } from '../common/DbSkillsLogo';
import { CreateHubModal, isAuthorizedForHubCreation } from '../CreateHubModal';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenClassroom: () => void;
  onOpenAttendance: () => void;
}

interface NavTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: Array<UserRole>;
}

const ALL_NAV_TABS: NavTab[] = [
  // CEO & Executive Command Specific Tabs
  {
    id: 'ceo_national_console',
    label: 'National Command',
    icon: Compass,
    allowedRoles: ['CEO']
  },
  {
    id: 'ceo_dashboard',
    label: 'Operations Drilldown',
    icon: BarChart3,
    allowedRoles: ['CEO', 'GM']
  },
  {
    id: 'executive',
    label: 'HQ Board / Governance',
    icon: Building2,
    allowedRoles: ['CEO']
  },

  // Regional & Management Consoles
  {
    id: 'apm_regional_console',
    label: 'Senior Manager Console',
    icon: Shield,
    allowedRoles: ['Senior Manager']
  },
  {
    id: 'po_audit_desk',
    label: 'PO Audit Desk',
    icon: CheckCircle,
    allowedRoles: ['PO', 'Senior Manager']
  },

  // Field & Branch Staff Tabs
  {
    id: 'ose_workspace',
    label: 'Candidate Registration Desk',
    icon: UserPlus,
    allowedRoles: ['OSE']
  },
  {
    id: 'trainer_workspace',
    label: 'Trainer Desk & Batch Roster',
    icon: GraduationCap,
    allowedRoles: ['Trainer']
  },
  {
    id: 'candidates',
    label: 'Drivers & Audit Pipeline',
    icon: Users,
    allowedRoles: ['OSE', 'Trainer', 'PO', 'Senior Manager', 'GM']
  },
  {
    id: 'inventory',
    label: 'Consumables & Stock',
    icon: Package,
    allowedRoles: ['OSE', 'Trainer', 'PO']
  },
  {
    id: 'leaves',
    label: 'Leaves & Comp-Off',
    icon: CalendarDays,
    allowedRoles: ['OSE', 'Trainer', 'PO', 'Senior Manager', 'GM']
  },
  {
    id: 'employees',
    label: 'Staff Roster & HR',
    icon: UserCheck,
    allowedRoles: ['GM']
  },
  {
    id: 'attendance',
    label: 'Self-Attendance & Staff',
    icon: UserCheck,
    allowedRoles: ['OSE', 'Trainer', 'PO', 'Senior Manager']
  },
  {
    id: 'tours',
    label: 'Tours & Expenses',
    icon: Briefcase,
    allowedRoles: ['OSE', 'Trainer', 'PO', 'Senior Manager', 'GM']
  }
];

// Clean GM Permissions List for management and sanction tabs
const GM_ALLOWED_TABS = [
  'ops-drilldown',       // Regional Performance & Hub Metrics (ceo_dashboard)
  'tours-finance',       // Stage-2 Financial Grants & NEFT Disbursements (tours)
  'master-pipeline',     // Read-Only Driver Audit & QC Master Ledger (candidates)
  'staff-roster',        // HR Provisioning / Add New Employee (employees)
  'leaves-governance'    // Senior Staff Leave Sanctions (leaves)
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenClassroom,
  onOpenAttendance
}) => {
  const {
    currentPersona,
    setCurrentPersona,
    personas,
    activeCenter,
    setActiveCenter,
    centers,
    addCenter,
    logoutToLanding,
    loginAsPersona
  } = useApp();

  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [isCenterMenuOpen, setIsCenterMenuOpen] = useState(false);
  const [isSelfPunchModalOpen, setIsSelfPunchModalOpen] = useState(false);
  const [isCreateHubOpen, setIsCreateHubOpen] = useState(false);

  // Strict RBAC: Hub creation authorized for GM Operations, Operations Head, Admin / CEO only
  const isHubCreationAllowed = isAuthorizedForHubCreation(currentPersona.role);

  // Strict Center Scoping check: OSE & Trainer can ONLY see their assigned center
  const isOse = currentPersona.role === 'OSE';
  const isTrainer = currentPersona.role === 'Trainer';
  const isLockedCenter = isOse || isTrainer;

  // Filter top navigation tabs strictly by currently logged-in role
  const visibleTabs = ALL_NAV_TABS.filter((tab) => {
    if (currentPersona.role === 'GM') {
      // Map canonical IDs to GM_ALLOWED_TABS
      const tabKeyMap: Record<string, string> = {
        'ceo_dashboard': 'ops-drilldown',
        'ops-drilldown': 'ops-drilldown',
        'tours': 'tours-finance',
        'tours-finance': 'tours-finance',
        'candidates': 'master-pipeline',
        'master-pipeline': 'master-pipeline',
        'employees': 'staff-roster',
        'staff-roster': 'staff-roster',
        'leaves': 'leaves-governance',
        'leaves-governance': 'leaves-governance'
      };
      const mappedKey = tabKeyMap[tab.id] || tab.id;
      return GM_ALLOWED_TABS.includes(mappedKey);
    }
    return tab.allowedRoles.includes(currentPersona.role);
  });

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* Top Banner */}
      <div className="w-full max-w-[98%] xl:max-w-[1850px] mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Portal Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <DbSkillsLogo className="h-10 w-auto" />

            <div>
              <div className="flex items-center">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg leading-tight">
                  DB SKILLS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block leading-tight mt-0.5">
                Safer Roads | Generate Livelihood | Change Lives
              </p>
            </div>
          </div>

          {/* CRITICAL DIRECTIVE: Explicit Logged In As Banner */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xs bg-[#E6F4EA] border border-[#007A3D]/30 text-xs text-[#005C2E] truncate">
            <span className="w-2 h-2 rounded-xs bg-[#007A3D] shrink-0" />
            <span className="truncate">
              Logged in as:{' '}
              <strong className="text-[#007A3D] font-bold">{currentPersona.role === 'CEO' ? 'CEO - National Command' : currentPersona.role}</strong>
              {' '}-{' '}
              <span className="font-medium text-slate-700">{currentPersona.name}</span>
            </span>
          </div>

          {/* Right Controls: Center Scoping, Persona Switcher & Self-Punch */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Self-Attendance GPS Punch Button (Single Source of Truth for Operational Roles) */}
            {currentPersona.role !== 'CEO' && (
              <button
                type="button"
                onClick={() => setIsSelfPunchModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xs bg-[#007A3D] hover:bg-[#005C2E] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                title="Single Source of Truth: Record Self-Attendance with Live GPS & Watermarked Selfie"
              >
                <Camera className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="font-bold">Self Punch</span>
              </button>
            )}

            {/* Center Selector Dropdown (STRICTLY CONFINED for OSE & Trainer) */}
            {isLockedCenter ? (
              // OSE & Trainer: Strict Center Scoping - Cross-center selector hidden/locked
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700">
                <Lock className="w-3 h-3 text-[#F15A24] shrink-0" />
                <span className="font-bold">{activeCenter.name}</span>
                <span className="text-[10px] font-mono bg-[#E0F2FE] text-[#0284C7] px-1.5 py-0.5 rounded-xs font-bold">
                  {activeCenter.code}
                </span>
              </div>
            ) : (
              // Management / Regional Officers: Center Selector Dropdown
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsCenterMenuOpen(!isCenterMenuOpen);
                    setIsPersonaMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#007A3D] shrink-0" />
                  <span className="hidden lg:inline">{activeCenter.name}</span>
                  <span className="lg:hidden font-mono">{activeCenter.code}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isCenterMenuOpen && (
                  <div className="absolute right-0 mt-1 w-64 bg-white rounded-sm shadow-md border border-slate-300 py-1 z-50 text-xs">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      Select Training Hub
                    </div>
                    {centers.map(ctr => (
                      <button
                        key={ctr.id}
                        onClick={() => {
                          setActiveCenter(ctr);
                          setIsCenterMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 ${
                          activeCenter.id === ctr.id ? 'bg-[#E6F4EA] font-bold text-[#005C2E]' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <p>{ctr.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{ctr.code} • {ctr.city}</p>
                        </div>
                        {activeCenter.id === ctr.id && (
                          <CheckCircle className="w-3.5 h-3.5 text-[#007A3D]" />
                        )}
                      </button>
                    ))}
                    {isHubCreationAllowed && (
                      <div className="p-2 border-t border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreateHubOpen(true);
                            setIsCenterMenuOpen(false);
                          }}
                          className="w-full py-1.5 px-2 bg-[#007A3D] hover:bg-[#005C2E] text-white rounded-xs text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create New Training Hub</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Persona Switcher & Exit to Landing */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsPersonaMenuOpen(!isPersonaMenuOpen);
                  setIsCenterMenuOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 transition-colors"
              >
                <img
                  src={currentPersona.avatar}
                  alt={currentPersona.name}
                  className="w-5 h-5 rounded-xs object-cover border border-slate-300 shrink-0"
                />
                <span className="hidden sm:inline font-bold">{currentPersona.role}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {isPersonaMenuOpen && (
                <div className="absolute right-0 mt-1 w-72 bg-white rounded-sm shadow-md border border-slate-300 py-1 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 flex items-center justify-between">
                    <span>Switch Active Persona</span>
                    <button
                      onClick={() => {
                        setIsPersonaMenuOpen(false);
                        logoutToLanding();
                      }}
                      className="text-[#007A3D] hover:underline font-bold"
                    >
                      Exit to Portal
                    </button>
                  </div>

                  {personas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        loginAsPersona(p);
                        setIsPersonaMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${
                        currentPersona.id === p.id
                          ? 'bg-[#E6F4EA] font-bold text-[#005C2E] border-l-3 border-[#007A3D]'
                          : 'text-slate-700'
                      }`}
                    >
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-7 h-7 rounded-xs object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold truncate">{p.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-slate-100 text-slate-700 font-bold border border-slate-200">
                            {p.role === 'CEO' ? 'CEO - National Command' : p.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{p.title}</p>
                      </div>
                    </button>
                  ))}

                  <div className="border-t border-slate-200 mt-1 pt-1 px-2">
                    <button
                      onClick={() => {
                        setIsPersonaMenuOpen(false);
                        logoutToLanding();
                      }}
                      className="w-full py-1.5 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Back to Welcome Portal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between overflow-x-auto py-1 border-t border-slate-200 gap-2">
          <nav className="flex items-center gap-1 overflow-x-auto py-0.5">
            {visibleTabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-2.5 py-1 rounded-sm text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-[#007A3D] text-white border-[#005C2E]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Trainer / Ops Action Buttons (Hidden for CEO Executive Command) */}
          {currentPersona.role !== 'CEO' && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                onClick={onOpenClassroom}
                className="px-2.5 py-1 rounded-sm text-xs font-bold bg-[#007A3D] text-white hover:bg-[#005C2E] transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer border border-[#005C2E]"
                title="Launch 1-Day Classroom Safety Presentation Deck"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden sm:inline">1-Day Slide Deck</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Modal for Self-Punch from anywhere */}
    <EmployeeSelfAttendanceModal
      isOpen={isSelfPunchModalOpen}
      onClose={() => setIsSelfPunchModalOpen(false)}
    />

    {/* Strictly Restricted Create Training Hub Modal (GM Operations & Executive Admin only) */}
    {isHubCreationAllowed && (
      <CreateHubModal
        isOpen={isCreateHubOpen}
        onClose={() => setIsCreateHubOpen(false)}
        userRole={currentPersona.role}
        onHubCreated={(hubData) => {
          const newHub = addCenter({
            code: hubData.code || hubData.centerCode,
            name: hubData.name || hubData.centerName,
            city: hubData.city,
            state: hubData.state,
            address: hubData.address || `${hubData.city}, ${hubData.state}`,
            latitude: Number(hubData.latitude) || 26.9124,
            longitude: Number(hubData.longitude) || 75.7873,
            geofenceRadiusMeters: Number(hubData.geofenceRadiusMeters) || 150,
            poName: hubData.inChargeName || 'Designated PO',
            apmName: 'Designated Manager',
            contactNumber: hubData.contactNumber,
            email: hubData.email,
            capacity: Number(hubData.capacity) || 40,
            inChargeName: hubData.inChargeName,
            status: 'ACTIVE',
            createdAt: hubData.createdAt || new Date().toISOString()
          });
          setActiveCenter(newHub);
        }}
      />
    )}
  </>
);
};
