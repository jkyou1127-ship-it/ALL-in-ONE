// 라이선스 화면: 본인 라이선스 열람 + 관리자 발급/회수/항목 관리
// C License = 큐브(종목별 기록), A License = ADOFAI/얼불춤(레벨별 정확도).
// 실제 플레이는 이 앱 밖(오프라인 대회 / 실제 ADOFAI 게임)에서 이루어지고,
// 여기서는 자격(발급 여부·종목별 기록/레벨별 정확도)만 관리한다.

// 관리자가 한 줄에 하나씩 "이름 | 값" 형식으로 입력한 텍스트를 [{name, value}]로 변환.
function parseLicenseItems(text) {
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

function licenseItemsToText(items) {
  return (items || []).map(i => `${i.name} | ${i.value}`).join("\n");
}

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

// ---- 관리자 ----

function licenseAdminEditFormHtml(typeKey, uid, licenseData) {
  const type = LICENSE_TYPES[typeKey];
  const items = (licenseData && licenseData[type.itemsField]) || [];
  const active = !!(licenseData && licenseData.active);
  return `
    <form class="inline-form license-admin-edit-form" data-type="${typeKey}" data-uid="${uid}">
      <p class="license-admin-edit-hint">한 줄에 하나씩, "${escapeHtml(type.nameLabel)} | ${escapeHtml(type.valueLabel)}" 형식으로 입력하세요. (예: ${escapeHtml(type.placeholder)})</p>
      <textarea class="license-admin-items-input" placeholder="${escapeHtml(type.placeholder)}">${escapeHtml(licenseItemsToText(items))}</textarea>
      <div class="inline-form">
        <button type="submit" class="btn small primary">${licenseData ? "저장" : "발급"}</button>
        ${active ? `<button type="button" class="btn small danger license-admin-revoke-btn" data-type="${typeKey}">회수</button>` : ""}
      </div>
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
          ${buildLicenseCardHtml("c", license.cLicense)}
          ${licenseAdminEditFormHtml("c", user.uid, license.cLicense)}
        </div>
        <div>
          ${buildLicenseCardHtml("a", license.aLicense)}
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
      const items = parseLicenseItems(form.querySelector(".license-admin-items-input").value);
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
