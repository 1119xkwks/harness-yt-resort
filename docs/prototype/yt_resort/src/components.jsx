// 공통 컴포넌트 — Header, Footer, Modal, Toast, Icons, Placeholder 등

const { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } = React;

// ============== ICONS ==============
const Icon = {
  Logo: ({ size = 24, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 4L28 12V28H4V12L16 4Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 28V18H20V28" stroke={color} strokeWidth="1.5"/>
      <circle cx="16" cy="13" r="1.5" fill={color}/>
    </svg>
  ),
  Menu: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 6H17M3 10H17M3 14H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Close: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10L8 14L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevronLeft: () => <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevronDown: () => <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M5 7L10 13L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Calendar: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" stroke="currentColor" strokeWidth="1.5"/><path d="M3 8H17" stroke="currentColor" strokeWidth="1.5"/><path d="M7 2V6M13 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  User: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3 17C3 13.5 6 11 10 11C14 11 17 13.5 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Lock: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><rect x="4" y="9" width="12" height="9" stroke="currentColor" strokeWidth="1.5"/><path d="M7 9V6C7 4.3 8.3 3 10 3C11.7 3 13 4.3 13 6V9" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Bed: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 18V8M21 18V12M3 12H21M3 14H21M7 12V9C7 8.5 7.5 8 8 8H11C11.5 8 12 8.5 12 9V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 16C2 13.5 4 12 7 12C10 12 12 13.5 12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 16C13 14 14.5 13 16 13C17.5 13 18 14 18 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Area: () => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" stroke="currentColor" strokeWidth="1.5"/><path d="M7 3V7M13 3V7M3 7H7M17 13H13M13 13V17" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Eye: () => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Info: () => <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M10 9V14M10 6V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Alert: () => <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 2L18 17H2L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 8V12M10 14V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Mail: () => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" stroke="currentColor" strokeWidth="1.5"/><path d="M2 4L10 11L18 4" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Phone: () => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 3H7L9 8L6.5 9.5C7.5 11.5 9 13 11 14L12.5 11.5L17 13V16C17 16.5 16.5 17 16 17C9.5 17 4 11.5 4 5C4 4.5 4.5 4 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Crown: () => <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 14L2 6L6 9L10 4L14 9L18 6L17 14H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 17H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
};

// ============== PLACEHOLDER ==============
function RoomPlaceholder({ room, variant = 'default' }) {
  const style = {
    '--tone-from': room.tone.from,
    '--tone-to': room.tone.to,
  };
  return (
    <div className="room-placeholder" style={style}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(90deg, transparent 0, transparent calc(50% - 0.5px), rgba(255,255,255,0.05) calc(50% - 0.5px), rgba(255,255,255,0.05) calc(50% + 0.5px), transparent calc(50% + 0.5px)),
          linear-gradient(0deg, transparent 0, transparent calc(50% - 0.5px), rgba(255,255,255,0.05) calc(50% - 0.5px), rgba(255,255,255,0.05) calc(50% + 0.5px), transparent calc(50% + 0.5px))
        `,
      }}/>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: variant === 'large' ? 200 : 120, height: variant === 'large' ? 200 : 120,
        border: '1px solid rgba(201,169,97,0.4)', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: variant === 'large' ? 180 : 108, height: variant === 'large' ? 180 : 108,
          border: '1px solid rgba(201,169,97,0.3)', borderRadius: '50%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6, textAlign: 'center',
        }}>
          <div style={{
            fontSize: variant === 'large' ? 11 : 9, letterSpacing: '0.3em',
            color: 'rgba(201,169,97,0.9)', fontWeight: 600,
          }}>YT</div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: variant === 'large' ? 20 : 14,
            color: 'rgba(255,255,255,0.85)', fontWeight: 300,
            padding: '0 12px', textAlign: 'center',
          }}>{room.name}</div>
          <div style={{
            fontSize: variant === 'large' ? 10 : 8, letterSpacing: '0.2em',
            color: 'rgba(201,169,97,0.7)',
          }}>{room.nameEn.toUpperCase()}</div>
        </div>
      </div>
    </div>
  );
}

// ============== HEADER ==============
function Header({ currentPage, onNavigate, session, onLogout }) {
  const navItems = [
    { id: 'home', label: '홈' },
    { id: 'rooms', label: '객실' },
    { id: 'bookings', label: '예약 확인', requireAuth: true },
  ];
  return (
    <header style={{
      background: 'var(--cream-100)',
      borderBottom: '1px solid var(--cream-400)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div className="container flex items-center justify-between" style={{ height: 80 }}>
        <button onClick={() => onNavigate('home')} className="flex items-center gap-3" style={{ color: 'var(--navy-900)' }}>
          <Icon.Logo size={28} color="var(--gold-500)"/>
          <div>
            <div className="font-serif" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.02em' }}>YT리조트</div>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--gold-600)', marginTop: 4, fontWeight: 600 }}>YT RESORT</div>
          </div>
        </button>

        <nav className="flex items-center gap-8">
          {navItems.map(item => {
            if (item.requireAuth && !session) return null;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  fontSize: 14, fontWeight: 500,
                  color: active ? 'var(--navy-900)' : 'var(--ink-700)',
                  letterSpacing: '0.05em',
                  position: 'relative',
                  padding: '4px 0',
                }}
              >
                {item.label}
                {active && <div style={{
                  position: 'absolute', bottom: -4, left: 0, right: 0,
                  height: 1, background: 'var(--gold-500)',
                }}/>}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <div className="flex items-center gap-3" style={{ fontSize: 13 }}>
                {session.memberType === MEMBER_TYPE.OWNER && (
                  <span className="badge badge-gold">
                    <Icon.Crown/> 분양회원
                  </span>
                )}
                <span style={{ color: 'var(--ink-700)' }}>
                  <span style={{ color: 'var(--navy-900)', fontWeight: 600 }}>{session.name}</span>
                  <span style={{ color: 'var(--ink-400)' }}> 님</span>
                </span>
              </div>
              <button onClick={onLogout} className="btn-ghost" style={{ fontSize: 13, color: 'var(--ink-500)' }}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onNavigate('login')} className="btn-ghost" style={{ fontSize: 13 }}>로그인</button>
              <button onClick={() => onNavigate('signup')} className="btn btn-outline btn-sm">회원가입</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ============== FOOTER ==============
function Footer() {
  return (
    <footer style={{
      background: 'var(--navy-900)', color: 'var(--slate-300)',
      padding: '64px 0 32px', marginTop: 120,
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          <div>
            <div className="flex items-center gap-3" style={{ color: 'var(--cream-100)', marginBottom: 16 }}>
              <Icon.Logo size={28} color="var(--gold-500)"/>
              <div className="font-serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--cream-100)' }}>YT리조트</div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--slate-300)', maxWidth: 360 }}>
              사계를 담은 휴식의 품격.<br/>
              YT리조트는 1997년부터 한 자리에서,<br/>
              변하지 않는 품격과 환대를 제공합니다.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--gold-400)', marginBottom: 16, fontWeight: 600 }}>RESERVATION</div>
            <div style={{ fontSize: 13, lineHeight: 2 }}>
              <div>객실 안내</div>
              <div>예약 확인</div>
              <div>예약 취소</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--gold-400)', marginBottom: 16, fontWeight: 600 }}>MEMBERSHIP</div>
            <div style={{ fontSize: 13, lineHeight: 2 }}>
              <div>일반 회원</div>
              <div>분양 회원</div>
              <div>멤버십 혜택</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--gold-400)', marginBottom: 16, fontWeight: 600 }}>CONTACT</div>
            <div style={{ fontSize: 13, lineHeight: 2 }}>
              <div style={{ color: 'var(--cream-100)', fontSize: 18, fontFamily: 'var(--font-serif)' }}>1588-0000</div>
              <div>평일 09:00 - 18:00</div>
              <div>reservation@yt-resort.co.kr</div>
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--navy-700)', marginBottom: 24 }}/>
        <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--slate-400)' }}>
          <div>© 2026 YT RESORT. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-6">
            <span>개인정보처리방침</span>
            <span>이용약관</span>
            <span>위치 안내</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============== TOAST ==============
const ToastContext = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = 'default') => {
    const id = Date.now() + Math.random();
    setToasts(ts => [...ts, { id, message, type }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && <Icon.Check/>}
            {t.type === 'error' && <Icon.Alert/>}
            {t.type === 'default' && <Icon.Info/>}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
function useToast() { return useContext(ToastContext); }

// ============== MODAL ==============
function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  const maxWidth = size === 'lg' ? 720 : size === 'sm' ? 400 : 540;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth }} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h2 style={{ fontSize: 22, fontWeight: 500 }}>{title}</h2>
            <button onClick={onClose} style={{ color: 'var(--ink-500)' }}><Icon.Close/></button>
          </div>
        )}
        <div>{children}</div>
        {footer && <div style={{ marginTop: 32, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

// ============== DATE PICKER ==============
function DatePicker({ value, onChange, minDate, label = '날짜 선택' }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const today = new Date();
  today.setHours(0,0,0,0);
  const min = minDate ? new Date(minDate) : today;
  min.setHours(0,0,0,0);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const selected = value ? new Date(value) : null;
  const isSelected = (d) => selected && d.getFullYear() === selected.getFullYear() && d.getMonth() === selected.getMonth() && d.getDate() === selected.getDate();
  const isDisabled = (d) => d < min;
  const isToday = (d) => d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '14px 16px', border: '1px solid var(--cream-400)', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 15, color: value ? 'var(--ink-900)' : 'var(--ink-400)',
          width: '100%', borderRadius: 'var(--radius-sm)',
        }}
      >
        <span className="flex items-center gap-2">
          <Icon.Calendar/>
          {value ? formatDateKR(value) : label}
        </span>
        <Icon.ChevronDown/>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50,
          background: '#fff', border: '1px solid var(--cream-400)',
          boxShadow: 'var(--shadow-lg)', padding: 20, width: 320,
        }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <button type="button" onClick={() => setViewDate(new Date(year, month-1, 1))} style={{ padding: 6 }}><Icon.ChevronLeft/></button>
            <div className="font-serif" style={{ fontSize: 17, fontWeight: 500 }}>{year}년 {month+1}월</div>
            <button type="button" onClick={() => setViewDate(new Date(year, month+1, 1))} style={{ padding: 6 }}><Icon.ChevronRight/></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
            {['일','월','화','수','목','금','토'].map((w, i) => (
              <div key={w} style={{
                textAlign: 'center', fontSize: 11, fontWeight: 600, padding: 6,
                color: i === 0 ? 'var(--danger)' : i === 6 ? 'var(--navy-700)' : 'var(--ink-500)',
              }}>{w}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i}/>;
              const dis = isDisabled(d);
              const sel = isSelected(d);
              const weekday = d.getDay();
              return (
                <button
                  key={i}
                  type="button"
                  disabled={dis}
                  onClick={() => { onChange(d.toISOString().slice(0,10)); setOpen(false); }}
                  style={{
                    padding: '8px 0', fontSize: 13,
                    color: dis ? 'var(--ink-400)' : sel ? '#fff' : weekday === 0 ? 'var(--danger)' : 'var(--ink-900)',
                    background: sel ? 'var(--navy-900)' : 'transparent',
                    border: isToday(d) && !sel ? '1px solid var(--gold-500)' : '1px solid transparent',
                    cursor: dis ? 'not-allowed' : 'pointer',
                    opacity: dis ? 0.4 : 1,
                    fontWeight: sel || isToday(d) ? 600 : 400,
                  }}
                >{d.getDate()}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============== TWEAKS PANEL ==============
function TweaksPanel({ tweaks, onChange }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setVisible(true);
      if (e.data?.type === '__deactivate_edit_mode') setVisible(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const update = (key, val) => {
    onChange({ ...tweaks, [key]: val });
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
  };

  if (!visible) return null;

  const options = {
    heroStyle: [
      { v: 'fullbleed', l: 'Full-bleed' },
      { v: 'split', l: 'Split' },
      { v: 'centered', l: 'Centered' },
    ],
    roomLayout: [
      { v: 'grid', l: 'Grid' },
      { v: 'list', l: 'List' },
      { v: 'large', l: 'Large' },
    ],
  };

  return (
    <div className="tweaks-panel">
      <div className="tweaks-header">Tweaks</div>
      {Object.entries(options).map(([key, opts]) => (
        <div key={key} className="tweak-row">
          <span className="tweak-label">{key === 'heroStyle' ? '메인 히어로' : '객실 카드'}</span>
          <div className="tweak-options">
            {opts.map(o => (
              <button
                key={o.v}
                className={`tweak-opt ${tweaks[key] === o.v ? 'active' : ''}`}
                onClick={() => update(key, o.v)}
              >{o.l}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============== 섹션 타이틀 ==============
function SectionTitle({ eyebrow, title, subtitle, align = 'center' }) {
  return (
    <div style={{ textAlign: align, marginBottom: 48 }}>
      {eyebrow && (
        <div className="ornament" style={{ marginBottom: 20, maxWidth: 300, marginLeft: align === 'center' ? 'auto' : 0, marginRight: align === 'center' ? 'auto' : 0 }}>
          {eyebrow}
        </div>
      )}
      <h2 className="font-serif" style={{ fontSize: 36, fontWeight: 400, lineHeight: 1.3, marginBottom: subtitle ? 16 : 0 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 15, color: 'var(--ink-500)', maxWidth: align === 'center' ? 560 : 'none', margin: align === 'center' ? '0 auto' : 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Export
Object.assign(window, {
  Icon, RoomPlaceholder, Header, Footer,
  ToastProvider, useToast,
  Modal, DatePicker, TweaksPanel, SectionTitle,
});
