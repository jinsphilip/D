// Server-side default data, seeded once into the shared store the very
// first time it boots with no existing data file. Mirrors js/utils.js's
// client-side seed functions so a fresh deployment looks the same as the
// old localStorage-only demo did.

function pad2(n) { return String(n).padStart(2, '0'); }

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function currentMonthStr() {
  const d = new Date();
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
    { id: 'EMP101', name: 'Alexander Wright', department: 'Operations', designation: 'Supervisor', baseSalary: 45000, phone: '+1 555-0192', joinDate: '2023-01-15', status: 'Active', siteId: 'SITE-101', messId: 'MESS-1' },
    { id: 'EMP102', name: 'Maria Gonzalez', department: 'Engineering', designation: 'Site Engineer', baseSalary: 52000, phone: '+1 555-0234', joinDate: '2023-03-10', status: 'Active', siteId: 'SITE-101', messId: 'MESS-1' },
    { id: 'EMP103', name: 'David Chen', department: 'Quality Control', designation: 'QC Inspector', baseSalary: 38000, phone: '+1 555-0345', joinDate: '2023-05-20', status: 'Active', siteId: 'SITE-102', messId: 'MESS-2' },
    { id: 'EMP104', name: 'Priya Sharma', department: 'Logistics', designation: 'Logistics Coordinator', baseSalary: 34000, phone: '+1 555-0456', joinDate: '2023-02-01', status: 'Active', siteId: 'SITE-102', messId: 'MESS-2' },
    { id: 'EMP105', name: "James O'Brien", department: 'Operations', designation: 'Foreman', baseSalary: 40000, phone: '+1 555-0567', joinDate: '2022-11-11', status: 'Active', siteId: 'SITE-103', messId: null },
    { id: 'EMP106', name: 'Fatima Al-Sayed', department: 'Engineering', designation: 'Junior Engineer', baseSalary: 30000, phone: '+1 555-0678', joinDate: '2024-01-08', status: 'Active', siteId: 'SITE-101', messId: 'MESS-1' },
    { id: 'EMP107', name: 'Robert Kim', department: 'Logistics', designation: 'Driver', baseSalary: 26000, phone: '+1 555-0789', joinDate: '2023-08-19', status: 'Active', siteId: 'SITE-104', messId: 'MESS-3' },
    { id: 'EMP108', name: 'Elena Petrova', department: 'Quality Control', designation: 'Safety Officer', baseSalary: 36000, phone: '+1 555-0890', joinDate: '2023-06-30', status: 'Active', siteId: 'SITE-102', messId: 'MESS-2' },
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
  const month = currentMonthStr();
  return {
    [month]: { 'MESS-1': 18000, 'MESS-2': 12000, 'MESS-3': 6000 },
  };
}

function seedAdvances() {
  return [
    { id: uid('ADV'), employeeId: 'EMP101', amount: 5000, dateGiven: prevMonthStr(currentMonthStr()) + '-10', note: 'Family emergency' },
  ];
}

function seedAttendance() {
  const today = todayISO();
  return {
    [today]: {
      EMP101: { status: 'present', otCount: 1.0, note: '' },
      EMP102: { status: 'present', otCount: 0, note: '' },
      EMP103: { status: 'present', otCount: 0.5, note: '' },
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
    companyName: 'Nikhila Engineering',
    companyAddress: '100 Enterprise Way, Suite 400',
  };
}

// Keys here must match STORAGE_KEYS values in js/utils.js
module.exports = function seedStore() {
  return {
    nep_sites: seedSites(),
    nep_employees: seedEmployees(),
    nep_attendance: seedAttendance(),
    nep_settings: seedSettings(),
    nep_messes: seedMesses(),
    nep_mess_expenses: seedMessExpenses(),
    nep_advances: seedAdvances(),
  };
};
