// ---------------------------------------------------------------------------
// Reports — read-only cross-entity views of the data, exportable to Excel
// (SheetJS/XLSX) and PDF (jsPDF + autoTable). Both libraries are loaded via
// <script> tags in index.html, same as React/Babel/Lucide.
// ---------------------------------------------------------------------------

function reportSiteName(sites, siteId) {
  return (sites.find((s) => s.id === siteId) || {}).name || 'Unassigned';
}

function reportMessName(messes, messId) {
  return (messes.find((m) => m.id === messId) || {}).name || 'Not enrolled';
}

function advanceStatusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function filterReportEmployees(employees, siteId, role, activeOnly) {
  let list = activeOnly ? employees.filter((e) => e.status === 'Active') : employees;
  if (siteId && siteId !== 'all') list = list.filter((e) => e.siteId === siteId);
  if (role && role !== 'all') list = list.filter((e) => e.designation === role);
  return list;
}

const REPORT_TYPES = {
  attendance: {
    label: 'Attendance Summary',
    icon: 'calendar-check',
    needsMonth: true,
    needsSite: true,
    needsRole: true,
    emptyMessage: 'No active employees match this filter.',
    columns: [
      { key: 'id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'designation', label: 'Role' },
      { key: 'siteName', label: 'Site' },
      { key: 'presentDays', label: 'Present', align: 'right' },
      { key: 'halfDays', label: 'Half Day', align: 'right' },
      { key: 'absentDays', label: 'Absent', align: 'right' },
      { key: 'otUnits', label: 'OT Units', align: 'right' },
      { key: 'payableDays', label: 'Payable Days', align: 'right' },
    ],
    buildRows: (ctx) => filterReportEmployees(ctx.employees, ctx.siteId, ctx.role, true).map((emp) => {
      const stats = getMonthAttendanceStats(emp.id, ctx.month, ctx.attendance, ctx.settings.holidays, ctx.travelRecords);
      return {
        id: emp.id, name: emp.name, designation: emp.designation, siteName: reportSiteName(ctx.sites, emp.siteId),
        presentDays: stats.presentDays, halfDays: stats.halfDays, absentDays: stats.absentDays,
        otUnits: stats.otUnits, payableDays: Number((stats.presentDays + stats.halfDays * 0.5).toFixed(1)),
      };
    }),
  },

  payroll: {
    label: 'Payroll Summary',
    icon: 'wallet',
    needsMonth: true,
    needsSite: true,
    needsRole: true,
    emptyMessage: 'No active employees match this filter.',
    columns: [
      { key: 'id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'designation', label: 'Role' },
      { key: 'siteName', label: 'Site' },
      { key: 'effectiveSalary', label: 'Salary', align: 'right', currency: true },
      { key: 'presentDays', label: 'Present', align: 'right' },
      { key: 'absentDays', label: 'Absent', align: 'right' },
      { key: 'otEarnings', label: 'OT Earnings', align: 'right', currency: true },
      { key: 'messDeduction', label: 'Mess Ded.', align: 'right', currency: true },
      { key: 'advanceDeduction', label: 'Advance Ded.', align: 'right', currency: true },
      { key: 'totalDeductions', label: 'Total Ded.', align: 'right', currency: true },
      { key: 'netPayable', label: 'Net Payable', align: 'right', currency: true },
    ],
    buildRows: (ctx) => filterReportEmployees(ctx.employees, ctx.siteId, ctx.role, true).map((emp) => {
      const extras = { employees: ctx.employees, messExpenses: ctx.messExpenses, advances: ctx.advances, salaryRevisions: ctx.salaryRevisions, travelRecords: ctx.travelRecords };
      const result = calculateEmployeePayroll(emp, ctx.month, ctx.attendance, ctx.settings, extras);
      return {
        id: emp.id, name: emp.name, designation: emp.designation, siteName: reportSiteName(ctx.sites, emp.siteId),
        effectiveSalary: result.baseSalary, presentDays: result.presentDays, absentDays: result.absentDays,
        otEarnings: result.otEarnings, messDeduction: result.messDeduction, advanceDeduction: result.advanceDeduction,
        totalDeductions: result.grandTotalDeductions, netPayable: result.netPayable,
      };
    }),
  },

  directory: {
    label: 'Employee Directory',
    icon: 'users',
    needsSite: true,
    needsRole: true,
    emptyMessage: 'No employees match this filter.',
    columns: [
      { key: 'id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'designation', label: 'Role' },
      { key: 'baseSalary', label: 'Base Salary', align: 'right', currency: true },
      { key: 'currentSalary', label: 'Current Salary', align: 'right', currency: true },
      { key: 'phone', label: 'Phone' },
      { key: 'aadhaar', label: 'Aadhaar' },
      { key: 'siteName', label: 'Site' },
      { key: 'messName', label: 'Mess' },
      { key: 'status', label: 'Status' },
      { key: 'joinDate', label: 'Joined' },
    ],
    buildRows: (ctx) => filterReportEmployees(ctx.employees, ctx.siteId, ctx.role, false).map((emp) => ({
      id: emp.id, name: emp.name, designation: emp.designation,
      baseSalary: emp.baseSalary, currentSalary: getSalaryForMonth(emp, currentMonthStr(), ctx.salaryRevisions),
      phone: emp.phone || '—', aadhaar: emp.aadhaarNumber ? maskAadhaarNumber(emp.aadhaarNumber) : '—',
      siteName: reportSiteName(ctx.sites, emp.siteId), messName: reportMessName(ctx.messes, emp.messId),
      status: emp.status, joinDate: emp.joinDate ? dateLabel(emp.joinDate) : '—',
    })),
  },

  advances: {
    label: 'Advances',
    icon: 'hand-coins',
    emptyMessage: 'No advances recorded.',
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'dateGiven', label: 'Date Given' },
      { key: 'amount', label: 'Amount', align: 'right', currency: true },
      { key: 'status', label: 'Status' },
      { key: 'note', label: 'Note' },
    ],
    buildRows: (ctx) => [...ctx.advances]
      .sort((a, b) => (a.dateGiven < b.dateGiven ? 1 : -1))
      .map((a) => {
        const emp = ctx.employees.find((e) => e.id === a.employeeId);
        return {
          employeeId: a.employeeId, name: emp ? emp.name : 'Unknown', dateGiven: dateLabel(a.dateGiven),
          amount: Number(a.amount) || 0, status: advanceStatusLabel(getAdvanceStatus(a, currentMonthStr())), note: a.note || '—',
        };
      }),
  },

  mess: {
    label: 'Mess Expenses',
    icon: 'utensils',
    needsMonth: true,
    emptyMessage: 'No mess fees recorded for this month.',
    columns: [
      { key: 'messName', label: 'Mess' },
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'fee', label: 'Fee', align: 'right', currency: true },
    ],
    buildRows: (ctx) => {
      const monthEntry = ctx.messExpenses[ctx.month] || {};
      const rows = [];
      Object.entries(monthEntry).forEach(([messId, fees]) => {
        Object.entries(fees || {}).forEach(([employeeId, fee]) => {
          const emp = ctx.employees.find((e) => e.id === employeeId);
          rows.push({
            messName: reportMessName(ctx.messes, messId), employeeId,
            name: emp ? emp.name : 'Unknown', fee: Number(fee) || 0,
          });
        });
      });
      return rows.sort((a, b) => a.messName.localeCompare(b.messName) || a.name.localeCompare(b.name));
    },
  },

  salaryRevisions: {
    label: 'Salary Revision History',
    icon: 'trending-up',
    emptyMessage: 'No salary hikes recorded.',
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'effectiveMonth', label: 'Effective Month' },
      { key: 'newSalary', label: 'New Salary', align: 'right', currency: true },
      { key: 'note', label: 'Note' },
    ],
    buildRows: (ctx) => [...ctx.salaryRevisions]
      .sort((a, b) => (a.effectiveMonth < b.effectiveMonth ? 1 : -1))
      .map((r) => {
        const emp = ctx.employees.find((e) => e.id === r.employeeId);
        return {
          employeeId: r.employeeId, name: emp ? emp.name : 'Unknown',
          effectiveMonth: monthLabel(r.effectiveMonth), newSalary: Number(r.newSalary) || 0, note: r.note || '—',
        };
      }),
  },

  travel: {
    label: 'Travel Allowance',
    icon: 'plane',
    emptyMessage: 'No travel records yet.',
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'fromDate', label: 'From Date' },
      { key: 'joinBackDate', label: 'Join Back Date' },
      { key: 'amount', label: 'Amount', align: 'right', currency: true },
      { key: 'note', label: 'Note' },
    ],
    buildRows: (ctx) => [...ctx.travelRecords]
      .sort((a, b) => (a.fromDate < b.fromDate ? 1 : -1))
      .map((t) => {
        const emp = ctx.employees.find((e) => e.id === t.employeeId);
        return {
          employeeId: t.employeeId, name: emp ? emp.name : 'Unknown',
          fromDate: dateLabel(t.fromDate), joinBackDate: dateLabel(t.joinBackDate),
          amount: Number(t.amount) || 0, note: t.note || '—',
        };
      }),
  },
};

function renderReportCell(col, row, settings) {
  const value = row[col.key];
  if (col.currency) return formatCurrency(value, settings.currency);
  return value === undefined || value === null || value === '' ? '—' : String(value);
}

function exportReportToExcel(reportLabel, columns, rows) {
  const header = columns.map((c) => c.label);
  const data = rows.map((row) => columns.map((c) => (c.currency ? Number(row[c.key]) || 0 : row[c.key])));
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  ws['!cols'] = columns.map(() => ({ wch: 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, reportLabel.replace(/[\\/*?:[\]]/g, '').slice(0, 31) || 'Report');
  XLSX.writeFile(wb, `${reportLabel.replace(/\s+/g, '-')}-${todayISO()}.xlsx`);
}

function exportReportToPDF(reportLabel, subtitle, columns, rows, settings) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' });
  doc.setFontSize(14);
  doc.text(reportLabel, 14, 15);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(subtitle, 14, 21);
  }
  doc.autoTable({
    startY: subtitle ? 26 : 20,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => renderReportCell(c, row, settings))),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    columnStyles: columns.reduce((acc, c, i) => { if (c.align === 'right') acc[i] = { halign: 'right' }; return acc; }, {}),
  });
  doc.save(`${reportLabel.replace(/\s+/g, '-')}-${todayISO()}.pdf`);
}

function ReportsModule({ employees, sites, messes, attendance, settings, messExpenses, advances, salaryRevisions, travelRecords, showToast }) {
  const [reportType, setReportType] = React.useState('attendance');
  const [month, setMonth] = React.useState(currentMonthStr());
  const [siteId, setSiteId] = React.useState('all');
  const [role, setRole] = React.useState('all');

  const config = REPORT_TYPES[reportType];
  const rows = React.useMemo(() => {
    const ctx = { employees, sites, messes, attendance, settings, messExpenses, advances, salaryRevisions, travelRecords, month, siteId, role };
    return config.buildRows(ctx);
  }, [reportType, month, siteId, role, employees, sites, messes, attendance, settings, messExpenses, advances, salaryRevisions, travelRecords]);

  const subtitleParts = [];
  if (config.needsMonth) subtitleParts.push(monthLabel(month));
  if (config.needsSite && siteId !== 'all') subtitleParts.push(reportSiteName(sites, siteId));
  if (config.needsRole && role !== 'all') subtitleParts.push(role);
  const subtitle = subtitleParts.join(' · ');

  const handleExportExcel = () => {
    if (typeof XLSX === 'undefined') { showToast('Excel export library failed to load. Check your connection.', 'error'); return; }
    exportReportToExcel(config.label, config.columns, rows);
    showToast('Excel file downloaded');
  };

  const handleExportPDF = () => {
    if (typeof window.jspdf === 'undefined') { showToast('PDF export library failed to load. Check your connection.', 'error'); return; }
    exportReportToPDF(config.label, subtitle, config.columns, rows, settings);
    showToast('PDF file downloaded');
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Reports</h2>
        <p className="text-sm text-slate-500">Generate and export attendance, payroll and employee reports.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Report Type">
            <select className={selectClass} value={reportType} onChange={(e) => setReportType(e.target.value)}>
              {Object.entries(REPORT_TYPES).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
            </select>
          </Field>
          {config.needsMonth && (
            <Field label="Month">
              <input type="month" className={inputClass} value={month} onChange={(e) => setMonth(e.target.value)} />
            </Field>
          )}
          {config.needsSite && (
            <Field label="Site">
              <select className={selectClass} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                <option value="all">All Sites</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          )}
          {config.needsRole && (
            <Field label="Role">
              <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="all">All Roles</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">{rows.length} row(s){subtitle ? ` · ${subtitle}` : ''}</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportExcel} disabled={rows.length === 0}>
              <Icon name="file-spreadsheet" className="w-4 h-4" /> Export Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} disabled={rows.length === 0}>
              <Icon name="file-text" className="w-4 h-4" /> Export PDF
            </Button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={config.icon} title="No data to show" message={config.emptyMessage} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60">
                  {config.columns.map((c) => (
                    <th key={c.key} className={`px-4 py-2.5 font-medium whitespace-nowrap ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    {config.columns.map((c) => (
                      <td key={c.key} className={`px-4 py-2.5 whitespace-nowrap ${c.align === 'right' ? 'text-right font-medium text-slate-700' : 'text-slate-700'}`}>
                        {renderReportCell(c, row, settings)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
