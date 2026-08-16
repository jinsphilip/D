function OtSelector({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
      {OT_LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          className={`px-2.5 py-1.5 text-xs font-medium touch-target transition-colors ${
            Number(value) === level ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
          } ${level !== 0 ? 'border-l border-slate-300' : ''}`}
        >
          {level === 0 ? 'None' : `${level.toFixed(1)}x`}
        </button>
      ))}
    </div>
  );
}

function StatusSelector({ value, onChange }) {
  const options = [
    { key: 'present', label: 'Present', tone: 'green' },
    { key: 'halfday', label: 'Half Day', tone: 'amber' },
    { key: 'absent', label: 'Absent', tone: 'red' },
  ];
  const active = {
    green: 'bg-emerald-600 text-white',
    amber: 'bg-amber-500 text-white',
    red: 'bg-rose-600 text-white',
  };
  return (
    <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
      {options.map((opt, i) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`px-2.5 py-1.5 text-xs font-medium touch-target transition-colors ${i > 0 ? 'border-l border-slate-300' : ''} ${
            value === opt.key ? active[opt.tone] : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const BLANK_RECORD = { status: undefined, otCount: 0, note: '' };

function AttendanceModule({ employees, sites, attendance, setAttendance, settings, siteFilter, setSiteFilter, showToast }) {
  const [date, setDate] = React.useState(todayISO());
  // Edits happen against this local draft first; nothing reaches the shared
  // backend until "Save Attendance" is clicked, so a whole date's worth of
  // taps/edits becomes one deliberate save instead of one network write per
  // click.
  const [draft, setDraft] = React.useState(() => attendance[date] || {});
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    setDraft(attendance[date] || {});
    setDirty(false);
    // Intentionally only re-syncs when the selected date changes, not on
    // every `attendance` update (e.g. a background poll picking up someone
    // else's edits elsewhere) — that would silently wipe out in-progress
    // local edits on the date currently being worked on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const monthStr = date.slice(0, 7);
  const workingDays = getWorkingDaysInMonth(monthStr, settings.daysInMonthMode, settings.holidays);
  const holiday = isHolidayDate(date, settings.holidays);
  const holidayName = isSunday(date) ? 'Sunday' : ((settings.holidays || []).find((h) => h.date === date) || {}).name || 'Holiday';

  const filteredEmployees = React.useMemo(() => {
    let list = employees.filter((e) => e.status === 'Active');
    if (siteFilter !== 'all') list = list.filter((e) => e.siteId === siteFilter);
    return list;
  }, [employees, siteFilter]);

  const siteName = (id) => (sites.find((s) => s.id === id) || {}).name || 'Unassigned';

  const getRecord = (empId) => draft[empId] || BLANK_RECORD;

  const changeDate = (nextDate) => {
    if (dirty && !window.confirm('You have unsaved attendance changes for this date. Switch dates and discard them?')) {
      return;
    }
    setDate(nextDate);
  };

  const updateRecord = (empId, patch) => {
    setDraft((prev) => {
      const current = prev[empId] || BLANK_RECORD;
      const next = { ...current, ...patch };
      if (next.status === 'absent') next.otCount = 0; // no OT on a day not worked
      return { ...prev, [empId]: next };
    });
    setDirty(true);
  };

  const markAllPresent = () => {
    setDraft((prev) => {
      const next = { ...prev };
      filteredEmployees.forEach((emp) => {
        const current = next[emp.id] || BLANK_RECORD;
        next[emp.id] = { ...current, status: 'present' };
      });
      return next;
    });
    setDirty(true);
    showToast(`Marked ${filteredEmployees.length} employee(s) present (not yet saved)`);
  };

  const markAllAbsent = () => {
    setDraft((prev) => {
      const next = { ...prev };
      filteredEmployees.forEach((emp) => {
        const current = next[emp.id] || BLANK_RECORD;
        next[emp.id] = { ...current, status: 'absent', otCount: 0 };
      });
      return next;
    });
    setDirty(true);
    showToast(`Marked ${filteredEmployees.length} employee(s) absent (not yet saved)`);
  };

  const saveAttendance = () => {
    setAttendance((prev) => ({ ...prev, [date]: draft }));
    setDirty(false);
    showToast('Attendance saved');
  };

  const otPreview = (emp, otCount) => {
    const dailyRate = workingDays > 0 ? emp.baseSalary / workingDays : 0;
    return Number(otCount || 0) * dailyRate;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Daily Attendance</h2>
          <p className="text-sm text-slate-500 flex items-center gap-2">
            {dateLabel(date)}
            {holiday && <Badge tone="blue">{holidayName} · Holiday</Badge>}
            {dirty && <Badge tone="amber">Unsaved changes</Badge>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            className={inputClass + ' w-auto'}
            value={date}
            max={todayISO()}
            onChange={(e) => changeDate(e.target.value)}
          />
          <select className={selectClass + ' w-auto min-w-[160px]'} value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
            <option value="all">All Sites</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <Button variant="secondary" onClick={markAllPresent} disabled={filteredEmployees.length === 0}>
            <Icon name="check-check" className="w-4 h-4" /> Mark Filtered Present
          </Button>
          <Button variant="secondary" onClick={markAllAbsent} disabled={filteredEmployees.length === 0}>
            <Icon name="x" className="w-4 h-4" /> Mark Filtered Absent
          </Button>
          <Button onClick={saveAttendance} disabled={!dirty}>
            <Icon name="save" className="w-4 h-4" /> Save Attendance
          </Button>
        </div>
      </div>

      {filteredEmployees.length === 0 ? (
        <EmptyState icon="calendar-x" title="No staff to display" message="Adjust the site filter or assign staff to a site first." />
      ) : (
        <React.Fragment>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {filteredEmployees.map((emp) => {
              const record = getRecord(emp.id);
              return (
                <div key={emp.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{emp.name}</p>
                      <p className="text-xs text-slate-400">{emp.id} · {siteName(emp.siteId)}</p>
                    </div>
                    <Badge tone={attendanceStatusTone(record.status)}>{attendanceStatusLabel(record.status)}</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Status</p>
                    <StatusSelector value={record.status} onChange={(v) => updateRecord(emp.id, { status: v })} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">OT Shift</p>
                    <OtSelector value={record.otCount} onChange={(v) => updateRecord(emp.id, { otCount: v })} />
                    {Number(record.otCount) > 0 && (
                      <p className="text-xs text-violet-600 mt-1.5 font-medium">
                        + {formatCurrency(otPreview(emp, record.otCount), settings.currency)} OT earnings
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      className={inputClass}
                      placeholder="Note / reason (optional)"
                      value={record.note || ''}
                      onChange={(e) => updateRecord(emp.id, { note: e.target.value })}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60">
                    <th className="px-4 py-2.5 font-medium">Employee</th>
                    <th className="px-4 py-2.5 font-medium">Site</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">OT Shift</th>
                    <th className="px-4 py-2.5 font-medium">OT Earnings</th>
                    <th className="px-4 py-2.5 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => {
                    const record = getRecord(emp.id);
                    return (
                      <tr key={emp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 align-top">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{emp.name}</div>
                          <div className="text-xs text-slate-400">{emp.id}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{siteName(emp.siteId)}</td>
                        <td className="px-4 py-3">
                          <StatusSelector value={record.status} onChange={(v) => updateRecord(emp.id, { status: v })} />
                        </td>
                        <td className="px-4 py-3">
                          <OtSelector value={record.otCount} onChange={(v) => updateRecord(emp.id, { otCount: v })} />
                        </td>
                        <td className="px-4 py-3">
                          {Number(record.otCount) > 0 ? (
                            <span className="text-violet-600 font-medium text-xs">{formatCurrency(otPreview(emp, record.otCount), settings.currency)}</span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className={inputClass + ' min-w-[160px]'}
                            placeholder="Reason..."
                            value={record.note || ''}
                            onChange={(e) => updateRecord(emp.id, { note: e.target.value })}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
