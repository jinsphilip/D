function PayslipModal({ employee, site, mess, monthStr, settings, result, onClose }) {
  const handlePrint = () => window.print();

  // Rendered via a portal into #print-root (a sibling of #root in
  // index.html) rather than inline in the component tree, so the print
  // stylesheet can hide #root entirely instead of just hiding its contents
  // with visibility — the latter left the rest of the app's real layout
  // height in place and produced extra blank printed pages.
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/50 no-print" onClick={onClose}></div>
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-xl my-0 sm:my-8 fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 no-print">
          <h3 className="font-semibold text-slate-900">Payslip Preview</h3>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handlePrint}>
              <Icon name="printer" className="w-4 h-4" /> Print
            </Button>
            <button className="touch-target text-slate-400 hover:text-slate-700 rounded-lg flex items-center justify-center" onClick={onClose}>
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div id="payslip-print-area" className="p-6 sm:p-8">
          <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-5">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{settings.companyName}</h1>
              <p className="text-sm text-slate-500">{settings.companyAddress}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Salary Slip</p>
              <p className="text-sm font-medium text-slate-700">{monthLabel(monthStr)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-6">
            <div className="text-slate-400">Employee ID</div>
            <div className="text-slate-800 font-medium text-right">{employee.id}</div>
            <div className="text-slate-400">Name</div>
            <div className="text-slate-800 font-medium text-right">{employee.name}</div>
            <div className="text-slate-400">Role</div>
            <div className="text-slate-800 font-medium text-right">{employee.designation}</div>
            <div className="text-slate-400">Job Site</div>
            <div className="text-slate-800 font-medium text-right">{site ? site.name : 'Unassigned'}</div>
            {mess && (
              <React.Fragment>
                <div className="text-slate-400">Mess</div>
                <div className="text-slate-800 font-medium text-right">{mess.name}</div>
              </React.Fragment>
            )}
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Attendance Summary</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-50 rounded-lg py-2.5">
                <p className="text-lg font-bold text-slate-800">{result.workingDays}</p>
                <p className="text-[11px] text-slate-400">Standard Days</p>
              </div>
              <div className="bg-emerald-50 rounded-lg py-2.5">
                <p className="text-lg font-bold text-emerald-700">{result.presentDays}</p>
                <p className="text-[11px] text-slate-400">Present</p>
              </div>
              <div className="bg-amber-50 rounded-lg py-2.5">
                <p className="text-lg font-bold text-amber-700">{result.halfDays}</p>
                <p className="text-[11px] text-slate-400">Half Days</p>
              </div>
              <div className="bg-rose-50 rounded-lg py-2.5">
                <p className="text-lg font-bold text-rose-700">{result.absentDays}</p>
                <p className="text-[11px] text-slate-400">Absent</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Financial Breakdown</p>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-600">Basic Salary</td>
                  <td className="py-2 text-right font-medium text-slate-800">{formatCurrency(result.baseSalary, settings.currency)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-600">Overtime Allowance ({result.otUnits.toFixed(1)} day(s) OT)</td>
                  <td className="py-2 text-right font-medium text-emerald-600">+ {formatCurrency(result.otEarnings, settings.currency)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-600">Absenteeism Deduction ({result.absentDays} day(s))</td>
                  <td className="py-2 text-right font-medium text-rose-600">− {formatCurrency(result.absentDeduction, settings.currency)}</td>
                </tr>
                <tr className={result.messDeduction > 0 || result.advanceDeduction > 0 ? 'border-b border-slate-100' : 'border-b border-slate-200'}>
                  <td className="py-2 text-slate-600">Half-Day Deduction ({result.halfDays} day(s))</td>
                  <td className="py-2 text-right font-medium text-rose-600">− {formatCurrency(result.halfDayDeduction, settings.currency)}</td>
                </tr>
                {result.messDeduction > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="py-2 text-slate-600 align-top">
                      Mess Deduction{mess ? ` (${mess.name})` : ''}
                      {result.appliedMessDeduction < result.messDeduction && (
                        <div className="text-[11px] text-amber-600 mt-0.5">
                          {formatCurrency(result.appliedMessDeduction, settings.currency)} of {formatCurrency(result.messDeduction, settings.currency)} — only partially covered this month
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-right font-medium text-rose-600 align-top">− {formatCurrency(result.appliedMessDeduction, settings.currency)}</td>
                  </tr>
                )}
                {result.advanceDeduction > 0 && (
                  <tr className="border-b border-slate-200">
                    <td className="py-2 text-slate-600 align-top">
                      Salary Advance Recovery
                      <div className="text-[11px] text-slate-400 mt-0.5 space-y-0.5">
                        {result.appliedAdvances.map((a) => (
                          <div key={a.id} className={a.outstandingAmount > 0 ? 'text-amber-600' : ''}>
                            {formatCurrency(a.recoveredAmount, settings.currency)} of {formatCurrency(a.amount, settings.currency)} ({a.dateGiven})
                            {a.outstandingAmount > 0 && ` — ${formatCurrency(a.outstandingAmount, settings.currency)} outstanding`}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 text-right font-medium text-rose-600 align-top">− {formatCurrency(result.appliedAdvanceDeduction, settings.currency)}</td>
                  </tr>
                )}
                <tr>
                  <td className="pt-3 text-slate-900 font-bold text-base">Net Payable Salary</td>
                  <td className="pt-3 text-right font-extrabold text-base text-brand-700">{formatCurrency(result.netPayable, settings.currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-300 mt-8 text-center">This is a system-generated payslip and does not require a signature.</p>
        </div>
      </div>
    </div>,
    document.getElementById('print-root')
  );
}
