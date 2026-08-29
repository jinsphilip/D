// No explicit "None" pill — clicking the already-active level clears it back
// to no-OT, same interaction as the grid's OT buttons.
function OtSelector({ value, onChange, disabled }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
      {OT_LEVELS.map((level, i) => {
        const active = Number(value) === level;
        return (
          <button
            key={level}
            type="button"
            disabled={disabled}
            onClick={() => onChange(active ? 0 : level)}
            className={`px-2.5 py-1.5 text-xs font-medium touch-target transition-colors ${i > 0 ? 'border-l border-slate-300' : ''} ${
              disabled ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : active ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {level.toFixed(1)}x
          </button>
        );
      })}
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
const STATUS_CYCLE = [undefined, 'present', 'halfday', 'absent'];

// Single-day attendance view: pick a date, edit each employee's status/OT/note,
// Save Attendance commits. Edits are tracked as a sparse `changes` overlay
// (only employees actually touched) rather than a full per-date snapshot, so
// an employee nobody edited always reflects the latest server value (picked
// up by background polling) and saving never clobbers another user's
// concurrent edit to a *different* employee on the same date — only the
// employees this session actually changed are merged in.
function DayView({ date, changeDate, employees, sites, siteName, attendance, setAttendance, settings, salaryRevisions, travelRecords, dirty, setDirty, showToast }) {
  const [changes, setChanges] = React.useState({});

  React.useEffect(() => {
    setChanges({});
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const monthStr = date.slice(0, 7);
  const workingDays = getWorkingDaysInMonth(monthStr, settings.daysInMonthMode, settings.holidays);
  const holiday = isHolidayDate(date, settings.holidays);
  const holidayName = isSunday(date) ? 'Sunday' : ((settings.holidays || []).find((h) => h.date === date) || {}).name || 'Holiday';

  const recordFromChanges = (changesObj, empId) => {
    const override = changesObj[empId];
    if (override !== undefined) return override || BLANK_RECORD;
    return (attendance[date] && attendance[date][empId]) || BLANK_RECORD;
  };
  const getRecord = (empId) => recordFromChanges(changes, empId);

  const updateRecord = (empId, patch) => {
    setChanges((prev) => {
      const current = recordFromChanges(prev, empId);
      const next = { ...current, ...patch };
      if (next.status !== 'present') next.otCount = 0; // OT only applies to a day marked Present
      return { ...prev, [empId]: next };
    });
    setDirty(true);
  };

  const markAllPresent = () => {
    setChanges((prev) => {
      const next = { ...prev };
      employees.forEach((emp) => {
        next[emp.id] = { ...recordFromChanges(prev, emp.id), status: 'present' };
      });
      return next;
    });
    setDirty(true);
    showToast(`Marked ${employees.length} employee(s) present (not yet saved)`);
  };

  const markAllAbsent = () => {
    setChanges((prev) => {
      const next = { ...prev };
      employees.forEach((emp) => {
        next[emp.id] = { ...recordFromChanges(prev, emp.id), status: 'absent', otCount: 0 };
      });
      return next;
    });
    setDirty(true);
    showToast(`Marked ${employees.length} employee(s) absent (not yet saved)`);
  };

  const saveAttendance = () => {
    setAttendance((prev) => {
      const merged = { ...(prev[date] || {}) };
      Object.keys(changes).forEach((empId) => {
        const rec = changes[empId];
        if (rec && rec.status) merged[empId] = rec;
        else delete merged[empId];
      });
      return { ...prev, [date]: merged };
    });
    setChanges({});
    setDirty(false);
    showToast('Attendance saved');
  };

  const otPreview = (emp, otCount) => {
    const dailyRate = workingDays > 0 ? getSalaryForMonth(emp, monthStr, salaryRevisions) / workingDays : 0;
    return Number(otCount || 0) * dailyRate;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-slate-500 flex items-center gap-2">
          {dateLabel(date)}
          {holiday && <Badge tone="blue">{holidayName} · Holiday</Badge>}
          {dirty && <Badge tone="amber">Unsaved changes</Badge>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            className={inputClass + ' w-auto'}
            value={date}
            max={todayISO()}
            onChange={(e) => changeDate(e.target.value)}
          />
          <Button variant="secondary" onClick={markAllPresent} disabled={employees.length === 0}>
            <Icon name="check-check" className="w-4 h-4" /> Mark Filtered Present
          </Button>
          <Button variant="secondary" onClick={markAllAbsent} disabled={employees.length === 0}>
            <Icon name="x" className="w-4 h-4" /> Mark Filtered Absent
          </Button>
          <Button onClick={saveAttendance} disabled={!dirty}>
            <Icon name="save" className="w-4 h-4" /> Save Attendance
          </Button>
        </div>
      </div>

      {employees.length === 0 ? (
        <EmptyState icon="calendar-x" title="No staff to display" message="Adjust the site filter or assign staff to a site first." />
      ) : (
        <React.Fragment>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {employees.map((emp) => {
              const record = getRecord(emp.id);
              const onTravel = isOnApprovedTravel(emp.id, date, travelRecords);
              return (
                <div key={emp.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{emp.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        {emp.id} · {siteName(emp.siteId)}
                        {onTravel && <Badge tone="blue">On Travel</Badge>}
                      </p>
                    </div>
                    <Badge tone={attendanceStatusTone(record.status)}>{attendanceStatusLabel(record.status)}</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Status</p>
                    <StatusSelector value={record.status} onChange={(v) => updateRecord(emp.id, { status: v })} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">OT Shift</p>
                    <OtSelector value={record.otCount} onChange={(v) => updateRecord(emp.id, { otCount: v })} disabled={record.status !== 'present'} />
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
                  {employees.map((emp) => {
                    const record = getRecord(emp.id);
                    const onTravel = isOnApprovedTravel(emp.id, date, travelRecords);
                    return (
                      <tr key={emp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 align-top">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 flex items-center gap-1.5">
                            {emp.name}
                            {onTravel && <Badge tone="blue">On Travel</Badge>}
                          </div>
                          <div className="text-xs text-slate-400">{emp.id}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{siteName(emp.siteId)}</td>
                        <td className="px-4 py-3">
                          <StatusSelector value={record.status} onChange={(v) => updateRecord(emp.id, { status: v })} />
                        </td>
                        <td className="px-4 py-3">
                          <OtSelector value={record.otCount} onChange={(v) => updateRecord(emp.id, { otCount: v })} disabled={record.status !== 'present'} />
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

function gridCellClasses(status, isFuture) {
  if (isFuture) return 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed';
  const tone = attendanceStatusTone(status);
  if (tone === 'slate') return 'bg-white text-slate-300 border-slate-200 hover:bg-slate-50 cursor-pointer';
  const active = {
    green: 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600',
    amber: 'bg-amber-400 text-white border-amber-400 hover:bg-amber-500',
    red: 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600',
  };
  return active[tone];
}

function gridCellLabel(status) {
  if (status === 'present') return 'P';
  if (status === 'halfday') return 'H';
  if (status === 'absent') return 'A';
  return '';
}

// OT only applies to a day actually marked Present — not Half Day, not
// Absent, not unmarked.
function otEditable(status) {
  return status === 'present';
}

// The OT levels, shown as individually clickable buttons in the grid
// (rather than a single cycling swatch) so all options are visible at once,
// same spirit as DayView's OtSelector pills.
const GRID_OT_LEVELS = OT_LEVELS;

function otButtonClasses(active, disabled) {
  if (disabled) return 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed';
  return active
    ? 'bg-violet-600 text-white border-violet-600 hover:bg-violet-700 cursor-pointer'
    : 'bg-white text-slate-300 border-slate-200 hover:bg-slate-50 cursor-pointer';
}

// Week/Month attendance grid: rows = employees, columns = every date in the
// visible range. Each cell has a status swatch on top (click cycles None ->
// Present -> Half Day -> Absent -> None) and, below it, OT buttons — one per
// OT_LEVELS entry — any of which can be clicked directly to set that day's
// OT (click the active one again to clear it back to none); OT only applies
// while the day is marked Present. "Mark Shown Present/Absent" bulk-applies
// to every non-future day in the range for the currently listed employees —
// Sundays and Settings holidays are not treated specially here, same as
// every other day. Like DayView, edits are a sparse overlay on top of the
// live `attendance` prop (only touched employee+date pairs are tracked), so
// saving merges just those pairs into the freshest server state instead of
// overwriting whole dates.
function RangeGridView({ mode, weekAnchor, changeWeekAnchor, month, changeMonth, employees, attendance, setAttendance, dirty, setDirty, showToast }) {
  const dates = mode === 'week' ? datesInRange(startOfWeek(weekAnchor), 7) : datesInMonth(month);
  const rangeKey = `${mode}_${dates[0]}_${dates[dates.length - 1]}`;

  const [changes, setChanges] = React.useState({});

  React.useEffect(() => {
    setChanges({});
    setDirty(false);
    // Resyncs only when the visible range's identity changes (week/month
    // navigation, or switching between the two) — not on every attendance
    // poll, matching DayView's rule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  const recordFromChanges = (changesObj, date, empId) => {
    const dayChanges = changesObj[date];
    const override = dayChanges && dayChanges[empId];
    if (override !== undefined) return override || BLANK_RECORD;
    return (attendance[date] && attendance[date][empId]) || BLANK_RECORD;
  };
  const getRecord = (date, empId) => recordFromChanges(changes, date, empId);

  const cycleStatus = (date, empId) => {
    if (date > todayISO()) return;
    const current = getRecord(date, empId);
    const idx = STATUS_CYCLE.indexOf(current.status);
    const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    const nextRecord = nextStatus ? { ...current, status: nextStatus, otCount: nextStatus === 'present' ? current.otCount : 0 } : null;
    setChanges((prev) => ({ ...prev, [date]: { ...(prev[date] || {}), [empId]: nextRecord } }));
    setDirty(true);
  };

  const setOt = (date, empId, otCount) => {
    if (date > todayISO()) return;
    const current = getRecord(date, empId);
    if (!otEditable(current.status)) return; // no OT on a day not worked
    setChanges((prev) => ({ ...prev, [date]: { ...(prev[date] || {}), [empId]: { ...current, otCount } } }));
    setDirty(true);
  };

  const bulkFill = (status) => {
    const targetDates = dates.filter((d) => d <= todayISO());
    if (targetDates.length === 0) {
      showToast('No eligible days to bulk-mark in this range.');
      return;
    }
    setChanges((prev) => {
      const next = { ...prev };
      targetDates.forEach((date) => {
        const dayChanges = { ...(next[date] || {}) };
        employees.forEach((emp) => {
          const current = recordFromChanges(prev, date, emp.id);
          dayChanges[emp.id] = { ...current, status, otCount: status === 'present' ? current.otCount : 0 };
        });
        next[date] = dayChanges;
      });
      return next;
    });
    setDirty(true);
    showToast(`Marked ${employees.length} employee(s) × ${targetDates.length} day(s) ${status} (not yet saved)`);
  };

  const saveRange = () => {
    setAttendance((prev) => {
      const next = { ...prev };
      Object.keys(changes).forEach((date) => {
        const merged = { ...(prev[date] || {}) };
        Object.keys(changes[date]).forEach((empId) => {
          const rec = changes[date][empId];
          if (rec && rec.status) merged[empId] = rec;
          else delete merged[empId];
        });
        next[date] = merged;
      });
      return next;
    });
    setChanges({});
    setDirty(false);
    showToast('Attendance saved');
  };

  const rangeLabel = mode === 'week'
    ? `${shortDateLabel(dates[0])} – ${shortDateLabel(dates[dates.length - 1])}, ${dates[0].slice(0, 4)}`
    : monthLabel(month);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-slate-500 flex items-center gap-2">
          {rangeLabel}
          {dirty && <Badge tone="amber">Unsaved changes</Badge>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'week' ? (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => changeWeekAnchor(addDays(weekAnchor, -7))} className="touch-target p-2 rounded-lg border border-slate-300 hover:bg-slate-50" aria-label="Previous week">
                <Icon name="chevron-left" className="w-4 h-4" />
              </button>
              <input type="date" className={inputClass + ' w-auto'} value={weekAnchor} onChange={(e) => changeWeekAnchor(e.target.value)} />
              <button type="button" onClick={() => changeWeekAnchor(addDays(weekAnchor, 7))} className="touch-target p-2 rounded-lg border border-slate-300 hover:bg-slate-50" aria-label="Next week">
                <Icon name="chevron-right" className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => changeMonth(prevMonthStr(month))} className="touch-target p-2 rounded-lg border border-slate-300 hover:bg-slate-50" aria-label="Previous month">
                <Icon name="chevron-left" className="w-4 h-4" />
              </button>
              <input type="month" className={inputClass + ' w-auto'} value={month} onChange={(e) => changeMonth(e.target.value)} />
              <button type="button" onClick={() => changeMonth(nextMonthStr(month))} className="touch-target p-2 rounded-lg border border-slate-300 hover:bg-slate-50" aria-label="Next month">
                <Icon name="chevron-right" className="w-4 h-4" />
              </button>
            </div>
          )}
          <Button variant="secondary" onClick={() => bulkFill('present')} disabled={employees.length === 0}>
            <Icon name="check-check" className="w-4 h-4" /> Mark Shown Present
          </Button>
          <Button variant="secondary" onClick={() => bulkFill('absent')} disabled={employees.length === 0}>
            <Icon name="x" className="w-4 h-4" /> Mark Shown Absent
          </Button>
          <Button onClick={saveRange} disabled={!dirty}>
            <Icon name="save" className="w-4 h-4" /> Save Attendance
          </Button>
        </div>
      </div>

      {employees.length === 0 ? (
        <EmptyState icon="calendar-x" title="No staff to display" message="Adjust the site filter or assign staff to a site first." />
      ) : (
        <React.Fragment>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span> Present</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block"></span> Half Day</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-rose-500 inline-block"></span> Absent</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-violet-600 inline-block"></span> OT marked</span>
            <span>Top of a cell cycles status; the buttons below pick OT — 0.5x / 1x / 1.5x / 2x (Present only).</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-auto max-h-[65vh]">
              <table className="text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="sticky top-0 left-0 z-20 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-500 border-b border-r border-slate-100" style={{ minWidth: '10rem' }}>
                      Employee
                    </th>
                    {dates.map((d) => {
                      const future = d > todayISO();
                      return (
                        <th
                          key={d}
                          className={`sticky top-0 z-10 px-1 py-2 text-center text-[11px] font-medium border-b border-slate-100 ${
                            future ? 'bg-slate-50 text-slate-300' : 'bg-slate-50/60 text-slate-500'
                          }`}
                          style={{ minWidth: '5.5rem' }}
                        >
                          {shortDateLabel(d)}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-slate-50 last:border-0">
                      <td className="sticky left-0 z-10 bg-white px-3 py-1.5 border-r border-slate-100">
                        <div className="font-medium text-slate-800 text-xs">{emp.name}</div>
                        <div className="text-[10px] text-slate-400">{emp.id}</div>
                      </td>
                      {dates.map((d) => {
                        const record = getRecord(d, emp.id);
                        const future = d > todayISO();
                        const otDisabled = future || !otEditable(record.status);
                        return (
                          <td key={d} className="px-1 py-1 text-center">
                            <div className="w-20 mx-auto">
                              <button
                                type="button"
                                disabled={future}
                                onClick={() => cycleStatus(d, emp.id)}
                                title={`${emp.name} · ${shortDateLabel(d)}${record.status ? ' · ' + attendanceStatusLabel(record.status) : ''}`}
                                className={`w-20 h-7 rounded-t-md border text-xs font-semibold flex items-center justify-center transition-colors ${gridCellClasses(record.status, future)}`}
                              >
                                {gridCellLabel(record.status)}
                              </button>
                              <div className="flex -mt-px">
                                {GRID_OT_LEVELS.map((level, i) => {
                                  const active = Number(record.otCount) === level;
                                  return (
                                    <button
                                      key={level}
                                      type="button"
                                      disabled={otDisabled}
                                      onClick={() => setOt(d, emp.id, active ? 0 : level)}
                                      title={`${emp.name} · ${shortDateLabel(d)} · OT ${level.toFixed(1)}x`}
                                      className={`flex-1 h-5 border text-[8px] font-medium flex items-center justify-center transition-colors ${
                                        i === 0 ? 'rounded-bl-md' : 'border-l-0'
                                      } ${i === GRID_OT_LEVELS.length - 1 ? 'rounded-br-md' : ''} ${otButtonClasses(active, otDisabled)}`}
                                    >
                                      {level === 1 ? '1x' : `${level}x`}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

const ATTENDANCE_VIEW_MODES = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

function AttendanceModule({ employees, sites, attendance, setAttendance, settings, salaryRevisions, travelRecords, siteFilter, setSiteFilter, showToast }) {
  const [viewMode, setViewMode] = React.useState('day');
  const [date, setDate] = React.useState(todayISO());
  const [weekAnchor, setWeekAnchor] = React.useState(todayISO());
  const [month, setMonth] = React.useState(currentMonthStr());
  const [dirty, setDirty] = React.useState(false);

  const filteredEmployees = React.useMemo(() => {
    let list = employees.filter((e) => e.status === 'Active');
    if (siteFilter !== 'all') list = list.filter((e) => e.siteId === siteFilter);
    return list;
  }, [employees, siteFilter]);

  const siteName = (id) => (sites.find((s) => s.id === id) || {}).name || 'Unassigned';

  const guardedNav = (setter) => (value) => {
    if (dirty && !window.confirm('You have unsaved attendance changes. Switch and discard them?')) return;
    setter(value);
  };
  const changeDate = guardedNav(setDate);
  const changeWeekAnchor = guardedNav(setWeekAnchor);
  const changeMonth = guardedNav(setMonth);
  const changeViewMode = guardedNav(setViewMode);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Attendance</h2>
          <p className="text-sm text-slate-500">Mark attendance by day, week or month.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
            {ATTENDANCE_VIEW_MODES.map((v, i) => (
              <button
                key={v.key}
                type="button"
                onClick={() => changeViewMode(v.key)}
                className={`px-3 py-1.5 text-xs font-medium touch-target transition-colors ${i > 0 ? 'border-l border-slate-300' : ''} ${
                  viewMode === v.key ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <select className={selectClass + ' w-auto min-w-[160px]'} value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
            <option value="all">All Sites</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {viewMode === 'day' && (
        <DayView
          date={date} changeDate={changeDate} employees={filteredEmployees} sites={sites} siteName={siteName}
          attendance={attendance} setAttendance={setAttendance} settings={settings} salaryRevisions={salaryRevisions} travelRecords={travelRecords}
          dirty={dirty} setDirty={setDirty} showToast={showToast}
        />
      )}
      {viewMode !== 'day' && (
        <RangeGridView
          mode={viewMode}
          weekAnchor={weekAnchor} changeWeekAnchor={changeWeekAnchor}
          month={month} changeMonth={changeMonth}
          employees={filteredEmployees}
          attendance={attendance} setAttendance={setAttendance}
          dirty={dirty} setDirty={setDirty} showToast={showToast}
        />
      )}
    </div>
  );
}
