const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { key: 'attendance', label: 'Attendance', icon: 'calendar-check' },
  { key: 'sites', label: 'Sites', icon: 'map-pin' },
  { key: 'employees', label: 'Employees', icon: 'users' },
  { key: 'payroll', label: 'Payroll', icon: 'wallet' },
  { key: 'mess', label: 'Mess', icon: 'utensils' },
  { key: 'advances', label: 'Advances', icon: 'hand-coins' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

// Polling interval for picking up changes another user made on a different
// device/browser. This is not a live push (no websockets) — it's a simple
// "check back every few seconds" refresh, which is enough for a small team
// entering attendance/payroll data without stepping on each other constantly.
const SYNC_POLL_MS = 6000;

function useServerState(key, seedFn) {
  const [state, setState] = React.useState(null); // null while loading
  const [error, setError] = React.useState(null);
  const savingRef = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;
    apiGet(key)
      .then(async (value) => {
        if (cancelled) return;
        if (value === null || value === undefined) {
          const seeded = seedFn();
          await apiPut(key, seeded).catch(() => {});
          if (!cancelled) setState(seeded);
        } else {
          setState(value);
        }
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load data'); });
    return () => { cancelled = true; };
  }, [key]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (savingRef.current) return;
      apiGet(key)
        .then((value) => {
          if (value === null || value === undefined) return;
          setState((prev) => (JSON.stringify(prev) === JSON.stringify(value) ? prev : value));
        })
        .catch(() => {});
    }, SYNC_POLL_MS);
    return () => clearInterval(interval);
  }, [key]);

  const setAndSync = React.useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      savingRef.current = true;
      apiPut(key, next)
        .catch((e) => setError(e.message || 'Failed to save data'))
        .finally(() => { savingRef.current = false; });
      return next;
    });
  }, [key]);

  return [state, setAndSync, error];
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">Connecting to server…</p>
      </div>
    </div>
  );
}

function ServerErrorScreen({ message }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <Icon name="server-crash" className="w-6 h-6" />
        </div>
        <p className="font-semibold text-slate-800">Can't reach the server</p>
        <p className="text-sm text-slate-500 mt-1">{message}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  );
}

function AuthenticatedApp({ username, onLogout }) {
  const [sites, setSites, sitesErr] = useServerState(STORAGE_KEYS.sites, seedSites);
  const [employees, setEmployees, employeesErr] = useServerState(STORAGE_KEYS.employees, seedEmployees);
  const [attendance, setAttendance, attendanceErr] = useServerState(STORAGE_KEYS.attendance, seedAttendance);
  const [settings, setSettings, settingsErr] = useServerState(STORAGE_KEYS.settings, seedSettings);
  const [messes, setMesses, messesErr] = useServerState(STORAGE_KEYS.messes, seedMesses);
  const [messExpenses, setMessExpenses, messExpensesErr] = useServerState(STORAGE_KEYS.messExpenses, seedMessExpenses);
  const [advances, setAdvances, advancesErr] = useServerState(STORAGE_KEYS.advances, seedAdvances);
  const [salaryRevisions, setSalaryRevisions, salaryRevisionsErr] = useServerState(STORAGE_KEYS.salaryRevisions, seedSalaryRevisions);

  const [tab, setTab] = React.useState('dashboard');
  const [siteFilter, setSiteFilter] = React.useState('all');
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [showToast, toastNode] = useToast();

  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const navigate = (key) => { setTab(key); setMobileNavOpen(false); };

  const firstError = sitesErr || employeesErr || attendanceErr || settingsErr || messesErr || messExpensesErr || advancesErr || salaryRevisionsErr;
  if (firstError) return <ServerErrorScreen message={firstError} />;

  const stillLoading = [sites, employees, attendance, settings, messes, messExpenses, advances, salaryRevisions].some((v) => v === null);
  if (stillLoading) return <LoadingScreen />;

  let content = null;
  if (tab === 'dashboard') {
    content = (
      <Dashboard
        sites={sites} employees={employees} attendance={attendance} settings={settings}
        messExpenses={messExpenses} advances={advances} salaryRevisions={salaryRevisions}
        siteFilter={siteFilter} setSiteFilter={setSiteFilter} onNavigate={navigate}
      />
    );
  } else if (tab === 'sites') {
    content = (
      <SitesModule sites={sites} setSites={setSites} employees={employees} setEmployees={setEmployees} showToast={showToast} />
    );
  } else if (tab === 'attendance') {
    content = (
      <AttendanceModule
        employees={employees} sites={sites} attendance={attendance} setAttendance={setAttendance}
        settings={settings} siteFilter={siteFilter} setSiteFilter={setSiteFilter} showToast={showToast}
        salaryRevisions={salaryRevisions}
      />
    );
  } else if (tab === 'employees') {
    content = (
      <EmployeesModule
        employees={employees} setEmployees={setEmployees} sites={sites} messes={messes} settings={settings} showToast={showToast}
        salaryRevisions={salaryRevisions} setSalaryRevisions={setSalaryRevisions}
      />
    );
  } else if (tab === 'payroll') {
    content = (
      <PayrollModule
        employees={employees} sites={sites} messes={messes} messExpenses={messExpenses} advances={advances}
        attendance={attendance} settings={settings}
        siteFilter={siteFilter} setSiteFilter={setSiteFilter}
        salaryRevisions={salaryRevisions}
      />
    );
  } else if (tab === 'mess') {
    content = (
      <MessModule
        messes={messes} setMesses={setMesses} employees={employees} setEmployees={setEmployees}
        messExpenses={messExpenses} setMessExpenses={setMessExpenses} settings={settings} showToast={showToast}
      />
    );
  } else if (tab === 'advances') {
    content = (
      <AdvancesModule employees={employees} advances={advances} setAdvances={setAdvances} settings={settings} showToast={showToast} />
    );
  } else if (tab === 'settings') {
    content = <SettingsModule settings={settings} setSettings={setSettings} showToast={showToast} username={username} />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-slate-200 bg-white">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">N</div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm leading-tight truncate">Nikhila Engineering</p>
            <p className="text-[11px] text-slate-400 leading-tight">Attendance &amp; Payroll</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-target ${
                tab === item.key ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon name={item.icon} className="w-4.5 h-4.5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-slate-100 space-y-2">
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Icon name="refresh-cw" className="w-3 h-3" /> Synced with server · shared by all users
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
              <Icon name="user-circle" className="w-3.5 h-3.5 shrink-0" /> {username}
            </span>
            <button onClick={onLogout} className="text-xs font-medium text-slate-400 hover:text-rose-600 flex items-center gap-1 shrink-0">
              <Icon name="log-out" className="w-3.5 h-3.5" /> Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm">N</div>
          <p className="font-bold text-slate-900 text-sm">Nikhila Engineering</p>
        </div>
        <button className="touch-target flex items-center justify-center text-slate-600" onClick={() => setMobileNavOpen(true)}>
          <Icon name="menu" className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileNavOpen(false)}></div>
          <div className="relative w-72 max-w-[80%] bg-white h-full shadow-xl flex flex-col fade-in">
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100">
              <p className="font-bold text-slate-900 text-sm">Menu</p>
              <button className="touch-target flex items-center justify-center text-slate-400" onClick={() => setMobileNavOpen(false)}>
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors touch-target ${
                    tab === item.key ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon name={item.icon} className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                <Icon name="user-circle" className="w-3.5 h-3.5 shrink-0" /> {username}
              </span>
              <button onClick={onLogout} className="text-xs font-medium text-slate-400 hover:text-rose-600 flex items-center gap-1 shrink-0">
                <Icon name="log-out" className="w-3.5 h-3.5" /> Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pt-20 md:pt-6 pb-20 md:pb-6">
          {content}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 flex items-stretch no-print">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.key)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 touch-target ${
              tab === item.key ? 'text-brand-600' : 'text-slate-400'
            }`}
          >
            <Icon name={item.icon} className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {toastNode}
    </div>
  );
}

// Gates the whole app behind the shared login. Only once a session is
// confirmed does AuthenticatedApp (and its useServerState hooks) mount at
// all, so nothing under /api/data is ever requested pre-login.
function App() {
  const [authState, setAuthState] = React.useState('checking'); // checking | out | in
  const [username, setUsername] = React.useState(null);

  React.useEffect(() => {
    fetchCurrentUser().then((name) => {
      if (name) { setUsername(name); setAuthState('in'); }
      else setAuthState('out');
    });
  }, []);

  React.useEffect(() => {
    const onUnauthorized = () => { setAuthState('out'); setUsername(null); };
    window.addEventListener('nep:unauthorized', onUnauthorized);
    return () => window.removeEventListener('nep:unauthorized', onUnauthorized);
  }, []);

  const handleLogin = (name) => { setUsername(name); setAuthState('in'); };
  const handleLogout = async () => {
    await logout().catch(() => {});
    setUsername(null);
    setAuthState('out');
  };

  if (authState === 'checking') return <LoadingScreen />;
  if (authState === 'out') return <LoginScreen onLogin={handleLogin} />;
  return <AuthenticatedApp username={username} onLogout={handleLogout} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
