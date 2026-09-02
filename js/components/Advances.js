function advanceStatusTone(status) {
  if (status === 'recovered') return 'slate';
  if (status === 'due') return 'amber';
  return 'blue';
}

function advanceStatusLabel(status) {
  if (status === 'recovered') return 'Recovered';
  if (status === 'due') return 'Deducting This Cycle';
  return 'Upcoming';
}

function AdvanceForm({ advance, employees, onSave, onClose }) {
  const isEdit = !!advance;
  const [form, setForm] = React.useState(
    advance || { employeeId: employees[0] ? employees[0].id : '', amount: '', dateGiven: todayISO(), note: '' }
  );

  const submit = (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.amount || Number(form.amount) <= 0 || !form.dateGiven) return;
    onSave({ ...form, amount: Number(form.amount) });
  };

  return (
    <Modal title={isEdit ? 'Edit Salary Advance' : 'Record Salary Advance'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Employee">
          <select className={selectClass} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>)}
          </select>
        </Field>
        <Field label="Advance Amount">
          <div className="relative">
            <input type="number" min="0.01" step="0.01" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
        </Field>
        <Field label="Date Given" hint="Recovered from next month's payroll, up to what's actually earned">
          <input type="date" className={inputClass} value={form.dateGiven} max={todayISO()} onChange={(e) => setForm({ ...form, dateGiven: e.target.value })} required />
        </Field>
        <Field label="Note" hint="Optional">
          <input className={inputClass} value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Family emergency" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save Changes' : 'Record Advance'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function AdvancesModule({ employees, advances, setAdvances, attendance, messExpenses, salaryRevisions, travelRecords, settings, showToast }) {
  const [formAdvance, setFormAdvance] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [refMonth, setRefMonth] = React.useState(currentMonthStr());

  const employeeName = (id) => (employees.find((e) => e.id === id) || {}).name || 'Unknown';

  const rows = advances
    .map((a) => ({ ...a, status: getAdvanceStatus(a, refMonth), recoveryMonth: nextMonthStr(a.dateGiven.slice(0, 7)) }))
    .sort((a, b) => (a.dateGiven < b.dateGiven ? 1 : -1));

  // Whether an advance's recovery month has fully passed (status
  // 'recovered') doesn't say whether the employee actually earned enough
  // that month to cover it — Math.max(0, ...) in calculateEmployeePayroll
  // silently absorbs any shortfall unless recomputed here. Only advances
  // already past their recovery month are checked (not 'due', since that
  // month's attendance may still be incomplete/provisional, and not
  // 'upcoming', since nothing's happened yet) — grouped by employee +
  // recovery month so the payroll waterfall (which depends on every
  // advance due that month together) only runs once per group.
  const recoveryByAdvanceId = React.useMemo(() => {
    const map = {};
    const groups = {};
    advances.forEach((a) => {
      if (getAdvanceStatus(a, refMonth) !== 'recovered') return;
      const recoveryMonth = nextMonthStr(a.dateGiven.slice(0, 7));
      const key = `${a.employeeId}|${recoveryMonth}`;
      groups[key] = groups[key] || { employeeId: a.employeeId, recoveryMonth };
    });
    const extras = { employees, messExpenses, advances, salaryRevisions, travelRecords };
    Object.values(groups).forEach(({ employeeId, recoveryMonth }) => {
      const employee = employees.find((e) => e.id === employeeId);
      if (!employee) return;
      const result = calculateEmployeePayroll(employee, recoveryMonth, attendance, settings, extras);
      result.appliedAdvances.forEach((r) => {
        map[r.id] = { recoveredAmount: r.recoveredAmount, outstandingAmount: r.outstandingAmount };
      });
    });
    return map;
  }, [advances, employees, attendance, settings, messExpenses, salaryRevisions, travelRecords, refMonth]);

  const totals = rows.reduce(
    (acc, a) => {
      if (a.status === 'recovered') {
        const recovery = recoveryByAdvanceId[a.id];
        acc.recovered += recovery ? recovery.recoveredAmount : a.amount;
        acc.outstanding += recovery ? recovery.outstandingAmount : 0;
      } else if (a.status === 'due') acc.due += a.amount;
      else acc.upcoming += a.amount;
      return acc;
    },
    { due: 0, upcoming: 0, recovered: 0, outstanding: 0 }
  );

  const saveAdvance = (form) => {
    if (form.id) {
      setAdvances(advances.map((a) => (a.id === form.id ? form : a)));
      showToast('Advance updated');
    } else {
      setAdvances([...advances, { ...form, id: uid('ADV') }]);
      showToast('Advance recorded');
    }
    setFormAdvance(null);
  };

  const confirmDelete = () => {
    setAdvances(advances.filter((a) => a.id !== deleteTarget.id));
    showToast('Advance removed');
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Salary Advances</h2>
          <p className="text-sm text-slate-500">Each advance is scheduled for recovery from the following month's payroll — if that month's earnings fall short, the remainder is tracked as outstanding, not carried forward automatically</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" className={inputClass + ' w-auto'} value={refMonth} onChange={(e) => setRefMonth(e.target.value)} />
          <Button onClick={() => setFormAdvance({})} disabled={employees.length === 0}>
            <Icon name="hand-coins" className="w-4 h-4" /> Record Advance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="clock" label="Deducting This Cycle" value={formatCurrency(totals.due, settings.currency)} tone="amber" />
        <StatCard icon="hourglass" label="Upcoming" value={formatCurrency(totals.upcoming, settings.currency)} tone="blue" />
        <StatCard icon="check-circle-2" label="Recovered" value={formatCurrency(totals.recovered, settings.currency)} tone="slate" />
        <StatCard icon="alert-triangle" label="Outstanding" value={formatCurrency(totals.outstanding, settings.currency)} tone="amber" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="hand-coins" title="No advances recorded" message="Record a salary advance to track its recovery next payroll cycle." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-2.5 font-medium">Employee</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Date Given</th>
                  <th className="px-4 py-2.5 font-medium">Recovery Month</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Note</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const recovery = recoveryByAdvanceId[a.id];
                  const isShort = a.status === 'recovered' && recovery && recovery.outstandingAmount > 0;
                  return (
                  <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{employeeName(a.employeeId)}</div>
                      <div className="text-xs text-slate-400">{a.employeeId}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(a.amount, settings.currency)}</td>
                    <td className="px-4 py-3 text-slate-600">{a.dateGiven}</td>
                    <td className="px-4 py-3 text-slate-600">{monthLabel(a.recoveryMonth)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={isShort ? 'amber' : advanceStatusTone(a.status)}>
                        {isShort ? (recovery.recoveredAmount > 0 ? 'Partially Recovered' : 'Unrecovered') : advanceStatusLabel(a.status)}
                      </Badge>
                      {isShort && (
                        <div className="text-[11px] text-amber-600 mt-1">Outstanding: {formatCurrency(recovery.outstandingAmount, settings.currency)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{a.note || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" className="!px-2" onClick={() => setFormAdvance(a)}>
                          <Icon name="pencil" className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" className="!px-2 text-rose-500 hover:bg-rose-50" onClick={() => setDeleteTarget(a)}>
                          <Icon name="trash-2" className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formAdvance !== null && (
        <AdvanceForm advance={formAdvance.id ? formAdvance : null} employees={employees} onSave={saveAdvance} onClose={() => setFormAdvance(null)} />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Advance"
          message={`Remove the ${formatCurrency(deleteTarget.amount, settings.currency)} advance for ${employeeName(deleteTarget.employeeId)}?`}
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
