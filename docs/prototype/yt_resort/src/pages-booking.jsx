// 예약 / 예약 확인 페이지

const { useState: useStateBk, useMemo: useMemoBk } = React;

// ============== 예약 페이지 ==============
function BookingPage({ onNavigate, session, params }) {
  const rooms = Storage.get(STORAGE_KEYS.ROOMS, MOCK_ROOMS);
  const room = rooms.find(r => r.code === params.roomCode);

  const tomorrow = useMemoBk(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0,10);
  }, []);

  const [form, setForm] = useStateBk({
    guestName: session?.name || '',
    guestPhone: session?.phone || '',
    guestCount: 2,
    specialRequest: '',
    stayDate: tomorrow,
  });
  const [agreeReservation, setAgreeReservation] = useStateBk(false);
  const [errors, setErrors] = useStateBk({});
  const [loading, setLoading] = useStateBk(false);
  const [confirmModal, setConfirmModal] = useStateBk(false);
  const [blockModal, setBlockModal] = useStateBk(null);
  const toast = useToast();

  if (!room) {
    return <div className="container" style={{ padding: '120px 0' }}><div>객실 정보를 찾을 수 없습니다.</div></div>;
  }

  const canBook = room.allowedMembers.includes(session.memberType);
  const available = room.stock > 0;
  const price = room.prices[session.memberType];

  if (!canBook) {
    return (
      <div className="page-content container fade-in" style={{ padding: '120px 48px', textAlign: 'center' }}>
        <Icon.Alert/>
        <h2 className="font-serif" style={{ fontSize: 32, marginTop: 16, marginBottom: 12 }}>예약 불가 객실</h2>
        <p style={{ color: 'var(--ink-500)', marginBottom: 32 }}>
          {session.memberType === MEMBER_TYPE.GENERAL ? '일반회원' : '분양회원'}은 본 객실을 예약하실 수 없습니다.
        </p>
        <button onClick={() => onNavigate('rooms')} className="btn btn-outline">객실 목록으로</button>
      </div>
    );
  }

  const update = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.guestName.trim()) e.guestName = '투숙자 이름을 입력해 주세요.';
    if (!form.guestPhone.trim()) e.guestPhone = '투숙자 연락처를 입력해 주세요.';
    else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(form.guestPhone.replace(/\s/g, ''))) e.guestPhone = '연락처 형식이 올바르지 않습니다.';
    if (!form.stayDate) e.stayDate = '투숙일을 선택해 주세요.';
    const maxCap = parseInt(room.capacity.match(/최대 (\d+)/)?.[1] || '2');
    if (form.guestCount < 1 || form.guestCount > maxCap) e.guestCount = `수용 인원은 1 ~ ${maxCap}인입니다.`;
    if (!agreeReservation) e.agree = '예약 약관에 동의해 주세요.';
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      toast('입력 내용을 확인해 주세요.', 'error');
      return;
    }

    // 재고/회원유형 실시간 검증
    const latest = Storage.get(STORAGE_KEYS.ROOMS, MOCK_ROOMS);
    const latestRoom = latest.find(r => r.code === room.code);
    if (!latestRoom.allowedMembers.includes(session.memberType)) {
      setBlockModal({ title: '예약 불가', message: '해당 회원 유형은 본 객실을 예약하실 수 없습니다.' });
      return;
    }
    if (latestRoom.stock <= 0) {
      setBlockModal({ title: '예약 마감', message: '죄송합니다. 방금 해당 객실의 재고가 소진되었습니다.' });
      return;
    }

    setConfirmModal(true);
  };

  const finalize = () => {
    setLoading(true);
    setTimeout(() => {
      // 재고 확인 재실행
      const latest = Storage.get(STORAGE_KEYS.ROOMS, MOCK_ROOMS);
      const idx = latest.findIndex(r => r.code === room.code);
      if (idx < 0 || latest[idx].stock <= 0) {
        setConfirmModal(false);
        setBlockModal({ title: '예약 마감', message: '재고가 소진되어 예약이 불가합니다.' });
        setLoading(false);
        return;
      }
      // 재고 차감
      latest[idx].stock -= 1;
      Storage.set(STORAGE_KEYS.ROOMS, latest);

      // 예약 저장
      const booking = {
        bookingNo: genBookingNo(),
        userId: session.id,
        roomCode: room.code,
        roomName: room.name,
        memberType: session.memberType,
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        guestCount: form.guestCount,
        specialRequest: form.specialRequest,
        stayDate: form.stayDate,
        price,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
      };
      const bookings = Storage.get(STORAGE_KEYS.BOOKINGS, []);
      Storage.set(STORAGE_KEYS.BOOKINGS, [booking, ...bookings]);

      setLoading(false);
      setConfirmModal(false);
      toast('예약이 완료되었습니다.', 'success');
      onNavigate('booking-complete', { bookingNo: booking.bookingNo });
    }, 700);
  };

  const maxCap = parseInt(room.capacity.match(/최대 (\d+)/)?.[1] || '2');

  return (
    <div className="page-content fade-in" style={{ background: 'var(--cream-100)', padding: '48px 0 120px' }}>
      <div className="container" style={{ maxWidth: 1080 }}>
        {/* 브래드크럼 */}
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 24 }}>
          <button onClick={() => onNavigate('home')} style={{ color: 'inherit' }}>홈</button>
          <span style={{ margin: '0 8px' }}>/</span>
          <button onClick={() => onNavigate('rooms')} style={{ color: 'inherit' }}>객실</button>
          <span style={{ margin: '0 8px' }}>/</span>
          <button onClick={() => onNavigate('room-detail', { roomCode: room.code })} style={{ color: 'inherit' }}>{room.name}</button>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--navy-900)' }}>예약</span>
        </div>

        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--gold-600)', fontWeight: 600, marginBottom: 12 }}>RESERVATION</div>
          <h1 className="font-serif" style={{ fontSize: 42, fontWeight: 400, letterSpacing: '-0.03em' }}>객실 예약</h1>
          <div className="hairline-gold" style={{ maxWidth: 60, marginTop: 24 }}/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48 }}>
          {/* 좌: 입력 폼 */}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* 투숙일 */}
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--navy-900)', fontWeight: 600, marginBottom: 16 }}>STAY DATE</div>
              <div className="input-group">
                <label className="input-label">투숙일<span className="required">*</span></label>
                <DatePicker value={form.stayDate} onChange={v => update('stayDate', v)}/>
                <div className="input-hint">1박 1실 기준으로 예약됩니다. 체크인 15:00 / 체크아웃 11:00</div>
                {errors.stayDate && <div className="input-error">{errors.stayDate}</div>}
              </div>
            </div>

            <div className="hairline"/>

            {/* 투숙자 정보 */}
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--navy-900)', fontWeight: 600, marginBottom: 16 }}>GUEST INFORMATION</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="input-group">
                  <label className="input-label">투숙자 이름<span className="required">*</span></label>
                  <input className={`input ${errors.guestName ? 'error' : ''}`} type="text" value={form.guestName} onChange={e => update('guestName', e.target.value)} placeholder="홍길동"/>
                  {errors.guestName && <div className="input-error">{errors.guestName}</div>}
                </div>
                <div className="input-group">
                  <label className="input-label">투숙자 연락처<span className="required">*</span></label>
                  <input className={`input ${errors.guestPhone ? 'error' : ''}`} type="tel" value={form.guestPhone} onChange={e => update('guestPhone', e.target.value)} placeholder="010-1234-5678"/>
                  {errors.guestPhone && <div className="input-error">{errors.guestPhone}</div>}
                </div>
                <div className="input-group">
                  <label className="input-label">투숙 인원<span className="required">*</span></label>
                  <div className="flex items-center gap-4" style={{ padding: '14px 16px', border: '1px solid var(--cream-400)', background: '#fff' }}>
                    <button type="button" onClick={() => update('guestCount', Math.max(1, form.guestCount - 1))} style={{ width: 32, height: 32, border: '1px solid var(--cream-400)', fontSize: 18 }}>−</button>
                    <div style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 500 }}>{form.guestCount}인</div>
                    <button type="button" onClick={() => update('guestCount', Math.min(maxCap, form.guestCount + 1))} style={{ width: 32, height: 32, border: '1px solid var(--cream-400)', fontSize: 18 }}>+</button>
                  </div>
                  <div className="input-hint">{room.capacity}</div>
                  {errors.guestCount && <div className="input-error">{errors.guestCount}</div>}
                </div>
                <div className="input-group">
                  <label className="input-label">요청 사항 <span style={{ color: 'var(--ink-400)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>(선택)</span></label>
                  <textarea
                    className="textarea"
                    value={form.specialRequest}
                    onChange={e => update('specialRequest', e.target.value)}
                    placeholder="고층 객실, 금연 객실 등 요청사항을 남겨주세요."
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            <div className="hairline"/>

            {/* 약관 */}
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--navy-900)', fontWeight: 600, marginBottom: 16 }}>TERMS</div>
              <label className="flex items-start gap-3" style={{ cursor: 'pointer', fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.7 }}>
                <button
                  type="button"
                  onClick={() => setAgreeReservation(!agreeReservation)}
                  style={{
                    width: 20, height: 20, marginTop: 2,
                    border: `1.5px solid ${agreeReservation ? 'var(--navy-900)' : 'var(--cream-400)'}`,
                    background: agreeReservation ? 'var(--navy-900)' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--cream-100)', flexShrink: 0,
                  }}
                >
                  {agreeReservation && <Icon.Check/>}
                </button>
                <span>
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>[필수]</span> 예약은 1박 1실 기준이며, 본인(분양회원 포함)에 해당하는 회원 유형의 요금이 적용됨에 동의합니다. 예약 완료 즉시 재고가 차감됩니다.
                </span>
              </label>
              {errors.agree && <div className="input-error" style={{ marginLeft: 32, marginTop: 4 }}>{errors.agree}</div>}
            </div>

            <div className="flex gap-3" style={{ marginTop: 16 }}>
              <button type="button" onClick={() => onNavigate('room-detail', { roomCode: room.code })} className="btn btn-ghost" style={{ border: '1px solid var(--cream-400)', flex: 1 }}>이전으로</button>
              <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 2 }}>예약 확인하기</button>
            </div>
          </form>

          {/* 우: 예약 요약 */}
          <div>
            <div style={{ position: 'sticky', top: 100, background: '#fff', border: '1px solid var(--cream-400)' }}>
              <div style={{ height: 200, position: 'relative', overflow: 'hidden' }}>
                <RoomPlaceholder room={room}/>
              </div>
              <div style={{ padding: 28 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.25em', color: 'var(--gold-600)', fontWeight: 600, marginBottom: 8 }}>{room.type.toUpperCase()}</div>
                <div className="font-serif" style={{ fontSize: 22, marginBottom: 16 }}>{room.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 20, lineHeight: 1.7 }}>
                  {room.size} · {room.bedType} · {room.view}
                </div>

                <div className="hairline" style={{ marginBottom: 20 }}/>

                <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--navy-900)', fontWeight: 600, marginBottom: 12 }}>SUMMARY</div>
                <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 2.2 }}>
                  <div className="flex justify-between"><span style={{ color: 'var(--ink-500)' }}>투숙일</span><span style={{ fontWeight: 500 }}>{form.stayDate ? formatDateKR(form.stayDate) : '—'}</span></div>
                  <div className="flex justify-between"><span style={{ color: 'var(--ink-500)' }}>체크인</span><span>15:00</span></div>
                  <div className="flex justify-between"><span style={{ color: 'var(--ink-500)' }}>체크아웃</span><span>다음날 11:00</span></div>
                  <div className="flex justify-between"><span style={{ color: 'var(--ink-500)' }}>투숙 인원</span><span style={{ fontWeight: 500 }}>{form.guestCount}인</span></div>
                  <div className="flex justify-between"><span style={{ color: 'var(--ink-500)' }}>회원 유형</span>
                    <span style={{ fontWeight: 500, color: 'var(--navy-900)' }}>{MEMBER_TYPE_LABEL[session.memberType]}</span>
                  </div>
                </div>

                <div className="hairline" style={{ margin: '20px 0' }}/>

                <div className="flex items-baseline justify-between">
                  <div style={{ fontSize: 13, color: 'var(--ink-700)' }}>총 결제 예정</div>
                  <div className="font-serif" style={{ fontSize: 26, color: 'var(--navy-900)', fontWeight: 500 }}>{formatKRW(price)}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 6, textAlign: 'right' }}>1박 1실 · 세금 및 봉사료 포함</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 예약 확인 모달 */}
      <Modal open={confirmModal} onClose={() => !loading && setConfirmModal(false)} title="예약 내용을 확인해 주세요">
        <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 2.2 }}>
          <div className="flex justify-between"><span style={{ color: 'var(--ink-500)' }}>객실</span><span style={{ fontWeight: 600 }}>{room.name}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--ink-500)' }}>투숙일</span><span>{formatDateKR(form.stayDate)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--ink-500)' }}>투숙자</span><span>{form.guestName} ({form.guestPhone})</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--ink-500)' }}>투숙 인원</span><span>{form.guestCount}인</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--ink-500)' }}>회원 유형</span><span>{MEMBER_TYPE_LABEL[session.memberType]}</span></div>
          <div className="hairline" style={{ margin: '12px 0' }}/>
          <div className="flex justify-between" style={{ fontSize: 15 }}>
            <span style={{ fontWeight: 600 }}>총 결제 금액</span>
            <span className="font-serif" style={{ fontSize: 22, color: 'var(--navy-900)', fontWeight: 500 }}>{formatKRW(price)}</span>
          </div>
        </div>
        <div style={{ marginTop: 24, fontSize: 12, color: 'var(--ink-500)', background: 'var(--cream-200)', padding: 12, lineHeight: 1.7 }}>
          <Icon.Info/> 예약을 확정하면 즉시 해당 객실의 재고가 1실 차감되며, 예약 완료 메일이 발송됩니다.
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <button onClick={() => setConfirmModal(false)} className="btn btn-ghost" style={{ border: '1px solid var(--cream-400)', flex: 1 }} disabled={loading}>수정하기</button>
          <button onClick={finalize} className="btn btn-gold" style={{ flex: 2 }} disabled={loading}>
            {loading ? <span className="spinner"/> : '예약 확정'}
          </button>
        </div>
      </Modal>

      {/* 차단 모달 */}
      <Modal open={!!blockModal} onClose={() => setBlockModal(null)} title={blockModal?.title} size="sm">
        <p style={{ fontSize: 14, color: 'var(--ink-700)', lineHeight: 1.8 }}>{blockModal?.message}</p>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => { setBlockModal(null); onNavigate('rooms'); }} className="btn btn-primary">객실 목록으로</button>
        </div>
      </Modal>
    </div>
  );
}

// ============== 예약 완료 페이지 ==============
function BookingCompletePage({ onNavigate, params }) {
  const bookings = Storage.get(STORAGE_KEYS.BOOKINGS, []);
  const booking = bookings.find(b => b.bookingNo === params.bookingNo);
  if (!booking) return <div className="container" style={{ padding: '120px 0' }}>예약 정보를 찾을 수 없습니다.</div>;
  const rooms = Storage.get(STORAGE_KEYS.ROOMS, MOCK_ROOMS);
  const room = rooms.find(r => r.code === booking.roomCode);

  return (
    <div className="page-content fade-in" style={{ background: 'var(--cream-100)', padding: '80px 0 120px' }}>
      <div className="container" style={{ maxWidth: 680, textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, margin: '0 auto 32px',
          borderRadius: '50%', border: '1px solid var(--gold-500)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--navy-900)', color: 'var(--gold-400)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M4 12L10 18L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div className="ornament" style={{ color: 'var(--gold-600)', marginBottom: 16, maxWidth: 240, margin: '0 auto 16px' }}>CONFIRMED</div>
        <h1 className="font-serif" style={{ fontSize: 40, fontWeight: 400, marginBottom: 16, letterSpacing: '-0.03em' }}>예약이 완료되었습니다</h1>
        <p style={{ fontSize: 15, color: 'var(--ink-500)', lineHeight: 1.8, marginBottom: 48 }}>
          {booking.guestName} 님, YT리조트를 선택해 주셔서 감사합니다.<br/>
          예약 상세 내용은 마이 예약에서 언제든 확인하실 수 있습니다.
        </p>

        <div style={{ background: '#fff', border: '1px solid var(--cream-400)', padding: 40, textAlign: 'left', marginBottom: 32 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--ink-500)', fontWeight: 600, marginBottom: 4 }}>BOOKING NO.</div>
              <div className="font-serif" style={{ fontSize: 24, color: 'var(--navy-900)', fontWeight: 500, letterSpacing: '0.02em' }}>{booking.bookingNo}</div>
            </div>
            <span className="badge badge-gold">{MEMBER_TYPE_LABEL[booking.memberType]}</span>
          </div>

          <div className="hairline" style={{ marginBottom: 24 }}/>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 13, marginBottom: 24 }}>
            <InfoRow label="객실" value={booking.roomName}/>
            <InfoRow label="투숙일" value={formatDateKR(booking.stayDate)}/>
            <InfoRow label="투숙자" value={booking.guestName}/>
            <InfoRow label="연락처" value={booking.guestPhone}/>
            <InfoRow label="투숙 인원" value={`${booking.guestCount}인`}/>
            <InfoRow label="예약일시" value={formatDateTime(booking.createdAt)}/>
          </div>

          {booking.specialRequest && (
            <>
              <div className="hairline" style={{ marginBottom: 20 }}/>
              <InfoRow label="요청사항" value={booking.specialRequest}/>
            </>
          )}

          <div className="hairline" style={{ margin: '24px 0' }}/>

          <div className="flex justify-between items-baseline">
            <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>결제 금액</div>
            <div className="font-serif" style={{ fontSize: 28, color: 'var(--navy-900)', fontWeight: 500 }}>{formatKRW(booking.price)}</div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => onNavigate('home')} className="btn btn-outline">홈으로</button>
          <button onClick={() => onNavigate('bookings')} className="btn btn-primary">예약 확인 페이지로</button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--ink-500)', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>{label.toUpperCase()}</div>
      <div style={{ color: 'var(--navy-900)', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

// ============== 예약 확인 페이지 ==============
function BookingsPage({ onNavigate, session }) {
  const allBookings = Storage.get(STORAGE_KEYS.BOOKINGS, []);
  const myBookings = allBookings.filter(b => b.userId === session.id);
  const [filter, setFilter] = useStateBk('all');
  const [cancelTarget, setCancelTarget] = useStateBk(null);
  const [, force] = useStateBk(0);
  const toast = useToast();

  const filtered = myBookings.filter(b => {
    if (filter === 'confirmed') return b.status === 'CONFIRMED';
    if (filter === 'cancelled') return b.status === 'CANCELLED';
    return true;
  });

  const cancel = () => {
    if (!cancelTarget) return;
    const bks = Storage.get(STORAGE_KEYS.BOOKINGS, []);
    const idx = bks.findIndex(b => b.bookingNo === cancelTarget.bookingNo);
    if (idx < 0) return;
    bks[idx].status = 'CANCELLED';
    bks[idx].cancelledAt = new Date().toISOString();
    Storage.set(STORAGE_KEYS.BOOKINGS, bks);

    // 재고 복구
    const rooms = Storage.get(STORAGE_KEYS.ROOMS, MOCK_ROOMS);
    const ri = rooms.findIndex(r => r.code === cancelTarget.roomCode);
    if (ri >= 0 && rooms[ri].stock < rooms[ri].totalStock) {
      rooms[ri].stock += 1;
      Storage.set(STORAGE_KEYS.ROOMS, rooms);
    }
    setCancelTarget(null);
    force(n => n + 1);
    toast('예약이 취소되었습니다.', 'success');
  };

  return (
    <div className="page-content fade-in" style={{ background: 'var(--cream-100)', padding: '64px 0 120px' }}>
      <div className="container" style={{ maxWidth: 1080 }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--gold-600)', fontWeight: 600, marginBottom: 12 }}>MY RESERVATIONS</div>
          <div className="flex items-end justify-between">
            <h1 className="font-serif" style={{ fontSize: 42, fontWeight: 400, letterSpacing: '-0.03em' }}>예약 확인</h1>
            <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>
              <span style={{ color: 'var(--navy-900)', fontWeight: 600 }}>{session.name}</span> 님의 예약 내역
            </div>
          </div>
          <div className="hairline-gold" style={{ maxWidth: 60, marginTop: 24 }}/>
        </div>

        {/* 필터 */}
        <div className="flex items-center gap-2" style={{ marginBottom: 24 }}>
          {[
            { v: 'all', l: `전체 (${myBookings.length})` },
            { v: 'confirmed', l: `확정 (${myBookings.filter(b => b.status === 'CONFIRMED').length})` },
            { v: 'cancelled', l: `취소 (${myBookings.filter(b => b.status === 'CANCELLED').length})` },
          ].map(f => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              style={{
                padding: '10px 20px', fontSize: 13, fontWeight: 500,
                background: filter === f.v ? 'var(--navy-900)' : 'transparent',
                color: filter === f.v ? 'var(--cream-100)' : 'var(--ink-700)',
                border: `1px solid ${filter === f.v ? 'var(--navy-900)' : 'var(--cream-400)'}`,
              }}
            >{f.l}</button>
          ))}
        </div>

        {/* 목록 */}
        {filtered.length === 0 ? (
          <div style={{
            padding: '96px 32px', background: '#fff', border: '1px solid var(--cream-400)',
            textAlign: 'center',
          }}>
            <div className="font-serif" style={{ fontSize: 22, color: 'var(--ink-500)', marginBottom: 12 }}>예약 내역이 없습니다</div>
            <p style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 24 }}>YT리조트의 객실을 둘러보고 첫 예약을 시작해 보세요.</p>
            <button onClick={() => onNavigate('rooms')} className="btn btn-outline">객실 보러가기</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(booking => {
              const rooms = Storage.get(STORAGE_KEYS.ROOMS, MOCK_ROOMS);
              const room = rooms.find(r => r.code === booking.roomCode);
              const isCancelled = booking.status === 'CANCELLED';
              const stayDate = new Date(booking.stayDate);
              stayDate.setHours(0,0,0,0);
              const today = new Date(); today.setHours(0,0,0,0);
              const canCancel = !isCancelled && stayDate >= today;

              return (
                <div key={booking.bookingNo} style={{
                  background: '#fff', border: '1px solid var(--cream-400)',
                  display: 'grid', gridTemplateColumns: '200px 1fr auto',
                  opacity: isCancelled ? 0.6 : 1,
                }}>
                  <div style={{ position: 'relative', overflow: 'hidden', minHeight: 180 }}>
                    {room && <RoomPlaceholder room={room}/>}
                    {isCancelled && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,19,32,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'var(--cream-100)', fontSize: 12, letterSpacing: '0.3em', fontWeight: 600 }}>CANCELLED</span>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
                        {isCancelled ? (
                          <span className="badge badge-danger">예약 취소</span>
                        ) : (
                          <span className="badge badge-success">예약 확정</span>
                        )}
                        {booking.memberType === MEMBER_TYPE.OWNER && (
                          <span className="badge badge-cream"><Icon.Crown/> 분양회원</span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--ink-500)', letterSpacing: '0.1em' }}>
                          예약번호 · <span style={{ color: 'var(--navy-900)', fontWeight: 600 }}>{booking.bookingNo}</span>
                        </span>
                      </div>
                      <div className="font-serif" style={{ fontSize: 26, color: 'var(--navy-900)', marginBottom: 12, fontWeight: 500 }}>{booking.roomName}</div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '8px 32px', fontSize: 12, color: 'var(--ink-700)' }}>
                        <div><span style={{ color: 'var(--ink-500)', marginRight: 8 }}>투숙일</span>{formatDateKR(booking.stayDate)}</div>
                        <div><span style={{ color: 'var(--ink-500)', marginRight: 8 }}>투숙자</span>{booking.guestName}</div>
                        <div><span style={{ color: 'var(--ink-500)', marginRight: 8 }}>인원</span>{booking.guestCount}인</div>
                        <div><span style={{ color: 'var(--ink-500)', marginRight: 8 }}>예약일</span>{formatDateShort(booking.createdAt)}</div>
                        <div><span style={{ color: 'var(--ink-500)', marginRight: 8 }}>연락처</span>{booking.guestPhone}</div>
                        <div><span style={{ color: 'var(--ink-500)', marginRight: 8 }}>회원 유형</span>{MEMBER_TYPE_LABEL[booking.memberType]}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '24px 32px', borderLeft: '1px solid var(--cream-300)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', minWidth: 220 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>TOTAL</div>
                      <div className="font-serif" style={{ fontSize: 24, color: 'var(--navy-900)', fontWeight: 500 }}>{formatKRW(booking.price)}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 4 }}>1박 1실</div>
                    </div>
                    <div className="flex flex-col gap-2" style={{ width: '100%' }}>
                      <button
                        onClick={() => onNavigate('room-detail', { roomCode: booking.roomCode })}
                        className="btn btn-sm btn-outline"
                        style={{ width: '100%' }}
                      >
                        객실 정보
                      </button>
                      {canCancel && (
                        <button
                          onClick={() => setCancelTarget(booking)}
                          className="btn btn-sm btn-ghost"
                          style={{ width: '100%', color: 'var(--danger)', border: '1px solid rgba(180,58,58,0.3)' }}
                        >
                          예약 취소
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 취소 모달 */}
      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="예약을 취소하시겠습니까?" size="sm">
        <p style={{ fontSize: 14, color: 'var(--ink-700)', lineHeight: 1.8, marginBottom: 16 }}>
          <span style={{ color: 'var(--navy-900)', fontWeight: 600 }}>{cancelTarget?.roomName}</span>의 예약이 취소되며, 해당 객실의 재고는 자동으로 복구됩니다.
        </p>
        <div style={{ background: 'var(--cream-200)', padding: 16, fontSize: 12, color: 'var(--ink-700)', lineHeight: 1.7 }}>
          <div>예약번호: {cancelTarget?.bookingNo}</div>
          <div>투숙일: {cancelTarget && formatDateKR(cancelTarget.stayDate)}</div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setCancelTarget(null)} className="btn btn-ghost" style={{ border: '1px solid var(--cream-400)' }}>돌아가기</button>
          <button onClick={cancel} className="btn" style={{ background: 'var(--danger)', color: '#fff' }}>예약 취소하기</button>
        </div>
      </Modal>
    </div>
  );
}

Object.assign(window, { BookingPage, BookingCompletePage, BookingsPage });
