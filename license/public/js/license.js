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
        <p class="desc">등급: ${licenseData && licenseData.grade ? escapeHtml(licenseData.grade) : "-"}</p>
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
      <span class="license-item-row__name">${escapeHtml(i.grade)} - ${escapeHtml(i.name)}</span>
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
    ? items.map((i, idx) => `<option value="${idx}">${escapeHtml(i.grade)} - ${escapeHtml(i.name)} (기준 ${type.valueLabel}: ${escapeHtml(i.value)})</option>`).join("")
    : `<option value="">등록된 조건이 없습니다</option>`;
  el("apply-value-label").textContent = `내 ${type.valueLabel}`;
}

function initLicenseApplyForm() {
  el("apply-type").addEventListener("change", fillApplyItemOptions);

  el("form-license-apply").addEventListener("submit", async (e) => {
    e.preventDefault();
    const typeKey = el("apply-type").value;
    const idxValue = el("apply-item-name").value;
    const claimedValue = el("apply-value").value.trim();
    const item = idxValue !== "" ? (requirementsCache[typeKey] || [])[Number(idxValue)] : null;
    if (!item) { showToast("신청할 조건이 없습니다. 관리자에게 문의해주세요.", "error"); return; }
    if (!claimedValue) { showToast(`달성한 ${LICENSE_TYPES[typeKey].valueLabel}을(를) 입력해주세요.`, "error"); return; }
    try {
      await submitLicenseApplication({ typeKey, grade: item.grade, itemName: item.name, claimedValue });
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
        <strong>${type.label} - ${escapeHtml(app.grade)} ${escapeHtml(app.itemName)}</strong>
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

// 조건 한 줄(등급/종목·레벨/기준값)을 입력 칸 3개짜리 행으로 표시한다.
// 행 안 칸에서 Enter를 누르면 바로 아래에 새 빈 행이 자동으로 추가된다.
function createRequirementRowElement(typeKey, item) {
  const row = document.createElement("div");
  row.className = "requirement-row";
  row.innerHTML = `
    <input type="text" class="requirement-grade" placeholder="등급 (예: 1급)" value="${escapeHtml(item && item.grade)}" />
    <input type="text" class="requirement-name" placeholder="${escapeHtml(LICENSE_TYPES[typeKey].nameLabel)} (예: ${typeKey === "c" ? "3x3x3 큐브" : "7.5 Reflection"})" value="${escapeHtml(item && item.name)}" />
    <input type="text" class="requirement-value" placeholder="기준값 (예: ${typeKey === "c" ? "15.00" : "95.00%"})" value="${escapeHtml(item && item.value)}" />
    <button type="button" class="btn small danger requirement-row-remove" title="이 조건 삭제">×</button>
  `;
  row.querySelectorAll("input").forEach(input => {
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      addRequirementRow(typeKey, row);
    });
  });
  row.querySelector(".requirement-row-remove").addEventListener("click", () => row.remove());
  return row;
}

function addRequirementRow(typeKey, afterRow) {
  const container = el(`admin-requirements-${typeKey}-rows`);
  const row = createRequirementRowElement(typeKey, null);
  if (afterRow && afterRow.nextSibling) {
    container.insertBefore(row, afterRow.nextSibling);
  } else {
    container.appendChild(row);
  }
  row.querySelector(".requirement-grade").focus();
  return row;
}

function renderRequirementRows(typeKey, items) {
  const container = el(`admin-requirements-${typeKey}-rows`);
  container.innerHTML = "";
  const list = items && items.length ? items : [null];
  list.forEach(item => container.appendChild(createRequirementRowElement(typeKey, item)));
}

function collectRequirementRows(typeKey) {
  const rows = Array.from(el(`admin-requirements-${typeKey}-rows`).querySelectorAll(".requirement-row"));
  return rows
    .map(row => ({
      grade: row.querySelector(".requirement-grade").value.trim(),
      name: row.querySelector(".requirement-name").value.trim(),
      value: row.querySelector(".requirement-value").value.trim()
    }))
    .filter(i => i.grade && i.name && i.value);
}

async function renderRequirementsAdmin() {
  const [cItems, aItems] = await Promise.all([
    fetchLicenseRequirements("c"),
    fetchLicenseRequirements("a")
  ]);
  renderRequirementRows("c", cItems);
  renderRequirementRows("a", aItems);
}

function initRequirementsAdminForm() {
  el("btn-add-requirement-c").addEventListener("click", () => addRequirementRow("c"));
  el("btn-add-requirement-a").addEventListener("click", () => addRequirementRow("a"));

  el("form-requirements-c").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await setLicenseRequirements("c", collectRequirementRows("c"));
      showToast("C License 조건을 저장했습니다.", "success");
      await renderLicenseRequirements();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  el("form-requirements-a").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await setLicenseRequirements("a", collectRequirementRows("a"));
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
  const requirement = (requirementsCache[app.typeKey] || []).find(i => i.grade === app.grade && i.name === app.itemName);
  return `
    <div class="item-card" data-id="${app.id}">
      <div class="info">
        <strong>${escapeHtml(app.applicantNickname)} - ${type.label}: ${escapeHtml(app.grade)} ${escapeHtml(app.itemName)}</strong>
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

  function gradeFormHtml(typeKey) {
    const data = typeKey === "c" ? license.cLicense : license.aLicense;
    if (!data) return "";
    const options = Array.from(new Set((requirementsCache[typeKey] || []).map(i => i.grade).filter(Boolean)));
    if (options.length === 0) {
      return `<p class="license-item-list--empty">등급을 저장하려면 먼저 "라이선스 조건 관리"에서 ${escapeHtml(LICENSE_TYPES[typeKey].label)} 조건에 등급을 포함해 등록하세요.</p>`;
    }
    const currentGrade = data.grade || "";
    return `
      <form class="inline-form license-grade-form" data-type="${typeKey}">
        <select class="license-grade-input">
          <option value="">등급 선택 안 함</option>
          ${options.map(name => `<option value="${escapeHtml(name)}" ${name === currentGrade ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
        </select>
        <button type="submit" class="btn small">등급 저장</button>
      </form>
    `;
  }

  container.innerHTML = `
    <div class="panel" style="margin-top:14px;">
      <h3>${escapeHtml(user.nickname)} <span class="desc">(${escapeHtml(user.obdId || "-")})</span></h3>
      <div class="license-cards license-cards--admin">
        <div>
          ${buildLicenseCardHtml("c", license.cLicense)}
          ${gradeFormHtml("c")}
          ${license.cLicense && license.cLicense.active ? `<button type="button" class="btn small danger license-admin-revoke-btn" data-type="c">C License 회수</button>` : ""}
        </div>
        <div>
          ${buildLicenseCardHtml("a", license.aLicense)}
          ${gradeFormHtml("a")}
          ${license.aLicense && license.aLicense.active ? `<button type="button" class="btn small danger license-admin-revoke-btn" data-type="a">A License 회수</button>` : ""}
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll(".license-grade-form").forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const typeKey = form.dataset.type;
      const grade = form.querySelector(".license-grade-input").value.trim();
      try {
        await setLicenseGrade(user.uid, typeKey, grade);
        showToast(`${LICENSE_TYPES[typeKey].label} 등급을 저장했습니다.`, "success");
        await renderLicenseAdminTarget(user);
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  });

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
  await Promise.all([
    renderRequirementsAdmin(),
    renderPendingLicenseApplications(),
    renderReviewedLicenseApplications(),
  ]);
}
