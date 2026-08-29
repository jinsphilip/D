function TravelForm({ record, employees, onSave, onClose }) {
  const isEdit = !!record;
  const [form, setForm] = React.useState(
    record || { employeeId: employees[0] ? employees[0].id : '', fromDate: todayISO(), joinBackDate: todayISO(), amount: '', note: '' }
  );
  const [dateError, setDateError] = React.useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.amount || Number(form.amount) <= 0 || !form.fromDate || !form.joinBackDate) return;
    if (form.joinBackDate < form.fromDate) {
      setDateError('Join-back date must be on or after the from date.');
      return;
    }
    onSave({ ...form, amount: Number(form.amount) });
  };

  return (
    <Modal title={isEdit ? 'Edit Travel Details' : 'Record Travel Allowance'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Employee">
          <select className={selectClass} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>)}
          </select>
        </Field>
        <Field label="From Date">
          <input
            type="date" className={inputClass} value={form.fromDate}
            onChange={(e) => { setForm({ ...form, fromDate: e.target.value }); setDateError(''); }}
            required
          />
        </Field>
        <Field label="Join Back Date" hint="The date the employee is back at work">
          <input
            type="date" className={inputClass} value={form.joinBackDate} min={form.fromDate}
            onChange={(e) => { setForm({ ...form, joinBackDate: e.target.value }); setDateError(''); }}
            required
          />
          {dateError && <span className="text-xs text-rose-500">{dateError}</span>}
        </Field>
        <Field label="Travel Amount Issued">
          <input type="number" min="0.01" step="0.01" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        </Field>
        <Field label="Note" hint="Optional">
          <input className={inputClass} value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Annual family vacation" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save Changes' : 'Record Travel'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function TravelModule({ employees, travelRecords, setTravelRecords, settings, showToast }) {
  const [formRecord, setFormRecord] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);

  const employeeName = (id) => (employees.find((e) => e.id === id) || {}).name || 'Unknown';

  const rows = [...travelRecords].sort((a, b) => (a.fromDate < b.fromDate ? 1 : -1));
  const totalIssued = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const saveRecord = (form) => {
    if (form.id) {
      setTravelRecords(travelRecords.map((r) => (r.id === form.id ? form : r)));
      showToast('Travel details updated');
    } else {
      setTravelRecords([...travelRecords, { ...form, id: uid('TRV') }]);
      showToast('Travel allowance recorded');
    }
    setFormRecord(null);
  };

  const confirmDelete = () => {
    setTravelRecords(travelRecords.filter((r) => r.id !== deleteTarget.id));
    showToast('Travel record removed');
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Travel Allowance</h2>
          <p className="text-sm text-slate-500">Track company-paid travel — record keeping only, doesn't affect payroll. Travel days aren't counted as absent.</p>
        </div>
        <Button onClick={() => setFormRecord({})} disabled={employees.length === 0}>
          <Icon name="plane" className="w-4 h-4" /> Record Travel
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard icon="plane" label="Trips Recorded" value={rows.length} tone="blue" />
        <StatCard icon="wallet" label="Total Issued" value={formatCurrency(totalIssued, settings.currency)} tone="slate" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="plane" title="No travel records yet" message="Record a trip to track who's traveling and when they're back." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-2.5 font-medium">Employee</th>
                  <th className="px-4 py-2.5 font-medium">From Date</th>
                  <th className="px-4 py-2.5 font-medium">Join Back Date</th>
                  <th className="px-4 py-2.5 font-medium">Amount Issued</th>
                  <th className="px-4 py-2.5 font-medium">Note</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{employeeName(r.employeeId)}</div>
                      <div className="text-xs text-slate-400">{r.employeeId}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{dateLabel(r.fromDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{dateLabel(r.joinBackDate)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(r.amount, settings.currency)}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{r.note || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" className="!px-2" onClick={() => setFormRecord(r)}>
                          <Icon name="pencil" className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" className="!px-2 text-rose-500 hover:bg-rose-50" onClick={() => setDeleteTarget(r)}>
                          <Icon name="trash-2" className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formRecord !== null && (
        <TravelForm record={formRecord.id ? formRecord : null} employees={employees} onSave={saveRecord} onClose={() => setFormRecord(null)} />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Travel Record"
          message={`Remove the travel record for ${employeeName(deleteTarget.employeeId)} (${dateLabel(deleteTarget.fromDate)} – ${dateLabel(deleteTarget.joinBackDate)})?`}
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
