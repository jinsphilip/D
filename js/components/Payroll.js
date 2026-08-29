function PayrollModule({ employees, sites, messes, messExpenses, advances, salaryRevisions, travelRecords, attendance, settings, siteFilter, setSiteFilter }) {
  const [month, setMonth] = React.useState(currentMonthStr());
  const [payslipEmp, setPayslipEmp] = React.useState(null);

  const filteredEmployees = React.useMemo(() => {
    let list = employees.filter((e) => e.status === 'Active');
    if (siteFilter !== 'all') list = list.filter((e) => e.siteId === siteFilter);
    return list;
  }, [employees, siteFilter]);

  const extras = React.useMemo(() => ({ employees, messExpenses, advances, salaryRevisions, travelRecords }), [employees, messExpenses, advances, salaryRevisions, travelRecords]);

  const rows = React.useMemo(() => {
    return filteredEmployees.map((emp) => ({
      employee: emp,
      result: calculateEmployeePayroll(emp, month, attendance, settings, extras),
    }));
  }, [filteredEmployees, attendance, settings, month, extras]);

  const totals = rows.reduce(
    (acc, r) => ({
      base: acc.base + r.result.baseSalary,
      deductions: acc.deductions + r.result.grandTotalDeductions,
      ot: acc.ot + r.result.otEarnings,
      mess: acc.mess + r.result.messDeduction,
      advance: acc.advance + r.result.advanceDeduction,
      net: acc.net + r.result.netPayable,
    }),
    { base: 0, deductions: 0, ot: 0, mess: 0, advance: 0, net: 0 }
  );

  const siteName = (id) => (sites.find((s) => s.id === id) || {}).name || 'Unassigned';
  const messName = (id) => (messes.find((m) => m.id === id) || {}).name || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Payroll &amp; Salary Calculation</h2>
          <p className="text-sm text-slate-500">{monthLabel(month)} · {getWorkingDaysInMonth(month, settings.daysInMonthMode, settings.holidays)} standard working days</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="month" className={inputClass + ' w-auto'} value={month} onChange={(e) => setMonth(e.target.value)} />
          <select className={selectClass + ' w-auto min-w-[160px]'} value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
            <option value="all">All Sites</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon="banknote" label="Total Basic" value={formatCurrency(totals.base, settings.currency)} tone="slate" />
        <StatCard icon="trending-down" label="Total Deductions" value={formatCurrency(totals.deductions, settings.currency)} tone="amber" />
        <StatCard icon="utensils" label="Mess Deductions" value={formatCurrency(totals.mess, settings.currency)} tone="amber" />
        <StatCard icon="trending-up" label="Total OT Earnings" value={formatCurrency(totals.ot, settings.currency)} tone="purple" />
        <StatCard icon="wallet" label="Net Payable" value={formatCurrency(totals.net, settings.currency)} tone="green" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="calculator" title="No employees to calculate" message="Adjust the site filter or add active employees." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-2.5 font-medium">Employee</th>
                  <th className="px-4 py-2.5 font-medium">Site</th>
                  <th className="px-4 py-2.5 font-medium text-center">P / H / A</th>
                  <th className="px-4 py-2.5 font-medium text-center">OT Units</th>
                  <th className="px-4 py-2.5 font-medium text-right">Attendance Ded.</th>
                  <th className="px-4 py-2.5 font-medium text-right">Mess Ded.</th>
                  <th className="px-4 py-2.5 font-medium text-right">Advance Ded.</th>
                  <th className="px-4 py-2.5 font-medium text-right">OT Earnings</th>
                  <th className="px-4 py-2.5 font-medium text-right">Net Payable</th>
                  <th className="px-4 py-2.5 font-medium text-right">Payslip</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ employee, result }) => (
                  <tr key={employee.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{employee.name}</div>
                      <div className="text-xs text-slate-400">
                        {employee.id}
                        {messName(employee.messId) && <span className="ml-1.5 text-violet-500">· {messName(employee.messId)}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{siteName(employee.siteId)}</td>
                    <td className="px-4 py-3 text-center text-xs">
                      <span className="text-emerald-600 font-medium">{result.presentDays}</span> /{' '}
                      <span className="text-amber-600 font-medium">{result.halfDays}</span> /{' '}
                      <span className="text-rose-600 font-medium">{result.absentDays}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{result.otUnits.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-rose-600">{result.totalDeductions > 0 ? `− ${formatCurrency(result.totalDeductions, settings.currency)}` : '—'}</td>
                    <td className="px-4 py-3 text-right text-rose-600">{result.messDeduction > 0 ? `− ${formatCurrency(result.messDeduction, settings.currency)}` : '—'}</td>
                    <td className="px-4 py-3 text-right text-rose-600">{result.advanceDeduction > 0 ? `− ${formatCurrency(result.advanceDeduction, settings.currency)}` : '—'}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{result.otEarnings > 0 ? `+ ${formatCurrency(result.otEarnings, settings.currency)}` : '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(result.netPayable, settings.currency)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" className="!px-2.5" onClick={() => setPayslipEmp({ employee, result })}>
                        <Icon name="file-text" className="w-4 h-4" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {payslipEmp && (
        <PayslipModal
          employee={payslipEmp.employee}
          site={sites.find((s) => s.id === payslipEmp.employee.siteId)}
          mess={messes.find((m) => m.id === payslipEmp.employee.messId)}
          monthStr={month}
          settings={settings}
          result={payslipEmp.result}
          onClose={() => setPayslipEmp(null)}
        />
      )}
    </div>
  );
}
