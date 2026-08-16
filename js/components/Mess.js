function MessForm({ mess, onSave, onClose }) {
  const [form, setForm] = React.useState(
    mess || { name: '', location: '', status: 'Active' }
  );
  const isEdit = !!mess;

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <Modal title={isEdit ? 'Edit Mess' : 'Add New Mess'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Mess Name">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. North Block Mess" required />
        </Field>
        <Field label="Location / Description" hint="Optional">
          <input className={inputClass} value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Near Downtown Commercial Hub" />
        </Field>
        <Field label="Status">
          <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {MESS_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save Changes' : 'Create Mess'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function MessMemberFeeRow({ employee, fee, currency, onChange }) {
  return (
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
      <td className="px-4 py-2.5">
        <div className="font-medium text-slate-800 text-sm">{employee.name}</div>
        <div className="text-xs text-slate-400">{employee.id} · {employee.designation}</div>
      </td>
      <td className="px-4 py-2.5 text-right">
        <div className="relative inline-block">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">{currency}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass + ' pl-6 w-32 text-right'}
            placeholder="0.00"
            value={fee || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </td>
    </tr>
  );
}

function MessModule({ messes, setMesses, employees, setEmployees, messExpenses, setMessExpenses, settings, showToast }) {
  const [formMess, setFormMess] = React.useState(null);
  const [assignMess, setAssignMess] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [month, setMonth] = React.useState(currentMonthStr());
  const [splitInputs, setSplitInputs] = React.useState({}); // messId -> quick-split draft total

  const activeMembersOf = (messId) => employees.filter((e) => e.messId === messId && e.status === 'Active');

  const setFee = (messId, empId, value) => {
    setMessExpenses((prev) => {
      const monthEntry = { ...(prev[month] || {}) };
      const messEntry = { ...(monthEntry[messId] || {}) };
      if (value === '' || value === null) delete messEntry[empId];
      else messEntry[empId] = Number(value);
      monthEntry[messId] = messEntry;
      return { ...prev, [month]: monthEntry };
    });
  };

  const applyEqualSplit = (messId) => {
    const total = Number(splitInputs[messId]);
    const members = activeMembersOf(messId);
    if (!total || total <= 0 || members.length === 0) return;
    const share = Math.round((total / members.length) * 100) / 100;
    setMessExpenses((prev) => {
      const monthEntry = { ...(prev[month] || {}) };
      const messEntry = { ...(monthEntry[messId] || {}) };
      members.forEach((m) => { messEntry[m.id] = share; });
      monthEntry[messId] = messEntry;
      return { ...prev, [month]: monthEntry };
    });
    showToast(`Split ${formatCurrency(total, settings.currency)} equally among ${members.length} member(s)`);
    setSplitInputs((prev) => ({ ...prev, [messId]: '' }));
  };

  const saveMess = (form) => {
    if (form.id) {
      setMesses(messes.map((m) => (m.id === form.id ? { ...m, ...form } : m)));
      showToast('Mess updated');
    } else {
      const id = nextMessId(messes);
      setMesses([...messes, { ...form, id }]);
      showToast('Mess created');
    }
    setFormMess(null);
  };

  const confirmDelete = () => {
    setEmployees(employees.map((e) => (e.messId === deleteTarget.id ? { ...e, messId: null } : e)));
    setMesses(messes.filter((m) => m.id !== deleteTarget.id));
    showToast('Mess deleted');
    setDeleteTarget(null);
  };

  const applyAssignment = (pending) => {
    setEmployees(employees.map((e) => (Object.prototype.hasOwnProperty.call(pending, e.id) ? { ...e, messId: pending[e.id] } : e)));
    showToast('Mess membership updated');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Mess Facilities</h2>
          <p className="text-sm text-slate-500">{messes.length} mess(es) · set each member's fee individually every month</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" className={inputClass + ' w-auto'} value={month} onChange={(e) => setMonth(e.target.value)} />
          <Button onClick={() => setFormMess({})}>
            <Icon name="plus" className="w-4 h-4" /> Add Mess
          </Button>
        </div>
      </div>

      {messes.length === 0 ? (
        <EmptyState icon="utensils" title="No mess facilities yet" message="Create a mess to start tracking shared food costs." />
      ) : (
        <div className="space-y-4">
          {messes.map((mess) => {
            const members = activeMembersOf(mess.id);
            const total = getMessMonthTotal(mess.id, month, messExpenses);
            return (
              <div key={mess.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{mess.name}</h3>
                      <Badge tone={mess.status === 'Active' ? 'green' : 'slate'}>{mess.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {mess.id}{mess.location ? ` · ${mess.location}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" className="!px-2.5" onClick={() => setAssignMess(mess)}>
                      <Icon name="user-plus" className="w-4 h-4" /> Members
                    </Button>
                    <Button variant="ghost" className="!px-2.5" onClick={() => setFormMess(mess)}>
                      <Icon name="pencil" className="w-4 h-4" /> Edit
                    </Button>
                    <Button variant="ghost" className="!px-2.5 text-rose-500 hover:bg-rose-50" onClick={() => setDeleteTarget(mess)}>
                      <Icon name="trash-2" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-end justify-between gap-3">
                  <Field label={`Quick Split · ${monthLabel(month)}`} hint="Fills every member's fee below with an equal share">
                    <div className="flex gap-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{settings.currency}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={inputClass + ' pl-7 w-40'}
                          placeholder="Total amount"
                          value={splitInputs[mess.id] || ''}
                          onChange={(e) => setSplitInputs((prev) => ({ ...prev, [mess.id]: e.target.value }))}
                        />
                      </div>
                      <Button variant="secondary" onClick={() => applyEqualSplit(mess.id)} disabled={members.length === 0}>
                        Apply
                      </Button>
                    </div>
                  </Field>
                  <div className="text-sm text-right">
                    <p className="text-slate-400">Total this month</p>
                    <p className="font-semibold text-brand-700">{formatCurrency(total, settings.currency)}</p>
                  </div>
                </div>

                {members.length === 0 ? (
                  <EmptyState icon="users" title="No active members" message="Use the Members button to enroll employees in this mess." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60">
                          <th className="px-4 py-2 font-medium">Employee</th>
                          <th className="px-4 py-2 font-medium text-right">Mess Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((emp) => (
                          <MessMemberFeeRow
                            key={emp.id}
                            employee={emp}
                            fee={getEmployeeMessFee(emp.id, mess.id, month, messExpenses)}
                            currency={settings.currency}
                            onChange={(v) => setFee(mess.id, emp.id, v)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {formMess !== null && (
        <MessForm mess={formMess.id ? formMess : null} onSave={saveMess} onClose={() => setFormMess(null)} />
      )}
      {assignMess && (
        <AssignmentModal
          title={`Mess Members · ${assignMess.name}`}
          entity={assignMess}
          fieldName="messId"
          employees={employees}
          onAssign={applyAssignment}
          onClose={() => setAssignMess(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Mess"
          message={`Delete "${deleteTarget.name}"? Employees enrolled in this mess will be unenrolled.`}
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
