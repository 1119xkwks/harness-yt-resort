// 메인 앱 — 라우팅, 인증 컨텍스트

const { useState: useStateApp, useEffect: useEffectApp } = React;

function App() {
  const [session, setSession] = useStateApp(() => Storage.get(STORAGE_KEYS.SESSION, null));
  const [page, setPage] = useStateApp('home');
  const [params, setParams] = useStateApp({});
  const [tweaks, setTweaks] = useStateApp(window.TWEAKS || {});

  // 로그인 상태 유지 (localStorage <-> session)
  useEffectApp(() => {
    if (session) Storage.set(STORAGE_KEYS.SESSION, session);
    else Storage.remove(STORAGE_KEYS.SESSION);
  }, [session]);

  // 페이지 이동 시 스크롤 맨 위
  useEffectApp(() => {
    window.scrollTo(0, 0);
  }, [page, params.roomCode, params.bookingNo]);

  const navigate = (p, nextParams = {}) => {
    // 권한 체크 — 예약, 예약 확인은 로그인 필요
    const protectedPages = ['booking', 'bookings', 'booking-complete'];
    if (protectedPages.includes(p) && !session) {
      setParams({ returnTo: p, returnParams: nextParams, ...nextParams });
      setPage('login');
      return;
    }
    setParams(nextParams);
    setPage(p);
  };

  const handleLogin = (user) => {
    setSession(user);
    // returnTo 처리
    if (params.returnTo) {
      const rp = params.returnParams || {};
      setParams(rp);
      setPage(params.returnTo);
    } else {
      setPage('home');
    }
  };

  const handleLogout = () => {
    setSession(null);
    setPage('home');
  };

  // 페이지 렌더링
  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onNavigate={navigate} session={session} tweaks={tweaks}/>;
      case 'login':
        return <LoginPage onNavigate={navigate} onLogin={handleLogin}/>;
      case 'signup':
        return <SignupPage onNavigate={navigate} onLogin={handleLogin}/>;
      case 'rooms':
        return <RoomsPage onNavigate={navigate} session={session} tweaks={tweaks}/>;
      case 'room-detail':
        return <RoomDetailPage onNavigate={navigate} session={session} params={params}/>;
      case 'booking':
        return <BookingPage onNavigate={navigate} session={session} params={params}/>;
      case 'booking-complete':
        return <BookingCompletePage onNavigate={navigate} params={params}/>;
      case 'bookings':
        return <BookingsPage onNavigate={navigate} session={session}/>;
      default:
        return <HomePage onNavigate={navigate} session={session} tweaks={tweaks}/>;
    }
  };

  return (
    <ToastProvider>
      <div data-screen-label={page}>
        <Header currentPage={page} onNavigate={navigate} session={session} onLogout={handleLogout}/>
        {renderPage()}
        <Footer/>
        <TweaksPanel tweaks={tweaks} onChange={setTweaks}/>
      </div>
    </ToastProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
