// 앱 진입점: 인증 상태 감지, 화면 전환, 라이선스 화면 렌더링

function showAuthScreen() {
  el("view-auth").classList.remove("hidden");
  el("view-app").classList.add("hidden");
  el("theme-toggle").classList.remove("hidden");
}

function showAppScreen() {
  el("view-auth").classList.add("hidden");
  el("view-app").classList.remove("hidden");
  el("theme-toggle").classList.add("hidden");
}

// ---- 로그인/회원가입 탭 ----
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    el("form-login").classList.toggle("hidden", tab !== "login");
    el("form-signup").classList.toggle("hidden", tab !== "signup");
  });
});

function translateAuthError(err) {
  const code = err.code || "";
  const map = {
    "auth/email-already-in-use": "이미 가입된 이메일입니다.",
    "auth/invalid-email": "이메일 형식이 올바르지 않습니다.",
    "auth/weak-password": "비밀번호는 6자 이상이어야 합니다.",
    "auth/user-not-found": "가입되지 않은 이메일입니다.",
    "auth/wrong-password": "비밀번호가 일치하지 않습니다.",
    "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다."
  };
  return map[code] || err.message || "오류가 발생했습니다.";
}

el("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await logIn(el("login-email").value.trim(), el("login-password").value);
  } catch (err) {
    showToast(translateAuthError(err), "error");
  }
});

el("form-signup").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await signUp(el("signup-nickname").value, el("signup-email").value.trim(), el("signup-password").value);
    showToast("회원가입이 완료되었습니다!", "success");
  } catch (err) {
    showToast(translateAuthError(err), "error");
  }
});

el("btn-logout").addEventListener("click", async () => {
  await logOut();
});

initLicenseApplyForm();
initLicenseAdmin();

auth.onAuthStateChanged(async (user) => {
  AppState.user = user;
  if (!user) {
    AppState.profile = null;
    AppState.isAdmin = false;
    showAuthScreen();
    return;
  }

  try {
    // 회원가입 직후에는 로그인 상태 변경 이벤트가 프로필 문서 생성보다 먼저 도착할 수 있고,
    // 이 리스너가 새 Firestore 연결을 처음 여는 경우라 지연이 커질 수 있어 넉넉하게(최대 ~10초)
    // 재시도한다 (obdcube 앱과 동일한 처리).
    for (let attempt = 0; attempt < 15; attempt++) {
      const snap = await db.collection("users").doc(user.uid).get();
      AppState.profile = snap.exists ? snap.data() : null;
      if (AppState.profile) break;
      await new Promise(r => setTimeout(r, 700));
    }
    const adminSnap = await db.collection("admins").doc(user.uid).get();
    AppState.isAdmin = adminSnap.exists;
  } catch (err) {
    showToast("프로필을 불러오지 못했습니다: " + err.message, "error");
  }

  if (!AppState.profile) {
    showToast("사용자 프로필을 찾을 수 없습니다. 다시 로그인해주세요.", "error");
    await logOut();
    return;
  }

  el("user-nickname").textContent = AppState.profile.nickname;
  el("view-license-admin").classList.toggle("hidden", !AppState.isAdmin);
  showAppScreen();
  await Promise.all([
    renderMyLicenseView(),
    renderLicenseRequirements(),
    renderMyLicenseApplications(),
  ]);
  if (AppState.isAdmin) await renderLicenseAdminView();
});
