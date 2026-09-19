# ALL-in-ONE

큐브 타이머, OBD Cube(온라인 큐브 대회 플랫폼), License(C/A 라이선스 관리)를 하나의 사이트로 묶고
**통합 로그인**을 적용한 저장소입니다.

- [`timer/`](./timer) — 큐브 연습 타이머 (스크램블, 기록/통계, ao5·ao12, 세션 관리)
- [`obdcube/`](./obdcube) — OBD Cube 온라인 큐브 대회 플랫폼 (대회 개최/참가, 순위, 상장/명찰)
- [`license/`](./license) — C License(큐브) / A License(ADOFAI) 발급·조회 앱
- 루트 [`index.html`](./index.html) — 세 앱으로 가는 허브 랜딩 페이지

`timer`, `obdcube`는 원래 각각 별도의 저장소(`cube_app`, `obdcube`)에서 개발되던 것을 이 저장소로 그대로
이식했고, `license`는 그 위에 새로 추가한 앱입니다.

## 통합 로그인

세 앱 모두 **같은 Firebase 프로젝트**(`all-in-one-bfc59`)를 사용합니다. 한 이메일/비밀번호 계정으로 세 앱
모두 로그인되고, 관리자 권한(Firestore `admins/{uid}` 컬렉션)도 공유됩니다. `timer` 앱의 기록은 같은
프로젝트 안에 `users/{uid}/solves/{id}` 서브컬렉션으로 저장되어, 계정을 삭제하면 데이터가 함께 정리됩니다.

회원가입도 완전히 같은 스키마를 씁니다 - 세 앱 어디서 가입해도 같은 방식으로 **닉네임**을 입력받아
`users/{uid}`(nickname/email/obdId), `nicknames/{nickname}` 문서를 만들고 **OBD ID**까지 발급하므로,
어느 앱에서 가입하든 세 앱에서 같은 닉네임·OBD ID로 보입니다. 각 앱 헤더에는 다른 두 앱으로 바로 이동하는
링크가 있습니다.

## C License / A License

별도 앱인 [`license/`](./license)에서 관리합니다. **관리자가 조건(기준 기록/정확도)을 먼저 등록하면, 그
조건을 실제로 달성한 사용자가 신청하고, 관리자가 검토해 승인해야 라이선스에 등록됩니다** (OBD Cube의 대회
주최 신청 -> 승인 패턴과 동일). 자세한 절차는 [`license/README.md`](./license/README.md) 참고.

| | C License | A License |
|---|---|---|
| 대상 | 큐브 | ADOFAI(얼불춤) |
| 실제 플레이 장소 | 오프라인 큐브 대회 (이 앱이 아님) | 실제 ADOFAI 게임 (이 앱이 아님) |
| 담기는 항목 | **종목별 기록(시간)** | **지정 레벨별 정확도** |

라이선스는 발급 여부·발급 번호·발급일·종목별 기록(레벨별 정확도) 목록을 관리하는 **자격 증명**입니다. 실제
대회 출전이나 게임 플레이 자체는 이 앱의 기능이 아닙니다. Firestore `licenses/{uid}` 컬렉션에 저장되고,
본인은 읽기만 가능하며 쓰기는 관리자만 가능합니다 (자세한 규칙은 [`obdcube/firestore.rules`](./obdcube/firestore.rules) 참고 —
세 앱이 같은 프로젝트를 쓰므로 규칙도 하나로 공유됩니다).

## Firebase 설정 (최초 1회)

세 앱이 프로젝트 하나를 공유하므로, Firebase 설정은 [`obdcube/README.md`](./obdcube/README.md)의
"Firebase 프로젝트 설정" 절차를 한 번만 따라 하면 됩니다. 직접 소유한 Firebase 프로젝트를 쓰려면
`obdcube/public/js/firebase-config.js`, `license/public/js/firebase-config.js`,
`timer/src/lib/firebase.ts` 세 곳의 config 값을 함께 바꿔주세요.

## 배포 (GitHub Pages)

저장소 **Settings → Pages**에서 Source를 **GitHub Actions**로 설정하면, `.github/workflows/deploy-pages.yml`이
`main`/`claude/**` 브랜치 푸시마다 다음을 수행합니다.

1. `timer/`를 빌드 (`npm ci && npm run build`)
2. 루트 `index.html` + 빌드된 `timer/dist` + `obdcube/public` + `license/public`을 하나의 사이트로 조합
3. GitHub Pages에 배포 — `/`(랜딩), `/timer/`(큐브 타이머), `/obdcube/`(OBD Cube), `/license/`(License)

## Windows 데스크톱 앱(.exe)

`timer`, `obdcube`는 독립적인 Electron 빌드도 그대로 유지합니다 (`license`는 웹 전용).

- `.github/workflows/build-timer-windows.yml` — `timer/` → `Release Build 1.0.exe`
- `.github/workflows/build-obdcube-windows.yml` — `obdcube/` → NSIS 설치 파일 + 포터블 exe

## 폴더 구조

```
index.html                 허브 랜딩 페이지
timer/                      큐브 타이머 (React + TypeScript + Vite)
obdcube/                    OBD Cube 대회 플랫폼 (바닐라 JS + Firebase)
license/                    C/A License 앱 (바닐라 JS + Firebase)
.github/workflows/
  deploy-pages.yml          GitHub Pages 통합 배포
  build-timer-windows.yml   큐브 타이머 exe 빌드
  build-obdcube-windows.yml OBD Cube exe 빌드
```

각 앱의 세부 기능·폴더 구조는 [`timer/README.md`](./timer/README.md), [`obdcube/README.md`](./obdcube/README.md)를 참고하세요.
