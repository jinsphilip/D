const CURRENCY_PRESETS = ['$', '₹', '€', '£', 'AED'];

function ChangePasswordSection({ username, showToast }) {
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('New passwords do not match'); return; }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
        <Icon name="lock" className="w-4 h-4 text-brand-600" /> Change Password
      </h3>
      {username && <p className="text-xs text-slate-400 -mt-2">Logged in as {username}</p>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Current Password">
          <input
            type="password" className={inputClass} value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required
          />
        </Field>
        <Field label="New Password" hint="At least 6 characters">
          <input
            type="password" className={inputClass} value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required
          />
        </Field>
        <Field label="Confirm New Password">
          <input
            type="password" className={inputClass} value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required
          />
        </Field>
        {error && (
          <p className="text-sm text-rose-600 flex items-start gap-1.5">
            <Icon name="alert-circle" className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Icon name="lock" className="w-4 h-4" /> {saving ? 'Updating…' : 'Update Password'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function HolidaysSection({ holidays, onChange }) {
  const [newDate, setNewDate] = React.useState('');
  const [newName, setNewName] = React.useState('');

  const sorted = React.useMemo(
    () => [...(holidays || [])].sort((a, b) => a.date.localeCompare(b.date)),
    [holidays]
  );

  const addHoliday = (e) => {
    e.preventDefault();
    if (!newDate) return;
    const rest = (holidays || []).filter((h) => h.date !== newDate);
    onChange([...rest, { date: newDate, name: newName.trim() || 'Holiday' }]);
    setNewDate('');
    setNewName('');
  };

  const removeHoliday = (date) => {
    onChange((holidays || []).filter((h) => h.date !== date));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          <Icon name="calendar-off" className="w-4 h-4 text-brand-600" /> Holidays
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Sundays are ordinary working days by default — add a specific Sunday here too if you want
          it off. Dates listed below (public holidays, festivals, weekly offs, etc.) don't count as
          absent when left unmarked in Attendance.
        </p>
      </div>

      {sorted.length > 0 && (
        <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
          {sorted.map((h) => (
            <li key={h.date} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-slate-800">{dateLabel(h.date)}</span>
                <span className="text-slate-400 ml-2">{h.name}</span>
              </div>
              <button
                type="button"
                onClick={() => removeHoliday(h.date)}
                className="touch-target text-slate-400 hover:text-rose-600 transition-colors"
                aria-label={`Remove holiday ${h.date}`}
              >
                <Icon name="trash-2" className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="date" className={inputClass + ' sm:w-auto'} value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addHoliday(e); }}
        />
        <input
          className={inputClass}
          placeholder="Holiday name (optional)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addHoliday(e); }}
        />
        <Button type="button" variant="secondary" onClick={addHoliday} disabled={!newDate}>
          <Icon name="plus" className="w-4 h-4" /> Add
        </Button>
      </div>
    </div>
  );
}

function SettingsModule({ settings, setSettings, showToast, username }) {
  const [form, setForm] = React.useState(settings);
  const [customCurrency, setCustomCurrency] = React.useState(!CURRENCY_PRESETS.includes(settings.currency));

  React.useEffect(() => { setForm(settings); }, [settings]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const save = (e) => {
    e.preventDefault();
    setSettings(form);
    showToast('Settings saved');
  };

  const modes = [
    { key: '26', label: 'Standard 26 Days', hint: 'Flat 26-day baseline, regardless of listed holidays' },
    { key: '30', label: 'Fixed 30 Days', hint: "Up to 30 days, or the month's real length if shorter (e.g. February)" },
    { key: 'actual', label: 'Actual Calendar Days', hint: 'Excludes only the holidays listed below' },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">System Configuration</h2>
        <p className="text-sm text-slate-500">Currency, working days and company profile</p>
      </div>

      <form onSubmit={save} className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <Icon name="building-2" className="w-4 h-4 text-brand-600" /> Company Profile
          </h3>
          <Field label="Business Name">
            <input className={inputClass} value={form.companyName} onChange={(e) => update({ companyName: e.target.value })} />
          </Field>
          <Field label="Official Address">
            <input className={inputClass} value={form.companyAddress} onChange={(e) => update({ companyAddress: e.target.value })} />
          </Field>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <Icon name="coins" className="w-4 h-4 text-brand-600" /> Currency
          </h3>
          <div className="flex flex-wrap gap-2">
            {CURRENCY_PRESETS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => { update({ currency: c }); setCustomCurrency(false); }}
                className={`touch-target px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  !customCurrency && form.currency === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {c}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomCurrency(true)}
              className={`touch-target px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                customCurrency ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Custom
            </button>
          </div>
          {customCurrency && (
            <input
              className={inputClass + ' max-w-[160px]'}
              placeholder="Symbol"
              value={form.currency}
              onChange={(e) => update({ currency: e.target.value })}
            />
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <Icon name="calendar-range" className="w-4 h-4 text-brand-600" /> Monthly Working Days Mode
          </h3>
          <div className="space-y-2">
            {modes.map((m) => (
              <label key={m.key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer touch-target ${form.daysInMonthMode === m.key ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="daysMode"
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                  checked={form.daysInMonthMode === m.key}
                  onChange={() => update({ daysInMonthMode: m.key })}
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">{m.label}</p>
                  <p className="text-xs text-slate-400">{m.hint}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <HolidaysSection holidays={form.holidays} onChange={(holidays) => update({ holidays })} />

        <div className="flex justify-end">
          <Button type="submit">
            <Icon name="save" className="w-4 h-4" /> Save Settings
          </Button>
        </div>
      </form>

      <ChangePasswordSection username={username} showToast={showToast} />
    </div>
  );
}
