// Server-side default data, seeded once into the shared store the very
// first time it boots with no existing data file. Mirrors js/utils.js's
// client-side seed functions so a fresh deployment looks the same as the
// old localStorage-only demo did.

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
    nep_salary_revisions: seedSalaryRevisions(),
    nep_travel_records: seedTravelRecords(),
  };
};
