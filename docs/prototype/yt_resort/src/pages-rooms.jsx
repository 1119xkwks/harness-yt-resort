// 객실 목록/상세 페이지

const { useState: useStateRoom } = React;

function RoomsPage({ onNavigate, session, tweaks }) {
  const [filter, setFilter] = useStateRoom('all'); // 'all' | 'available' | 'owner-only'
  const rooms = Storage.get(STORAGE_KEYS.ROOMS, MOCK_ROOMS);

  const layout = tweaks.roomLayout || 'grid';

  const filteredRooms = rooms.filter(r => {
    if (filter === 'available') {
      if (!session) return r.stock > 0;
      return r.stock > 0 && r.allowedMembers.includes(session.memberType);
    }
    if (filter === 'owner-only') return r.tag === 'OWNER_ONLY';
    return true;
  });

  return (
    <div className="page-content fade-in" style={{ padding: '64px 0 0', background: 'var(--cream-100)' }}>
      {/* 페이지 타이틀 */}
      <div className="container" style={{ marginBottom: 64 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--gold-600)', fontWeight: 600, marginBottom: 12 }}>
          ROOMS & SUITES
        </div>
        <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
          <h1 className="font-serif" style={{ fontSize: 48, fontWeight: 400, letterSpacing: '-0.03em' }}>객실 안내</h1>
          {session && (
            <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--ink-500)' }}>
              {session.memberType === MEMBER_TYPE.OWNER ? (
                <><span className="badge badge-gold"><Icon.Crown/> 분양회원</span><div style={{ marginTop: 8 }}>분양회원 전용 객실 및 특별 요금으로 표시됩니다.</div></>
              ) : (
                <><span className="badge badge-outline">일반회원</span><div style={{ marginTop: 8 }}>일반회원 요금으로 표시됩니다.</div></>
              )}
            </div>
          )}
        </div>
        <div className="hairline-gold" style={{ maxWidth: 80 }}/>

        {/* 필터 */}
        <div className="flex items-center gap-2" style={{ marginTop: 32 }}>
          {[
            { v: 'all', l: '전체' },
            { v: 'available', l: '예약 가능' },
            { v: 'owner-only', l: '분양회원 전용' },
          ].map(f => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              style={{
                padding: '10px 20px', fontSize: 13, fontWeight: 500,
                background: filter === f.v ? 'var(--navy-900)' : 'transparent',
                color: filter === f.v ? 'var(--cream-100)' : 'var(--ink-700)',
                border: `1px solid ${filter === f.v ? 'var(--navy-900)' : 'var(--cream-400)'}`,
                transition: 'all 0.2s',
              }}
            >{f.l}</button>
          ))}
          <div style={{ flex: 1 }}/>
          <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>
            총 <span style={{ color: 'var(--navy-900)', fontWeight: 600 }}>{filteredRooms.length}</span>개 객실
          </div>
        </div>
      </div>

      {/* 객실 목록 */}
      <div className="container" style={{ paddingBottom: 120 }}>
        {layout === 'grid' && <RoomGrid rooms={filteredRooms} session={session} onNavigate={onNavigate}/>}
        {layout === 'list' && <RoomList rooms={filteredRooms} session={session} onNavigate={onNavigate}/>}
        {layout === 'large' && <RoomLarge rooms={filteredRooms} session={session} onNavigate={onNavigate}/>}
      </div>
    </div>
  );
}

function RoomGrid({ rooms, session, onNavigate }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
      {rooms.map(room => {
        const canBook = !session || room.allowedMembers.includes(session.memberType);
        const available = room.stock > 0;
        const price = session && room.prices[session.memberType];
        return (
          <button
            key={room.code}
            onClick={() => onNavigate('room-detail', { roomCode: room.code })}
            style={{ textAlign: 'left', background: '#fff', boxShadow: 'var(--shadow-sm)', transition: 'all 0.3s', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
          >
            <div style={{ height: 280, position: 'relative', overflow: 'hidden' }}>
              <RoomPlaceholder room={room}/>
              {room.tag === 'OWNER_ONLY' && (
                <div style={{ position: 'absolute', top: 16, left: 16 }}>
                  <span className="badge badge-gold"><Icon.Crown/> 분양회원 전용</span>
                </div>
              )}
              {!available && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,19,32,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream-100)' }}>
                  <div className="font-serif" style={{ fontSize: 20, letterSpacing: '0.1em' }}>예약 마감</div>
                </div>
              )}
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', color: 'var(--gold-600)', fontWeight: 600, marginBottom: 8 }}>{room.type.toUpperCase()}</div>
              <div className="font-serif" style={{ fontSize: 22, color: 'var(--navy-900)', marginBottom: 12 }}>{room.name}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ink-500)', marginBottom: 16 }}>
                <span className="flex items-center gap-1"><Icon.Area/> {room.size}</span>
                <span className="flex items-center gap-1"><Icon.Users/> {room.capacity.split(' / ')[0]}</span>
                <span className="flex items-center gap-1"><Icon.Eye/> {room.view}</span>
              </div>
              <div className="hairline" style={{ marginBottom: 16 }}/>
              <div className="flex items-center justify-between">
                <div>
                  {price ? (
                    <>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>1박 요금</div>
                      <div className="font-serif" style={{ fontSize: 20, color: 'var(--navy-900)', fontWeight: 500 }}>{formatKRW(price)}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>1박 요금</div>
                      <div className="font-serif" style={{ fontSize: 16, color: 'var(--ink-500)' }}>로그인 후 확인</div>
                    </>
                  )}
                </div>
                {!canBook ? (
                  <span className="badge badge-muted">예약 불가</span>
                ) : (
                  <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--navy-900)', fontWeight: 600 }}>상세보기 <Icon.ChevronRight/></span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function RoomList({ rooms, session, onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {rooms.map(room => {
        const canBook = !session || room.allowedMembers.includes(session.memberType);
        const available = room.stock > 0;
        const price = session && room.prices[session.memberType];
        return (
          <button
            key={room.code}
            onClick={() => onNavigate('room-detail', { roomCode: room.code })}
            style={{ display: 'grid', gridTemplateColumns: '360px 1fr auto', gap: 32, textAlign: 'left', background: '#fff', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
          >
            <div style={{ height: 240, position: 'relative', overflow: 'hidden' }}>
              <RoomPlaceholder room={room}/>
              {room.tag === 'OWNER_ONLY' && (
                <div style={{ position: 'absolute', top: 12, left: 12 }}>
                  <span className="badge badge-gold"><Icon.Crown/> 분양회원 전용</span>
                </div>
              )}
            </div>
            <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', color: 'var(--gold-600)', fontWeight: 600, marginBottom: 8 }}>{room.type.toUpperCase()}</div>
              <div className="font-serif" style={{ fontSize: 28, color: 'var(--navy-900)', marginBottom: 12 }}>{room.name}</div>
              <p style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.7, marginBottom: 16, maxWidth: 520 }}>{room.description}</p>
              <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--ink-500)' }}>
                <span className="flex items-center gap-1"><Icon.Area/> {room.size}</span>
                <span className="flex items-center gap-1"><Icon.Users/> {room.capacity}</span>
                <span className="flex items-center gap-1"><Icon.Bed/> {room.bedType}</span>
                <span className="flex items-center gap-1"><Icon.Eye/> {room.view}</span>
              </div>
            </div>
            <div style={{ padding: '24px 32px 24px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', gap: 12, minWidth: 200 }}>
              {!available ? (
                <span className="badge badge-muted" style={{ fontSize: 12 }}>예약 마감</span>
              ) : !canBook ? (
                <span className="badge badge-muted" style={{ fontSize: 12 }}>예약 불가</span>
              ) : (
                <span className="badge" style={{ background: 'rgba(61,122,90,0.12)', color: 'var(--success)', fontSize: 11 }}>
                  <Icon.Check/> 예약 가능 · 잔여 {room.stock}실
                </span>
              )}
              {price ? (
                <>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', textAlign: 'right' }}>1박 요금</div>
                  <div className="font-serif" style={{ fontSize: 26, color: 'var(--navy-900)', fontWeight: 500 }}>{formatKRW(price)}</div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>로그인 후 확인</div>
              )}
              <div className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--navy-900)', fontWeight: 600 }}>상세보기 <Icon.ChevronRight/></div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function RoomLarge({ rooms, session, onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
      {rooms.map((room, idx) => {
        const canBook = !session || room.allowedMembers.includes(session.memberType);
        const available = room.stock > 0;
        const price = session && room.prices[session.memberType];
        const reverse = idx % 2 === 1;
        return (
          <button
            key={room.code}
            onClick={() => onNavigate('room-detail', { roomCode: room.code })}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, textAlign: 'left', cursor: 'pointer', alignItems: 'center' }}
          >
            <div style={{ height: 440, position: 'relative', overflow: 'hidden', order: reverse ? 2 : 1 }}>
              <RoomPlaceholder room={room} variant="large"/>
              {room.tag === 'OWNER_ONLY' && (
                <div style={{ position: 'absolute', top: 20, left: 20 }}>
                  <span className="badge badge-gold"><Icon.Crown/> 분양회원 전용</span>
                </div>
              )}
            </div>
            <div style={{ order: reverse ? 1 : 2, padding: '0 24px' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--gold-600)', fontWeight: 600, marginBottom: 12 }}>
                0{idx+1} · {room.type.toUpperCase()}
              </div>
              <h3 className="font-serif" style={{ fontSize: 38, fontWeight: 400, color: 'var(--navy-900)', marginBottom: 16, letterSpacing: '-0.02em' }}>{room.name}</h3>
              <p style={{ fontSize: 15, color: 'var(--ink-700)', lineHeight: 1.9, marginBottom: 28 }}>{room.description}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28, fontSize: 13, color: 'var(--ink-700)' }}>
                <span className="flex items-center gap-2"><Icon.Area/> {room.size}</span>
                <span className="flex items-center gap-2"><Icon.Users/> {room.capacity}</span>
                <span className="flex items-center gap-2"><Icon.Bed/> {room.bedType}</span>
                <span className="flex items-center gap-2"><Icon.Eye/> {room.view}</span>
              </div>
              <div className="hairline" style={{ marginBottom: 20 }}/>
              <div className="flex items-center justify-between">
                {price ? (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 4 }}>1박 요금</div>
                    <div className="font-serif" style={{ fontSize: 28, color: 'var(--navy-900)', fontWeight: 500 }}>{formatKRW(price)}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 14, color: 'var(--ink-500)' }}>로그인 후 요금 확인</div>
                )}
                <div className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--navy-900)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  View Detail <Icon.ChevronRight/>
                </div>
              </div>
              {!available && <div style={{ marginTop: 16, fontSize: 12, color: 'var(--danger)' }}><Icon.Alert/> 현재 예약 마감된 객실입니다.</div>}
              {!canBook && available && <div style={{ marginTop: 16, fontSize: 12, color: 'var(--ink-500)' }}><Icon.Info/> 해당 회원 유형으로는 예약이 불가한 객실입니다.</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============== 객실 상세 ==============
function RoomDetailPage({ onNavigate, session, params }) {
  const rooms = Storage.get(STORAGE_KEYS.ROOMS, MOCK_ROOMS);
  const room = rooms.find(r => r.code === params.roomCode);

  if (!room) {
    return (
      <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>
        <h2 className="font-serif" style={{ fontSize: 32 }}>객실을 찾을 수 없습니다</h2>
        <button onClick={() => onNavigate('rooms')} className="btn btn-outline" style={{ marginTop: 24 }}>객실 목록으로</button>
      </div>
    );
  }

  const canBook = !session || room.allowedMembers.includes(session.memberType);
  const available = room.stock > 0;
  const currentPrice = session && room.prices[session.memberType];

  const handleBook = () => {
    if (!session) {
      onNavigate('login');
      return;
    }
    if (!canBook) return;
    if (!available) return;
    onNavigate('booking', { roomCode: room.code });
  };

  return (
    <div className="page-content fade-in" style={{ background: 'var(--cream-100)' }}>
      {/* 브래드크럼 */}
      <div className="container" style={{ padding: '24px 48px', fontSize: 12, color: 'var(--ink-500)' }}>
        <button onClick={() => onNavigate('home')} style={{ color: 'inherit' }}>홈</button>
        <span style={{ margin: '0 8px' }}>/</span>
        <button onClick={() => onNavigate('rooms')} style={{ color: 'inherit' }}>객실</button>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: 'var(--navy-900)' }}>{room.name}</span>
      </div>

      {/* 히어로 이미지 */}
      <div className="container">
        <div style={{ height: 520, position: 'relative', overflow: 'hidden', marginBottom: 48 }}>
          <RoomPlaceholder room={room} variant="large"/>
          {room.tag === 'OWNER_ONLY' && (
            <div style={{ position: 'absolute', top: 24, left: 24 }}>
              <span className="badge badge-gold" style={{ padding: '8px 14px', fontSize: 12 }}><Icon.Crown/> 분양회원 전용 객실</span>
            </div>
          )}
        </div>
      </div>

      {/* 정보 섹션 */}
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 64, paddingBottom: 120 }}>
        {/* 좌: 상세 정보 */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--gold-600)', fontWeight: 600, marginBottom: 12 }}>
            {room.type.toUpperCase()} · {room.code}
          </div>
          <h1 className="font-serif" style={{ fontSize: 48, fontWeight: 400, marginBottom: 12, letterSpacing: '-0.03em' }}>{room.name}</h1>
          <div style={{ fontSize: 14, color: 'var(--ink-500)', fontStyle: 'italic', marginBottom: 32 }}>{room.nameEn}</div>

          <div className="hairline-gold" style={{ maxWidth: 60, marginBottom: 32 }}/>

          <p style={{ fontSize: 16, color: 'var(--ink-700)', lineHeight: 1.9, marginBottom: 48 }}>{room.description}</p>

          {/* 기본 정보 */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--navy-900)', fontWeight: 600, marginBottom: 20 }}>ROOM INFORMATION</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, border: '1px solid var(--cream-400)' }}>
              {[
                { label: '객실 코드', value: room.code },
                { label: '객실 크기', value: room.size },
                { label: '수용 인원', value: room.capacity },
                { label: '침대 구성', value: room.bedType },
                { label: '전망', value: room.view },
                { label: '객실 타입', value: room.type },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '16px 20px',
                  borderRight: i % 2 === 0 ? '1px solid var(--cream-400)' : 'none',
                  borderBottom: i < 4 ? '1px solid var(--cream-400)' : 'none',
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 13,
                }}>
                  <span style={{ color: 'var(--ink-500)' }}>{item.label}</span>
                  <span style={{ color: 'var(--navy-900)', fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 어메니티 */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--navy-900)', fontWeight: 600, marginBottom: 20 }}>AMENITIES</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {room.amenities.map(a => (
                <div key={a} className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--ink-700)', padding: '10px 0' }}>
                  <Icon.Check/> {a}
                </div>
              ))}
            </div>
          </div>

          {/* 회원 유형별 요금 */}
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--navy-900)', fontWeight: 600, marginBottom: 20 }}>PRICING BY MEMBERSHIP</div>
            <div style={{ border: '1px solid var(--cream-400)' }}>
              {[
                { type: MEMBER_TYPE.GENERAL, label: '일반회원' },
                { type: MEMBER_TYPE.OWNER, label: '분양회원' },
              ].map((m, i) => {
                const allowed = room.allowedMembers.includes(m.type);
                const p = room.prices[m.type];
                return (
                  <div key={m.type} style={{
                    padding: '20px 24px',
                    borderBottom: i === 0 ? '1px solid var(--cream-400)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: session && session.memberType === m.type ? 'rgba(201,169,97,0.08)' : 'transparent',
                  }}>
                    <div className="flex items-center gap-3">
                      {m.type === MEMBER_TYPE.OWNER && <Icon.Crown/>}
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy-900)' }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>
                          {allowed ? '예약 가능' : '예약 불가'}
                        </div>
                      </div>
                    </div>
                    {allowed ? (
                      <div className="font-serif" style={{ fontSize: 22, color: 'var(--navy-900)', fontWeight: 500 }}>{formatKRW(p)}<span style={{ fontSize: 12, color: 'var(--ink-500)', marginLeft: 4 }}>/ 1박</span></div>
                    ) : (
                      <span style={{ fontSize: 13, color: 'var(--ink-400)' }}>—</span>
                    )}
                  </div>
                );
              })}
            </div>
            {room.tag === 'OWNER_ONLY' && (
              <div style={{ marginTop: 12, padding: '10px 12px', fontSize: 12, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon.Info/> 본 객실은 분양회원만 예약하실 수 있습니다.
              </div>
            )}
          </div>
        </div>

        {/* 우: 예약 카드 */}
        <div>
          <div style={{ position: 'sticky', top: 100, padding: 32, background: '#fff', boxShadow: 'var(--shadow-md)', border: '1px solid var(--cream-400)' }}>
            <div className="font-serif" style={{ fontSize: 22, marginBottom: 8, fontWeight: 500 }}>예약 안내</div>
            <div className="hairline-gold" style={{ maxWidth: 40, marginBottom: 24 }}/>

            {/* 재고 상태 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>AVAILABILITY</div>
              {available ? (
                <div className="flex items-center justify-between">
                  <span className="badge" style={{ background: 'rgba(61,122,90,0.12)', color: 'var(--success)' }}>
                    <Icon.Check/> 예약 가능
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>잔여 <span style={{ color: 'var(--navy-900)', fontWeight: 600 }}>{room.stock}</span>/{room.totalStock}실</span>
                </div>
              ) : (
                <span className="badge" style={{ background: 'rgba(180,58,58,0.1)', color: 'var(--danger)' }}>
                  <Icon.Alert/> 예약 마감
                </span>
              )}
              {available && (
                <div style={{ marginTop: 12, height: 4, background: 'var(--cream-300)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(room.stock / room.totalStock) * 100}%`, background: room.stock / room.totalStock < 0.3 ? 'var(--danger)' : 'var(--gold-500)' }}/>
                </div>
              )}
            </div>

            {/* 요금 */}
            {session ? (
              canBook ? (
                <div style={{ padding: '20px 0', borderTop: '1px solid var(--cream-300)', borderBottom: '1px solid var(--cream-300)', marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>
                    {session.memberType === MEMBER_TYPE.OWNER ? '분양회원가' : '일반회원가'}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="font-serif" style={{ fontSize: 32, color: 'var(--navy-900)', fontWeight: 500 }}>{formatKRW(currentPrice)}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>/ 1박</div>
                  </div>
                  {session.memberType === MEMBER_TYPE.OWNER && room.prices.GENERAL && (
                    <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 6 }}>
                      일반가 {formatKRW(room.prices.GENERAL)} 대비 {formatKRW(room.prices.GENERAL - currentPrice)} 절약
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: 16, background: 'rgba(180,58,58,0.06)', border: '1px solid rgba(180,58,58,0.2)', fontSize: 13, color: 'var(--danger)', marginBottom: 24, lineHeight: 1.7 }}>
                  <Icon.Alert/> 본 객실은 {session.memberType === MEMBER_TYPE.GENERAL ? '분양회원 전용' : ''}으로 예약이 불가합니다.
                </div>
              )
            ) : (
              <div style={{ padding: 16, background: 'var(--cream-200)', fontSize: 13, color: 'var(--ink-700)', marginBottom: 24, lineHeight: 1.7 }}>
                <Icon.Info/> 요금 및 예약은 로그인 후 이용 가능합니다.
              </div>
            )}

            {/* 예약 버튼 */}
            {session ? (
              <button
                onClick={handleBook}
                disabled={!canBook || !available}
                className="btn btn-gold btn-lg w-full"
                style={{ opacity: (!canBook || !available) ? 0.5 : 1 }}
              >
                {!available ? '예약 마감' : !canBook ? '예약 불가' : '예약하기'}
              </button>
            ) : (
              <button onClick={() => onNavigate('login')} className="btn btn-primary btn-lg w-full">로그인 후 예약</button>
            )}

            <div style={{ marginTop: 24, fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.8 }}>
              <div className="flex items-start gap-2" style={{ marginBottom: 6 }}>
                <Icon.Info/>
                <span>1박 1실 예약만 가능합니다.</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon.Phone/>
                <span>전화 문의: 1588-0000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RoomsPage, RoomDetailPage });
