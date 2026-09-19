// Firestore 데이터 접근 헬퍼: 계정 프로필 조회 + 라이선스(C/A) 발급·조회

// WCA ID(예: 2015DOEJ01 = 가입연도 + 이름 4자 + 2자리 일련번호)를 본떠 만든
// OBD ID. obdcube 앱(../../obdcube/public/js/data.js)과 완전히 같은 규칙이며,
// 같은 Firestore 프로젝트를 공유하므로 카운터도 함께 쓴다.
async function generateObdId(nickname) {
  const year = new Date().getFullYear();
  const nameCode = String(nickname || "").replace(/\s/g, "").slice(0, 4).toUpperCase().padEnd(4, "X");
  const prefix = `${year}${nameCode}`;
  const counterRef = db.collection("obdIdCounters").doc(prefix);
  const seq = await db.runTransaction(async (tx) => {
    const doc = await tx.get(counterRef);
    const next = (doc.exists ? doc.data().count : 0) + 1;
    tx.set(counterRef, { count: next });
    return next;
  });
  return `${prefix}${String(seq).padStart(2, "0")}`;
}

async function fetchUserProfile(uid) {
  const doc = await db.collection("users").doc(uid).get();
  return doc.exists ? { uid, ...doc.data() } : null;
}

async function findUserByNickname(nickname) {
  const snap = await db.collection("nicknames").doc(nickname.trim()).get();
  if (!snap.exists) return null;
  const uid = snap.data().uid;
  const userDoc = await db.collection("users").doc(uid).get();
  return userDoc.exists ? { uid, ...userDoc.data() } : null;
}

// ---- 라이선스 (C License = 큐브, A License = ADOFAI) ----
// 실제 대회 출전(C)·게임 플레이(A)는 이 앱 밖에서 이루어지고, 이 앱은 발급 여부와
// 종목별 기록(C)/레벨별 정확도(A)를 관리 - 둘 다 관리자가 직접 입력한다.
// 문서 구조: licenses/{uid} = {
//   cLicense: { active, licenseNo, issuedAt, updatedAt, events: [{name, value}] },
//   aLicense: { active, licenseNo, issuedAt, updatedAt, levels: [{name, value}] }
// }

const LICENSE_TYPES = {
  c: {
    field: "cLicense",
    label: "C License",
    subLabel: "Cube",
    itemsField: "events",
    itemsLabel: "종목별 기록",
    nameLabel: "종목",
    valueLabel: "시간",
    placeholder: "3x3x3 큐브 | 12.34"
  },
  a: {
    field: "aLicense",
    label: "A License",
    subLabel: "ADOFAI",
    itemsField: "levels",
    itemsLabel: "레벨별 정확도",
    nameLabel: "레벨",
    valueLabel: "정확도",
    placeholder: "7.5 Reflection | 98.50%"
  }
};

// OBD ID와 같은 방식(연도+일련번호)의 발급 번호. 종류별로 카운터를 분리한다.
async function generateLicenseNo(typeKey) {
  const year = new Date().getFullYear();
  const prefix = `${typeKey.toUpperCase()}-${year}-`;
  const counterRef = db.collection("licenseCounters").doc(`${typeKey}-${year}`);
  const seq = await db.runTransaction(async (tx) => {
    const doc = await tx.get(counterRef);
    const next = (doc.exists ? doc.data().count : 0) + 1;
    tx.set(counterRef, { count: next });
    return next;
  });
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

async function fetchMyLicense(uid) {
  const snap = await db.collection("licenses").doc(uid).get();
  return snap.exists ? snap.data() : {};
}

// 관리자 전용: 발급(신규) 또는 종목/레벨-값 목록 수정. 기존에 발급된 적이 있으면
// 번호는 그대로 유지하고 항목/활성 여부만 갱신한다. items: [{name, value}]
async function issueOrUpdateLicense(uid, typeKey, items) {
  const type = LICENSE_TYPES[typeKey];
  const ref = db.collection("licenses").doc(uid);
  const snap = await ref.get();
  const existing = snap.exists ? snap.data()[type.field] : null;
  const licenseNo = (existing && existing.licenseNo) || await generateLicenseNo(typeKey);
  await ref.set({
    [type.field]: {
      active: true,
      licenseNo,
      issuedAt: (existing && existing.issuedAt) || firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      [type.itemsField]: items
    }
  }, { merge: true });
}

async function revokeLicense(uid, typeKey) {
  const type = LICENSE_TYPES[typeKey];
  const ref = db.collection("licenses").doc(uid);
  const snap = await ref.get();
  const existing = snap.exists ? snap.data()[type.field] : null;
  if (!existing) return;
  await ref.set({ [type.field]: { ...existing, active: false } }, { merge: true });
}
