function EmployeeForm({ employee, sites, employees, onSave, onClose }) {
  const isEdit = !!employee;
  const [form, setForm] = React.useState(
    employee || {
      id: nextEmployeeId(employees),
      name: '',
      department: DEPARTMENTS[0],
      designation: '',
      baseSalary: '',
      phone: '',
      joinDate: todayISO(),
      status: 'Active',
      siteId: sites[0] ? sites[0].id : null,
    }
  );
  const [idError, setIdError] = React.useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.designation.trim() || !form.baseSalary) return;
    if (!isEdit && employees.some((emp) => emp.id === form.id.trim())) {
      setIdError('This Employee ID is already in use.');
      return;
    }
    onSave({ ...form, id: form.id.trim(), baseSalary: Number(form.baseSalary) });
  };

  return (
    <Modal title={isEdit ? 'Edit Employee' : 'Add New Employee'} onClose={onClose} wide>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <Field label="Employee ID">
          <input
            className={inputClass}
            value={form.id}
            disabled={isEdit}
            onChange={(e) => { setForm({ ...form, id: e.target.value }); setIdError(''); }}
            placeholder="EMPxxx"
            required
          />
          {idError && <span className="text-xs text-rose-500">{idError}</span>}
        </Field>
        <Field label="Full Name">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Department">
          <select className={selectClass} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Designation / Role">
          <input className={inputClass} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Site Engineer" required />
        </Field>
        <Field label="Base Monthly Salary">
          <input type="number" min="0" step="0.01" className={inputClass} value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} required />
        </Field>
        <Field label="Phone Number">
          <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-0100" />
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

function EmployeesModule({ employees, setEmployees, sites, settings, showToast }) {
  const [formEmp, setFormEmp] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [deptFilter, setDeptFilter] = React.useState('all');

  const siteName = (id) => (sites.find((s) => s.id === id) || {}).name || 'Unassigned';

  const filtered = employees.filter((e) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
    const matchesDept = deptFilter === 'all' || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const saveEmployee = (form) => {
    if (employees.some((e) => e.id === form.id) && formEmp && formEmp.id) {
      setEmployees(employees.map((e) => (e.id === form.id ? form : e)));
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
        <select className={selectClass + ' sm:w-56'} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="all">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
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
                  <th className="px-4 py-2.5 font-medium">Department / Role</th>
                  <th className="px-4 py-2.5 font-medium">Base Salary</th>
                  <th className="px-4 py-2.5 font-medium">Site</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{emp.name}</div>
                      <div className="text-xs text-slate-400">{emp.id} · {emp.phone || 'No phone'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700">{emp.department}</div>
                      <div className="text-xs text-slate-400">{emp.designation}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(emp.baseSalary, settings.currency)}</td>
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
                      <Badge tone={emp.status === 'Active' ? 'green' : 'slate'}>{emp.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" className="!px-2" onClick={() => setFormEmp(emp)}>
                          <Icon name="pencil" className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" className="!px-2 text-rose-500 hover:bg-rose-50" onClick={() => setDeleteTarget(emp)}>
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

      {formEmp !== null && (
        <EmployeeForm employee={formEmp.id ? formEmp : null} sites={sites} employees={employees} onSave={saveEmployee} onClose={() => setFormEmp(null)} />
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
