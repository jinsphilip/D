function EmployeeForm({ employee, sites, messes, employees, onSave, onClose }) {
  const isEdit = !!employee;
  const [form, setForm] = React.useState(
    employee || {
      id: nextEmployeeId(employees),
      name: '',
      designation: ROLES[0],
      baseSalary: '',
      phone: '',
      aadhaarNumber: '',
      joinDate: todayISO(),
      status: 'Active',
      siteId: sites[0] ? sites[0].id : null,
      messId: null,
    }
  );
  const [idError, setIdError] = React.useState('');
  const [aadhaarError, setAadhaarError] = React.useState('');
  const [revealAadhaar, setRevealAadhaar] = React.useState(!(employee && employee.aadhaarNumber));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.designation || !form.baseSalary) return;
    const trimmedId = form.id.trim();
    if (employees.some((emp) => emp.id === trimmedId && !(isEdit && emp.id === employee.id))) {
      setIdError('This Employee ID is already in use.');
      return;
    }
    const aadhaarNumber = (form.aadhaarNumber || '').trim();
    if (aadhaarNumber && !isValidAadhaar(aadhaarNumber)) {
      setAadhaarError('Aadhaar number must be exactly 12 digits.');
      return;
    }
    onSave({ ...form, id: trimmedId, baseSalary: Number(form.baseSalary), aadhaarNumber });
  };

  return (
    <Modal title={isEdit ? 'Edit Employee' : 'Add New Employee'} onClose={onClose} wide>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <Field label="Employee ID">
          <input
            className={inputClass}
            value={form.id}
            onChange={(e) => { setForm({ ...form, id: e.target.value }); setIdError(''); }}
            placeholder="EMPxxx"
            required
          />
          {idError && <span className="text-xs text-rose-500">{idError}</span>}
        </Field>
        <Field label="Full Name">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Role">
          <select className={selectClass} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Base Monthly Salary" hint={isEdit ? 'Salary in effect before this employee\'s first recorded hike — use Salary History to record raises' : undefined}>
          <input type="number" min="0" step="0.01" className={inputClass} value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} required />
        </Field>
        <Field label="Phone Number">
          <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-0100" />
        </Field>
        <Field label="Aadhaar Number" hint="Optional">
          <div className="relative">
            <input
              type="text"
              className={inputClass + ' pr-9'}
              value={revealAadhaar ? (form.aadhaarNumber || '') : (form.aadhaarNumber ? maskAadhaarNumber(form.aadhaarNumber) : '')}
              readOnly={!revealAadhaar}
              onChange={(e) => { setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) }); setAadhaarError(''); }}
              placeholder="12-digit number"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setRevealAadhaar((v) => !v)}
              aria-label={revealAadhaar ? 'Hide Aadhaar number' : 'Reveal Aadhaar number'}
            >
              <Icon name={revealAadhaar ? 'eye-off' : 'eye'} className="w-4 h-4" />
            </button>
          </div>
          {aadhaarError && <span className="text-xs text-rose-500">{aadhaarError}</span>}
        </Field>
        <Field label="Date of Joining">
          <input type="date" className={inputClass} value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
        </Field>
        <Field label="Assigned Site">
          <select className={selectClass} value={form.siteId || ''} onChange={(e) => setForm({ ...form, siteId: e.target.value || null })}>
            <option value="">Unassigned</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Mess" hint="Optional">
          <select className={selectClass} value={form.messId || ''} onChange={(e) => setForm({ ...form, messId: e.target.value || null })}>
            <option value="">Not enrolled</option>
            {messes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </Field>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save Changes' : 'Add Employee'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// Records dated salary hikes for one employee and shows their history.
// Payroll for a given month resolves the salary via getSalaryForMonth: the
// most recent revision whose effectiveMonth has arrived, falling back to
// employee.baseSalary if none apply yet — so this never rewrites baseSalary
// itself, and past payroll stays untouched by a later hike.
function SalaryHistoryModal({ employee, salaryRevisions, setSalaryRevisions, settings, showToast, onClose }) {
  const blankForm = () => ({ newSalary: '', effectiveMonth: currentMonthStr(), note: '' });
  const [form, setForm] = React.useState(blankForm());
  const [deleteTarget, setDeleteTarget] = React.useState(null);

  const history = getSalaryRevisionsForEmployee(employee.id, salaryRevisions);
  const currentSalary = getSalaryForMonth(employee, currentMonthStr(), salaryRevisions);
  const isEdit = !!form.id;

  const submit = (e) => {
    e.preventDefault();
    if (!form.newSalary || Number(form.newSalary) <= 0 || !form.effectiveMonth) return;
    if (isEdit) {
      setSalaryRevisions(salaryRevisions.map((r) => (r.id === form.id ? { ...r, ...form, newSalary: Number(form.newSalary) } : r)));
      showToast('Salary revision updated');
    } else {
      setSalaryRevisions([...salaryRevisions, { ...form, id: uid('SAL'), employeeId: employee.id, newSalary: Number(form.newSalary) }]);
      showToast('Salary hike recorded');
    }
    setForm(blankForm());
  };

  const editRevision = (r) => setForm({ id: r.id, newSalary: String(r.newSalary), effectiveMonth: r.effectiveMonth, note: r.note || '' });

  const confirmDelete = () => {
    setSalaryRevisions(salaryRevisions.filter((r) => r.id !== deleteTarget.id));
    showToast('Salary revision removed');
    setDeleteTarget(null);
  };

  return (
    <Modal title={`Salary History · ${employee.name}`} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Current Effective Salary</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(currentSalary, settings.currency)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Starting Base Salary</p>
            <p className="text-sm font-medium text-slate-600">{formatCurrency(employee.baseSalary, settings.currency)}</p>
          </div>
        </div>

        <form onSubmit={submit} className="grid sm:grid-cols-3 gap-3 items-end">
          <Field label="New Salary">
            <input type="number" min="0.01" step="0.01" className={inputClass} value={form.newSalary} onChange={(e) => setForm({ ...form, newSalary: e.target.value })} required />
          </Field>
          <Field label="Effective Month">
            <input type="month" className={inputClass} value={form.effectiveMonth} onChange={(e) => setForm({ ...form, effectiveMonth: e.target.value })} required />
          </Field>
          <Field label="Note" hint="Optional">
            <input className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Annual increment" />
          </Field>
          <div className="sm:col-span-3 flex justify-end gap-2">
            {isEdit && <Button type="button" variant="secondary" onClick={() => setForm(blankForm())}>Cancel Edit</Button>}
            <Button type="submit"><Icon name="trending-up" className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Record Hike'}</Button>
          </div>
        </form>

        {history.length === 0 ? (
          <EmptyState icon="trending-up" title="No hikes recorded yet" message="Record one above to start this employee's salary history." />
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60">
                  <th className="px-3 py-2 font-medium">Effective Month</th>
                  <th className="px-3 py-2 font-medium">New Salary</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-3 py-2 text-slate-700">
                      <div className="flex items-center gap-2">
                        <span>{monthLabel(r.effectiveMonth)}</span>
                        {r.effectiveMonth > currentMonthStr() && <Badge tone="blue">Future</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800">{formatCurrency(r.newSalary, settings.currency)}</td>
                    <td className="px-3 py-2 text-slate-500 max-w-[160px] truncate">{r.note || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" className="!px-2" onClick={() => editRevision(r)}>
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
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Salary Revision"
          message={`Remove the ${formatCurrency(deleteTarget.newSalary, settings.currency)} revision effective ${monthLabel(deleteTarget.effectiveMonth)}?`}
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Modal>
  );
}

function EmployeesModule({
  employees, setEmployees, sites, messes, settings, showToast,
  salaryRevisions, setSalaryRevisions,
  attendance, setAttendance,
  messExpenses, setMessExpenses,
  advances, setAdvances,
  travelRecords, setTravelRecords,
}) {
  const [formEmp, setFormEmp] = React.useState(null);
  const [historyEmp, setHistoryEmp] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');

  const siteName = (id) => (sites.find((s) => s.id === id) || {}).name || 'Unassigned';

  const filtered = employees.filter((e) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || e.designation === roleFilter;
    return matchesSearch && matchesRole;
  });

  // attendance[date][employeeId], messExpenses[month][messId][employeeId],
  // advances/salaryRevisions/travelRecords[].employeeId all reference an
  // employee by id — changing the id has to cascade or every past record
  // for that employee silently orphans.
  const hasRelatedRecords = (empId) => {
    const inAttendance = Object.values(attendance).some((day) => day && Object.prototype.hasOwnProperty.call(day, empId));
    const inMessExpenses = Object.values(messExpenses).some(
      (byMess) => byMess && Object.values(byMess).some((fees) => fees && Object.prototype.hasOwnProperty.call(fees, empId))
    );
    return (
      inAttendance || inMessExpenses ||
      advances.some((a) => a.employeeId === empId) ||
      salaryRevisions.some((r) => r.employeeId === empId) ||
      travelRecords.some((t) => t.employeeId === empId)
    );
  };

  const cascadeRenameId = (oldId, newId) => {
    setAttendance(Object.fromEntries(Object.entries(attendance).map(([date, day]) => {
      if (!day || !Object.prototype.hasOwnProperty.call(day, oldId)) return [date, day];
      const { [oldId]: record, ...rest } = day;
      return [date, { ...rest, [newId]: record }];
    })));
    setMessExpenses(Object.fromEntries(Object.entries(messExpenses).map(([month, byMess]) => [
      month,
      Object.fromEntries(Object.entries(byMess || {}).map(([messId, fees]) => {
        if (!fees || !Object.prototype.hasOwnProperty.call(fees, oldId)) return [messId, fees];
        const { [oldId]: fee, ...rest } = fees;
        return [messId, { ...rest, [newId]: fee }];
      })),
    ])));
    setAdvances(advances.map((a) => (a.employeeId === oldId ? { ...a, employeeId: newId } : a)));
    setSalaryRevisions(salaryRevisions.map((r) => (r.employeeId === oldId ? { ...r, employeeId: newId } : r)));
    setTravelRecords(travelRecords.map((t) => (t.employeeId === oldId ? { ...t, employeeId: newId } : t)));
  };

  const saveEmployee = (form) => {
    const originalId = formEmp && formEmp.id;
    if (originalId) {
      if (form.id !== originalId) {
        if (
          hasRelatedRecords(originalId) &&
          !window.confirm(`Changing the Employee ID will move ${originalId}'s attendance, mess fees, advances, salary history and travel records to the new ID (${form.id}). Continue?`)
        ) {
          return;
        }
        cascadeRenameId(originalId, form.id);
      }
      setEmployees(employees.map((e) => (e.id === originalId ? form : e)));
      showToast('Employee updated');
    } else {
      setEmployees([...employees, form]);
      showToast('Employee added');
    }
    setFormEmp(null);
  };

  const confirmDelete = () => {
    setEmployees(employees.filter((e) => e.id !== deleteTarget.id));
    showToast('Employee removed');
    setDeleteTarget(null);
  };

  const reassign = (empId, siteId) => {
    setEmployees(employees.map((e) => (e.id === empId ? { ...e, siteId: siteId || null } : e)));
    showToast('Site reassigned');
  };

  const reassignMess = (empId, messId) => {
    setEmployees(employees.map((e) => (e.id === empId ? { ...e, messId: messId || null } : e)));
    showToast('Mess membership updated');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Employee Profiles</h2>
          <p className="text-sm text-slate-500">{employees.length} employee(s) total</p>
        </div>
        <Button onClick={() => setFormEmp({})}>
          <Icon name="user-plus" className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Icon name="search" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={inputClass + ' pl-9'} placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={selectClass + ' sm:w-56'} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="users" title="No employees found" message="Try adjusting your search or filters." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-2.5 font-medium">Employee</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Current Salary</th>
                  <th className="px-4 py-2.5 font-medium">Site</th>
                  <th className="px-4 py-2.5 font-medium">Mess</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => {
                  const currentSalary = getSalaryForMonth(emp, currentMonthStr(), salaryRevisions);
                  return (
                  <tr key={emp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        {emp.name}
                        {emp.aadhaarNumber && <Icon name="shield-check" className="w-3.5 h-3.5 text-emerald-500" aria-label="Aadhaar on file" />}
                      </div>
                      <div className="text-xs text-slate-400">{emp.id} · {emp.phone || 'No phone'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{emp.designation}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{formatCurrency(currentSalary, settings.currency)}</div>
                      {currentSalary !== emp.baseSalary && (
                        <div className="text-xs text-slate-400">Base: {formatCurrency(emp.baseSalary, settings.currency)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={selectClass + ' !py-1.5 text-xs min-w-[150px]'}
                        value={emp.siteId || ''}
                        onChange={(e) => reassign(emp.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={selectClass + ' !py-1.5 text-xs min-w-[150px]'}
                        value={emp.messId || ''}
                        onChange={(e) => reassignMess(emp.id, e.target.value)}
                      >
                        <option value="">Not enrolled</option>
                        {messes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={emp.status === 'Active' ? 'green' : 'slate'}>{emp.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" className="!px-2" onClick={() => setHistoryEmp(emp)} aria-label="Salary History">
                          <Icon name="trending-up" className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" className="!px-2" onClick={() => setFormEmp(emp)}>
                          <Icon name="pencil" className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" className="!px-2 text-rose-500 hover:bg-rose-50" onClick={() => setDeleteTarget(emp)}>
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

      {formEmp !== null && (
        <EmployeeForm employee={formEmp.id ? formEmp : null} sites={sites} messes={messes} employees={employees} onSave={saveEmployee} onClose={() => setFormEmp(null)} />
      )}
      {historyEmp && (
        <SalaryHistoryModal
          employee={historyEmp} salaryRevisions={salaryRevisions} setSalaryRevisions={setSalaryRevisions}
          settings={settings} showToast={showToast} onClose={() => setHistoryEmp(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Employee"
          message={`Remove "${deleteTarget.name}" (${deleteTarget.id}) from records? This cannot be undone.`}
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
