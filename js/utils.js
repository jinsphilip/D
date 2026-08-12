// ---------------------------------------------------------------------------
// Nikhila Engineering — Attendance & Payroll Management System
// Data model, localStorage persistence, seed data & calculation engine
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  sites: 'nep_sites',
  employees: 'nep_employees',
  attendance: 'nep_attendance',
  settings: 'nep_settings',
};

const DEPARTMENTS = ['Operations', 'Engineering', 'Quality Control', 'Logistics', 'Administration'];
const SITE_STATUSES = ['Active', 'On Hold', 'Completed'];
const OT_LEVELS = [0, 1.0, 1.5];
const ATTENDANCE_STATUSES = ['present', 'halfday', 'absent'];

function pad2(n) { return String(n).padStart(2, '0'); }

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function nextEmployeeId(employees) {
  let max = 100;
  employees.forEach((e) => {
    const m = /^EMP(\d+)$/.exec(e.id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `EMP${max + 1}`;
}

function nextSiteId(sites) {
  let max = 100;
  sites.forEach((s) => {
    const m = /^SITE-(\d+)$/.exec(s.id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `SITE-${max + 1}`;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

function seedSites() {
  return [
    { id: 'SITE-101', name: 'Downtown Commercial Hub', location: 'Sector 12, Metro City', status: 'Active' },
    { id: 'SITE-102', name: 'Riverside Residential Tower', location: 'Riverside Avenue', status: 'Active' },
    { id: 'SITE-103', name: 'Industrial Park Extension', location: 'Zone 7, Industrial Belt', status: 'On Hold' },
    { id: 'SITE-104', name: 'Highway Bridge Project', location: 'NH-44, Km 212', status: 'Completed' },
  ];
}

function seedEmployees() {
  return [
    { id: 'EMP101', name: 'Alexander Wright', department: 'Operations', designation: 'Supervisor', baseSalary: 45000, phone: '+1 555-0192', joinDate: '2023-01-15', status: 'Active', siteId: 'SITE-101' },
    { id: 'EMP102', name: 'Maria Gonzalez', department: 'Engineering', designation: 'Site Engineer', baseSalary: 52000, phone: '+1 555-0234', joinDate: '2023-03-10', status: 'Active', siteId: 'SITE-101' },
    { id: 'EMP103', name: 'David Chen', department: 'Quality Control', designation: 'QC Inspector', baseSalary: 38000, phone: '+1 555-0345', joinDate: '2023-05-20', status: 'Active', siteId: 'SITE-102' },
    { id: 'EMP104', name: 'Priya Sharma', department: 'Logistics', designation: 'Logistics Coordinator', baseSalary: 34000, phone: '+1 555-0456', joinDate: '2023-02-01', status: 'Active', siteId: 'SITE-102' },
    { id: 'EMP105', name: "James O'Brien", department: 'Operations', designation: 'Foreman', baseSalary: 40000, phone: '+1 555-0567', joinDate: '2022-11-11', status: 'Active', siteId: 'SITE-103' },
    { id: 'EMP106', name: 'Fatima Al-Sayed', department: 'Engineering', designation: 'Junior Engineer', baseSalary: 30000, phone: '+1 555-0678', joinDate: '2024-01-08', status: 'Active', siteId: 'SITE-101' },
    { id: 'EMP107', name: 'Robert Kim', department: 'Logistics', designation: 'Driver', baseSalary: 26000, phone: '+1 555-0789', joinDate: '2023-08-19', status: 'Active', siteId: 'SITE-104' },
    { id: 'EMP108', name: 'Elena Petrova', department: 'Quality Control', designation: 'Safety Officer', baseSalary: 36000, phone: '+1 555-0890', joinDate: '2023-06-30', status: 'Active', siteId: 'SITE-102' },
  ];
}

function seedAttendance() {
  const today = todayISO();
  return {
    [today]: {
      EMP101: { status: 'present', otCount: 1.0, note: '' },
      EMP102: { status: 'present', otCount: 0, note: '' },
      EMP103: { status: 'present', otCount: 1.5, note: '' },
      EMP104: { status: 'halfday', otCount: 0, note: 'Left early' },
      EMP105: { status: 'absent', otCount: 0, note: 'Medical leave' },
      EMP106: { status: 'present', otCount: 0, note: '' },
    },
  };
}

function seedSettings() {
  return {
    currency: '$',
    daysInMonthMode: '26',
    defaultOtMultiplier: 1.5,
    companyName: 'Nikhila Engineering',
    companyAddress: '100 Enterprise Way, Suite 400',
  };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function loadState(key, seedFn) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse localStorage key', key, e);
  }
  const seeded = seedFn();
  try { localStorage.setItem(key, JSON.stringify(seeded)); } catch (e) {}
  return seeded;
}

function saveState(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

// ---------------------------------------------------------------------------
// Calculation engine
// ---------------------------------------------------------------------------

function daysInCalendarMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function getWorkingDaysInMonth(monthStr, mode) {
  if (mode === '30') return 30;
  if (mode === 'actual') {
    const [y, m] = monthStr.split('-').map(Number);
    const total = new Date(y, m, 0).getDate();
    let count = 0;
    for (let d = 1; d <= total; d++) {
      if (new Date(y, m - 1, d).getDay() !== 0) count++;
    }
    return count;
  }
  return 26; // Standard 26-day mode (default)
}

// Aggregate an employee's attendance stats for a given YYYY-MM month
function getMonthAttendanceStats(employeeId, monthStr, attendance) {
  const total = daysInCalendarMonth(monthStr);
  let presentDays = 0, halfDays = 0, absentDays = 0, otUnits = 0, loggedDays = 0;
  for (let d = 1; d <= total; d++) {
    const dateKey = `${monthStr}-${pad2(d)}`;
    const record = attendance[dateKey] && attendance[dateKey][employeeId];
    if (!record) continue;
    loggedDays++;
    if (record.status === 'present') presentDays++;
    else if (record.status === 'halfday') halfDays++;
    else if (record.status === 'absent') absentDays++;
    otUnits += Number(record.otCount) || 0;
  }
  return { presentDays, halfDays, absentDays, otUnits, loggedDays };
}

// Full payroll computation for one employee for one month, per spec formulas
function calculateEmployeePayroll(employee, monthStr, attendance, settings) {
  const workingDays = getWorkingDaysInMonth(monthStr, settings.daysInMonthMode);
  const dailyRate = workingDays > 0 ? employee.baseSalary / workingDays : 0;
  const stats = getMonthAttendanceStats(employee.id, monthStr, attendance);

  const absentDeduction = stats.absentDays * dailyRate;
  const halfDayDeduction = stats.halfDays * 0.5 * dailyRate;
  const totalDeductions = absentDeduction + halfDayDeduction;

  const otMultiplier = Number(settings.defaultOtMultiplier) || 1;
  const otEarnings = stats.otUnits * otMultiplier * dailyRate;

  const netPayable = Math.max(0, employee.baseSalary - totalDeductions + otEarnings);

  return {
    workingDays,
    dailyRate,
    ...stats,
    absentDeduction,
    halfDayDeduction,
    totalDeductions,
    otMultiplier,
    otEarnings,
    baseSalary: employee.baseSalary,
    netPayable,
  };
}

function formatCurrency(amount, symbol) {
  const n = Number(amount) || 0;
  return `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function monthLabel(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function dateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
