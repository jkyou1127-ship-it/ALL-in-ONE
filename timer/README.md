# 🧊 큐브 연습

> 이 폴더는 [ALL-in-ONE](../README.md) 저장소의 하위 앱입니다. Firebase 로그인은 [`obdcube`](../obdcube) 앱과
> 같은 프로젝트를 공유하므로, 한 계정으로 두 앱 모두 로그인됩니다.

WCA 공인 종목 전체를 지원하는 큐브 연습 앱입니다. 웹으로 개발했고, Electron으로 감싸서 Windows 데스크톱 앱(.exe)으로도 씁니다.

## 시작하기 (웹으로 개발/미리보기)

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
```

## 데스크톱 앱(exe)으로 실행하기

```bash
npm run electron:dev      # 개발 중 데스크톱 창으로 실행
npm run electron:build    # release/ 폴더에 설치 프로그램(exe) 생성 (Windows에서 실행해야 함)
```

이 리포지토리에는 `.github/workflows/build-windows.yml`도 있어서, `claude/**` 또는 `main` 브랜치에 푸시하면
GitHub Actions(windows-latest)가 자동으로 exe를 빌드해 Actions 탭의 아티팩트로 올려줍니다. 리눅스 샌드박스에서는
NSIS 인스톨러 빌드에 필요한 wine 실행이 커널 제약으로 막혀 있어, 실제 Windows exe 생성은 로컬 Windows 또는
이 CI에서 이루어집니다.

## 폴더 구조

```
src/
  App.tsx, App.css        앱 셸(헤더/종목 선택/바텀내비), 전역 컴포넌트 스타일
  index.css                테마 CSS 변수 (라이트 기본 + 다크 모드)
  types.ts                 공용 타입 (Solve, Settings, TabKey)
  webBluetooth.d.ts         Web Bluetooth 최소 타입 선언
  components/
    BottomNav.tsx           하단 탭 내비게이션
    Confetti.tsx             PB 갱신 축하 캔버스 컨페티
    PixelMascot.tsx          선택 가능한 픽셀아트 마스코트
  lib/
    events.ts                 WCA 종목 목록/메타데이터 (인스펙션 여부 등)
    scrambles.ts               종목별 스크램블 생성기 (NxN/피라밍크스/스큐브/메가밍크스/스퀘어-1/시계)
    time.ts, stats.ts, storage.ts, quotes.ts, confetti.ts, notifications.ts
    ganTimer.ts                GAN 스마트 타이머 Web Bluetooth 연결(베스트에포트)
    popSound.ts, keySound.ts    Web Audio로 합성한 효과음(뽁뽁이/기계식 키보드)
    mascotCharacters.ts         마스코트 캐릭터 데이터(8종)
  features/
    timer/TimerScreen.tsx     메인 타이머 화면(검사시간/PB 경쟁바/즉시 페널티 포함)
    records/
      RecordsScreen.tsx        종목별 기록/통계/목표·스트릭/마스코트·알림 설정
      SolveRow.tsx              개별 솔브 기록 행 (+2/DNF/삭제)
    fun/                      심심풀이 탭(반응속도/타자연습/낙서장/뽁뽁이/해킹터미널/
                                멍때리기/DVD/타건감/김서림)
electron/
  main.cjs                  Electron 메인 프로세스(창 생성, GAN 블루투스 기기선택 처리)
scripts/
  make-cube-icon.mjs, generate-icon.mjs   앱 아이콘 생성
public/
  sw.js                     알림 표시용 최소 서비스워커
  manifest.webmanifest      PWA 매니페스트
```

## 주요 기능

- **WCA 공인 종목 전체 지원**: 2x2~7x7, 3x3 한손/블라인드, 피라밍크스, 스큐브, 메가밍크스, 스퀘어-1, 시계(13종).
  헤더 드롭다운으로 종목을 바꾸면 그 종목에 맞는 표기법으로 스크램블이 생성되고, 기록/통계도 종목별로 분리됩니다.
  (참고: 실제 WCA 대회는 랜덤 스테이트 스크램블러(TNoodle)를 씁니다. 이 앱은 랜덤 무브 방식이라 완전히 동일하진
  않고, 메가밍크스/스퀘어-1/시계는 공식 표기법을 간이 재현한 것이라 화면에 안내 문구가 표시됩니다.)
- **검사(인스펙션) 시간**: WCA 규정대로 15초 카운트다운, 15초 초과 +2, 17초 초과 DNF. 블라인드 종목은 자동으로
  인스펙션 없이 진행되고, 설정에서 전체 껐다 켤 수 있습니다.
- **터치 타이머**: 화면을 터치 후 손을 떼면 시작, 다시 터치하면 정지. 실행 중에는 헤더/내비를 숨기고 숫자만 크게 표시.
  결과 화면에서 바로 OK/+2/DNF 페널티를 줄 수 있고, 풀리는 동안 PB 대비 진행바로 페이스를 비교합니다.
- **GAN 스마트 타이머 연동(베스트에포트)**: Web Bluetooth로 실제 기기 검색/연결. GAN의 정확한 통신 프로토콜은
  비공개라 범용 알림 이벤트를 로고 버튼으로 간주하는 방식이며, 결과 확인(리셋) 후 재클릭 시 검사 시간이 시작됩니다.
- **기록/통계**: 종목별 PB, Ao5, Ao12(WCA 방식), 세션 평균, 솔브별 +2/DNF, 삭제.
- **목표 & 스트릭**: 하루 목표 솔빙 횟수(전체 종목 합산), 연속 달성일 계산, 🔥 아이콘 강조.
- **마스코트**: 8종 캐릭터(블롭 4색·로봇 4색) 중 선택 가능, 타이머 화면 상단에 크게 표시.
- **PB 컨페티**: 이전 최고 기록 경신 시 화면 전체 컨페티 애니메이션.
- **로컬 알림**: 지정 시간 리마인드(앱이 열려있는 동안 동작), 2일 이상 미접속 시 앱 재방문 환영 배너.
- **심심풀이 탭**: 반응속도 테스트, 타자연습, 픽셀 낙서장, 무한 뽁뽁이, 해킹 터미널, 생명게임(멍때리기),
  DVD 스크린세이버, 기계식 키보드 타건감(청/갈/적축/무접점), 김서림 와이핑. 효과음은 전부 Web Audio로
  합성해서 외부 오디오 파일이 없습니다.
- **다크 모드**: 기본은 라이트 테마이며, 헤더의 토글 버튼으로 다크 모드 전환 가능.

## 데이터 저장

모든 기록/설정은 브라우저(또는 데스크톱 앱의) `localStorage`에 저장됩니다(서버 없음). 데이터를 지우면 기록도 함께 삭제됩니다.
