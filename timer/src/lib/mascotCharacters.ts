export type CharacterId =
  | 'blob-blue'
  | 'blob-pink'
  | 'blob-yellow'
  | 'blob-lime'
  | 'bot-yellow'
  | 'bot-mint'
  | 'bot-blue'
  | 'bot-pink'
  | 'cat-purple'
  | 'cat-red'
  | 'cat-orange'
  | 'cat-sky'
  | 'cube-purple'
  | 'cube-red'
  | 'cube-orange'
  | 'cube-sky'
  | 'bunny-pink'
  | 'bunny-mint'
  | 'bunny-lime'
  | 'bunny-sky'
  | 'bunny-yellow'
  | 'bunny-purple'
  | 'bunny-red'
  | 'bunny-orange'
  | 'rip-sq1'
  | 'gold-cube'
  | 'lazy-cat'
  | 'rainbow-cube'
  | 'lightning-cube'
  | 'shooting-star'
  | 'admin-crown';

// 12x13 pixel-art grids. '.' = transparent.
const BLOB_SPRITE = [
  '....BBBB....',
  '..BBBBBBBB..',
  '.BBBBBBBBBB.',
  'BBBBBBBBBBBB',
  'BBWKBBBBKWBB',
  'BBPBBBBBBPBB',
  'BBBKBBBBKBBB',
  'BBBBKKKKBBBB',
  'BBBBBBBBBBBB',
  '.BBBBBBBBBB.',
  '..DDDDDDDD..',
  '...DD..DD...',
  '...KK..KK...',
];

const BOT_SPRITE = [
  '.....BB.....',
  '.....KK.....',
  '...BBBBBB...',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBWKBBBBKWBB',
  'BBPBBBBBBPBB',
  'BBBBKKKKBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  '.BBBBBBBBBB.',
  '...DD..DD...',
  '...KK..KK...',
];

// blob body with pointy cat ears (pink inner-ear peek for extra cute)
const CAT_SPRITE = [
  '.PP......PP.',
  '.BB......BB.',
  '.BBBBBBBBBB.',
  'BBBBBBBBBBBB',
  'BBWKBBBBKWBB',
  'BBPBBBBBBPBB',
  'BBBKBBBBKBBB',
  'BBBBKKKKBBBB',
  'BBBBBBBBBBBB',
  '.BBBBBBBBBB.',
  '..DDDDDDDD..',
  '...DD..DD...',
  '...KK..KK...',
];

// flat-topped cube-headed friend
const CUBE_SPRITE = [
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBWKBBBBKWBB',
  'BBPBBBBBBPBB',
  'BBBKBBBBKBBB',
  'BBBBKKKKBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'DDDDDDDDDDDD',
  '...DD..DD...',
  '...KK..KK...',
];

// blob body with tall, close-set bunny ears
const BUNNY_SPRITE = [
  '...PP..PP...',
  '...BB..BB...',
  '..BBBBBBBB..',
  'BBBBBBBBBBBB',
  'BBWKBBBBKWBB',
  'BBPBBBBBBPBB',
  'BBBKBBBBKBBB',
  'BBBBKKKKBBBB',
  'BBBBBBBBBBBB',
  '.BBBBBBBBBB.',
  '..DDDDDDDD..',
  '...DD..DD...',
  '...KK..KK...',
];

// a cute little floating ghost - the friendly spirit of the departed Square-1 event
const GHOST_SPRITE = [
  '....BBBB....',
  '..BBBBBBBB..',
  '.BBBBBBBBBB.',
  'BBBBBBBBBBBB',
  'BBWKBBBBKWBB',
  'BBPBBBBBBPBB',
  'BBBKBBBBKBBB',
  'BBBBKKKKBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBBB.BB.BBBB',
  'BBB...B...BB',
];

// cat body with closed, sleepy eyes and a small resting smile
const LAZY_CAT_SPRITE = [
  '.PP......PP.',
  '.BB......BB.',
  '.BBBBBBBBBB.',
  'BBBBBBBBBBBB',
  'BBBKBBBBKBBB',
  'BBPBBBBBBPBB',
  'BBBBBBBBBBBB',
  'BBBBBKKBBBBB',
  'BBBBBBBBBBBB',
  '.BBBBBBBBBB.',
  '..DDDDDDDD..',
  '...DD..DD...',
  '...KK..KK...',
];

// flat cube striped like a rainbow - for the completionist who's tried every event
const RAINBOW_CUBE_SPRITE = [
  'RRRRRRRRRRRR',
  'RRRRRRRRRRRR',
  'OOOOOOOOOOOO',
  'OOOOOOOOOOOO',
  'YYWKYYYYKWYY',
  'YYPYYYYYYPYY',
  'YYYKYYYYKYYY',
  'YYYYKKKKYYYY',
  'GGGGGGGGGGGG',
  'GGGGGGGGGGGG',
  'VVVVVVVVVVVV',
  '...DD..DD...',
  '...KK..KK...',
];

// flat cube with a small lightning-bolt spark on its forehead
const LIGHTNING_CUBE_SPRITE = [
  'BBBBBBBBBBBB',
  'BBBBBZBBBBBB',
  'BBBBZZBBBBBB',
  'BBBZZBBBBBBB',
  'BBWKBBBBKWBB',
  'BBPBBBBBBPBB',
  'BBBKBBBBKBBB',
  'BBBBKKKKBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'DDDDDDDDDDDD',
  '...DD..DD...',
  '...KK..KK...',
];

// flat cube with a sparkling comet-trail corner - for landing 10 taps on the PB tile
const SHOOTING_STAR_SPRITE = [
  'S.BBBBBBBB.S',
  '.SBBBBBBBBS.',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBWKBBBBKWBB',
  'BBPBBBBBBPBB',
  'BBBKBBBBKBBB',
  'BBBBKKKKBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'DDDDDDDDDDDD',
  '...DD..DD...',
  '...KK..KK...',
];

// cube body topped with a crown - for the app's admin account only
const ADMIN_SPRITE = [
  '.C..C..C..C.',
  'CCCCCJCCCCCC',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBWKBBBBKWBB',
  'BBPBBBBBBPBB',
  'BBBKBBBBKBBB',
  'BBBBKKKKBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'DDDDDDDDDDDD',
  '...DD..DD...',
  '...KK..KK...',
];

const PALETTES: Record<string, Record<string, string>> = {
  blue: { B: '#6c8cff', D: '#3f5fe0', K: '#22243a', W: '#ffffff', P: '#ff9ec4' },
  pink: { B: '#ff7aa8', D: '#e8508a', K: '#3a1f2b', W: '#ffffff', P: '#ffe1ec' },
  yellow: { B: '#ffcb3d', D: '#e0a51a', K: '#3a2b0a', W: '#ffffff', P: '#fff2c2' },
  mint: { B: '#3ddc9a', D: '#1fae74', K: '#0a2b20', W: '#ffffff', P: '#d6fff0' },
  lime: { B: '#a3e635', D: '#7cc61a', K: '#243a0a', W: '#ffffff', P: '#eaffc2' },
  purple: { B: '#a78bfa', D: '#7c5cf0', K: '#241a3d', W: '#ffffff', P: '#f1e8ff' },
  red: { B: '#ff6b6b', D: '#e0403f', K: '#3a1414', W: '#ffffff', P: '#ffd6d6' },
  orange: { B: '#ff9f43', D: '#e8791a', K: '#3a2308', W: '#ffffff', P: '#ffe4c2' },
  sky: { B: '#5ec8f2', D: '#2ea3d6', K: '#0f2a38', W: '#ffffff', P: '#dff5ff' },
  stone: { B: '#b8bcc4', D: '#8b909c', K: '#4a4e58', W: '#ffffff', P: '#d8dbe0' },
  ghost: { B: '#f1edff', D: '#d8cdfa', K: '#4a4460', W: '#ffffff', P: '#ffd1e8' },
  gold: { B: '#ffd54a', D: '#e0a800', K: '#4a3a08', W: '#ffffff', P: '#fff3c2' },
  sleepy: { B: '#c9c3e0', D: '#a89fc7', K: '#3a3550', W: '#ffffff', P: '#ffd6ea' },
  rainbow: { R: '#ff5c5c', O: '#ff9f43', Y: '#ffd93d', G: '#4ade80', V: '#a78bfa', D: '#8b7fc7', K: '#2a2a2a', W: '#ffffff', P: '#fff3b0' },
  volt: { B: '#22d3ee', D: '#0891b2', K: '#082f35', W: '#ffffff', P: '#d6fbff', Z: '#fde047' },
  royal: { B: '#7c3aed', D: '#5b21b6', K: '#1e1033', W: '#ffffff', P: '#f5d0fe', C: '#ffd700', J: '#ef4444' },
  comet: { B: '#60a5fa', D: '#2563eb', K: '#0c1e3d', W: '#ffffff', P: '#bfe0ff', S: '#fef08a' },
};

export interface MascotCharacter {
  id: CharacterId;
  name: string;
  sprite: string[];
  colors: Record<string, string>;
  /** hidden easter-egg character - excluded from the picker unless unlocked */
  secret?: boolean;
  /** only ever shown to the admin account (see lib/admin.ts), regardless of unlock state */
  adminOnly?: boolean;
  /** character-exclusive speech-bubble lines - replaces the shared line pool when tapped */
  quotes?: string[];
  /** extra lines mixed into the pool for the admin account only, written to fit
   * this specific character rather than being one generic shared pool */
  adminQuotes?: string[];
}

export const MASCOT_CHARACTERS: MascotCharacter[] = [
  {
    id: 'blob-blue',
    name: '블루',
    sprite: BLOB_SPRITE,
    colors: PALETTES.blue,
    adminQuotes: ['블루라서 차분해 보이지만 사실 저도 다 보고 있어요, 관리자님', '이 파란빛, 관리자님 전용 색이에요', '기본 캐릭터인 척하지만 저도 특별대우 받아요'],
  },
  {
    id: 'blob-pink',
    name: '핑크',
    sprite: BLOB_SPRITE,
    colors: PALETTES.pink,
    adminQuotes: ['핑크는 사랑이죠, 관리자님도 사랑해요', '이 대사, 관리자님한테만 들려드리는 거예요', '귀여운 척하지만 관리자님만 아는 비밀이 있어요'],
  },
  {
    id: 'blob-yellow',
    name: '노랑',
    sprite: BLOB_SPRITE,
    colors: PALETTES.yellow,
    adminQuotes: ['햇살처럼 밝은데, 관리자님 앞에서만 더 반짝여요', '노란빛 특별 서비스, 관리자님만을 위해', '기본 색인데 관리자님한테는 기본이 아니죠'],
  },
  {
    id: 'blob-lime',
    name: '연두',
    sprite: BLOB_SPRITE,
    colors: PALETTES.lime,
    adminQuotes: ['상큼한 연두, 관리자님께만 상큼하게', '이건 관리자님만 볼 수 있는 대사예요', '싱그럽죠? 관리자님 전용 싱그러움이에요'],
  },
  {
    id: 'bot-yellow',
    name: '옐로 봇',
    sprite: BOT_SPRITE,
    colors: PALETTES.yellow,
    adminQuotes: ['관리자 인증 완료, 특별 대사 재생합니다', '삐빅- 관리자님을 인식했습니다', '로봇이지만 관리자님한테는 감성적이에요'],
  },
  {
    id: 'bot-mint',
    name: '민트 봇',
    sprite: BOT_SPRITE,
    colors: PALETTES.mint,
    adminQuotes: ['민트 시스템, 관리자 전용 모드로 전환합니다', '삐빅, 오늘도 관리자님 확인', '차가운 로봇 같아도 관리자님한테는 다정해요'],
  },
  {
    id: 'bot-blue',
    name: '블루 봇',
    sprite: BOT_SPRITE,
    colors: PALETTES.blue,
    adminQuotes: ['블루 프로토콜, 관리자님께만 공개', '시스템 점검 중... 관리자님이시군요, 통과!', '로그 기록: 관리자님 접속'],
  },
  {
    id: 'bot-pink',
    name: '핑크 봇',
    sprite: BOT_SPRITE,
    colors: PALETTES.pink,
    adminQuotes: ['핑크 회로에도 관리자님 전용 칩이 있어요', '삐빅- 사랑스러운 관리자님 감지', '로봇도 관리자님 앞에서는 설레요'],
  },
  {
    id: 'cat-purple',
    name: '라벤더 냥이',
    sprite: CAT_SPRITE,
    colors: PALETTES.purple,
    adminQuotes: ['라벤더 향기 나는 관리자 전용 대사다냥', '이건 관리자님한테만 야옹거리는 거예요', '냥이도 관리자님은 알아본다냥'],
  },
  {
    id: 'cat-red',
    name: '레드 냥이',
    sprite: CAT_SPRITE,
    colors: PALETTES.red,
    adminQuotes: ['빨간 냥이도 관리자님 앞에선 얌전하다냥', '이 대사, 관리자님만 들을 수 있다냥', '레드답게 열정적으로 환영한다냥'],
  },
  {
    id: 'cat-orange',
    name: '오렌지 냥이',
    sprite: CAT_SPRITE,
    colors: PALETTES.orange,
    adminQuotes: ['오렌지 냥이가 관리자님께 특별 인사다냥', '귤색 털도 관리자님 앞에서만 반짝인다냥', '이건 관리자님 전용 골골송이다냥'],
  },
  {
    id: 'cat-sky',
    name: '하늘 냥이',
    sprite: CAT_SPRITE,
    colors: PALETTES.sky,
    adminQuotes: ['하늘빛 냥이가 관리자님을 알아봤다냥', '맑은 하늘처럼 관리자님을 반긴다냥', '이 대사는 관리자님한테만 야옹'],
  },
  {
    id: 'cube-purple',
    name: '퍼플 큐브',
    sprite: CUBE_SPRITE,
    colors: PALETTES.purple,
    adminQuotes: ['보라 큐브도 관리자님 앞에서는 각 잡고 인사해요', '이 면은 관리자님만 볼 수 있는 특수 각도예요', '큐브지만 관리자님한테는 열려있어요'],
  },
  {
    id: 'cube-red',
    name: '레드 큐브',
    sprite: CUBE_SPRITE,
    colors: PALETTES.red,
    adminQuotes: ['빨간 큐브, 관리자님께 경례!', '레드답게 뜨거운 환영 인사예요, 관리자님', '이 대사는 관리자님 전용 스티커예요'],
  },
  {
    id: 'cube-orange',
    name: '오렌지 큐브',
    sprite: CUBE_SPRITE,
    colors: PALETTES.orange,
    adminQuotes: ['오렌지빛 큐브가 관리자님께만 상큼하게 인사', '이 면은 관리자님만 열람 가능해요', '큐브계의 비밀 메뉴, 관리자님 한정판'],
  },
  {
    id: 'cube-sky',
    name: '하늘 큐브',
    sprite: CUBE_SPRITE,
    colors: PALETTES.sky,
    adminQuotes: ['하늘빛 큐브, 관리자님께 맑은 인사', '이 대사는 관리자님 전용 하늘색이에요', '구름 위에서도 관리자님은 알아봐요'],
  },
  {
    id: 'bunny-pink',
    name: '핑크 토끼',
    sprite: BUNNY_SPRITE,
    colors: PALETTES.pink,
    adminQuotes: ['깡총깡총, 관리자님한테만 다가가요', '이 귀는 관리자님 목소리만 쫑긋 듣는대요', '핑크 토끼의 비밀 인사, 관리자님께'],
  },
  {
    id: 'bunny-mint',
    name: '민트 토끼',
    sprite: BUNNY_SPRITE,
    colors: PALETTES.mint,
    adminQuotes: ['민트 토끼가 관리자님께 상쾌한 인사를', '이건 관리자님만 아는 토끼굴 비밀이에요', '깡총, 관리자님 전용 점프!'],
  },
  {
    id: 'bunny-lime',
    name: '연두 토끼',
    sprite: BUNNY_SPRITE,
    colors: PALETTES.lime,
    adminQuotes: ['연두빛 토끼도 관리자님은 알아봐요', '이 대사는 관리자님만 들을 수 있는 귀엣말이에요', '상큼한 토끼가 관리자님께 인사해요'],
  },
  {
    id: 'bunny-sky',
    name: '하늘 토끼',
    sprite: BUNNY_SPRITE,
    colors: PALETTES.sky,
    adminQuotes: ['하늘 토끼가 구름 사이로 관리자님을 찾았어요', '이건 관리자님 전용 하늘빛 인사예요', '깡총깡총, 관리자님 반가워요'],
  },
  {
    id: 'bunny-yellow',
    name: '노랑 토끼',
    sprite: BUNNY_SPRITE,
    colors: PALETTES.yellow,
    adminQuotes: ['노란 토끼가 관리자님께 햇살 인사', '이 대사는 관리자님만의 당근이에요', '반짝이는 노랑, 관리자님 전용이에요'],
  },
  {
    id: 'bunny-purple',
    name: '라벤더 토끼',
    sprite: BUNNY_SPRITE,
    colors: PALETTES.purple,
    adminQuotes: ['라벤더 향 토끼가 관리자님께 살포시', '이건 관리자님만 맡을 수 있는 향기예요', '조용히, 관리자님한테만 속삭여요'],
  },
  {
    id: 'bunny-red',
    name: '레드 토끼',
    sprite: BUNNY_SPRITE,
    colors: PALETTES.red,
    adminQuotes: ['빨간 토끼가 관리자님께 힘차게 인사', '이 대사는 관리자님 전용 당근케이크예요', '열정 가득, 관리자님만을 위해'],
  },
  {
    id: 'bunny-orange',
    name: '오렌지 토끼',
    sprite: BUNNY_SPRITE,
    colors: PALETTES.orange,
    adminQuotes: ['오렌지 토끼가 관리자님께 상큼 인사', '이건 관리자님만의 특별 당근이에요', '깡총, 관리자님 오셨네요!'],
  },
  {
    id: 'rip-sq1',
    name: '스퀘어-1 유령',
    sprite: GHOST_SPRITE,
    colors: PALETTES.ghost,
    secret: true,
    quotes: [
      '어? 스퀘어-1 부활했는데... 나는 뭐지?',
      '살아났으면 나한테도 말을 해줬어야지',
      '이제 유령 은퇴해도 되는 건가',
      '(3,0) / (0,-3)... 그 스크램블이 아직도 생각나',
    ],
    adminQuotes: [
      '관리자님이니까 말하는데, 사실 부활 소식 미리 알고 있었어요',
      '유령이라 다 보여요... 관리자님이 코드 고치는 것도요',
      '이 대사는 관리자님한테만 성불 안 하고 들려드려요',
      '관리자님 몰래 앱 여기저기 떠다니고 있어요',
    ],
  },
  {
    id: 'gold-cube',
    name: '황금 큐브',
    sprite: CUBE_SPRITE,
    colors: PALETTES.gold,
    secret: true,
    quotes: [
      '반짝반짝 빛나지? 부럽지?',
      '10번이나 눌러줘서 고마워!',
      '나는 특별해, 아무나 못 봐',
      '황금빛 정기를 받아라',
      '형광펜 아니고 순금이야',
    ],
    adminQuotes: [
      '관리자님한테는 순도 100% 황금 대사를 드려요',
      '이건 진짜 관리자 한정판 반짝임이에요',
      '황금보다 귀한 건 관리자님이죠',
      '10번 안 눌러도 관리자님은 그냥 다 갖고 계시잖아요',
    ],
  },
  {
    id: 'lazy-cat',
    name: '낮잠 냥이',
    sprite: LAZY_CAT_SPRITE,
    colors: PALETTES.sleepy,
    secret: true,
    quotes: ['졸려... 5분만 더 잘게...', '목표? 그냥 자자옹', '타이머 누르기 귀찮다옹', 'Zzz... 하암', '오늘은 그냥 쉬는 날이다옹'],
    adminQuotes: [
      '관리자님 오면 그래도 눈은 뜬다옹',
      '이 대사는 관리자님한테만 특별히 깨서 말하는 거다옹',
      '졸려도 관리자님은 알아본다옹',
      '꿈에서도 관리자님 얘기 한다옹',
    ],
  },
  {
    id: 'rainbow-cube',
    name: '레인보우 큐브',
    sprite: RAINBOW_CUBE_SPRITE,
    colors: PALETTES.rainbow,
    secret: true,
    quotes: ['모든 종목을 다 해봤어!', '나는 올라운더 큐브다', '무지개처럼 다채롭지?', '12종목 정주행 완료!', '다음엔 뭘 해볼까?'],
    adminQuotes: [
      '관리자님한테는 무지개 끝 비밀도 보여드려요',
      '이 색깔은 관리자님 전용 13번째 색이에요',
      '모든 종목 다 해봤지만 관리자님이 최고 종목이에요',
      '색깔 하나하나가 다 관리자님 취향으로 골랐어요',
    ],
  },
  {
    id: 'lightning-cube',
    name: '번개 큐브',
    sprite: LIGHTNING_CUBE_SPRITE,
    colors: PALETTES.volt,
    secret: true,
    quotes: ['번쩍! 빠르게 가자!', '속도가 생명이다', '찌릿찌릿하지?', '느린 건 못 참아'],
    adminQuotes: [
      '관리자님 앞에서는 번개도 잠깐 멈춰요',
      '이 대사는 관리자님한테만 빠르게 전달돼요',
      '찌릿, 관리자님 감지 완료',
      '관리자님 반응속도는 저보다 빠를지도 몰라요',
    ],
  },
  {
    id: 'shooting-star',
    name: '별똥별 큐브',
    sprite: SHOOTING_STAR_SPRITE,
    colors: PALETTES.comet,
    secret: true,
    quotes: [
      '나를 보면 소원을 빌어봐!',
      'PB를 10번이나 확인했구나',
      '빠르게 지나가는 게 내 매력이지',
      '오늘 신기록 한번 노려볼까?',
      '반짝반짝, 눈부시지?',
    ],
    adminQuotes: [
      '관리자님한테는 소원 안 빌어도 다 들어드려요',
      '이 대사는 관리자님만 볼 수 있는 유성이에요',
      '별똥별도 관리자님 앞에서는 오래 머물러요',
      'PB 타일, 관리자님도 몰래 10번 눌러보셨죠?',
    ],
  },
  {
    id: 'admin-crown',
    name: '관리자 큐브',
    sprite: ADMIN_SPRITE,
    colors: PALETTES.royal,
    secret: true,
    adminOnly: true,
    quotes: [
      '어서와요, 관리자님',
      '캐릭터는 전부 이미 갖고 있잖아요',
      '버그 제보는 언제든 환영이에요',
      '오늘도 앱 잘 부탁해요',
      '왕관 무겁지 않아요, 걱정 마세요',
    ],
  },
];

export function getCharacter(id: CharacterId): MascotCharacter {
  return MASCOT_CHARACTERS.find((c) => c.id === id) ?? MASCOT_CHARACTERS[0];
}

export function visibleCharacters(unlockedSecretIds: Set<string>, isAdmin = false): MascotCharacter[] {
  return MASCOT_CHARACTERS.filter((c) => {
    if (c.adminOnly) return isAdmin;
    return !c.secret || unlockedSecretIds.has(c.id) || isAdmin;
  });
}
