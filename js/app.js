const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { key: 'attendance', label: 'Attendance', icon: 'calendar-check' },
  { key: 'sites', label: 'Sites', icon: 'map-pin' },
  { key: 'employees', label: 'Employees', icon: 'users' },
  { key: 'payroll', label: 'Payroll', icon: 'wallet' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

function usePersistentState(key, seedFn) {
  const [state, setState] = React.useState(() => loadState(key, seedFn));
  React.useEffect(() => { saveState(key, state); }, [key, state]);
  return [state, setState];
}

function App() {
  const [sites, setSites] = usePersistentState(STORAGE_KEYS.sites, seedSites);
  const [employees, setEmployees] = usePersistentState(STORAGE_KEYS.employees, seedEmployees);
  const [attendance, setAttendance] = usePersistentState(STORAGE_KEYS.attendance, seedAttendance);
  const [settings, setSettings] = usePersistentState(STORAGE_KEYS.settings, seedSettings);

  const [tab, setTab] = React.useState('dashboard');
  const [siteFilter, setSiteFilter] = React.useState('all');
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [showToast, toastNode] = useToast();

  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const navigate = (key) => { setTab(key); setMobileNavOpen(false); };

  let content = null;
  if (tab === 'dashboard') {
    content = (
      <Dashboard
        sites={sites} employees={employees} attendance={attendance} settings={settings}
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
      />
    );
  } else if (tab === 'employees') {
    content = (
      <EmployeesModule employees={employees} setEmployees={setEmployees} sites={sites} settings={settings} showToast={showToast} />
    );
  } else if (tab === 'payroll') {
    content = (
      <PayrollModule
        employees={employees} sites={sites} attendance={attendance} settings={settings}
        siteFilter={siteFilter} setSiteFilter={setSiteFilter}
      />
    );
  } else if (tab === 'settings') {
    content = <SettingsModule settings={settings} setSettings={setSettings} showToast={showToast} />;
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
        <div className="px-5 py-4 border-t border-slate-100 text-[11px] text-slate-400">
          Data stored locally in this browser.
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
