// Mock 데이터 + 상수

const MEMBER_TYPE = {
  GENERAL: 'GENERAL',   // 일반 회원
  OWNER: 'OWNER',       // 분양 회원
};

const MEMBER_TYPE_LABEL = {
  GENERAL: '일반회원',
  OWNER: '분양회원',
};

// 객실 Mock 데이터 (6개)
const MOCK_ROOMS = [
  {
    code: 'STD-OCN',
    name: '스탠다드 오션',
    nameEn: 'Standard Ocean',
    type: '스탠다드',
    size: '42㎡',
    capacity: '기준 2인 / 최대 3인',
    bedType: '퀸 베드 1',
    view: '오션뷰',
    description: '탁 트인 바다 전망과 절제된 미감이 공존하는 스탠다드 객실. 여유로운 휴식을 위한 가장 기본적인 선택.',
    amenities: ['욕조', '무료 Wi-Fi', '미니바', '커피머신', '금고', '헤어드라이어'],
    stock: 8,
    totalStock: 12,
    prices: {
      GENERAL: 280000,
      OWNER: 180000,
    },
    allowedMembers: ['GENERAL', 'OWNER'],
    tone: { from: '#2a4160', to: '#0f1b2d' },
    tag: null,
  },
  {
    code: 'STD-MNT',
    name: '스탠다드 마운틴',
    nameEn: 'Standard Mountain',
    type: '스탠다드',
    size: '42㎡',
    capacity: '기준 2인 / 최대 3인',
    bedType: '트윈 베드',
    view: '마운틴뷰',
    description: '사계를 그대로 담아내는 창가. 고요한 산세가 만드는 깊은 몰입감의 스탠다드 객실.',
    amenities: ['욕조', '무료 Wi-Fi', '미니바', '커피머신', '금고'],
    stock: 5,
    totalStock: 10,
    prices: {
      GENERAL: 250000,
      OWNER: 160000,
    },
    allowedMembers: ['GENERAL', 'OWNER'],
    tone: { from: '#3d4f3a', to: '#1a2319' },
    tag: null,
  },
  {
    code: 'FAM-DLX',
    name: '패밀리 디럭스',
    nameEn: 'Family Deluxe',
    type: '패밀리',
    size: '68㎡',
    capacity: '기준 4인 / 최대 5인',
    bedType: '퀸 베드 1 + 싱글 베드 2',
    view: '오션뷰',
    description: '여유로운 공간 설계와 별도 거실을 갖춘 가족 전용 디럭스. 세대가 함께 머무는 시간을 위한 구성.',
    amenities: ['욕조', '무료 Wi-Fi', '미니바', '커피머신', '금고', '주방 시설', '소파'],
    stock: 3,
    totalStock: 8,
    prices: {
      GENERAL: 420000,
      OWNER: 280000,
    },
    allowedMembers: ['GENERAL', 'OWNER'],
    tone: { from: '#6b5a3e', to: '#2a2317' },
    tag: null,
  },
  {
    code: 'FAM-PRM',
    name: '패밀리 프리미엄',
    nameEn: 'Family Premium',
    type: '패밀리',
    size: '82㎡',
    capacity: '기준 4인 / 최대 6인',
    bedType: '킹 베드 1 + 싱글 베드 2',
    view: '파노라믹 오션뷰',
    description: '넓은 테라스와 파노라마 창이 만드는 확장된 시야. 분양 회원만을 위해 설계된 프리미엄 패밀리 공간.',
    amenities: ['자쿠지', '테라스', '무료 Wi-Fi', '미니바', '에스프레소 머신', '금고', '주방 시설', '다이닝'],
    stock: 2,
    totalStock: 4,
    prices: {
      OWNER: 380000,
    },
    allowedMembers: ['OWNER'],
    tone: { from: '#8b6f47', to: '#3a2f1f' },
    tag: 'OWNER_ONLY',
  },
  {
    code: 'SUT-EXE',
    name: '이그제큐티브 스위트',
    nameEn: 'Executive Suite',
    type: '스위트',
    size: '110㎡',
    capacity: '기준 2인 / 최대 4인',
    bedType: '킹 베드 1',
    view: '파노라믹 오션뷰',
    description: '별도의 응접실과 드레스룸, 전용 다이닝 공간을 갖춘 이그제큐티브 스위트. 품격 있는 휴식의 정점.',
    amenities: ['자쿠지', '테라스', '라운지 이용', '전용 체크인', '에스프레소 머신', '다이닝', '드레스룸'],
    stock: 2,
    totalStock: 6,
    prices: {
      GENERAL: 780000,
      OWNER: 520000,
    },
    allowedMembers: ['GENERAL', 'OWNER'],
    tone: { from: '#7a6344', to: '#2e2518' },
    tag: null,
  },
  {
    code: 'SUT-PRE',
    name: '프레지덴셜 스위트',
    nameEn: 'Presidential Suite',
    type: '스위트',
    size: '185㎡',
    capacity: '기준 2인 / 최대 6인',
    bedType: '킹 베드 1 + 트윈',
    view: '파노라믹 오션뷰',
    description: 'YT리조트가 자부하는 최상위 스위트. 전용 풀과 버틀러 서비스가 포함된, 분양 회원을 위한 프라이빗 공간.',
    amenities: ['프라이빗 풀', '버틀러 서비스', '전용 테라스', '라운지', '와인 셀러', '다이닝', '드레스룸'],
    stock: 0,
    totalStock: 2,
    prices: {
      OWNER: 1200000,
    },
    allowedMembers: ['OWNER'],
    tone: { from: '#5a4a2e', to: '#1f1810' },
    tag: 'OWNER_ONLY',
  },
];

// 로컬스토리지 키
const STORAGE_KEYS = {
  USERS: 'yt_users',
  SESSION: 'yt_session',
  BOOKINGS: 'yt_bookings',
  ROOMS: 'yt_rooms',
};

// 초기 더미 유저 (데모용)
const SEED_USERS = [
  {
    id: 'demo',
    password: 'demo1234',
    name: '김유티',
    phone: '010-1234-5678',
    email: 'demo@example.com',
    ownerNo: '',
    memberType: MEMBER_TYPE.GENERAL,
    createdAt: new Date('2025-10-12').toISOString(),
  },
  {
    id: 'owner',
    password: 'owner1234',
    name: '박소영',
    phone: '010-9876-5432',
    email: 'owner@example.com',
    ownerNo: 'YT-2024-0821',
    memberType: MEMBER_TYPE.OWNER,
    createdAt: new Date('2025-08-21').toISOString(),
  },
];

// 초기 더미 예약 (데모용)
const SEED_BOOKINGS = [
  {
    bookingNo: 'YT20260412-0001',
    userId: 'owner',
    roomCode: 'FAM-DLX',
    roomName: '패밀리 디럭스',
    memberType: MEMBER_TYPE.OWNER,
    guestName: '박소영',
    guestPhone: '010-9876-5432',
    guestCount: 4,
    specialRequest: '고층 객실 희망',
    stayDate: '2026-05-15',
    price: 280000,
    status: 'CONFIRMED',
    createdAt: new Date('2026-04-12').toISOString(),
  },
];

// 스토리지 헬퍼
const Storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  }
};

// 초기화 (seed)
function initStorage() {
  if (!Storage.get(STORAGE_KEYS.USERS)) {
    Storage.set(STORAGE_KEYS.USERS, SEED_USERS);
  }
  if (!Storage.get(STORAGE_KEYS.ROOMS)) {
    Storage.set(STORAGE_KEYS.ROOMS, MOCK_ROOMS);
  }
  if (!Storage.get(STORAGE_KEYS.BOOKINGS)) {
    Storage.set(STORAGE_KEYS.BOOKINGS, SEED_BOOKINGS);
  }
}
initStorage();

// 유틸
function formatKRW(n) {
  if (n == null) return '—';
  return '₩ ' + n.toLocaleString('ko-KR');
}
function formatDateKR(iso) {
  const d = new Date(iso);
  const week = ['일','월','화','수','목','금','토'][d.getDay()];
  return `${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')} (${week})`;
}
function formatDateShort(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}
function formatDateTime(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function genBookingNo() {
  const d = new Date();
  const datePart = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `YT${datePart}-${rand}`;
}

// Export
Object.assign(window, {
  MEMBER_TYPE, MEMBER_TYPE_LABEL,
  MOCK_ROOMS, STORAGE_KEYS, SEED_USERS,
  Storage, initStorage,
  formatKRW, formatDateKR, formatDateShort, formatDateTime, genBookingNo,
});
