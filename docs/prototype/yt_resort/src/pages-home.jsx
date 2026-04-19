// 홈 페이지

const { useState: useStateHome } = React;

function HomePage({ onNavigate, session, tweaks }) {
  const heroStyle = tweaks.heroStyle || 'fullbleed';

  return (
    <div className="page-content fade-in">
      {/* HERO */}
      {heroStyle === 'fullbleed' && <HeroFullbleed onNavigate={onNavigate}/>}
      {heroStyle === 'split' && <HeroSplit onNavigate={onNavigate}/>}
      {heroStyle === 'centered' && <HeroCentered onNavigate={onNavigate}/>}

      {/* FEATURE STRIP */}
      <section style={{ background: 'var(--cream-200)', padding: '48px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 48 }}>
          {[
            { eyebrow: 'SINCE 1997', title: '29년의 환대', desc: '변하지 않는 품격' },
            { eyebrow: 'EAST SEA', title: '오션 파노라마', desc: '전 객실 오션 뷰' },
            { eyebrow: 'MICHELIN', title: '미쉐린 다이닝', desc: '사계의 미식' },
            { eyebrow: 'MEMBERS', title: '분양회원 전용', desc: '프라이빗 시설' },
          ].map((f, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--gold-600)', fontWeight: 600, marginBottom: 8 }}>{f.eyebrow}</div>
              <div className="font-serif" style={{ fontSize: 22, color: 'var(--navy-900)', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROOMS PREVIEW */}
      <section style={{ padding: '120px 0', background: 'var(--cream-100)' }}>
        <div className="container">
          <SectionTitle
            eyebrow="ROOMS & SUITES"
            title="사계를 담는 객실"
            subtitle="엄선된 시야와 절제된 디자인. 계절마다 다른 풍경이 머무는 공간을 소개합니다."
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {MOCK_ROOMS.slice(0, 3).map(room => (
              <button
                key={room.code}
                onClick={() => onNavigate('room-detail', { roomCode: room.code })}
                style={{ textAlign: 'left', cursor: 'pointer', transition: 'transform 0.3s ease' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ height: 360, position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
                  <RoomPlaceholder room={room}/>
                  {room.tag === 'OWNER_ONLY' && (
                    <div style={{ position: 'absolute', top: 16, left: 16 }}>
                      <span className="badge badge-gold"><Icon.Crown/> 분양회원 전용</span>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--gold-600)', fontWeight: 600, marginBottom: 8 }}>
                  {room.type.toUpperCase()}
                </div>
                <div className="font-serif" style={{ fontSize: 22, color: 'var(--navy-900)', marginBottom: 8 }}>{room.name}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.7 }}>{room.description.slice(0, 60)}...</div>
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 64 }}>
            <button onClick={() => onNavigate('rooms')} className="btn btn-outline btn-lg">
              전체 객실 보기 <Icon.ChevronRight/>
            </button>
          </div>
        </div>
      </section>

      {/* MEMBER CTA */}
      {!session && (
        <section style={{ background: 'var(--navy-900)', padding: '96px 0', color: 'var(--cream-100)' }}>
          <div className="container text-center">
            <div className="ornament" style={{ color: 'var(--gold-400)', marginBottom: 24, maxWidth: 240, margin: '0 auto 24px' }}>MEMBERSHIP</div>
            <h2 className="font-serif" style={{ color: 'var(--cream-100)', fontSize: 42, fontWeight: 400, marginBottom: 16 }}>
              YT의 품격, 회원으로 누리다
            </h2>
            <p style={{ color: 'var(--slate-300)', fontSize: 15, maxWidth: 560, margin: '0 auto 40px' }}>
              분양회원번호가 있으시다면 프라이빗 스위트와 특별 요금을 이용하실 수 있습니다.<br/>
              일반회원도 가입 즉시 모든 객실을 예약하실 수 있습니다.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => onNavigate('signup')} className="btn btn-gold btn-lg">회원 가입하기</button>
              <button onClick={() => onNavigate('login')} className="btn btn-lg" style={{ color: 'var(--cream-100)', border: '1px solid var(--slate-400)' }}>로그인</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function HeroFullbleed({ onNavigate }) {
  return (
    <section style={{
      height: 720, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #1e3049 0%, #0a1320 100%)',
    }}>
      {/* Decorative background pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(201,169,97,0.15), transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(201,169,97,0.1), transparent 50%)
        `,
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(0deg, transparent 49.5%, rgba(201,169,97,0.08) 50%, transparent 50.5%),
          linear-gradient(90deg, transparent 49.5%, rgba(201,169,97,0.08) 50%, transparent 50.5%)
        `,
        backgroundSize: '120px 120px',
      }}/>

      {/* Decorative circle motif */}
      <div style={{
        position: 'absolute', right: '10%', top: '50%', transform: 'translateY(-50%)',
        width: 500, height: 500, borderRadius: '50%',
        border: '1px solid rgba(201,169,97,0.2)',
      }}/>
      <div style={{
        position: 'absolute', right: '14%', top: '50%', transform: 'translateY(-50%)',
        width: 420, height: 420, borderRadius: '50%',
        border: '1px solid rgba(201,169,97,0.3)',
      }}/>

      <div className="container" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 640, color: 'var(--cream-100)' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.4em', color: 'var(--gold-400)', fontWeight: 600, marginBottom: 24 }}>
            YT RESORT · SINCE 1997
          </div>
          <h1 className="font-serif" style={{
            fontSize: 68, fontWeight: 300, lineHeight: 1.15, color: 'var(--cream-100)',
            marginBottom: 32, letterSpacing: '-0.03em',
          }}>
            사계를 담은<br/>
            <span style={{ fontWeight: 500, fontStyle: 'italic', color: 'var(--gold-400)' }}>휴식의 품격</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--slate-300)', lineHeight: 1.8, marginBottom: 40, maxWidth: 480 }}>
            동해를 마주한 자리에서 29년, 한결같은 환대로 머무는 시간을 품어온 곳.<br/>
            YT리조트가 선사하는 조용한 깊이를 경험하세요.
          </p>
          <div className="flex gap-3">
            <button onClick={() => onNavigate('rooms')} className="btn btn-gold btn-lg">객실 예약하기</button>
            <button onClick={() => onNavigate('rooms')} className="btn btn-lg" style={{ color: 'var(--cream-100)', border: '1px solid var(--slate-400)' }}>
              객실 둘러보기
            </button>
          </div>
        </div>
      </div>

      {/* Bottom info strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        borderTop: '1px solid rgba(201,169,97,0.2)',
        background: 'rgba(10,19,32,0.6)', backdropFilter: 'blur(8px)',
        padding: '20px 0',
      }}>
        <div className="container flex justify-between items-center" style={{ color: 'var(--slate-300)', fontSize: 12 }}>
          <div className="flex gap-8">
            <div><span style={{ color: 'var(--gold-400)', marginRight: 8 }}>강원 양양</span>동해를 마주한 휴식</div>
          </div>
          <div className="flex gap-6" style={{ fontSize: 11, letterSpacing: '0.2em' }}>
            <span>EAST · SEA</span>
            <span style={{ color: 'var(--gold-400)' }}>·</span>
            <span>SINCE 1997</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroSplit({ onNavigate }) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 640 }}>
      <div style={{
        background: 'var(--cream-200)', padding: '80px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 11, letterSpacing: '0.4em', color: 'var(--gold-600)', fontWeight: 600, marginBottom: 24 }}>
          YT RESORT · SINCE 1997
        </div>
        <h1 className="font-serif" style={{ fontSize: 56, fontWeight: 300, lineHeight: 1.2, marginBottom: 24, letterSpacing: '-0.03em' }}>
          사계를 담은<br/>
          <em style={{ fontWeight: 500, fontStyle: 'italic', color: 'var(--gold-600)' }}>휴식의 품격</em>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-700)', lineHeight: 1.8, marginBottom: 40, maxWidth: 420 }}>
          동해를 마주한 자리에서 29년, 한결같은 환대로 머무는 시간을 품어온 곳.
        </p>
        <div className="flex gap-3">
          <button onClick={() => onNavigate('rooms')} className="btn btn-primary btn-lg">객실 예약하기</button>
          <button onClick={() => onNavigate('rooms')} className="btn btn-outline btn-lg">객실 둘러보기</button>
        </div>
      </div>
      <div style={{ background: 'var(--navy-900)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(201,169,97,0.15), transparent 60%)',
        }}/>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 380, height: 380, borderRadius: '50%',
          border: '1px solid rgba(201,169,97,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 320, height: 320, borderRadius: '50%',
            border: '1px solid rgba(201,169,97,0.5)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'var(--cream-100)',
          }}>
            <div style={{ fontSize: 10, letterSpacing: '0.4em', color: 'var(--gold-400)', fontWeight: 600, marginBottom: 16 }}>EST. 1997</div>
            <div className="font-serif" style={{ fontSize: 48, fontWeight: 300 }}>YT</div>
            <div className="font-serif" style={{ fontSize: 16, marginTop: 8, fontStyle: 'italic', color: 'var(--gold-400)' }}>YT Resort</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroCentered({ onNavigate }) {
  return (
    <section style={{
      minHeight: 640, background: 'var(--cream-100)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '96px 0',
      borderBottom: '1px solid var(--cream-400)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 800 }}>
        <div className="ornament" style={{ color: 'var(--gold-600)', marginBottom: 32, maxWidth: 280, margin: '0 auto 32px' }}>
          SINCE 1997
        </div>
        <h1 className="font-serif" style={{ fontSize: 72, fontWeight: 300, lineHeight: 1.15, marginBottom: 32, letterSpacing: '-0.03em' }}>
          사계를 담은<br/>
          <em style={{ fontWeight: 500, fontStyle: 'italic', color: 'var(--gold-600)' }}>휴식의 품격</em>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink-700)', lineHeight: 1.8, marginBottom: 48, maxWidth: 560, margin: '0 auto 48px' }}>
          동해를 마주한 자리에서 29년,<br/>
          한결같은 환대로 머무는 시간을 품어온 곳.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => onNavigate('rooms')} className="btn btn-primary btn-lg">객실 예약하기</button>
          <button onClick={() => onNavigate('rooms')} className="btn btn-outline btn-lg">객실 둘러보기</button>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { HomePage });
