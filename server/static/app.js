(() => {
  const form = document.getElementById("orderForm");
  const orderDate = document.getElementById("orderDate");
  const shopId = document.getElementById("shopId");
  const shopPicker = document.getElementById("shopPicker");
  const supplierId = document.getElementById("supplierId");
  const supplierPicker = document.getElementById("supplierPicker");
  const dailyTotal = document.getElementById("dailyTotal");
  const submitBtn = document.getElementById("submitBtn");
  const formMsg = document.getElementById("formMsg");

  const queryForm = document.getElementById("queryForm");
  const queryDate = document.getElementById("queryDate");
  const queryDateCalBtn = document.getElementById("queryDateCalBtn");
  const queryCal = document.getElementById("queryCal");
  const calTitle = document.getElementById("calTitle");
  const calHint = document.getElementById("calHint");
  const calBody = document.getElementById("calBody");
  const calPrev = document.getElementById("calPrev");
  const calNext = document.getElementById("calNext");
  const calToday = document.getElementById("calToday");
  const calClear = document.getElementById("calClear");
  const queryShopId = document.getElementById("queryShopId");
  const queryShopPicker = document.getElementById("queryShopPicker");
  const querySupplierId = document.getElementById("querySupplierId");
  const querySupplierPicker = document.getElementById("querySupplierPicker");
  const queryBtn = document.getElementById("queryBtn");
  const resetQueryBtn = document.getElementById("resetQueryBtn");
  const queryMsg = document.getElementById("queryMsg");

  const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
  let calMode = "day";
  let calCursor = new Date();
  let rangeAnchor = null;

  const orderList = document.getElementById("orderList");
  const resultTableWrap = document.getElementById("resultTableWrap");
  const emptyHint = document.getElementById("emptyHint");
  const listMeta = document.getElementById("listMeta");
  const sumMeta = document.getElementById("sumMeta");

  const panelCreate = document.getElementById("panelCreate");
  const panelQuery = document.getElementById("panelQuery");
  const panelManage = document.getElementById("panelManage");
  const panelUsers = document.getElementById("panelUsers");
  const mainTabs = document.getElementById("mainTabs");
  const tabs = document.querySelectorAll(".tab");
  const manageTab = document.querySelector('.tab[data-tab="manage"]');
  const usersTab = document.querySelector('.tab[data-tab="users"]');
  const createTab = document.querySelector('.tab[data-tab="create"]');

  const shopForm = document.getElementById("shopForm");
  const newShopName = document.getElementById("newShopName");
  const shopMsg = document.getElementById("shopMsg");
  const shopManageList = document.getElementById("shopManageList");

  const supplierForm = document.getElementById("supplierForm");
  const newSupplierName = document.getElementById("newSupplierName");
  const supplierMsg = document.getElementById("supplierMsg");
  const supplierManageList = document.getElementById("supplierManageList");

  const managerForm = document.getElementById("managerForm");
  const newManagerUsername = document.getElementById("newManagerUsername");
  const newManagerPassword = document.getElementById("newManagerPassword");
  const newManagerShopId = document.getElementById("newManagerShopId");
  const newManagerShopPicker = document.getElementById("newManagerShopPicker");
  const managerMsg = document.getElementById("managerMsg");
  const managerList = document.getElementById("managerList");
  const managerEmpty = document.getElementById("managerEmpty");

  const deletionList = document.getElementById("deletionList");
  const deletionTableWrap = document.getElementById("deletionTableWrap");
  const deletionEmpty = document.getElementById("deletionEmpty");
  const deletionMeta = document.getElementById("deletionMeta");
  const clearDeletionsBtn = document.getElementById("clearDeletionsBtn");

  const dupModal = document.getElementById("dupModal");
  const dupTitle = document.getElementById("dupTitle");
  const dupText = document.getElementById("dupText");
  const dupYes = document.getElementById("dupYes");
  const dupNo = document.getElementById("dupNo");
  const dupNameWrap = document.getElementById("dupNameWrap");
  const dupName = document.getElementById("dupName");
  const dupPasswordWrap = document.getElementById("dupPasswordWrap");
  const dupPassword = document.getElementById("dupPassword");
  const dupPasswordError = document.getElementById("dupPasswordError");
  const currentUser = document.getElementById("currentUser");
  const currentRole = document.getElementById("currentRole");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const passwordModal = document.getElementById("passwordModal");
  const passwordBackdrop = document.getElementById("passwordBackdrop");
  const passwordForm = document.getElementById("passwordForm");
  const oldPassword = document.getElementById("oldPassword");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const passwordMsg = document.getElementById("passwordMsg");
  const passwordSave = document.getElementById("passwordSave");
  const passwordCancel = document.getElementById("passwordCancel");
  const recentList = document.getElementById("recentList");
  const recentTableWrap = document.getElementById("recentTableWrap");
  const recentEmpty = document.getElementById("recentEmpty");
  const recentMeta = document.getElementById("recentMeta");

  const ADMIN_CONFIRM_HEADER = "X-Admin-Confirm";

  let dupResolve = null;
  let dupRequirePassword = false;
  let dupRequireName = false;
  let shops = [];
  let suppliers = [];
  let managers = [];
  let currentUserInfo = null;

  function isAdmin() {
    return !currentUserInfo || currentUserInfo.role !== "manager";
  }

  function isManager() {
    return Boolean(currentUserInfo && currentUserInfo.role === "manager");
  }

  function managerShopName() {
    return (currentUserInfo && currentUserInfo.shop_name) || "";
  }

  function managerShopId() {
    return currentUserInfo && currentUserInfo.shop_id
      ? String(currentUserInfo.shop_id)
      : "";
  }

  function applyRoleUi() {
    const admin = isAdmin();
    if (manageTab) manageTab.hidden = !admin;
    if (usersTab) usersTab.hidden = !admin;
    if (createTab) createTab.hidden = admin;
    if (mainTabs) {
      mainTabs.classList.toggle("tabs-3", admin);
      mainTabs.classList.toggle("tabs-2", !admin);
    }
    if (currentRole) {
      if (isManager()) {
        currentRole.hidden = false;
        currentRole.textContent = `店长 · ${managerShopName()}`;
      } else {
        currentRole.hidden = false;
        currentRole.textContent = "管理员";
      }
    }
    document.body.classList.toggle("role-manager", isManager());
    document.body.classList.toggle("role-admin", isAdmin());
    if (admin && panelCreate && !panelCreate.hidden) {
      switchTab("manage");
    }
    if (!admin && panelManage && !panelManage.hidden) {
      switchTab("create");
    }
    if (!admin && panelUsers && !panelUsers.hidden) {
      switchTab("create");
    }
  }

  function lockShopPickers() {
    const sid = managerShopId();
    if (!isManager() || !sid) {
      shopPicker?.closest(".choice-field")?.classList.remove("is-locked");
      queryShopPicker?.closest(".choice-field")?.classList.remove("is-locked");
      return;
    }
    shopId.value = sid;
    queryShopId.value = sid;
    shopPicker?.closest(".choice-field")?.classList.add("is-locked");
    queryShopPicker?.closest(".choice-field")?.classList.add("is-locked");
  }

  function refreshIconHtml() {
    return `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.2-5.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M20 5v5h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  function makeRefreshTotalBtn(onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon-refresh-btn";
    btn.setAttribute("aria-label", "刷新本月金额");
    btn.title = "刷新本月金额";
    btn.innerHTML = refreshIconHtml();
    btn.addEventListener("click", async () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.classList.add("is-spinning");
      try {
        await onClick();
      } finally {
        btn.disabled = false;
        btn.classList.remove("is-spinning");
      }
    });
    return btn;
  }

  async function refreshShopMonthTotal(shopId, totalEl, msgEl) {
    const res = await api(`/api/shops/${shopId}`);
    if (!res.ok) throw new Error(await parseError(res));
    const shop = await res.json();
    const idx = shops.findIndex((s) => Number(s.id) === Number(shopId));
    if (idx >= 0) {
      shops[idx] = { ...shops[idx], month_total: shop.month_total };
    }
    if (totalEl) {
      totalEl.textContent = `本月 ¥${formatMoney(Number(shop.month_total || 0))}`;
    }
    if (msgEl) showMsg(msgEl, "本月金额已刷新", true);
  }

  async function refreshSupplierMonthTotal(supplierId, totalEl, msgEl) {
    const res = await api(`/api/suppliers/${supplierId}`);
    if (!res.ok) throw new Error(await parseError(res));
    const item = await res.json();
    const idx = suppliers.findIndex((s) => Number(s.id) === Number(supplierId));
    if (idx >= 0) {
      suppliers[idx] = { ...suppliers[idx], month_total: item.month_total };
    }
    if (totalEl) {
      totalEl.textContent = `本月 ¥${formatMoney(Number(item.month_total || 0))}`;
    }
    if (msgEl) showMsg(msgEl, "本月金额已刷新", true);
  }

  function renderShopManageList() {
    if (!shopManageList) return;
    shopManageList.innerHTML = "";
    if (!shops.length) {
      const empty = document.createElement("p");
      empty.className = "chip-empty";
      empty.textContent = "暂无店铺";
      shopManageList.appendChild(empty);
      return;
    }
    for (const shop of shops) {
      const shopManagers = managers.filter((m) => Number(m.shop_id) === Number(shop.id));
      const card = document.createElement("div");
      card.className = "shop-manage-card";
      card.innerHTML = `
        <div class="shop-manage-head">
          <span class="name"></span>
          <span class="manager-name"></span>
        </div>
        <div class="shop-month-row">
          <span class="shop-month-total"></span>
        </div>
        <div class="manage-actions"></div>
      `;
      card.querySelector(".name").textContent = shop.name;
      const totalEl = card.querySelector(".shop-month-total");
      const monthTotal = Number(shop.month_total || 0);
      totalEl.textContent = `本月 ¥${formatMoney(monthTotal)}`;
      card.querySelector(".shop-month-row").appendChild(
        makeRefreshTotalBtn(async () => {
          try {
            await refreshShopMonthTotal(shop.id, totalEl, shopMsg);
          } catch (err) {
            showMsg(shopMsg, err.message || "刷新失败", false);
          }
        })
      );
      const managerNameEl = card.querySelector(".manager-name");
      if (shopManagers.length) {
        managerNameEl.textContent = `店长：${shopManagers.map((m) => m.username).join("、")}`;
        if (shopManagers.every((m) => m.disabled)) {
          managerNameEl.classList.add("is-disabled");
        }
      } else {
        managerNameEl.textContent = "暂无店长";
        managerNameEl.classList.add("is-empty");
      }
      const actions = card.querySelector(".manage-actions");
      for (const mgr of shopManagers) {
        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "toggle-btn" + (mgr.disabled ? " is-enable" : "");
        toggleBtn.textContent = mgr.disabled ? "启用" : "禁用";
        toggleBtn.addEventListener("click", () => toggleManagerDisabled(mgr));
        actions.appendChild(toggleBtn);
      }
      const renameBtn = document.createElement("button");
      renameBtn.type = "button";
      renameBtn.className = "rename-btn";
      renameBtn.textContent = "改名";
      renameBtn.addEventListener("click", () => renameShop(shop));
      actions.appendChild(renameBtn);
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "删除";
      deleteBtn.addEventListener("click", () => deleteShop(shop));
      actions.appendChild(deleteBtn);
      shopManageList.appendChild(card);
    }
  }

  function renderSupplierManageList() {
    if (!supplierManageList) return;
    supplierManageList.innerHTML = "";
    if (!suppliers.length) {
      const empty = document.createElement("p");
      empty.className = "chip-empty";
      empty.textContent = "暂无供应商";
      supplierManageList.appendChild(empty);
      return;
    }
    for (const item of suppliers) {
      const card = document.createElement("div");
      card.className = "shop-manage-card";
      card.innerHTML = `
        <div class="shop-manage-head">
          <span class="name"></span>
        </div>
        <div class="shop-month-row">
          <span class="shop-month-total"></span>
        </div>
        <div class="manage-actions">
          <button type="button" class="rename-btn">改名</button>
          <button type="button" class="delete-btn">删除</button>
        </div>
      `;
      card.querySelector(".name").textContent = item.name;
      const totalEl = card.querySelector(".shop-month-total");
      const monthTotal = Number(item.month_total || 0);
      totalEl.textContent = `本月 ¥${formatMoney(monthTotal)}`;
      card.querySelector(".shop-month-row").appendChild(
        makeRefreshTotalBtn(async () => {
          try {
            await refreshSupplierMonthTotal(item.id, totalEl, supplierMsg);
          } catch (err) {
            showMsg(supplierMsg, err.message || "刷新失败", false);
          }
        })
      );
      card.querySelector(".rename-btn").addEventListener("click", () => renameSupplier(item));
      card.querySelector(".delete-btn").addEventListener("click", () => deleteSupplier(item));
      supplierManageList.appendChild(card);
    }
  }

  async function loadManagers() {
    if (!isAdmin()) {
      managers = [];
      return;
    }
    const res = await api("/api/users");
    if (!res.ok) throw new Error(await parseError(res));
    managers = await res.json();
    renderShopManageList();
    renderManagerList();
  }

  function managerFeedbackEl() {
    return panelUsers && !panelUsers.hidden && managerMsg ? managerMsg : shopMsg;
  }

  function renderManagerList() {
    if (!managerList) return;
    managerList.innerHTML = "";
    if (managerEmpty) managerEmpty.hidden = managers.length > 0;
    for (const item of managers) {
      const row = document.createElement("div");
      row.className = "manager-row" + (item.disabled ? " is-disabled" : "");
      const shopLabel = item.shop_name || "未绑定店铺";
      row.innerHTML = `
        <div class="meta">
          <div class="name"></div>
          <div class="shop"></div>
        </div>
        <div class="manager-actions">
          <button type="button" class="edit-btn">编辑</button>
          <button type="button" class="toggle-btn"></button>
          <button type="button" class="delete-btn">删除</button>
        </div>
      `;
      const nameEl = row.querySelector(".name");
      nameEl.textContent = item.username;
      if (item.disabled) {
        const badgeEl = document.createElement("span");
        badgeEl.className = "disabled-badge";
        badgeEl.textContent = "已禁用";
        nameEl.appendChild(badgeEl);
      }
      row.querySelector(".shop").textContent = shopLabel;
      const toggleBtn = row.querySelector(".toggle-btn");
      toggleBtn.classList.toggle("is-enable", Boolean(item.disabled));
      toggleBtn.textContent = item.disabled ? "启用" : "禁用";
      row.querySelector(".edit-btn").addEventListener("click", () => openEditManagerModal(item));
      toggleBtn.addEventListener("click", () => toggleManagerDisabled(item));
      row.querySelector(".delete-btn").addEventListener("click", () => deleteManager(item));
      managerList.appendChild(row);
    }
  }

  async function toggleManagerDisabled(item) {
    const willDisable = !item.disabled;
    const action = willDisable ? "禁用" : "启用";
    const ok = await openModal({
      title: `${action}店长`,
      text: `确认${action}店长「${item.username}」？`,
      yesText: `确定${action}`,
      noText: "取消",
      danger: willDisable,
    });
    if (!ok) return;
    const res = await api(`/api/users/${item.id}/disabled`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: willDisable }),
    });
    const msgEl = managerFeedbackEl();
    if (!res.ok) {
      showMsg(msgEl, await parseError(res), false);
      return;
    }
    showMsg(msgEl, `店长已${action}`, true);
    await loadManagers();
  }

  async function createManager() {
    hideMsg(managerMsg);
    const username = (newManagerUsername?.value || "").trim();
    const password = newManagerPassword?.value || "";
    const shopId = Number(newManagerShopId?.value || 0);
    if (!username) {
      showMsg(managerMsg, "请输入用户名", false);
      return;
    }
    if (password.length < 4) {
      showMsg(managerMsg, "密码至少 4 位", false);
      return;
    }
    if (!shopId) {
      showMsg(managerMsg, "请选择绑定店铺", false);
      return;
    }
    const res = await api("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, shop_id: shopId }),
    });
    if (!res.ok) {
      showMsg(managerMsg, await parseError(res), false);
      return;
    }
    if (newManagerUsername) newManagerUsername.value = "";
    if (newManagerPassword) newManagerPassword.value = "";
    showMsg(managerMsg, "店长已添加", true);
    await loadManagers();
  }

  async function deleteManager(item) {
    const password = await confirmDelete(`确认删除店长「${item.username}」？`);
    if (!password) return;
    const res = await api(`/api/users/${item.id}`, {
      method: "DELETE",
      headers: adminConfirmHeaders(password),
    });
    const msgEl = managerFeedbackEl();
    if (!res.ok && res.status !== 204) {
      showMsg(msgEl, await parseError(res), false);
      return;
    }
    showMsg(msgEl, "店长已删除", true);
    await loadManagers();
  }

  async function api(url, options = {}) {
    const res = await fetch(url, { credentials: "include", ...options });
    if (res.status === 401) {
      location.href = "/login";
      throw new Error("未登录");
    }
    return res;
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function toISODate(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function parseQueryDateInput(raw) {
    const s = String(raw || "").trim().replace(/\s+/g, "");
    if (!s) return { ok: true, params: {} };

    const range = s.match(
      /^(\d{4}-\d{2}-\d{2})(?:[~～/至]|--)(\d{4}-\d{2}-\d{2})$/
    );
    if (range) {
      const [, from, to] = range;
      if (from > to) return { ok: false, error: "开始日期不能晚于结束日期" };
      return { ok: true, params: { date_from: from, date_to: to } };
    }

    // 同月简写：2026-08-01~08-31
    const shortRange = s.match(/^(\d{4}-\d{2})-(\d{2})(?:[~～/至]|--)(\d{2})$/);
    if (shortRange) {
      const [, ym, d1, d2] = shortRange;
      const from = `${ym}-${d1}`;
      const to = `${ym}-${d2}`;
      if (from > to) return { ok: false, error: "开始日期不能晚于结束日期" };
      return { ok: true, params: { date_from: from, date_to: to } };
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return { ok: true, params: { order_date: s } };
    }
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) {
      return { ok: true, params: { month: s } };
    }
    return {
      ok: false,
      error: "日期格式：2026-08-06、2026-08 或 2026-08-01~2026-08-31",
    };
  }

  function getSelectedRange() {
    const parsed = parseQueryDateInput(queryDate.value);
    if (!parsed.ok) return { mode: calMode, from: null, to: null, month: null };
    const { params } = parsed;
    if (params.month) return { mode: "month", from: null, to: null, month: params.month };
    if (params.date_from || params.date_to) {
      return {
        mode: "range",
        from: params.date_from || null,
        to: params.date_to || null,
        month: null,
      };
    }
    if (params.order_date) {
      return { mode: "day", from: params.order_date, to: params.order_date, month: null };
    }
    return { mode: calMode, from: null, to: null, month: null };
  }

  function setCalOpen(open) {
    queryCal.hidden = !open;
    queryDateCalBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) renderCalendar();
  }

  function renderCalendar() {
    const selected = getSelectedRange();
    const y = calCursor.getFullYear();
    const m = calCursor.getMonth();
    const today = todayISO();

    queryCal.querySelectorAll(".cal-mode").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === calMode);
    });

    if (calMode === "month") {
      calTitle.textContent = `${y} 年`;
      calHint.textContent = "选择月份";
      const months = document.createElement("div");
      months.className = "cal-months";
      for (let i = 0; i < 12; i += 1) {
        const value = `${y}-${pad2(i + 1)}`;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cal-month-cell";
        btn.textContent = `${i + 1}月`;
        if (value === today.slice(0, 7)) btn.classList.add("today");
        if (selected.month === value) btn.classList.add("selected");
        btn.addEventListener("click", () => {
          queryDate.value = value;
          rangeAnchor = null;
          setCalOpen(false);
          queryOrders();
        });
        months.appendChild(btn);
      }
      calBody.replaceChildren(months);
      return;
    }

    calTitle.textContent = `${y} 年 ${m + 1} 月`;
    calHint.textContent =
      calMode === "range"
        ? rangeAnchor
          ? `已选 ${rangeAnchor}，再选结束日`
          : "先选开始日，再选结束日"
        : "选择一天";

    const weekdays = document.createElement("div");
    weekdays.className = "cal-weekdays";
    WEEKDAYS.forEach((w) => {
      const span = document.createElement("span");
      span.textContent = w;
      weekdays.appendChild(span);
    });

    const days = document.createElement("div");
    days.className = "cal-days";
    const first = new Date(y, m, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const from = selected.from;
    const to = selected.to;

    for (let i = 0; i < startWeekday; i += 1) {
      const empty = document.createElement("button");
      empty.type = "button";
      empty.className = "cal-day";
      empty.disabled = true;
      empty.textContent = "";
      days.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const value = `${y}-${pad2(m + 1)}-${pad2(day)}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-day";
      btn.textContent = String(day);
      if (value === today) btn.classList.add("today");
      if (calMode === "day" && from === value) btn.classList.add("selected");
      if (calMode === "range") {
        if (from && to && value >= from && value <= to) btn.classList.add("in-range");
        if (from === value) btn.classList.add("range-start");
        if (to === value) btn.classList.add("range-end");
        if (rangeAnchor === value) btn.classList.add("selected");
      }
      btn.addEventListener("click", () => onCalDayClick(value));
      days.appendChild(btn);
    }

    calBody.replaceChildren(weekdays, days);
  }

  function onCalDayClick(value) {
    if (calMode === "day") {
      queryDate.value = value;
      rangeAnchor = null;
      setCalOpen(false);
      queryOrders();
      return;
    }

    if (!rangeAnchor) {
      rangeAnchor = value;
      queryDate.value = value;
      renderCalendar();
      return;
    }

    let from = rangeAnchor;
    let to = value;
    if (from > to) [from, to] = [to, from];
    queryDate.value = `${from}~${to}`;
    rangeAnchor = null;
    setCalOpen(false);
    queryOrders();
  }

  function showMsg(el, text, ok) {
    el.hidden = false;
    el.textContent = text;
    el.className = `msg ${ok ? "ok" : "err"}`;
  }

  function hideMsg(el) {
    el.hidden = true;
    el.textContent = "";
  }

  function formatMoney(n) {
    return Number(n).toFixed(2);
  }

  function almostEqual(a, b) {
    return Math.abs(Number(a) - Number(b)) < 0.001;
  }

  function openModal({
    title,
    text,
    yesText,
    noText,
    danger = false,
    requirePassword = false,
    requireName = false,
    defaultName = "",
  }) {
    dupTitle.textContent = title;
    dupText.textContent = text;
    dupYes.textContent = yesText;
    dupNo.textContent = noText;
    dupYes.className = danger ? "btn-danger" : "btn-primary";
    dupNo.className = "btn-secondary";
    dupRequirePassword = !!requirePassword;
    dupRequireName = !!requireName;
    dupPasswordWrap.hidden = !dupRequirePassword;
    if (dupNameWrap) dupNameWrap.hidden = !dupRequireName;
    dupPasswordError.hidden = true;
    dupPasswordError.textContent = "";
    dupPassword.value = "";
    if (dupName) dupName.value = defaultName || "";
    dupModal.hidden = false;
    if (dupRequireName && dupName) {
      setTimeout(() => {
        dupName.focus();
        dupName.select();
      }, 30);
    } else if (dupRequirePassword) {
      setTimeout(() => dupPassword.focus(), 30);
    }
    return new Promise((resolve) => {
      dupResolve = resolve;
    });
  }

  function closeModal(result) {
    let resolveValue = result;
    if (result && dupRequireName) {
      const name = (dupName?.value || "").trim().replace(/\s+/g, " ");
      if (!name) {
        dupPasswordError.hidden = false;
        dupPasswordError.textContent = "请输入名称";
        dupName?.focus();
        return;
      }
      resolveValue = name;
    } else if (result && dupRequirePassword) {
      const pwd = dupPassword.value;
      if (!pwd) {
        dupPasswordError.hidden = false;
        dupPasswordError.textContent = "请输入登录密码";
        dupPassword.focus();
        return;
      }
      resolveValue = pwd;
    }
    dupModal.hidden = true;
    dupRequirePassword = false;
    dupRequireName = false;
    dupPasswordWrap.hidden = true;
    if (dupNameWrap) dupNameWrap.hidden = true;
    dupPassword.value = "";
    if (dupName) dupName.value = "";
    dupPasswordError.hidden = true;
    if (dupResolve) {
      const resolve = dupResolve;
      dupResolve = null;
      resolve(resolveValue);
    }
  }

  async function confirmDelete(text) {
    return openModal({
      title: "确认删除",
      text: `${text}\n请输入登录密码后确认。`,
      yesText: "确定删除",
      noText: "取消",
      danger: true,
      requirePassword: true,
    });
  }

  async function promptRename(kindLabel, oldName) {
    return openModal({
      title: `修改${kindLabel}名称`,
      text: `当前名称：${oldName}`,
      yesText: "保存",
      noText: "取消",
      requireName: true,
      defaultName: oldName,
    });
  }

  function adminConfirmHeaders(password, extra = {}) {
    return {
      ...extra,
      [ADMIN_CONFIRM_HEADER]: password,
    };
  }

  dupYes.addEventListener("click", () => closeModal(true));
  dupNo.addEventListener("click", () => closeModal(false));
  dupModal.querySelector(".modal-backdrop").addEventListener("click", () => closeModal(false));
  dupPassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      closeModal(true);
    }
  });
  if (dupName) {
    dupName.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        closeModal(true);
      }
    });
  }

  async function parseError(res) {
    try {
      const data = await res.json();
      if (typeof data.detail === "string") return data.detail;
      if (Array.isArray(data.detail)) {
        return data.detail.map((x) => x.msg || JSON.stringify(x)).join("；");
      }
    } catch (_) {
      /* ignore */
    }
    return `请求失败（HTTP ${res.status}）`;
  }

  function renderChipPicker(container, hiddenInput, items, options = {}) {
    const {
      allowEmpty = false,
      emptyLabel = "全部",
      emptyHint = "暂无选项，请先在管理页添加",
      keepValue = true,
      valueKey = "name",
    } = options;
    const itemValue = (item) => String(item[valueKey]);
    let selected = keepValue ? String(hiddenInput.value || "") : "";
    if (selected && !items.some((x) => itemValue(x) === selected)) {
      selected = "";
      hiddenInput.value = "";
    }

    container.innerHTML = "";

    const addChip = (value, label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (selected === value ? " active" : "");
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", selected === value ? "true" : "false");
      btn.textContent = label;
      btn.addEventListener("click", () => {
        hiddenInput.value = value;
        renderChipPicker(container, hiddenInput, items, options);
      });
      container.appendChild(btn);
    };

    if (allowEmpty) addChip("", emptyLabel);
    for (const item of items) {
      addChip(itemValue(item), item.name);
    }
    if (!items.length && !allowEmpty) {
      const empty = document.createElement("p");
      empty.className = "chip-empty";
      empty.textContent = emptyHint;
      container.appendChild(empty);
    }
  }

  function renderManageGrid(container, items, onDelete, emptyText = "暂无数据", onRename = null) {
    container.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "chip-empty";
      empty.textContent = emptyText;
      container.appendChild(empty);
      return;
    }
    for (const item of items) {
      const cell = document.createElement("div");
      cell.className = "manage-chip";
      const actions = onRename
        ? `<div class="manage-actions"><button type="button" class="rename-btn">改名</button><button type="button" class="delete-btn">删除</button></div>`
        : `<button type="button" class="delete-btn">删除</button>`;
      cell.innerHTML = `<span class="name"></span>${actions}`;
      cell.querySelector(".name").textContent = item.name;
      cell.querySelector(".delete-btn").addEventListener("click", () => onDelete(item));
      if (onRename) {
        cell.querySelector(".rename-btn").addEventListener("click", () => onRename(item));
      }
      container.appendChild(cell);
    }
  }

  function formatDeletedAt(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).replace("T", " ").slice(0, 19);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  }

  function deletionLimit() {
    return document.documentElement.classList.contains("is-pc") ? 50 : 20;
  }

  function renderDeletions(items) {
    deletionList.innerHTML = "";
    const hasItems = items.length > 0;
    deletionEmpty.hidden = hasItems;
    deletionEmpty.textContent = "暂无删除记录";
    deletionTableWrap.hidden = !hasItems;
    deletionMeta.textContent = hasItems ? `最近 ${items.length} 条` : "";
    if (clearDeletionsBtn) clearDeletionsBtn.hidden = !hasItems;

    for (const item of items) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-date"></td>
        <td class="col-kind"></td>
        <td class="col-operator"></td>
        <td class="col-summary"></td>
      `;
      tr.querySelector(".col-date").textContent = formatDeletedAt(item.deleted_at);
      tr.querySelector(".col-kind").textContent = item.kind_label || item.kind || "";
      const operator = item.operator_username || "—";
      const roleLabel = item.operator_role_label || "";
      tr.querySelector(".col-operator").textContent = roleLabel
        ? `${operator}（${roleLabel}）`
        : operator;
      tr.querySelector(".col-summary").textContent = item.summary || "";
      deletionList.appendChild(tr);
    }
  }

  async function loadDeletions() {
    try {
      const res = await api(`/api/deletions?limit=${deletionLimit()}`);
      if (!res.ok) throw new Error(await parseError(res));
      renderDeletions(await res.json());
    } catch (err) {
      renderDeletions([]);
      deletionMeta.textContent = "";
      deletionEmpty.hidden = false;
      deletionEmpty.textContent = err.message || "加载删除记录失败";
    }
  }

  async function clearAllDeletions() {
    if (!isAdmin()) return;
    const password = await confirmDelete("确认清空全部最近删除记录？此操作不可恢复。");
    if (!password) return;
    const res = await api("/api/deletions", {
      method: "DELETE",
      headers: adminConfirmHeaders(password),
    });
    if (!res.ok && res.status !== 204) {
      showMsg(shopMsg, await parseError(res), false);
      return;
    }
    showMsg(shopMsg, "最近删除记录已清空", true);
    await loadDeletions();
  }

  if (clearDeletionsBtn) {
    clearDeletionsBtn.addEventListener("click", () => {
      clearAllDeletions().catch((err) => {
        showMsg(shopMsg, err.message || "清空失败", false);
      });
    });
  }

  async function loadCatalog() {
    const [shopRes, supplierRes] = await Promise.all([
      api("/api/shops"),
      api("/api/suppliers"),
    ]);
    if (!shopRes.ok) throw new Error(await parseError(shopRes));
    if (!supplierRes.ok) throw new Error(await parseError(supplierRes));
    shops = await shopRes.json();
    suppliers = await supplierRes.json();

    if (isManager() && managerShopId()) {
      shopId.value = managerShopId();
      queryShopId.value = managerShopId();
    }

    renderChipPicker(shopPicker, shopId, shops, {
      allowEmpty: false,
      emptyHint: "暂无店铺，请先在管理页添加",
      keepValue: true,
      valueKey: "id",
    });
    renderChipPicker(supplierPicker, supplierId, suppliers, {
      allowEmpty: false,
      emptyHint: "暂无供应商，请先在管理页添加",
      keepValue: true,
      valueKey: "id",
    });
    renderChipPicker(queryShopPicker, queryShopId, shops, {
      allowEmpty: !isManager(),
      emptyLabel: "全部店铺",
      keepValue: true,
      valueKey: "id",
    });
    renderChipPicker(querySupplierPicker, querySupplierId, suppliers, {
      allowEmpty: true,
      emptyLabel: "全部供应商",
      keepValue: true,
      valueKey: "id",
    });
    if (newManagerShopPicker && newManagerShopId) {
      renderChipPicker(newManagerShopPicker, newManagerShopId, shops, {
        allowEmpty: false,
        emptyHint: "暂无店铺，请先在管理页添加",
        keepValue: true,
        valueKey: "id",
      });
    }
    lockShopPickers();

    if (isAdmin()) {
      renderSupplierManageList();
      await Promise.all([loadManagers(), loadDeletions()]);
    }
  }

  async function renameShop(item) {
    const name = await promptRename("店铺", item.name);
    if (!name) return;
    if (name === item.name) {
      showMsg(shopMsg, "名称未变化", true);
      return;
    }
    if (nameExists(shops, name)) {
      showMsg(shopMsg, "店铺名不可以重复", false);
      return;
    }
    const res = await api(`/api/shops/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      showMsg(shopMsg, await parseError(res), false);
      return;
    }
    showMsg(shopMsg, "店铺名称已更新", true);
    await loadCatalog();
  }

  async function renameSupplier(item) {
    const name = await promptRename("供应商", item.name);
    if (!name) return;
    if (name === item.name) {
      showMsg(supplierMsg, "名称未变化", true);
      return;
    }
    if (nameExists(suppliers, name)) {
      showMsg(supplierMsg, "供应商名不可以重复", false);
      return;
    }
    const res = await api(`/api/suppliers/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      showMsg(supplierMsg, await parseError(res), false);
      return;
    }
    showMsg(supplierMsg, "供应商名称已更新", true);
    await loadCatalog();
  }

  async function deleteShop(item) {
    const password = await confirmDelete(`确认删除店铺「${item.name}」？`);
    if (!password) return;
    const res = await api(`/api/shops/${item.id}`, {
      method: "DELETE",
      headers: adminConfirmHeaders(password),
    });
    if (!res.ok && res.status !== 204) {
      showMsg(shopMsg, await parseError(res), false);
      return;
    }
    showMsg(shopMsg, "店铺已删除", true);
    await loadCatalog();
  }

  async function deleteSupplier(item) {
    const password = await confirmDelete(`确认删除供应商「${item.name}」？`);
    if (!password) return;
    const res = await api(`/api/suppliers/${item.id}`, {
      method: "DELETE",
      headers: adminConfirmHeaders(password),
    });
    if (!res.ok && res.status !== 204) {
      showMsg(supplierMsg, await parseError(res), false);
      return;
    }
    showMsg(supplierMsg, "供应商已删除", true);
    await loadCatalog();
  }

  function switchTab(name) {
    if (name === "manage" && !isAdmin()) {
      name = "create";
    }
    if (name === "users" && !isAdmin()) {
      name = "create";
    }
    if (name === "create" && isAdmin()) {
      name = "manage";
    }
    tabs.forEach((tab) => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    panelCreate.hidden = name !== "create";
    panelQuery.hidden = name !== "query";
    panelManage.hidden = name !== "manage";
    if (panelUsers) panelUsers.hidden = name !== "users";
    if (name === "create") loadRecentOrders();
    if (name === "query") queryOrders();
    if (name === "manage") {
      loadCatalog().catch((err) => showMsg(shopMsg, err.message, false));
    }
    if (name === "users") {
      loadCatalog().catch((err) => showMsg(managerMsg, err.message, false));
    }
  }

  function canEditOrders() {
    return isAdmin() || isManager();
  }

  function canDeleteOrders() {
    return isAdmin() || isManager();
  }

  const editOrderModal = document.getElementById("editOrderModal");
  const editOrderBackdrop = document.getElementById("editOrderBackdrop");
  const editOrderForm = document.getElementById("editOrderForm");
  const editOrderTitle = document.getElementById("editOrderTitle");
  const editOrderMeta = document.getElementById("editOrderMeta");
  const editOrderDate = document.getElementById("editOrderDate");
  const editShopId = document.getElementById("editShopId");
  const editShopPicker = document.getElementById("editShopPicker");
  const editSupplierId = document.getElementById("editSupplierId");
  const editSupplierPicker = document.getElementById("editSupplierPicker");
  const editDailyTotal = document.getElementById("editDailyTotal");
  const editOrderMsg = document.getElementById("editOrderMsg");
  const editOrderSave = document.getElementById("editOrderSave");
  const editOrderCancel = document.getElementById("editOrderCancel");
  let editingOrderId = null;

  function closeEditOrderModal() {
    if (!editOrderModal) return;
    editOrderModal.hidden = true;
    editingOrderId = null;
    hideMsg(editOrderMsg);
    if (editOrderSave) editOrderSave.disabled = false;
  }

  function openEditOrderModal(order) {
    if (!editOrderModal || !canEditOrders()) return;
    editingOrderId = order.id;
    hideMsg(editOrderMsg);
    editOrderTitle.textContent = "修改订单";
    editOrderMeta.textContent = `编号：${order.order_no || order.id}`;
    editOrderDate.value = order.order_date || "";
    editShopId.value = order.shop_id ? String(order.shop_id) : "";
    editSupplierId.value = order.supplier_id ? String(order.supplier_id) : "";
    editDailyTotal.value = order.daily_total != null ? String(order.daily_total) : "";

    if (isManager() && managerShopId()) {
      editShopId.value = managerShopId();
    }

    renderChipPicker(editShopPicker, editShopId, shops, {
      allowEmpty: false,
      emptyHint: "暂无店铺",
      keepValue: true,
      valueKey: "id",
    });
    renderChipPicker(editSupplierPicker, editSupplierId, suppliers, {
      allowEmpty: false,
      emptyHint: "暂无供应商",
      keepValue: true,
      valueKey: "id",
    });

    const shopField = editShopPicker?.closest(".choice-field");
    if (shopField) {
      shopField.classList.toggle("is-locked", isManager());
    }

    editOrderModal.hidden = false;
    setTimeout(() => editDailyTotal?.focus(), 30);
  }

  async function saveEditOrder(e) {
    e.preventDefault();
    if (!editingOrderId) return;
    hideMsg(editOrderMsg);

    if (isManager() && managerShopId()) {
      editShopId.value = managerShopId();
    }

    const payload = {
      order_date: editOrderDate.value,
      shop_id: Number(editShopId.value),
      supplier_id: Number(editSupplierId.value),
      daily_total: Number(editDailyTotal.value),
    };

    if (!payload.order_date) {
      showMsg(editOrderMsg, "请选择日期", false);
      return;
    }
    if (!payload.shop_id || !payload.supplier_id) {
      showMsg(editOrderMsg, "请选择店铺和供应商", false);
      return;
    }
    if (!(payload.daily_total > 0)) {
      showMsg(editOrderMsg, "单日总金额必须大于 0", false);
      return;
    }

    editOrderSave.disabled = true;
    try {
      const res = await api(`/api/orders/${editingOrderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await parseError(res));
      closeEditOrderModal();
      const msgEl = panelCreate.hidden ? queryMsg : formMsg;
      showMsg(msgEl, "订单已更新", true);
      await loadRecentOrders();
      if (!panelQuery.hidden) await queryOrders();
    } catch (err) {
      showMsg(editOrderMsg, err.message || "保存失败", false);
    } finally {
      editOrderSave.disabled = false;
    }
  }

  if (editOrderForm) {
    editOrderForm.addEventListener("submit", saveEditOrder);
  }
  if (editOrderCancel) {
    editOrderCancel.addEventListener("click", closeEditOrderModal);
  }
  if (editOrderBackdrop) {
    editOrderBackdrop.addEventListener("click", closeEditOrderModal);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (editOrderModal && !editOrderModal.hidden) {
      closeEditOrderModal();
    }
    if (editManagerModal && !editManagerModal.hidden) {
      closeEditManagerModal();
    }
  });

  const editManagerModal = document.getElementById("editManagerModal");
  const editManagerBackdrop = document.getElementById("editManagerBackdrop");
  const editManagerForm = document.getElementById("editManagerForm");
  const editManagerUsername = document.getElementById("editManagerUsername");
  const editManagerPassword = document.getElementById("editManagerPassword");
  const editManagerShopId = document.getElementById("editManagerShopId");
  const editManagerShopPicker = document.getElementById("editManagerShopPicker");
  const editManagerMsg = document.getElementById("editManagerMsg");
  const editManagerSave = document.getElementById("editManagerSave");
  const editManagerCancel = document.getElementById("editManagerCancel");
  let editingManagerId = null;

  function closeEditManagerModal() {
    if (!editManagerModal) return;
    editManagerModal.hidden = true;
    editingManagerId = null;
    hideMsg(editManagerMsg);
    if (editManagerSave) editManagerSave.disabled = false;
    if (editManagerPassword) editManagerPassword.value = "";
  }

  function openEditManagerModal(item) {
    if (!editManagerModal || !isAdmin()) return;
    editingManagerId = item.id;
    hideMsg(editManagerMsg);
    if (editManagerUsername) editManagerUsername.value = item.username || "";
    if (editManagerPassword) editManagerPassword.value = "";
    if (editManagerShopId) editManagerShopId.value = item.shop_id ? String(item.shop_id) : "";
    renderChipPicker(editManagerShopPicker, editManagerShopId, shops, {
      allowEmpty: false,
      emptyHint: "暂无店铺，请先在管理页添加",
      keepValue: true,
      valueKey: "id",
    });
    editManagerModal.hidden = false;
    if (editManagerUsername) editManagerUsername.focus();
  }

  async function saveEditManager(e) {
    e.preventDefault();
    if (!editingManagerId) return;
    hideMsg(editManagerMsg);
    const username = (editManagerUsername?.value || "").trim();
    const password = editManagerPassword?.value || "";
    const shopId = Number(editManagerShopId?.value || 0);
    if (!username) {
      showMsg(editManagerMsg, "请输入用户名", false);
      return;
    }
    if (password && password.length < 4) {
      showMsg(editManagerMsg, "密码至少 4 位", false);
      return;
    }
    if (!shopId) {
      showMsg(editManagerMsg, "请选择绑定店铺", false);
      return;
    }
    const payload = { username, shop_id: shopId };
    if (password) payload.password = password;
    if (editManagerSave) editManagerSave.disabled = true;
    try {
      const res = await api(`/api/users/${editingManagerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await parseError(res));
      closeEditManagerModal();
      showMsg(managerFeedbackEl(), "店长已更新", true);
      await loadManagers();
    } catch (err) {
      showMsg(editManagerMsg, err.message || "保存失败", false);
    } finally {
      if (editManagerSave) editManagerSave.disabled = false;
    }
  }

  if (editManagerForm) {
    editManagerForm.addEventListener("submit", saveEditManager);
  }
  if (editManagerCancel) {
    editManagerCancel.addEventListener("click", closeEditManagerModal);
  }
  if (editManagerBackdrop) {
    editManagerBackdrop.addEventListener("click", closeEditManagerModal);
  }

  function appendOrderRow(tbody, order) {
    const tr = document.createElement("tr");
    const canEdit = canEditOrders();
    const canDelete = canDeleteOrders();
    let opsHtml = `<td class="ops ops-empty">—</td>`;
    if (canEdit || canDelete) {
      opsHtml = `<td class="ops">`;
      if (canEdit) opsHtml += `<button type="button" class="edit-btn">修改</button>`;
      if (canDelete) opsHtml += `<button type="button" class="delete-btn">删除</button>`;
      opsHtml += `</td>`;
    }
    tr.innerHTML = `
      <td class="col-no"></td>
      <td class="col-shop"></td>
      <td class="col-date"></td>
      <td class="col-supplier"></td>
      <td class="num col-amount"></td>
      ${opsHtml}
    `;
    tr.querySelector(".col-no").textContent = order.order_no || order.id;
    tr.querySelector(".col-shop").textContent = order.shop_name;
    tr.querySelector(".col-date").textContent = order.order_date;
    tr.querySelector(".col-supplier").textContent = order.supplier_name;
    tr.querySelector(".col-amount").textContent = `¥${formatMoney(order.daily_total)}`;
    const editBtn = tr.querySelector(".edit-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => openEditOrderModal(order));
    }
    const deleteBtn = tr.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => deleteOrder(order.id));
    }
    tbody.appendChild(tr);
  }

  function renderRecentOrders(orders) {
    recentList.innerHTML = "";
    const hasItems = orders.length > 0;
    recentEmpty.hidden = hasItems;
    recentEmpty.textContent = "暂无提交记录";
    recentTableWrap.hidden = !hasItems;
    recentMeta.textContent = hasItems ? `最近 ${orders.length} 条` : "";

    for (const order of orders) {
      appendOrderRow(recentList, order);
    }
  }

  function recentLimit() {
    // PC 展示更多，手机保持精简
    return document.documentElement.classList.contains("is-pc") ? 50 : 10;
  }

  async function loadRecentOrders() {
    try {
      const res = await api(`/api/orders?limit=${recentLimit()}`);
      if (!res.ok) throw new Error(await parseError(res));
      renderRecentOrders(await res.json());
    } catch (err) {
      renderRecentOrders([]);
      recentMeta.textContent = "";
      recentEmpty.hidden = false;
      recentEmpty.textContent = err.message || "加载最近提交失败";
    }
  }

  window.addEventListener("devicechange", () => {
    if (!panelCreate.hidden) loadRecentOrders();
    if (!panelManage.hidden) loadDeletions();
  });

  function renderOrders(orders) {
    orderList.innerHTML = "";
    const hasItems = orders.length > 0;
    emptyHint.hidden = hasItems;
    resultTableWrap.hidden = !hasItems;
    listMeta.textContent = hasItems ? `共 ${orders.length} 条` : "";

    if (hasItems) {
      const total = orders.reduce((sum, o) => sum + Number(o.daily_total), 0);
      sumMeta.hidden = false;
      sumMeta.textContent = `合计金额：¥${formatMoney(total)}`;
    } else {
      sumMeta.hidden = true;
      sumMeta.textContent = "";
    }

    for (const order of orders) {
      appendOrderRow(orderList, order);
    }
  }

  async function queryOrders() {
    hideMsg(queryMsg);
    const parsed = parseQueryDateInput(queryDate.value);
    if (!parsed.ok) {
      showMsg(queryMsg, parsed.error, false);
      return;
    }

    const params = new URLSearchParams();
    Object.entries(parsed.params).forEach(([key, value]) => {
      params.set(key, value);
    });
    if (queryShopId.value) params.set("shop_id", queryShopId.value);
    if (querySupplierId.value) params.set("supplier_id", querySupplierId.value);

    listMeta.textContent = "加载中…";
    queryBtn.disabled = true;
    try {
      const qs = params.toString();
      const res = await api(`/api/orders${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error(await parseError(res));
      renderOrders(await res.json());
    } catch (err) {
      listMeta.textContent = "";
      renderOrders([]);
      showMsg(queryMsg, err.message || "查询失败", false);
    } finally {
      queryBtn.disabled = false;
    }
  }

  async function deleteOrder(id) {
    if (!canDeleteOrders()) {
      showMsg(formMsg, "无权删除订单", false);
      return;
    }
    const password = await confirmDelete("确认删除这条订单？");
    if (!password) return;
    const msgEl = panelCreate.hidden ? queryMsg : formMsg;
    try {
      const res = await api(`/api/orders/${id}`, {
        method: "DELETE",
        headers: adminConfirmHeaders(password),
      });
      if (!res.ok && res.status !== 204) throw new Error(await parseError(res));
      showMsg(msgEl, "已删除", true);
      await loadRecentOrders();
      if (!panelQuery.hidden) await queryOrders();
    } catch (err) {
      showMsg(msgEl, err.message || "删除失败", false);
    }
  }

  async function findExistingOrder(payload) {
    const res = await api(
      `/api/orders?order_date=${encodeURIComponent(payload.order_date)}&shop_id=${encodeURIComponent(payload.shop_id)}&supplier_id=${encodeURIComponent(payload.supplier_id)}`
    );
    if (!res.ok) return null;
    const orders = await res.json();
    // 仅日期+店铺+供应商+金额完全一致才算重复
    return (
      orders.find(
        (o) =>
          o.order_date === payload.order_date &&
          Number(o.shop_id) === Number(payload.shop_id) &&
          Number(o.supplier_id) === Number(payload.supplier_id) &&
          almostEqual(o.daily_total, payload.daily_total)
      ) || null
    );
  }

  async function createOrder(payload) {
    const res = await api("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await parseError(res));
    return true;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg(formMsg);

    if (isManager() && managerShopId()) {
      shopId.value = managerShopId();
    }

    const payload = {
      order_date: orderDate.value,
      shop_id: Number(shopId.value),
      supplier_id: Number(supplierId.value),
      daily_total: Number(dailyTotal.value),
    };

    if (!payload.shop_id || !payload.supplier_id) {
      showMsg(formMsg, "请选择店铺和供应商", false);
      return;
    }
    if (!(payload.daily_total > 0)) {
      showMsg(formMsg, "单日总金额必须大于 0", false);
      return;
    }

    submitBtn.disabled = true;
    try {
      const existing = await findExistingOrder(payload);
      if (existing) {
        const shouldSubmit = await openModal({
          title: "是否提交",
          text: "订单信息可能重复，是否继续提交",
          yesText: "是",
          noText: "否",
        });
        if (!shouldSubmit) {
          showMsg(formMsg, "已取消提交（判定为重复）", false);
          return;
        }
      }

      const ok = await createOrder(payload);
      if (!ok) return;
      dailyTotal.value = "";
      queryDate.value = payload.order_date;
      showMsg(formMsg, "提交成功", true);
      await loadRecentOrders();
    } catch (err) {
      showMsg(formMsg, err.message || "提交失败", false);
    } finally {
      submitBtn.disabled = false;
    }
  });

  function normalizeName(name) {
    return String(name || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase();
  }

  function nameExists(list, name) {
    const key = normalizeName(name);
    return list.some((item) => normalizeName(item.name) === key);
  }

  shopForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg(shopMsg);
    const name = newShopName.value.trim().replace(/\s+/g, " ");
    if (!name) {
      showMsg(shopMsg, "请输入店铺名", false);
      return;
    }
    if (nameExists(shops, name)) {
      showMsg(shopMsg, "店铺名不可以重复", false);
      return;
    }
    const res = await api("/api/shops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      showMsg(shopMsg, await parseError(res), false);
      return;
    }
    newShopName.value = "";
    showMsg(shopMsg, "店铺已添加，店长账号已自动创建（用户名=店名，密码 12345）", true);
    await loadCatalog();
  });

  if (managerForm) {
    managerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await createManager();
    });
  }

  supplierForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg(supplierMsg);
    const name = newSupplierName.value.trim().replace(/\s+/g, " ");
    if (!name) {
      showMsg(supplierMsg, "请输入供应商名", false);
      return;
    }
    if (nameExists(suppliers, name)) {
      showMsg(supplierMsg, "供应商名不可以重复", false);
      return;
    }
    const res = await api("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      showMsg(supplierMsg, await parseError(res), false);
      return;
    }
    newSupplierName.value = "";
    showMsg(supplierMsg, "供应商已添加", true);
    await loadCatalog();
  });

  queryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    queryOrders();
  });

  queryDateCalBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = queryCal.hidden;
    if (willOpen) {
      const selected = getSelectedRange();
      if (selected.mode) calMode = selected.mode;
      if (selected.month) {
        const [yy, mm] = selected.month.split("-").map(Number);
        calCursor = new Date(yy, mm - 1, 1);
      } else if (selected.from) {
        const [yy, mm] = selected.from.split("-").map(Number);
        calCursor = new Date(yy, mm - 1, 1);
      } else {
        calCursor = new Date();
      }
      rangeAnchor = null;
    }
    setCalOpen(willOpen);
  });

  queryCal.addEventListener("click", (e) => e.stopPropagation());

  queryCal.querySelectorAll(".cal-mode").forEach((btn) => {
    btn.addEventListener("click", () => {
      calMode = btn.dataset.mode;
      rangeAnchor = null;
      renderCalendar();
    });
  });

  calPrev.addEventListener("click", () => {
    if (calMode === "month") {
      calCursor = new Date(calCursor.getFullYear() - 1, 0, 1);
    } else {
      calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1);
    }
    renderCalendar();
  });

  calNext.addEventListener("click", () => {
    if (calMode === "month") {
      calCursor = new Date(calCursor.getFullYear() + 1, 0, 1);
    } else {
      calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1);
    }
    renderCalendar();
  });

  calToday.addEventListener("click", () => {
    const today = todayISO();
    calCursor = new Date();
    rangeAnchor = null;
    if (calMode === "month") {
      queryDate.value = today.slice(0, 7);
    } else {
      calMode = "day";
      queryDate.value = today;
    }
    setCalOpen(false);
    queryOrders();
  });

  calClear.addEventListener("click", () => {
    queryDate.value = "";
    rangeAnchor = null;
    setCalOpen(false);
    queryOrders();
  });

  document.addEventListener("click", () => {
    if (!queryCal.hidden) setCalOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !queryCal.hidden) setCalOpen(false);
  });

  resetQueryBtn.addEventListener("click", () => {
    queryDate.value = todayISO();
    queryShopId.value = isManager() ? managerShopId() : "";
    querySupplierId.value = "";
    renderChipPicker(queryShopPicker, queryShopId, shops, {
      allowEmpty: !isManager(),
      emptyLabel: "全部店铺",
      keepValue: false,
      valueKey: "id",
    });
    renderChipPicker(querySupplierPicker, querySupplierId, suppliers, {
      allowEmpty: true,
      emptyLabel: "全部供应商",
      keepValue: false,
      valueKey: "id",
    });
    lockShopPickers();
    rangeAnchor = null;
    setCalOpen(false);
    queryOrders();
  });

  function openPasswordModal() {
    if (!passwordModal) return;
    hideMsg(passwordMsg);
    oldPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    passwordModal.hidden = false;
    setTimeout(() => oldPassword.focus(), 30);
  }

  function closePasswordModal() {
    if (!passwordModal) return;
    passwordModal.hidden = true;
    hideMsg(passwordMsg);
    oldPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    if (passwordSave) passwordSave.disabled = false;
  }

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", openPasswordModal);
  }
  if (passwordCancel) {
    passwordCancel.addEventListener("click", closePasswordModal);
  }
  if (passwordBackdrop) {
    passwordBackdrop.addEventListener("click", closePasswordModal);
  }
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg(passwordMsg);
      const oldPwd = oldPassword.value;
      const newPwd = newPassword.value;
      const confirmPwd = confirmPassword.value;
      if (!oldPwd) {
        showMsg(passwordMsg, "请输入当前密码", false);
        return;
      }
      if (!newPwd || newPwd.length < 4) {
        showMsg(passwordMsg, "新密码至少 4 位", false);
        return;
      }
      if (newPwd !== confirmPwd) {
        showMsg(passwordMsg, "两次输入的新密码不一致", false);
        return;
      }
      if (newPwd === oldPwd) {
        showMsg(passwordMsg, "新密码不能与当前密码相同", false);
        return;
      }
      passwordSave.disabled = true;
      try {
        const res = await api("/api/auth/password", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            old_password: oldPwd,
            new_password: newPwd,
          }),
        });
        if (!res.ok && res.status !== 204) {
          throw new Error(await parseError(res));
        }
        closePasswordModal();
        showMsg(formMsg, "密码已修改，下次请用新密码登录", true);
      } catch (err) {
        showMsg(passwordMsg, err.message || "修改失败", false);
      } finally {
        passwordSave.disabled = false;
      }
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && passwordModal && !passwordModal.hidden) {
      closePasswordModal();
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await api("/api/auth/logout", { method: "POST" });
    location.href = "/login";
  });

  orderDate.value = todayISO();
  queryDate.value = todayISO();

  (async () => {
    const meRes = await api("/api/auth/me");
    if (!meRes.ok) return;
    currentUserInfo = await meRes.json();
    currentUser.textContent = currentUserInfo.username;
    applyRoleUi();
    // 管理员默认进管理页，店长默认进录入页
    switchTab(isAdmin() ? "manage" : "create");
    await loadCatalog();
  })().catch((err) => {
    if (err.message !== "未登录") {
      showMsg(formMsg, err.message || "加载失败", false);
    }
  });
})();
