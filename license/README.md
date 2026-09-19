# 🪪 License - C License / A License

> 이 폴더는 [ALL-in-ONE](../README.md) 저장소의 하위 앱입니다. Firebase 로그인은 [`timer`](../timer),
> [`obdcube`](../obdcube) 앱과 같은 프로젝트를 공유하므로, 한 계정으로 세 앱 모두 로그인됩니다.

C License(큐브)·A License(ADOFAI/얼불춤) 자격을 발급·조회하는 앱입니다.

- 웹앱: https://jkyou1127-ship-it.github.io/ALL-in-ONE/license/

## 라이선스란

| | C License | A License |
|---|---|---|
| 대상 | 큐브 | ADOFAI(얼불춤) |
| 실제 플레이 장소 | 오프라인 큐브 대회 (이 앱이 아님) | 실제 ADOFAI 게임 (이 앱이 아님) |
| 담기는 항목 | **종목별 기록(시간)** | **지정 레벨별 정확도** |

실제 대회 출전이나 게임 플레이 자체는 이 앱의 기능이 아닙니다. 이 앱은 발급 여부·발급 번호·발급일과
관리자가 직접 입력한 종목별 기록(C)/레벨별 정확도(A)만 관리하는 **자격 증명**입니다.

## 주요 기능

- 로그인하면 본인의 **C License / A License** 카드 두 개를 확인 가능 (미발급이면 "미발급" 표시)
- 각 카드에는 발급 번호, 발급일, 종목별 기록(C) 또는 레벨별 정확도(A) 목록이 표시됨
- 관리자는 "라이선스 관리" 패널에서 닉네임으로 사용자를 검색해:
  - 라이선스 발급(신규) 또는 기존 항목 수정
  - 항목은 한 줄에 하나씩 `종목/레벨 | 값` 형식으로 입력 (예: `3x3x3 큐브 | 12.34`, `7.5 Reflection | 98.50%`)
  - 라이선스 회수(비활성화) — 회수해도 발급 번호와 기록은 남아있고 다시 발급하면 재사용됨
- 로그인/회원가입은 `obdcube`와 완전히 같은 방식(닉네임 2~16자, 중복 확인, OBD ID 자동 발급)을 씁니다

## Firebase 설정

`timer`, `obdcube`와 같은 Firebase 프로젝트를 공유합니다. 최초 설정 방법은
[`../obdcube/README.md`](../obdcube/README.md)의 "Firebase 프로젝트 설정" 절을 참고하세요. 이 앱의 설정 파일은
[`public/js/firebase-config.js`](./public/js/firebase-config.js)이며, 다른 프로젝트를 쓰려면 `timer`/`obdcube`
설정 파일과 함께 값을 맞춰줘야 합니다.

Firestore 보안 규칙은 세 앱이 공유하는 [`../obdcube/firestore.rules`](../obdcube/firestore.rules)에
`licenses/{uid}` 컬렉션 규칙으로 정의되어 있습니다 — 본인은 읽기만, 발급/수정/회수는 관리자만 가능합니다.

## 폴더 구조

```
public/
  index.html
  css/style.css          obdcube와 같은 디자인 토큰 + 라이선스 카드 스타일
  js/
    firebase-config.js   Firebase 프로젝트 연결 설정
    utils.js             공용 헬퍼(토스트, 테마 전환 등)
    auth.js               로그인/회원가입/닉네임/관리자 부트스트랩 (obdcube와 동일)
    data.js                Firestore CRUD (프로필 조회 + 라이선스 발급/조회)
    license.js              카드 렌더링 + 관리자 발급/회수 폼
    app.js                  인증 상태 처리 및 화면 전환
```
