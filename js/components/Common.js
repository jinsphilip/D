// ---------------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------------

function Icon({ name, className = 'w-4 h-4' }) {
  return <i data-lucide={name} className={className}></i>;
}

function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-rose-100 text-rose-700',
    blue: 'bg-brand-100 text-brand-700',
    purple: 'bg-violet-100 text-violet-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
}

function attendanceStatusTone(status) {
  if (status === 'present') return 'green';
  if (status === 'halfday') return 'amber';
  if (status === 'absent') return 'red';
  return 'slate';
}

function attendanceStatusLabel(status) {
  if (status === 'present') return 'Present';
  if (status === 'halfday') return 'Half Day';
  if (status === 'absent') return 'Absent';
  return 'Not Marked';
}

function siteStatusTone(status) {
  if (status === 'Active') return 'green';
  if (status === 'On Hold') return 'amber';
  if (status === 'Completed') return 'slate';
  return 'slate';
}

function StatCard({ icon, label, value, tone = 'blue', sub }) {
  const tones = {
    blue: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${tones[tone] || tones.blue}`}>
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
        <p className="text-xl font-bold text-slate-900 leading-tight truncate">{value}</p>
        {sub ? <p className="text-[11px] text-slate-400 truncate">{sub}</p> : null}
      </div>
    </div>
  );
}

function Button({ children, variant = 'primary', className = '', ...rest }) {
  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
    ghost: 'hover:bg-slate-100 text-slate-600',
  };
  return (
    <button
      className={`touch-target inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-slate-400 mt-1">{hint}</span> : null}
    </label>
  );
}

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 touch-target';
const selectClass = inputClass + ' bg-white';

function Modal({ title, onClose, children, wide }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>
      <div className={`relative bg-white w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] flex flex-col fade-in`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button className="touch-target -mr-2 text-slate-400 hover:text-slate-700 rounded-lg flex items-center justify-center" onClick={onClose}>
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel, danger }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600 mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>Confirm</Button>
      </div>
    </Modal>
  );
}

function EmptyState({ icon, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Icon name={icon} className="w-6 h-6 text-slate-400" />
      </div>
      <p className="font-medium text-slate-700">{title}</p>
      {message ? <p className="text-sm text-slate-400 mt-1 max-w-xs">{message}</p> : null}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = React.useState(null);
  const show = React.useCallback((message, tone = 'success') => {
    setToast({ message, tone, key: Date.now() });
  }, []);
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  const node = toast ? (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] fade-in">
      <div className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white ${toast.tone === 'error' ? 'bg-rose-600' : 'bg-slate-900'}`}>
        {toast.message}
      </div>
    </div>
  ) : null;
  return [show, node];
}
