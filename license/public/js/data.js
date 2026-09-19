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

async function revokeLicense(uid, typeKey) {
  const type = LICENSE_TYPES[typeKey];
  const ref = db.collection("licenses").doc(uid);
  const snap = await ref.get();
  const existing = snap.exists ? snap.data()[type.field] : null;
  if (!existing) return;
  await ref.set({ [type.field]: { ...existing, active: false } }, { merge: true });
}

// 관리자 전용: 항목(종목/레벨 + 기록/정확도) 등록과 그 항목이 속한 등급을 함께 반영한다.
// 기존에 발급된 적이 있으면 번호는 그대로 유지한다. item: {grade, name, value}
async function upsertLicenseItem(uid, typeKey, item) {
  const type = LICENSE_TYPES[typeKey];
  const ref = db.collection("licenses").doc(uid);
  const snap = await ref.get();
  const existing = snap.exists ? snap.data()[type.field] : null;
  const items = (existing && existing[type.itemsField]) || [];
  const idx = items.findIndex(i => i.name === item.name);
  const storedItem = { name: item.name, value: item.value };
  if (idx >= 0) items[idx] = storedItem; else items.push(storedItem);
  const licenseNo = (existing && existing.licenseNo) || await generateLicenseNo(typeKey);
  await ref.set({
    [type.field]: {
      active: true,
      licenseNo,
      grade: item.grade,
      issuedAt: (existing && existing.issuedAt) || firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      [type.itemsField]: items
    }
  }, { merge: true });
}

// 관리자 전용: 등급만 다시 지정(오타 수정 등). 라이선스가 아직 없으면(미발급) 먼저 신청이 승인되어야 한다.
async function setLicenseGrade(uid, typeKey, grade) {
  const type = LICENSE_TYPES[typeKey];
  const ref = db.collection("licenses").doc(uid);
  const snap = await ref.get();
  const existing = snap.exists ? snap.data()[type.field] : null;
  if (!existing) throw new Error("먼저 라이선스가 발급(신청 승인)되어야 등급을 입력할 수 있습니다.");
  await ref.set({ [type.field]: { ...existing, grade, updatedAt: firebase.firestore.FieldValue.serverTimestamp() } }, { merge: true });
}

// ---- 라이선스 신청 조건 (관리자가 지정) ----
// 등급마다 C: 종목별 기준 기록(이 기록을 달성해야 신청 가능), A: 레벨별 기준 정확도를 정한다.
// 문서 구조: licenseRequirements/{typeKey} = { items: [{grade, name, value}] }

async function fetchLicenseRequirements(typeKey) {
  const snap = await db.collection("licenseRequirements").doc(typeKey).get();
  return snap.exists ? (snap.data().items || []) : [];
}

async function setLicenseRequirements(typeKey, items) {
  await db.collection("licenseRequirements").doc(typeKey).set({
    items,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// ---- 라이선스 신청 (신청 -> 관리자 승인 -> licenses에 반영) ----
// 문서 구조: licenseApplications/{appId} = {
//   applicantUid, applicantNickname, typeKey: 'c'|'a', grade, itemName, claimedValue,
//   status: 'pending'|'approved'|'rejected', createdAt, reviewedAt, reviewedByNickname, rejectReason
// }

async function submitLicenseApplication({ typeKey, grade, itemName, claimedValue }) {
  return db.collection("licenseApplications").add({
    applicantUid: AppState.user.uid,
    applicantNickname: AppState.profile.nickname,
    typeKey,
    grade,
    itemName,
    claimedValue,
    status: "pending",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function fetchMyLicenseApplications() {
  const snap = await db.collection("licenseApplications")
    .where("applicantUid", "==", AppState.user.uid)
    .get();
  const list = [];
  snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
  list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return list;
}

async function cancelLicenseApplication(appId) {
  await db.collection("licenseApplications").doc(appId).update({ status: "cancelled" });
}

async function fetchPendingLicenseApplications() {
  const snap = await db.collection("licenseApplications").where("status", "==", "pending").get();
  const list = [];
  snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
  list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  return list;
}

async function fetchReviewedLicenseApplications() {
  const snap = await db.collection("licenseApplications").where("status", "in", ["approved", "rejected"]).get();
  const list = [];
  snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
  list.sort((a, b) => (b.reviewedAt?.seconds || 0) - (a.reviewedAt?.seconds || 0));
  return list;
}

// 승인: 신청 상태를 approved로 바꾸고, 신청자의 licenses 문서에 해당 항목(이름+신청값)과 등급을
// 반영한다(기존에 같은 이름 항목이 있으면 값을 갱신). 최초 승인이면 라이선스 번호를 새로 발급한다.
async function approveLicenseApplication(app) {
  await upsertLicenseItem(app.applicantUid, app.typeKey, { grade: app.grade, name: app.itemName, value: app.claimedValue });
  await db.collection("licenseApplications").doc(app.id).update({
    status: "approved",
    reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
    reviewedByNickname: AppState.profile.nickname
  });
}

async function rejectLicenseApplication(app, reason) {
  await db.collection("licenseApplications").doc(app.id).update({
    status: "rejected",
    reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
    reviewedByNickname: AppState.profile.nickname,
    rejectReason: reason || ""
  });
}
