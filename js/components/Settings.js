const CURRENCY_PRESETS = ['$', '₹', '€', '£', 'AED'];

function SettingsModule({ settings, setSettings, showToast }) {
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
    { key: '26', label: 'Standard 26 Days', hint: 'Excludes 4 Sundays' },
    { key: '30', label: 'Fixed 30 Days', hint: 'Flat month length' },
    { key: 'actual', label: 'Actual Calendar Days', hint: 'Excludes Sundays dynamically' },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">System Configuration</h2>
        <p className="text-sm text-slate-500">Currency, overtime rules and company profile</p>
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

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <Icon name="clock" className="w-4 h-4 text-brand-600" /> Overtime Rules
          </h3>
          <Field label="Default OT Rate Multiplier" hint="Applied to all logged OT shift units when computing payroll">
            <div className="flex gap-2">
              {[1.0, 1.5].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => update({ defaultOtMultiplier: m })}
                  className={`touch-target px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    Number(form.defaultOtMultiplier) === m ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {m.toFixed(1)}x
                </button>
              ))}
            </div>
          </Field>
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

        <div className="flex justify-end">
          <Button type="submit">
            <Icon name="save" className="w-4 h-4" /> Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
