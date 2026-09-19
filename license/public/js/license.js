// 라이선스 화면: 신청 조건 열람 -> 본인 신청 -> 관리자 승인/반려 -> 라이선스 카드 반영
// C License = 큐브(종목별 기록), A License = ADOFAI/얼불춤(레벨별 정확도).
// 실제 플레이는 이 앱 밖(오프라인 대회 / 실제 ADOFAI 게임)에서 이루어지고,
// 여기서는 조건 달성 신청 -> 관리자 검증 -> 등록의 자격 관리만 담당한다.

const APPLICATION_STATUS_LABEL = { pending: "심사 중", approved: "승인됨", rejected: "반려됨", cancelled: "취소됨" };

function renderLicenseItemRows(type, items) {
  if (!items || items.length === 0) {
    return `<p class="license-item-list--empty">등록된 ${escapeHtml(type.itemsLabel)}이(가) 없습니다.</p>`;
  }
  return `<div class="license-item-list">${items.map(i => `
    <div class="license-item-row">
      <span class="license-item-row__name">${escapeHtml(i.name)}</span>
      <span class="license-item-row__value">${escapeHtml(i.value)}</span>
    </div>
  `).join("")}</div>`;
}

function buildLicenseCardHtml(typeKey, licenseData) {
  const type = LICENSE_TYPES[typeKey];
  const active = !!(licenseData && licenseData.active);
  const items = (licenseData && licenseData[type.itemsField]) || [];
  return `
    <div class="license-card license-card--${typeKey} ${active ? "is-active" : "is-inactive"}">
      <div class="license-card__head">
        <div class="license-card__title">
          <strong>${type.label}</strong>
          <span>${type.subLabel}</span>
        </div>
        <span class="badge ${active ? "active" : "ended"}">${active ? "발급됨" : "미발급"}</span>
      </div>
      <div class="license-card__body">
        <p class="license-card__no">${licenseData && licenseData.licenseNo ? escapeHtml(licenseData.licenseNo) : "-"}</p>
        <p class="desc">발급일: ${licenseData && licenseData.issuedAt ? formatDate(licenseData.issuedAt) : "-"}</p>
        <p class="license-card__items-label">${type.itemsLabel}</p>
        ${renderLicenseItemRows(type, items)}
      </div>
    </div>
  `;
}

// ---- 본인 열람 ----

async function renderMyLicenseView() {
  const container = el("license-cards");
  container.innerHTML = "<p class='desc'>불러오는 중...</p>";
  const license = await fetchMyLicense(AppState.user.uid);
  container.innerHTML = buildLicenseCardHtml("c", license.cLicense) + buildLicenseCardHtml("a", license.aLicense);
}

// ---- 신청 조건 열람 + 신청 ----

let requirementsCache = { c: [], a: [] };

function requirementRowsHtml(typeKey, items) {
  const type = LICENSE_TYPES[typeKey];
  if (!items || items.length === 0) return `<p class="license-item-list--empty">아직 관리자가 등록한 조건이 없습니다.</p>`;
  return `<div class="license-item-list">${items.map(i => `
    <div class="license-item-row">
      <span class="license-item-row__name">${escapeHtml(i.name)}</span>
      <span class="license-item-row__value">${escapeHtml(type.valueLabel)} ${escapeHtml(i.value)}</span>
    </div>
  `).join("")}</div>`;
}

async function renderLicenseRequirements() {
  const [cItems, aItems] = await Promise.all([
    fetchLicenseRequirements("c"),
    fetchLicenseRequirements("a")
  ]);
  requirementsCache = { c: cItems, a: aItems };
  el("license-requirements").innerHTML = `
    <div class="license-cards">
      <div>
        <h3>C License 조건</h3>
        ${requirementRowsHtml("c", cItems)}
      </div>
      <div>
        <h3>A License 조건</h3>
        ${requirementRowsHtml("a", aItems)}
      </div>
    </div>
  `;
  fillApplyItemOptions();
}

function fillApplyItemOptions() {
  const typeKey = el("apply-type").value;
  const items = requirementsCache[typeKey] || [];
  const type = LICENSE_TYPES[typeKey];
  el("apply-item-name").innerHTML = items.length
    ? items.map(i => `<option value="${escapeHtml(i.name)}">${escapeHtml(i.name)} (기준 ${type.valueLabel}: ${escapeHtml(i.value)})</option>`).join("")
    : `<option value="">등록된 조건이 없습니다</option>`;
  el("apply-value-label").textContent = `내 ${type.valueLabel}`;
}

function initLicenseApplyForm() {
  el("apply-type").addEventListener("change", fillApplyItemOptions);

  el("form-license-apply").addEventListener("submit", async (e) => {
    e.preventDefault();
    const typeKey = el("apply-type").value;
    const itemName = el("apply-item-name").value;
    const claimedValue = el("apply-value").value.trim();
    if (!itemName) { showToast("신청할 조건이 없습니다. 관리자에게 문의해주세요.", "error"); return; }
    if (!claimedValue) { showToast(`달성한 ${LICENSE_TYPES[typeKey].valueLabel}을(를) 입력해주세요.`, "error"); return; }
    try {
      await submitLicenseApplication({ typeKey, itemName, claimedValue });
      el("apply-value").value = "";
      showToast("신청이 접수되었습니다. 관리자 승인을 기다려주세요.", "success");
      await renderMyLicenseApplications();
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

function applicationRowHtml(app, showCancel) {
  const type = LICENSE_TYPES[app.typeKey];
  return `
    <div class="item-card" data-id="${app.id}">
      <div class="info">
        <strong>${type.label} - ${escapeHtml(app.itemName)}</strong>
        <span>신청 ${escapeHtml(type.valueLabel)}: ${escapeHtml(app.claimedValue)}</span>
        ${app.status === "rejected" && app.rejectReason ? `<span>반려 사유: ${escapeHtml(app.rejectReason)}</span>` : ""}
      </div>
      <div class="actions">
        <span class="badge ${app.status === "approved" ? "approved" : app.status === "rejected" ? "rejected" : "pending"}">${APPLICATION_STATUS_LABEL[app.status] || app.status}</span>
        ${showCancel && app.status === "pending" ? `<button type="button" class="btn small danger btn-cancel-license-app" data-id="${app.id}">취소</button>` : ""}
      </div>
    </div>
  `;
}

async function renderMyLicenseApplications() {
  const container = el("my-license-applications");
  container.innerHTML = "<p class='desc'>불러오는 중...</p>";
  const list = await fetchMyLicenseApplications();
  container.innerHTML = list.length === 0
    ? "<p class='desc'>신청 내역이 없습니다.</p>"
    : list.map(app => applicationRowHtml(app, true)).join("");

  container.querySelectorAll(".btn-cancel-license-app").forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        await cancelLicenseApplication(btn.dataset.id);
        showToast("신청을 취소했습니다.", "success");
        await renderMyLicenseApplications();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  });
}

// ---- 관리자: 조건 관리 ----

function requirementsTextareaValue(items) {
  return (items || []).map(i => `${i.name} | ${i.value}`).join("\n");
}

function parseRequirementLines(text) {
  return String(text || "")
    .split("\n")
    .map(line => {
      const idx = line.indexOf("|");
      if (idx === -1) return null;
      const name = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      return name && value ? { name, value } : null;
    })
    .filter(Boolean);
}

async function renderRequirementsAdmin() {
  const [cItems, aItems] = await Promise.all([
    fetchLicenseRequirements("c"),
    fetchLicenseRequirements("a")
  ]);
  el("admin-requirements-c").value = requirementsTextareaValue(cItems);
  el("admin-requirements-a").value = requirementsTextareaValue(aItems);
}

function initRequirementsAdminForm() {
  el("form-requirements-c").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await setLicenseRequirements("c", parseRequirementLines(el("admin-requirements-c").value));
      showToast("C License 조건을 저장했습니다.", "success");
      await renderLicenseRequirements();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  el("form-requirements-a").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await setLicenseRequirements("a", parseRequirementLines(el("admin-requirements-a").value));
      showToast("A License 조건을 저장했습니다.", "success");
      await renderLicenseRequirements();
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

// ---- 관리자: 신청 승인 대기 ----

function pendingApplicationRowHtml(app) {
  const type = LICENSE_TYPES[app.typeKey];
  const requirement = (requirementsCache[app.typeKey] || []).find(i => i.name === app.itemName);
  return `
    <div class="item-card" data-id="${app.id}">
      <div class="info">
        <strong>${escapeHtml(app.applicantNickname)} - ${type.label}: ${escapeHtml(app.itemName)}</strong>
        <span>신청 ${escapeHtml(type.valueLabel)}: ${escapeHtml(app.claimedValue)}${requirement ? ` (기준: ${escapeHtml(requirement.value)})` : ""}</span>
      </div>
      <div class="actions">
        <button class="btn small success btn-approve-license" data-id="${app.id}">승인</button>
        <button class="btn small danger btn-reject-license" data-id="${app.id}">반려</button>
      </div>
    </div>
  `;
}

async function renderPendingLicenseApplications() {
  const container = el("license-pending-list");
  container.innerHTML = "<p class='desc'>불러오는 중...</p>";
  const list = await fetchPendingLicenseApplications();
  container.innerHTML = list.length === 0
    ? "<p class='desc'>대기 중인 신청이 없습니다.</p>"
    : list.map(pendingApplicationRowHtml).join("");

  container.querySelectorAll(".btn-approve-license").forEach(btn => {
    btn.addEventListener("click", async () => {
      const list2 = await fetchPendingLicenseApplications();
      const app = list2.find(a => a.id === btn.dataset.id);
      if (!app) return;
      try {
        await approveLicenseApplication(app);
        showToast(`${app.applicantNickname}님의 신청을 승인했습니다.`, "success");
        await renderPendingLicenseApplications();
        await renderReviewedLicenseApplications();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  });

  container.querySelectorAll(".btn-reject-license").forEach(btn => {
    btn.addEventListener("click", async () => {
      const list2 = await fetchPendingLicenseApplications();
      const app = list2.find(a => a.id === btn.dataset.id);
      if (!app) return;
      const reason = prompt("반려 사유를 입력해주세요 (선택)") || "";
      try {
        await rejectLicenseApplication(app, reason);
        showToast(`${app.applicantNickname}님의 신청을 반려했습니다.`, "success");
        await renderPendingLicenseApplications();
        await renderReviewedLicenseApplications();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  });
}

async function renderReviewedLicenseApplications() {
  const container = el("license-reviewed-list");
  const list = await fetchReviewedLicenseApplications();
  container.innerHTML = list.length === 0
    ? "<p class='desc'>처리 내역이 없습니다.</p>"
    : list.map(app => applicationRowHtml(app, false)).join("");
}

// ---- 관리자: 닉네임으로 특정 사용자 라이선스 조회 + 회수 ----

async function renderLicenseAdminTarget(user) {
  const container = el("license-admin-target");
  container.innerHTML = "<p class='desc'>불러오는 중...</p>";
  const license = await fetchMyLicense(user.uid);

  container.innerHTML = `
    <div class="panel" style="margin-top:14px;">
      <h3>${escapeHtml(user.nickname)} <span class="desc">(${escapeHtml(user.obdId || "-")})</span></h3>
      <div class="license-cards license-cards--admin">
        <div>
          ${buildLicenseCardHtml("c", license.cLicense)}
          ${license.cLicense && license.cLicense.active ? `<button type="button" class="btn small danger license-admin-revoke-btn" data-type="c">C License 회수</button>` : ""}
        </div>
        <div>
          ${buildLicenseCardHtml("a", license.aLicense)}
          ${license.aLicense && license.aLicense.active ? `<button type="button" class="btn small danger license-admin-revoke-btn" data-type="a">A License 회수</button>` : ""}
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll(".license-admin-revoke-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const typeKey = btn.dataset.type;
      if (!confirm(`${LICENSE_TYPES[typeKey].label}을(를) 회수할까요?`)) return;
      try {
        await revokeLicense(user.uid, typeKey);
        showToast(`${LICENSE_TYPES[typeKey].label}을(를) 회수했습니다.`, "success");
        await renderLicenseAdminTarget(user);
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  });
}

function initLicenseAdminSearchForm() {
  el("form-license-search").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nickname = el("license-target-nickname").value.trim();
    try {
      const user = await findUserByNickname(nickname);
      if (!user) { showToast("해당 닉네임의 사용자를 찾을 수 없습니다.", "error"); return; }
      await renderLicenseAdminTarget(user);
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

function initLicenseAdmin() {
  initRequirementsAdminForm();
  initLicenseAdminSearchForm();
}

async function renderLicenseAdminView() {
  await Promise.all([renderRequirementsAdmin(), renderPendingLicenseApplications(), renderReviewedLicenseApplications()]);
}
