// 라이선스 화면: 본인 라이선스 열람 + 관리자 발급/회수/지정 종목·레벨 관리
// C License = 큐브, A License = ADOFAI(얼불춤). 실제 플레이는 이 앱 밖(오프라인 대회 /
// 실제 ADOFAI 게임)에서 이루어지고, 여기서는 자격(발급 여부·지정 종목/레벨)만 다룬다.

function licenseItemsFromInput(text) {
  return String(text || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

function renderLicenseChips(items) {
  if (!items || items.length === 0) return `<span class="license-chip license-chip--empty">지정된 항목 없음</span>`;
  return items.map(i => `<span class="license-chip">${escapeHtml(i)}</span>`).join("");
}

// readOnly: 본인 열람용(발급/회수 버튼 없음). actions: 관리자용 버튼 HTML을 끼워 넣을 때 사용.
function buildLicenseCardHtml(typeKey, licenseData, actionsHtml) {
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
        <div class="license-chip-row">${renderLicenseChips(items)}</div>
      </div>
      ${actionsHtml ? `<div class="license-card__actions">${actionsHtml}</div>` : ""}
    </div>
  `;
}

// ---- 본인 열람 ----

async function renderLicenseView() {
  const container = el("license-cards");
  container.innerHTML = "<p class='desc'>불러오는 중...</p>";
  const license = await fetchMyLicense(AppState.user.uid);
  container.innerHTML =
    buildLicenseCardHtml("c", license.cLicense, "") +
    buildLicenseCardHtml("a", license.aLicense, "");
}

// ---- 관리자 ----

function licenseAdminEditFormHtml(typeKey, uid, licenseData) {
  const type = LICENSE_TYPES[typeKey];
  const items = (licenseData && licenseData[type.itemsField]) || [];
  const active = !!(licenseData && licenseData.active);
  return `
    <form class="inline-form license-admin-edit-form" data-type="${typeKey}" data-uid="${uid}">
      <input type="text" class="license-admin-items-input" placeholder="${type.itemsLabel} (쉼표로 구분)" value="${escapeHtml(items.join(", "))}" />
      <button type="submit" class="btn small primary">${licenseData ? "저장" : "발급"}</button>
      ${active ? `<button type="button" class="btn small danger license-admin-revoke-btn" data-type="${typeKey}">회수</button>` : ""}
    </form>
  `;
}

async function renderLicenseAdminTarget(user) {
  const container = el("license-admin-target");
  container.innerHTML = "<p class='desc'>불러오는 중...</p>";
  const license = await fetchMyLicense(user.uid);

  container.innerHTML = `
    <div class="panel" style="margin-top:14px;">
      <h3>${escapeHtml(user.nickname)} <span class="desc">(${escapeHtml(user.obdId || "-")})</span></h3>
      <div class="license-cards license-cards--admin">
        <div>
          ${buildLicenseCardHtml("c", license.cLicense, "")}
          ${licenseAdminEditFormHtml("c", user.uid, license.cLicense)}
        </div>
        <div>
          ${buildLicenseCardHtml("a", license.aLicense, "")}
          ${licenseAdminEditFormHtml("a", user.uid, license.aLicense)}
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll(".license-admin-edit-form").forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const typeKey = form.dataset.type;
      const targetUid = form.dataset.uid;
      const items = licenseItemsFromInput(form.querySelector(".license-admin-items-input").value);
      try {
        await issueOrUpdateLicense(targetUid, typeKey, items);
        showToast(`${LICENSE_TYPES[typeKey].label}을(를) 저장했습니다.`, "success");
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

function initLicenseAdminForm() {
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
