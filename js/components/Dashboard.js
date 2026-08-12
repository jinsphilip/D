function Dashboard({ sites, employees, attendance, settings, siteFilter, setSiteFilter, onNavigate }) {
  const today = todayISO();
  const month = currentMonthStr();

  const filteredEmployees = React.useMemo(() => {
    if (siteFilter === 'all') return employees;
    return employees.filter((e) => e.siteId === siteFilter);
  }, [employees, siteFilter]);

  const activeEmployees = filteredEmployees.filter((e) => e.status === 'Active');
  const activeSites = sites.filter((s) => s.status === 'Active');
  const visibleSites = siteFilter === 'all' ? activeSites : sites.filter((s) => s.id === siteFilter && s.status === 'Active');

  const todayRecords = attendance[today] || {};
  const presentToday = activeEmployees.filter((e) => {
    const r = todayRecords[e.id];
    return r && (r.status === 'present' || r.status === 'halfday');
  }).length;
  const otToday = activeEmployees.filter((e) => {
    const r = todayRecords[e.id];
    return r && Number(r.otCount) > 0;
  }).length;

  const estimatedPayroll = React.useMemo(() => {
    return activeEmployees.reduce((sum, emp) => {
      const result = calculateEmployeePayroll(emp, month, attendance, settings);
      return sum + result.netPayable;
    }, 0);
  }, [activeEmployees, attendance, settings, month]);

  const siteName = (id) => (sites.find((s) => s.id === id) || {}).name || '—';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Overview</h2>
          <p className="text-sm text-slate-500">{dateLabel(today)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="filter" className="w-4 h-4 text-slate-400" />
          <select
            className={selectClass + ' w-auto min-w-[180px]'}
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value="all">All Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon="users" label="Active Staff" value={activeEmployees.length} tone="blue" />
        <StatCard icon="map-pin" label="Active Sites" value={visibleSites.length} tone="purple" />
        <StatCard icon="check-circle-2" label="On-Duty Today" value={presentToday} tone="green" />
        <StatCard icon="zap" label="OT Duty Today" value={otToday} tone="amber" />
        <div className="col-span-2 lg:col-span-1">
          <StatCard icon="wallet" label={`Est. Payroll (${monthLabel(month)})`} value={formatCurrency(estimatedPayroll, settings.currency)} tone="slate" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Today's Attendance Log</h3>
          <button className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1" onClick={() => onNavigate('attendance')}>
            Go to Attendance <Icon name="arrow-right" className="w-3.5 h-3.5" />
          </button>
        </div>
        {activeEmployees.length === 0 ? (
          <EmptyState icon="users" title="No staff for this site" message="Assign employees to this site to see them here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2 font-medium">Employee</th>
                  <th className="px-4 py-2 font-medium">Site</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">OT Shift</th>
                </tr>
              </thead>
              <tbody>
                {activeEmployees.map((emp) => {
                  const r = todayRecords[emp.id];
                  return (
                    <tr key={emp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-800">{emp.name}</div>
                        <div className="text-xs text-slate-400">{emp.id} · {emp.designation}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{siteName(emp.siteId)}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={attendanceStatusTone(r && r.status)}>{attendanceStatusLabel(r && r.status)}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        {r && Number(r.otCount) > 0 ? (
                          <Badge tone="purple">{Number(r.otCount).toFixed(1)}x OT</Badge>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
