// 인증 페이지 — 로그인, 회원가입

const { useState: useStateAuth } = React;

// ============== 로그인 ==============
function LoginPage({ onNavigate, onLogin }) {
  const [form, setForm] = useStateAuth({ id: '', password: '' });
  const [error, setError] = useStateAuth('');
  const [loading, setLoading] = useStateAuth(false);
  const toast = useToast();

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.id || !form.password) {
      setError('아이디와 비밀번호를 입력해 주세요.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const users = Storage.get(STORAGE_KEYS.USERS, []);
      const user = users.find(u => u.id === form.id && u.password === form.password);
      if (!user) {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        setLoading(false);
        return;
      }
      onLogin(user);
      toast(`${user.name} 님, 환영합니다.`, 'success');
      setLoading(false);
    }, 400);
  };

  return (
    <div className="page-content fade-in" style={{ padding: '80px 0 120px', background: 'var(--cream-100)' }}>
      <div className="container-form">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="ornament" style={{ marginBottom: 16, maxWidth: 180, margin: '0 auto 16px' }}>MEMBER</div>
          <h1 className="font-serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 12 }}>로그인</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-500)' }}>YT리조트 회원이신가요?</p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="input-group">
            <label className="input-label">아이디</label>
            <input
              className="input"
              type="text"
              value={form.id}
              onChange={e => setForm({ ...form, id: e.target.value })}
              placeholder="아이디를 입력해 주세요"
              autoFocus
            />
          </div>
          <div className="input-group">
            <label className="input-label">비밀번호</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="비밀번호를 입력해 주세요"
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px', background: 'rgba(180,58,58,0.08)',
              border: '1px solid rgba(180,58,58,0.3)',
              color: 'var(--danger)', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Icon.Alert/> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <span className="spinner"/> : '로그인'}
          </button>
        </form>

        <div style={{ marginTop: 32, textAlign: 'center', fontSize: 13, color: 'var(--ink-500)' }}>
          아직 회원이 아니신가요?{' '}
          <button onClick={() => onNavigate('signup')} style={{ color: 'var(--navy-900)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            회원가입
          </button>
        </div>

        <div style={{
          marginTop: 48, padding: 20, background: 'var(--cream-200)',
          borderLeft: '2px solid var(--gold-500)',
          fontSize: 12, color: 'var(--ink-700)', lineHeight: 1.8,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--navy-900)', fontSize: 13 }}>데모 계정</div>
          <div>· 일반회원 — 아이디: <code style={{ color: 'var(--navy-900)' }}>demo</code> / 비번: <code style={{ color: 'var(--navy-900)' }}>demo1234</code></div>
          <div>· 분양회원 — 아이디: <code style={{ color: 'var(--navy-900)' }}>owner</code> / 비번: <code style={{ color: 'var(--navy-900)' }}>owner1234</code></div>
        </div>
      </div>
    </div>
  );
}

// ============== 회원가입 ==============
function SignupPage({ onNavigate, onLogin }) {
  const [form, setForm] = useStateAuth({
    ownerNo: '', name: '', phone: '', email: '',
    id: '', password: '', passwordConfirm: '',
    agreeTerms: false, agreePrivacy: false,
  });
  const [errors, setErrors] = useStateAuth({});
  const [idCheck, setIdCheck] = useStateAuth(null); // 'checking' | 'available' | 'taken'
  const [termsModal, setTermsModal] = useStateAuth(null);
  const [loading, setLoading] = useStateAuth(false);
  const toast = useToast();

  const memberType = form.ownerNo.trim() ? MEMBER_TYPE.OWNER : MEMBER_TYPE.GENERAL;

  const validatePhone = (p) => /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(p.replace(/\s/g, ''));
  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validateOwnerNo = (o) => /^YT-\d{4}-\d{4}$/.test(o);
  const validatePassword = (p) => p.length >= 8 && /[a-zA-Z]/.test(p) && /[0-9]/.test(p);

  const checkId = () => {
    if (!form.id) {
      setErrors({ ...errors, id: '아이디를 입력해 주세요.' });
      return;
    }
    if (form.id.length < 4) {
      setErrors({ ...errors, id: '아이디는 4자 이상이어야 합니다.' });
      return;
    }
    setIdCheck('checking');
    setTimeout(() => {
      const users = Storage.get(STORAGE_KEYS.USERS, []);
      const taken = users.some(u => u.id === form.id);
      setIdCheck(taken ? 'taken' : 'available');
      setErrors({ ...errors, id: null });
    }, 400);
  };

  const update = (key, val) => {
    setForm({ ...form, [key]: val });
    if (key === 'id') setIdCheck(null);
    if (errors[key]) setErrors({ ...errors, [key]: null });
  };

  const validate = () => {
    const e = {};
    if (form.ownerNo.trim() && !validateOwnerNo(form.ownerNo)) {
      e.ownerNo = '분양회원번호 형식이 올바르지 않습니다. (예: YT-2024-0821)';
    }
    if (!form.name.trim()) e.name = '이름을 입력해 주세요.';
    if (!form.phone.trim()) e.phone = '연락처를 입력해 주세요.';
    else if (!validatePhone(form.phone)) e.phone = '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)';
    if (form.email && !validateEmail(form.email)) e.email = '이메일 형식이 올바르지 않습니다.';
    if (!form.id.trim()) e.id = '아이디를 입력해 주세요.';
    else if (idCheck !== 'available') e.id = '아이디 중복 확인을 해주세요.';
    if (!form.password) e.password = '비밀번호를 입력해 주세요.';
    else if (!validatePassword(form.password)) e.password = '비밀번호는 영문·숫자 포함 8자리 이상이어야 합니다.';
    if (form.password !== form.passwordConfirm) e.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (!form.agreeTerms) e.agreeTerms = '이용 약관에 동의해주세요.';
    if (!form.agreePrivacy) e.agreePrivacy = '개인정보 처리방침에 동의해주세요.';
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      toast('입력 내용을 다시 확인해 주세요.', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const users = Storage.get(STORAGE_KEYS.USERS, []);
      const newUser = {
        id: form.id,
        password: form.password,
        name: form.name,
        phone: form.phone,
        email: form.email,
        ownerNo: form.ownerNo.trim(),
        memberType,
        createdAt: new Date().toISOString(),
      };
      Storage.set(STORAGE_KEYS.USERS, [...users, newUser]);
      onLogin(newUser);
      toast(`${memberType === MEMBER_TYPE.OWNER ? '분양회원' : '일반회원'}으로 가입되었습니다.`, 'success');
      setLoading(false);
    }, 500);
  };

  return (
    <div className="page-content fade-in" style={{ padding: '80px 0 120px', background: 'var(--cream-100)' }}>
      <div className="container-form" style={{ maxWidth: 600 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="ornament" style={{ marginBottom: 16, maxWidth: 180, margin: '0 auto 16px' }}>JOIN US</div>
          <h1 className="font-serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 12 }}>회원가입</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-500)' }}>YT리조트의 멤버가 되어주세요.</p>
        </div>

        {/* 회원 유형 안내 */}
        <div style={{
          padding: 20, marginBottom: 32,
          background: memberType === MEMBER_TYPE.OWNER ? 'var(--navy-900)' : 'var(--cream-200)',
          color: memberType === MEMBER_TYPE.OWNER ? 'var(--cream-100)' : 'var(--ink-700)',
          transition: 'all 0.3s ease',
        }}>
          <div className="flex items-center gap-3">
            {memberType === MEMBER_TYPE.OWNER && <Icon.Crown/>}
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', fontWeight: 600, color: memberType === MEMBER_TYPE.OWNER ? 'var(--gold-400)' : 'var(--ink-500)' }}>
                회원 유형
              </div>
              <div className="font-serif" style={{ fontSize: 18, fontWeight: 500, marginTop: 2 }}>
                {memberType === MEMBER_TYPE.OWNER ? '분양회원으로 가입됩니다' : '일반회원으로 가입됩니다'}
              </div>
              <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>
                {memberType === MEMBER_TYPE.OWNER
                  ? '분양회원 전용 객실 및 특별 요금을 이용하실 수 있습니다.'
                  : '분양회원번호를 입력하시면 자동으로 분양회원으로 가입됩니다.'}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 분양회원번호 */}
          <div className="input-group">
            <label className="input-label">
              분양회원번호 <span style={{ color: 'var(--ink-400)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>(선택)</span>
            </label>
            <input
              className={`input ${errors.ownerNo ? 'error' : ''}`}
              type="text"
              value={form.ownerNo}
              onChange={e => update('ownerNo', e.target.value)}
              placeholder="YT-2024-0821"
            />
            {errors.ownerNo && <div className="input-error">{errors.ownerNo}</div>}
            {!errors.ownerNo && <div className="input-hint">분양회원번호가 있는 경우에만 입력해 주세요.</div>}
          </div>

          <div style={{ height: 1, background: 'var(--cream-400)', margin: '12px 0' }}/>

          {/* 이름 */}
          <div className="input-group">
            <label className="input-label">이름<span className="required">*</span></label>
            <input
              className={`input ${errors.name ? 'error' : ''}`}
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="홍길동"
            />
            {errors.name && <div className="input-error">{errors.name}</div>}
          </div>

          {/* 연락처 */}
          <div className="input-group">
            <label className="input-label">연락처<span className="required">*</span></label>
            <input
              className={`input ${errors.phone ? 'error' : ''}`}
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              placeholder="010-1234-5678"
            />
            {errors.phone && <div className="input-error">{errors.phone}</div>}
          </div>

          {/* 이메일 */}
          <div className="input-group">
            <label className="input-label">
              이메일 <span style={{ color: 'var(--ink-400)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>(선택)</span>
            </label>
            <input
              className={`input ${errors.email ? 'error' : ''}`}
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="example@email.com"
            />
            {errors.email && <div className="input-error">{errors.email}</div>}
          </div>

          <div style={{ height: 1, background: 'var(--cream-400)', margin: '12px 0' }}/>

          {/* 아이디 */}
          <div className="input-group">
            <label className="input-label">아이디<span className="required">*</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className={`input ${errors.id ? 'error' : ''}`}
                type="text"
                value={form.id}
                onChange={e => update('id', e.target.value)}
                placeholder="4자 이상"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={checkId} className="btn btn-outline btn-sm" style={{ minWidth: 100 }}>
                {idCheck === 'checking' ? <span className="spinner"/> : '중복확인'}
              </button>
            </div>
            {errors.id && <div className="input-error">{errors.id}</div>}
            {idCheck === 'available' && !errors.id && <div className="input-success"><Icon.Check/> 사용 가능한 아이디입니다.</div>}
            {idCheck === 'taken' && <div className="input-error">이미 사용 중인 아이디입니다.</div>}
          </div>

          {/* 비밀번호 */}
          <div className="input-group">
            <label className="input-label">비밀번호<span className="required">*</span></label>
            <input
              className={`input ${errors.password ? 'error' : ''}`}
              type="password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              placeholder="영문·숫자 포함 8자리 이상"
            />
            {errors.password && <div className="input-error">{errors.password}</div>}
            {!errors.password && <div className="input-hint">영문과 숫자를 포함하여 8자리 이상 입력해 주세요.</div>}
          </div>

          {/* 비밀번호 확인 */}
          <div className="input-group">
            <label className="input-label">비밀번호 확인<span className="required">*</span></label>
            <input
              className={`input ${errors.passwordConfirm ? 'error' : ''}`}
              type="password"
              value={form.passwordConfirm}
              onChange={e => update('passwordConfirm', e.target.value)}
              placeholder="비밀번호를 다시 입력해 주세요"
            />
            {errors.passwordConfirm && <div className="input-error">{errors.passwordConfirm}</div>}
          </div>

          {/* 약관 동의 */}
          <div style={{ marginTop: 12, padding: '20px 0', borderTop: '1px solid var(--cream-400)', borderBottom: '1px solid var(--cream-400)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AgreeCheckbox
              checked={form.agreeTerms}
              onChange={v => update('agreeTerms', v)}
              label="이용 약관에 동의합니다"
              required
              onViewClick={() => setTermsModal('terms')}
              error={errors.agreeTerms}
            />
            <AgreeCheckbox
              checked={form.agreePrivacy}
              onChange={v => update('agreePrivacy', v)}
              label="개인정보 처리방침에 동의합니다"
              required
              onViewClick={() => setTermsModal('privacy')}
              error={errors.agreePrivacy}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? <span className="spinner"/> : '가입하기'}
          </button>
        </form>

        <div style={{ marginTop: 32, textAlign: 'center', fontSize: 13, color: 'var(--ink-500)' }}>
          이미 회원이신가요?{' '}
          <button onClick={() => onNavigate('login')} style={{ color: 'var(--navy-900)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            로그인
          </button>
        </div>
      </div>

      {/* 약관 모달 */}
      <Modal open={termsModal === 'terms'} onClose={() => setTermsModal(null)} title="이용 약관" size="lg">
        <TermsContent type="terms"/>
      </Modal>
      <Modal open={termsModal === 'privacy'} onClose={() => setTermsModal(null)} title="개인정보 처리방침" size="lg">
        <TermsContent type="privacy"/>
      </Modal>
    </div>
  );
}

function AgreeCheckbox({ checked, onChange, label, required, onViewClick, error }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-3" style={{ cursor: 'pointer', fontSize: 14 }}>
          <button
            type="button"
            onClick={() => onChange(!checked)}
            style={{
              width: 20, height: 20,
              border: `1.5px solid ${checked ? 'var(--navy-900)' : 'var(--cream-400)'}`,
              background: checked ? 'var(--navy-900)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cream-100)',
              flexShrink: 0,
            }}
          >
            {checked && <Icon.Check/>}
          </button>
          <span style={{ color: 'var(--ink-900)' }}>
            {required && <span style={{ color: 'var(--danger)' }}>[필수] </span>}
            {label}
          </span>
        </label>
        <button type="button" onClick={onViewClick} style={{ fontSize: 12, color: 'var(--ink-500)', textDecoration: 'underline' }}>
          전문보기
        </button>
      </div>
      {error && <div className="input-error" style={{ marginLeft: 32, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function TermsContent({ type }) {
  if (type === 'terms') {
    return (
      <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.9, maxHeight: 400, overflowY: 'auto' }}>
        <h3 style={{ fontSize: 15, marginTop: 0, marginBottom: 8, color: 'var(--navy-900)' }}>제1조 (목적)</h3>
        <p style={{ marginBottom: 16 }}>
          본 약관은 YT리조트(이하 "회사")가 제공하는 객실 예약 서비스 이용에 관한 조건 및 절차, 이용자와 회사 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
        <h3 style={{ fontSize: 15, marginBottom: 8, color: 'var(--navy-900)' }}>제2조 (회원의 구분)</h3>
        <p style={{ marginBottom: 16 }}>
          회사는 회원을 일반회원과 분양회원으로 구분하여 운영합니다. 분양회원번호를 보유한 이용자는 분양회원으로, 그렇지 않은 이용자는 일반회원으로 가입됩니다.
        </p>
        <h3 style={{ fontSize: 15, marginBottom: 8, color: 'var(--navy-900)' }}>제3조 (예약 및 취소)</h3>
        <p style={{ marginBottom: 16 }}>
          예약은 1박 1실을 기본으로 하며, 회원 유형에 따라 예약 가능한 객실과 요금이 상이할 수 있습니다. 예약 취소는 입실일 이전까지 가능합니다.
        </p>
        <h3 style={{ fontSize: 15, marginBottom: 8, color: 'var(--navy-900)' }}>제4조 (이용자의 의무)</h3>
        <p>
          이용자는 가입 시 정확한 정보를 제공하여야 하며, 타인의 정보를 도용하거나 허위 정보를 기재하여서는 안 됩니다.
        </p>
      </div>
    );
  }
  return (
    <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.9, maxHeight: 400, overflowY: 'auto' }}>
      <h3 style={{ fontSize: 15, marginTop: 0, marginBottom: 8, color: 'var(--navy-900)' }}>개인정보의 수집 항목</h3>
      <p style={{ marginBottom: 16 }}>
        회사는 회원 가입 및 예약 서비스 제공을 위해 다음의 개인정보를 수집합니다: 이름, 연락처, 아이디, 비밀번호, 이메일(선택), 분양회원번호(해당자).
      </p>
      <h3 style={{ fontSize: 15, marginBottom: 8, color: 'var(--navy-900)' }}>개인정보의 이용 목적</h3>
      <p style={{ marginBottom: 16 }}>
        수집된 개인정보는 회원 식별, 객실 예약 접수 및 확인, 분양회원 전용 서비스 제공, 고객 문의 응대 목적으로만 사용됩니다.
      </p>
      <h3 style={{ fontSize: 15, marginBottom: 8, color: 'var(--navy-900)' }}>개인정보의 보유 기간</h3>
      <p>
        회원 탈퇴 시 즉시 파기되며, 관계 법령에 의한 보존 필요가 있는 경우 해당 법령이 정한 기간 동안 보관됩니다.
      </p>
    </div>
  );
}

Object.assign(window, { LoginPage, SignupPage });
