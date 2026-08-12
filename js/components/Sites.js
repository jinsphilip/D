function SiteForm({ site, onSave, onClose }) {
  const [form, setForm] = React.useState(
    site || { name: '', location: '', status: 'Active' }
  );
  const isEdit = !!site;

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) return;
    onSave(form);
  };

  return (
    <Modal title={isEdit ? 'Edit Site' : 'Add New Site'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Site Name">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Downtown Commercial Hub" required />
        </Field>
        <Field label="Location / Address">
          <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Sector 12, Metro City" required />
        </Field>
        <Field label="Status">
          <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {SITE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save Changes' : 'Create Site'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function SitesModule({ sites, setSites, employees, setEmployees, showToast }) {
  const [formSite, setFormSite] = React.useState(null); // null = closed, {} = new, site = edit
  const [assignSite, setAssignSite] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [expanded, setExpanded] = React.useState(null);

  const staffOf = (siteId) => employees.filter((e) => e.siteId === siteId);

  const saveSite = (form) => {
    if (form.id) {
      setSites(sites.map((s) => (s.id === form.id ? { ...s, ...form } : s)));
      showToast('Site updated');
    } else {
      const id = nextSiteId(sites);
      setSites([...sites, { ...form, id }]);
      showToast('Site created');
    }
    setFormSite(null);
  };

  const confirmDelete = () => {
    setEmployees(employees.map((e) => (e.siteId === deleteTarget.id ? { ...e, siteId: null } : e)));
    setSites(sites.filter((s) => s.id !== deleteTarget.id));
    showToast('Site deleted');
    setDeleteTarget(null);
  };

  const applyAssignment = (pending) => {
    setEmployees(employees.map((e) => (Object.prototype.hasOwnProperty.call(pending, e.id) ? { ...e, siteId: pending[e.id] } : e)));
    showToast('Staff assignment updated');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Sites &amp; Project Locations</h2>
          <p className="text-sm text-slate-500">{sites.length} site(s) total</p>
        </div>
        <Button onClick={() => setFormSite({})}>
          <Icon name="plus" className="w-4 h-4" /> Add Site
        </Button>
      </div>

      {sites.length === 0 ? (
        <EmptyState icon="map-pin" title="No sites yet" message="Create your first project site to start assigning staff." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => {
            const staff = staffOf(site.id);
            const isOpen = expanded === site.id;
            return (
              <div key={site.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{site.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{site.id}</p>
                    </div>
                    <Badge tone={siteStatusTone(site.status)}>{site.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                    <Icon name="map-pin" className="w-3.5 h-3.5 shrink-0" /> {site.location}
                  </p>
                  <button
                    className="text-sm text-slate-600 mt-3 flex items-center gap-1.5 hover:text-brand-600"
                    onClick={() => setExpanded(isOpen ? null : site.id)}
                  >
                    <Icon name="users" className="w-3.5 h-3.5" />
                    {staff.length} staff assigned
                    <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} className="w-3.5 h-3.5" />
                  </button>
                  {isOpen && (
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto border-t border-slate-100 pt-2">
                      {staff.length === 0 ? (
                        <p className="text-xs text-slate-400">No employees assigned.</p>
                      ) : staff.map((e) => (
                        <div key={e.id} className="text-xs text-slate-600 flex items-center justify-between">
                          <span className="truncate">{e.name}</span>
                          <span className="text-slate-400 shrink-0 ml-2">{e.designation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-100 px-3 py-2 flex items-center gap-1 bg-slate-50/60">
                  <Button variant="ghost" className="!px-2.5" onClick={() => setAssignSite(site)}>
                    <Icon name="user-plus" className="w-4 h-4" /> Staff
                  </Button>
                  <Button variant="ghost" className="!px-2.5" onClick={() => setFormSite(site)}>
                    <Icon name="pencil" className="w-4 h-4" /> Edit
                  </Button>
                  <Button variant="ghost" className="!px-2.5 ml-auto text-rose-500 hover:bg-rose-50" onClick={() => setDeleteTarget(site)}>
                    <Icon name="trash-2" className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formSite !== null && (
        <SiteForm site={formSite.id ? formSite : null} onSave={saveSite} onClose={() => setFormSite(null)} />
      )}
      {assignSite && (
        <AssignmentModal
          title={`Assign Staff · ${assignSite.name}`}
          entity={assignSite}
          fieldName="siteId"
          employees={employees}
          onAssign={applyAssignment}
          onClose={() => setAssignSite(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Site"
          message={`Delete "${deleteTarget.name}"? Employees assigned to this site will become unassigned.`}
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
