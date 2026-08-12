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

function MessModule({ messes, setMesses, employees, setEmployees, messExpenses, setMessExpenses, settings, showToast }) {
  const [formMess, setFormMess] = React.useState(null);
  const [assignMess, setAssignMess] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [expanded, setExpanded] = React.useState(null);
  const [month, setMonth] = React.useState(currentMonthStr());

  const membersOf = (messId) => employees.filter((e) => e.messId === messId);
  const activeMembersOf = (messId) => employees.filter((e) => e.messId === messId && e.status === 'Active');

  const expenseFor = (messId) => (messExpenses[month] || {})[messId] || '';

  const setExpense = (messId, value) => {
    setMessExpenses((prev) => {
      const monthEntry = { ...(prev[month] || {}) };
      if (value === '' || value === null) delete monthEntry[messId];
      else monthEntry[messId] = Number(value);
      return { ...prev, [month]: monthEntry };
    });
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
          <p className="text-sm text-slate-500">{messes.length} mess(es) · costs split equally among active members each month</p>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {messes.map((mess) => {
            const members = membersOf(mess.id);
            const activeMembers = activeMembersOf(mess.id);
            const isOpen = expanded === mess.id;
            const expense = expenseFor(mess.id);
            const perHead = activeMembers.length > 0 ? (Number(expense) || 0) / activeMembers.length : 0;
            return (
              <div key={mess.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{mess.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{mess.id}</p>
                    </div>
                    <Badge tone={mess.status === 'Active' ? 'green' : 'slate'}>{mess.status}</Badge>
                  </div>
                  {mess.location && (
                    <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                      <Icon name="map-pin" className="w-3.5 h-3.5 shrink-0" /> {mess.location}
                    </p>
                  )}
                  <button
                    className="text-sm text-slate-600 mt-3 flex items-center gap-1.5 hover:text-brand-600"
                    onClick={() => setExpanded(isOpen ? null : mess.id)}
                  >
                    <Icon name="users" className="w-3.5 h-3.5" />
                    {members.length} member(s)
                    <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} className="w-3.5 h-3.5" />
                  </button>
                  {isOpen && (
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto border-t border-slate-100 pt-2">
                      {members.length === 0 ? (
                        <p className="text-xs text-slate-400">No employees enrolled.</p>
                      ) : members.map((e) => (
                        <div key={e.id} className="text-xs text-slate-600 flex items-center justify-between">
                          <span className="truncate">{e.name}</span>
                          <span className="text-slate-400 shrink-0 ml-2">{e.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <Field label={`Total Expense · ${monthLabel(month)}`}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{settings.currency}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={inputClass + ' pl-7'}
                          placeholder="0.00"
                          value={expense}
                          onChange={(e) => setExpense(mess.id, e.target.value)}
                        />
                      </div>
                    </Field>
                    {Number(expense) > 0 && (
                      <p className="text-xs text-slate-500 mt-1.5">
                        {activeMembers.length > 0 ? (
                          <React.Fragment>
                            <span className="font-semibold text-brand-700">{formatCurrency(perHead, settings.currency)}</span> / active member ({activeMembers.length})
                          </React.Fragment>
                        ) : (
                          <span className="text-amber-600">No active members — cost won't be distributed yet.</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div className="border-t border-slate-100 px-3 py-2 flex items-center gap-1 bg-slate-50/60">
                  <Button variant="ghost" className="!px-2.5" onClick={() => setAssignMess(mess)}>
                    <Icon name="user-plus" className="w-4 h-4" /> Members
                  </Button>
                  <Button variant="ghost" className="!px-2.5" onClick={() => setFormMess(mess)}>
                    <Icon name="pencil" className="w-4 h-4" /> Edit
                  </Button>
                  <Button variant="ghost" className="!px-2.5 ml-auto text-rose-500 hover:bg-rose-50" onClick={() => setDeleteTarget(mess)}>
                    <Icon name="trash-2" className="w-4 h-4" />
                  </Button>
                </div>
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
