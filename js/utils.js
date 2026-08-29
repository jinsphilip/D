// ---------------------------------------------------------------------------
// Nikhila Engineering — Attendance & Payroll Management System
// Data model, localStorage persistence, seed data & calculation engine
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  sites: 'nep_sites',
  employees: 'nep_employees',
  attendance: 'nep_attendance',
  settings: 'nep_settings',
  messes: 'nep_messes',
  messExpenses: 'nep_mess_expenses',
  advances: 'nep_advances',
  salaryRevisions: 'nep_salary_revisions',
  travelRecords: 'nep_travel_records',
};

const ROLES = ['Technician', 'Senior Technician'];
const SITE_STATUSES = ['Active', 'On Hold', 'Completed'];
const MESS_STATUSES = ['Active', 'Inactive'];
const OT_LEVELS = [0.5, 1.0, 1.5, 2.0];
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

function nextMonthStr(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m, 1); // m is already "next month index" in 0-based terms
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function prevMonthStr(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
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

function nextMessId(messes) {
  let max = 0;
  messes.forEach((m) => {
    const match = /^MESS-(\d+)$/.exec(m.id);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  });
  return `MESS-${max + 1}`;
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
    { id: 'EMP101', name: 'MD Jahid', designation: 'Senior Technician', baseSalary: 20000, phone: '+91 9035553614', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP102', name: 'Pankaj Kumar', designation: 'Senior Technician', baseSalary: 21000, phone: '+91 9071907667', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP103', name: 'Umesh Paswan', designation: 'Senior Technician', baseSalary: 18000, phone: '+91 9611950241', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP104', name: 'Baldev Paswan', designation: 'Senior Technician', baseSalary: 19000, phone: '+91 9535327590', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP105', name: 'Rajan Paswan', designation: 'Senior Technician', baseSalary: 19500, phone: '+91 9113059237', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP106', name: 'MD Sahid', designation: 'Senior Technician', baseSalary: 19000, phone: '+91 9743168417', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP107', name: 'Raja Kumar', designation: 'Senior Technician', baseSalary: 19000, phone: '+91 8073761560', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP108', name: 'Akash Kumar', designation: 'Senior Technician', baseSalary: 16000, phone: '+91 7090035519', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP109', name: 'Vinod Kumar', designation: 'Senior Technician', baseSalary: 17000, phone: '+91 8581821061', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP110', name: 'Dinesh Kumar', designation: 'Senior Technician', baseSalary: 17000, phone: '+91 6362503412', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP111', name: 'Rajeev Paswan', designation: 'Senior Technician', baseSalary: 18500, phone: '+91 8496841450', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP112', name: 'Rahul Paswan', designation: 'Senior Technician', baseSalary: 18000, phone: '+91 6801091650', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP113', name: 'Saajan Paswan', designation: 'Senior Technician', baseSalary: 17000, phone: '+91 6202427151', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP114', name: 'Aman Kumar', designation: 'Technician', baseSalary: 14500, phone: '+91 7667025720', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP115', name: 'Suraj Paswan', designation: 'Technician', baseSalary: 14500, phone: '+91 7902668864', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP116', name: 'Rahul Kumar', designation: 'Technician', baseSalary: 14000, phone: '+91 7019199214', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP117', name: 'Dileep Paswan', designation: 'Technician', baseSalary: 13500, phone: '+91 6366714657', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP118', name: 'Vijay Kumar', designation: 'Senior Technician', baseSalary: 25000, phone: '+91 9110056458', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP119', name: 'Budhan Paswan', designation: 'Senior Technician', baseSalary: 24000, phone: '+91 8310438975', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP120', name: 'Anil Kumar', designation: 'Senior Technician', baseSalary: 24000, phone: '+91 9704693195', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP121', name: 'Vikaram Kumar', designation: 'Technician', baseSalary: 13000, phone: '+91 631713694', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP122', name: 'Ashik Kumr', designation: 'Technician', baseSalary: 12000, phone: '+91 9234169435', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP123', name: 'Munna Paswan', designation: 'Senior Technician', baseSalary: 18000, phone: '+91 6202217454', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP124', name: 'Rajan Kumar', designation: 'Technician', baseSalary: 14500, phone: '', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP125', name: 'Krishna Kumar', designation: 'Technician', baseSalary: 12000, phone: '', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP126', name: 'Rohit Kumar', designation: 'Technician', baseSalary: 13000, phone: '', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
    { id: 'EMP127', name: 'Vivek Kumar', designation: 'Technician', baseSalary: 13000, phone: '', joinDate: '2026-08-29', status: 'Active', siteId: null, messId: null },
  ];
}

function seedMesses() {
  return [
    { id: 'MESS-1', name: 'North Block Mess', location: 'Near Downtown Commercial Hub', status: 'Active' },
    { id: 'MESS-2', name: 'Riverside Canteen', location: 'Near Riverside Residential Tower', status: 'Active' },
    { id: 'MESS-3', name: 'Central Workers Mess', location: 'Zone 7, Industrial Belt', status: 'Active' },
  ];
}

function seedMessExpenses() {
  return {};
}

function seedAdvances() {
  return [];
}

function seedSalaryRevisions() {
  return [];
}

function seedTravelRecords() {
  return [];
}

function seedAttendance() {
  return {};
}

function seedSettings() {
  return {
    currency: '$',
    daysInMonthMode: '26',
    companyName: 'Nikhila Engineering',
    companyAddress: '100 Enterprise Way, Suite 400',
    holidays: [],
  };
}

// ---------------------------------------------------------------------------
// Persistence — a small shared JSON store on the server (see server/), so
// every browser reads and writes the same data instead of each browser
// having its own isolated localStorage copy.
// ---------------------------------------------------------------------------

// A 401 from any of these means the session cookie is missing or expired.
// Broadcast it so the app-level auth gate can drop back to the login screen
// instead of every caller having to check for it individually.
function notifyUnauthorized() {
  window.dispatchEvent(new CustomEvent('nep:unauthorized'));
}

async function apiGet(key) {
  const res = await fetch(`/api/data/${key}`, { credentials: 'include' });
  if (res.status === 401) { notifyUnauthorized(); throw new Error('Session expired — please log in again'); }
  if (!res.ok) throw new Error(`Server returned ${res.status} while loading data`);
  return res.json();
}

async function apiPut(key, value) {
  const res = await fetch(`/api/data/${key}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (res.status === 401) { notifyUnauthorized(); throw new Error('Session expired — please log in again'); }
  if (!res.ok) throw new Error(`Server returned ${res.status} while saving data`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Auth — single shared login (see server/auth.js)
// ---------------------------------------------------------------------------

async function fetchCurrentUser() {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.username;
}

async function login(username, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data.username;
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

async function changePassword(currentPassword, newPassword) {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to change password');
  return true;
}

// ---------------------------------------------------------------------------
// Calculation engine
// ---------------------------------------------------------------------------

function daysInCalendarMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

// Sundays are ordinary working days by default — like any other day, they're
// only non-working if explicitly listed in Settings
// (holidays: [{ date: 'YYYY-MM-DD', name }]), so an admin can choose to give
// a Sunday off (or leave it a working day and mark attendance for it).
function isHolidayDate(dateStr, holidays) {
  return (holidays || []).some((h) => h.date === dateStr);
}

// Whether employeeId is on an approved (company-paid) travel trip covering
// dateStr — inclusive of both the departure and join-back dates.
function isOnApprovedTravel(employeeId, dateStr, travelRecords) {
  return (travelRecords || []).some((t) => t.employeeId === employeeId && dateStr >= t.fromDate && dateStr <= t.joinBackDate);
}

// dateStr shifted by n days (n may be negative).
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

// Monday-anchored start of the week containing dateStr, so Sunday naturally
// lands at the end of the week rather than the start.
function startOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay(); // 0=Sun..6=Sat
  return addDays(dateStr, day === 0 ? -6 : 1 - day);
}

// `count` consecutive YYYY-MM-DD strings starting at startDateStr.
function datesInRange(startDateStr, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(addDays(startDateStr, i));
  return out;
}

// Every YYYY-MM-DD in a calendar month.
function datesInMonth(monthStr) {
  const total = daysInCalendarMonth(monthStr);
  const out = [];
  for (let d = 1; d <= total; d++) out.push(`${monthStr}-${pad2(d)}`);
  return out;
}

// Compact column-header label for a grid, e.g. "Mon 17" — dateLabel is too
// verbose (weekday + month + day + year) for a narrow grid column.
function shortDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
}

function getWorkingDaysInMonth(monthStr, mode, holidays) {
  if (mode === '30') return 30;
  if (mode === 'actual') {
    const total = daysInCalendarMonth(monthStr);
    let count = 0;
    for (let d = 1; d <= total; d++) {
      if (!isHolidayDate(`${monthStr}-${pad2(d)}`, holidays)) count++;
    }
    return count;
  }
  return 26; // Standard 26-day mode (default)
}

// Aggregate an employee's attendance stats for a given YYYY-MM month.
// A day with no attendance record at all defaults to absent (no pay) —
// unmarked is treated as worst-case by default, whether the day is in the
// past, today, or later this month, so net payable reflects $0 until
// attendance is actually logged rather than silently paying out for days
// nobody has marked yet.
function getMonthAttendanceStats(employeeId, monthStr, attendance, holidays, travelRecords) {
  const totalDaysInMonth = daysInCalendarMonth(monthStr);

  let presentDays = 0, halfDays = 0, absentDays = 0, otUnits = 0, loggedDays = 0;
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateKey = `${monthStr}-${pad2(d)}`;
    const record = attendance[dateKey] && attendance[dateKey][employeeId];
    if (record && record.status) {
      loggedDays++;
      if (record.status === 'present') presentDays++;
      else if (record.status === 'halfday') halfDays++;
      else if (record.status === 'absent') absentDays++;
      otUnits += Number(record.otCount) || 0;
    } else if (!isHolidayDate(dateKey, holidays) && !isOnApprovedTravel(employeeId, dateKey, travelRecords)) {
      // Only dates explicitly listed in Settings (or covered by approved
      // travel) skip the default-absent deduction when left unmarked — a
      // Sunday is an ordinary day unless it's been added to that list.
      absentDays++;
    }
  }
  return { presentDays, halfDays, absentDays, otUnits, loggedDays };
}

// Number of currently-active employees enrolled in a given mess
function getMessMemberCount(messId, employees) {
  return employees.filter((e) => e.messId === messId && e.status === 'Active').length;
}

// Mess fees are set per employee, not split equally: messExpenses[month][messId]
// is a map of { employeeId: fee }. This looks up one employee's fee for a
// given mess and month.
function getEmployeeMessFee(employeeId, messId, monthStr, messExpenses) {
  const messEntry = (messExpenses[monthStr] || {})[messId] || {};
  return Number(messEntry[employeeId]) || 0;
}

// Sum of every member's fee for a mess in a given month — used for display
// (e.g. "Total This Month") rather than for splitting anything.
function getMessMonthTotal(messId, monthStr, messExpenses) {
  const messEntry = (messExpenses[monthStr] || {})[messId] || {};
  return Object.values(messEntry).reduce((sum, fee) => sum + (Number(fee) || 0), 0);
}

// Salary advances recovered in a payroll month: any advance disbursed during
// the immediately preceding calendar month shows up as a deduction here.
function getApplicableAdvances(employeeId, monthStr, advances) {
  const recoveryMonth = prevMonthStr(monthStr);
  return advances.filter((a) => a.employeeId === employeeId && a.dateGiven.slice(0, 7) === recoveryMonth);
}

function getAdvanceStatus(advance, referenceMonthStr) {
  const recoveryMonth = nextMonthStr(advance.dateGiven.slice(0, 7));
  if (recoveryMonth === referenceMonthStr) return 'due';
  if (recoveryMonth < referenceMonthStr) return 'recovered';
  return 'upcoming';
}

// An employee's salary revisions (hikes), most-recently-effective first.
// Ties on the same effectiveMonth break by id, which embeds a creation
// timestamp (see uid()), so the most recently recorded one wins.
function getSalaryRevisionsForEmployee(employeeId, salaryRevisions) {
  return (salaryRevisions || [])
    .filter((r) => r.employeeId === employeeId)
    .sort((a, b) => (a.effectiveMonth === b.effectiveMonth ? (a.id < b.id ? 1 : -1) : (a.effectiveMonth < b.effectiveMonth ? 1 : -1)));
}

// The salary in effect for employeeId during monthStr: the newSalary of the
// most recent revision whose effectiveMonth has arrived by monthStr, or the
// employee's baseSalary if no revision applies yet — i.e. baseSalary is the
// salary in effect before the first recorded hike, not necessarily "current."
function getSalaryForMonth(employee, monthStr, salaryRevisions) {
  const applicable = getSalaryRevisionsForEmployee(employee.id, salaryRevisions).filter((r) => r.effectiveMonth <= monthStr);
  return applicable.length ? applicable[0].newSalary : employee.baseSalary;
}

// Full payroll computation for one employee for one month, per spec formulas.
// `extras` carries cross-entity context needed for mess fees, advance
// recovery, historical salary resolution and approved-travel exemption:
// { employees, messExpenses, advances, salaryRevisions, travelRecords }.
function calculateEmployeePayroll(employee, monthStr, attendance, settings, extras) {
  extras = extras || {};
  const messExpenses = extras.messExpenses || {};
  const advances = extras.advances || [];
  const salaryRevisions = extras.salaryRevisions || [];
  const travelRecords = extras.travelRecords || [];

  // The salary actually in effect for this month — not necessarily the
  // employee's current baseSalary — so past months stay unaffected by a
  // later hike and a hike only applies from its effective month onward.
  const effectiveSalary = getSalaryForMonth(employee, monthStr, salaryRevisions);

  const workingDays = getWorkingDaysInMonth(monthStr, settings.daysInMonthMode, settings.holidays);
  const dailyRate = workingDays > 0 ? effectiveSalary / workingDays : 0;
  const stats = getMonthAttendanceStats(employee.id, monthStr, attendance, settings.holidays, travelRecords);

  const absentDeduction = stats.absentDays * dailyRate;
  const halfDayDeduction = stats.halfDays * 0.5 * dailyRate;
  const totalDeductions = absentDeduction + halfDayDeduction;

  // Each day's logged OT level (see OT_LEVELS) is itself the fraction of a
  // day's pay earned for that day's overtime — no separate multiplier.
  const otEarnings = stats.otUnits * dailyRate;

  const messDeduction = employee.messId ? getEmployeeMessFee(employee.id, employee.messId, monthStr, messExpenses) : 0;

  const appliedAdvances = getApplicableAdvances(employee.id, monthStr, advances);
  const advanceDeduction = appliedAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  const grandTotalDeductions = totalDeductions + messDeduction + advanceDeduction;
  const netPayable = Math.max(0, effectiveSalary - grandTotalDeductions + otEarnings);

  return {
    workingDays,
    dailyRate,
    ...stats,
    absentDeduction,
    halfDayDeduction,
    totalDeductions,
    otEarnings,
    messDeduction,
    appliedAdvances,
    advanceDeduction,
    grandTotalDeductions,
    // The salary actually effective for monthStr, not employee.baseSalary --
    // kept under this field name since Payslip.js/Payroll.js already just
    // display whatever this returns.
    baseSalary: effectiveSalary,
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

// Format-only validation (12 digits) — deliberately not the official UIDAI
// Verhoeff checksum, which only catches typos, not a fundamentally wrong
// number; not worth the added complexity for a "provision to enter" field.
function isValidAadhaar(number) {
  return /^\d{12}$/.test(number);
}

function maskAadhaarNumber(number) {
  const digits = String(number || '');
  const last4 = digits.slice(-4);
  return `XXXX XXXX ${last4}`;
}
