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
  const resetQueryBtn = document.getElementById("resetQueryBtn");
  const queryMsg = document.getElementById("queryMsg");

  const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
  let calMode = "day";
  let calCursor = new Date();
  let rangeAnchor = null;
  let querySeq = 0;
  let queryDateTimer = null;

  const orderList = document.getElementById("orderList");
  const resultTableWrap = document.getElementById("resultTableWrap");
  const emptyHint = document.getElementById("emptyHint");
  const listMeta = document.getElementById("listMeta");
  const sumMeta = document.getElementById("sumMeta");

  const panelCreate = document.getElementById("panelCreate");
  const panelQuery = document.getElementById("panelQuery");
  const panelManage = document.getElementById("panelManage");
  const panelCost = document.getElementById("panelCost");
  const panelUsers = document.getElementById("panelUsers");
  const mainTabs = document.getElementById("mainTabs");
  const tabs = document.querySelectorAll(".tab");
  const manageTab = document.querySelector('.tab[data-tab="manage"]');
  const costTab = document.querySelector('.tab[data-tab="cost"]');
  const usersTab = document.querySelector('.tab[data-tab="users"]');
  const createTab = document.querySelector('.tab[data-tab="create"]');

  const shopForm = document.getElementById("shopForm");
  const newShopName = document.getElementById("newShopName");
  const shopMsg = document.getElementById("shopMsg");
  const shopManageList = document.getElementById("shopManageList");
  const shopTableWrap = document.getElementById("shopTableWrap");
  const shopEmpty = document.getElementById("shopEmpty");

  const supplierForm = document.getElementById("supplierForm");
  const newSupplierName = document.getElementById("newSupplierName");
  const supplierMsg = document.getElementById("supplierMsg");
  const supplierManageList = document.getElementById("supplierManageList");
  const supplierTableWrap = document.getElementById("supplierTableWrap");
  const supplierEmpty = document.getElementById("supplierEmpty");

  const managerForm = document.getElementById("managerForm");
  const newManagerUsername = document.getElementById("newManagerUsername");
  const newManagerPassword = document.getElementById("newManagerPassword");
  const newManagerShopId = document.getElementById("newManagerShopId");
  const newManagerShopPicker = document.getElementById("newManagerShopPicker");
  const managerMsg = document.getElementById("managerMsg");
  const managerList = document.getElementById("managerList");
  const managerEmpty = document.getElementById("managerEmpty");

  const costForm = document.getElementById("costForm");
  const costShopId = document.getElementById("costShopId");
  const costShopPicker = document.getElementById("costShopPicker");
  const costMsg = document.getElementById("costMsg");
  const costListMeta = document.getElementById("costListMeta");
  const costSumMeta = document.getElementById("costSumMeta");
  const costTableWrap = document.getElementById("costTableWrap");
  const costNameHead = document.getElementById("costNameHead");
  const costList = document.getElementById("costList");
  const costEmpty = document.getElementById("costEmpty");
  const costChartTitle = document.getElementById("costChartTitle");
  const costChartMeta = document.getElementById("costChartMeta");
  const costChartCard = document.getElementById("costChartCard");
  const costChart = document.getElementById("costChart");
  const costChartPrev = document.getElementById("costChartPrev");
  const costChartNext = document.getElementById("costChartNext");
  const costTimeModal = document.getElementById("costTimeModal");
  const costTimeBackdrop = document.getElementById("costTimeBackdrop");
  const costTimeYearInput = document.getElementById("costTimeYearInput");
  const costTimeMonthInput = document.getElementById("costTimeMonthInput");
  const costTimeUseYear = document.getElementById("costTimeUseYear");
  const costTimeUseMonth = document.getElementById("costTimeUseMonth");
  const costChartTypeRow = document.getElementById("costChartTypeRow");
  let costPeriod = "day";
  let costChartKind = "bar";
  let costSelectedYear = new Date().getFullYear();
  let costSelectedDay = "";
  let costSelectedMonth = "";
  let lastCostReport = null;

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
  const returnAdminBtn = document.getElementById("returnAdminBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const androidAppBtn = document.getElementById("androidAppBtn");
  const appMain = document.querySelector("main.wrap");
  const webPauseGate = document.getElementById("webPauseGate");
  const webPauseDownload = document.getElementById("webPauseDownload");
  const webPauseMeta = document.getElementById("webPauseMeta");
  const webPauseAdmin = document.getElementById("webPauseAdmin");
  const pauseWebSwitch = document.getElementById("pauseWebSwitch");
  const pauseWebSwitchGate = document.getElementById("pauseWebSwitchGate");
  const pauseWebMsg = document.getElementById("pauseWebMsg");

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
  let pauseWeb = false;

  function isAdmin() {
    return !currentUserInfo || currentUserInfo.role !== "manager";
  }

  function isManager() {
    return Boolean(currentUserInfo && currentUserInfo.role === "manager");
  }

  function isImpersonating() {
    return Boolean(currentUserInfo && currentUserInfo.impersonating);
  }

  function managerShopName() {
    return (currentUserInfo && currentUserInfo.shop_name) || "";
  }

  function managerShopId() {
    return currentUserInfo && currentUserInfo.shop_id
      ? String(currentUserInfo.shop_id)
      : "";
  }

  function syncPauseSwitches() {
    if (pauseWebSwitch) pauseWebSwitch.checked = pauseWeb;
    if (pauseWebSwitchGate) pauseWebSwitchGate.checked = pauseWeb;
  }

  function applyWebPause(paused) {
    pauseWeb = Boolean(paused);
    document.body.classList.toggle("web-paused", pauseWeb);
    if (appMain) appMain.hidden = pauseWeb;
    if (webPauseGate) webPauseGate.hidden = !pauseWeb;
    if (webPauseAdmin) webPauseAdmin.hidden = !(pauseWeb && isAdmin());
    syncPauseSwitches();
  }

  async function loadSettings() {
    const res = await api("/api/settings");
    if (!res.ok) return;
    const data = await res.json();
    applyWebPause(Boolean(data.pause_web));
  }

  async function setPauseWeb(next) {
    const res = await api("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pause_web: Boolean(next) }),
    });
    if (!res.ok) throw new Error(await parseError(res));
    const data = await res.json();
    applyWebPause(Boolean(data.pause_web));
    if (!pauseWeb) {
      switchTab(isAdmin() ? "cost" : "create");
      await loadCatalog();
    }
  }

  function bindPauseSwitch(el, msgEl) {
    if (!el) return;
    el.addEventListener("change", async () => {
      const next = el.checked;
      el.disabled = true;
      if (pauseWebSwitch) pauseWebSwitch.disabled = true;
      if (pauseWebSwitchGate) pauseWebSwitchGate.disabled = true;
      try {
        await setPauseWeb(next);
        if (msgEl) showMsg(msgEl, next ? "网页功能已暂停" : "网页功能已恢复", true);
      } catch (err) {
        syncPauseSwitches();
        if (msgEl) showMsg(msgEl, err.message || "保存失败", false);
        else showMsg(formMsg, err.message || "保存失败", false);
      } finally {
        if (pauseWebSwitch) pauseWebSwitch.disabled = false;
        if (pauseWebSwitchGate) pauseWebSwitchGate.disabled = false;
      }
    });
  }

  function applyRoleUi() {
    const admin = isAdmin();
    if (manageTab) manageTab.hidden = !admin;
    if (costTab) costTab.hidden = !admin;
    if (usersTab) usersTab.hidden = !admin;
    if (createTab) createTab.hidden = admin;
    if (mainTabs) {
      mainTabs.classList.toggle("tabs-4", admin);
      mainTabs.classList.toggle("tabs-3", false);
      mainTabs.classList.toggle("tabs-2", !admin);
    }
    if (currentRole) {
      if (isImpersonating()) {
        currentRole.hidden = false;
        currentRole.textContent = isManager()
          ? `以店长登录 · ${managerShopName()}`
          : "以管理员登录";
      } else if (isManager()) {
        currentRole.hidden = false;
        currentRole.textContent = `店长 · ${managerShopName()}`;
      } else {
        currentRole.hidden = false;
        currentRole.textContent = "管理员";
      }
    }
    if (returnAdminBtn) returnAdminBtn.hidden = !isImpersonating();
    document.body.classList.toggle("role-manager", isManager());
    document.body.classList.toggle("role-admin", isAdmin());
    if (admin && panelCreate && !panelCreate.hidden) {
      switchTab("cost");
    }
    if (!admin && panelManage && !panelManage.hidden) {
      switchTab("create");
    }
    if (!admin && panelUsers && !panelUsers.hidden) {
      switchTab("create");
    }
    if (!admin && panelCost && !panelCost.hidden) {
      switchTab("create");
    }
    applyWebPause(pauseWeb);
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

  function renderShopManageList() {
    if (!shopManageList) return;
    shopManageList.innerHTML = "";
    const empty = !shops.length;
    if (shopTableWrap) shopTableWrap.hidden = empty;
    if (shopEmpty) shopEmpty.hidden = !empty;
    for (const shop of shops) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-name"></td>
        <td class="ops">
          <button type="button" class="edit-btn">改名</button>
          <button type="button" class="delete-btn">删除</button>
        </td>
      `;
      tr.querySelector(".col-name").textContent = shop.name;
      tr.querySelector(".edit-btn").addEventListener("click", () => renameShop(shop));
      tr.querySelector(".delete-btn").addEventListener("click", () => deleteShop(shop));
      shopManageList.appendChild(tr);
    }
  }

  function renderSupplierManageList() {
    if (!supplierManageList) return;
    supplierManageList.innerHTML = "";
    const empty = !suppliers.length;
    if (supplierTableWrap) supplierTableWrap.hidden = empty;
    if (supplierEmpty) supplierEmpty.hidden = !empty;
    for (const item of suppliers) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-name"></td>
        <td class="ops">
          <button type="button" class="edit-btn">改名</button>
          <button type="button" class="delete-btn">删除</button>
        </td>
      `;
      tr.querySelector(".col-name").textContent = item.name;
      tr.querySelector(".edit-btn").addEventListener("click", () => renameSupplier(item));
      tr.querySelector(".delete-btn").addEventListener("click", () => deleteSupplier(item));
      supplierManageList.appendChild(tr);
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
          ${item.disabled ? "" : '<button type="button" class="login-btn">登录</button>'}
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
      const loginBtn = row.querySelector(".login-btn");
      if (loginBtn) loginBtn.addEventListener("click", () => loginAsManager(item));
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

  async function loginAsManager(item) {
    const ok = await openModal({
      title: "切换登录",
      text: `以「${item.username}」（店长）登录？之后可在顶部「返回管理员」。`,
      yesText: "切换",
      noText: "取消",
    });
    if (!ok) return;
    const msgEl = managerFeedbackEl();
    const res = await api(`/api/users/${item.id}/login`, { method: "POST" });
    if (!res.ok) {
      showMsg(msgEl, await parseError(res), false);
      return;
    }
    location.replace("/");
  }

  async function returnToAdmin() {
    const origin = (currentUserInfo && currentUserInfo.origin_username) || "管理员";
    const ok = await openModal({
      title: "返回管理员",
      text: `返回账号 ${origin} ？`,
      yesText: "返回",
      noText: "取消",
    });
    if (!ok) return;
    const res = await api("/api/auth/return-admin", { method: "POST" });
    if (!res.ok) {
      showMsg(formMsg, await parseError(res), false);
      return;
    }
    location.replace("/");
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
        if (typeof options.onChange === "function") options.onChange(value);
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

  function renderQueryPickers() {
    renderChipPicker(queryShopPicker, queryShopId, shops, {
      allowEmpty: !isManager(),
      emptyLabel: "全部店铺",
      keepValue: true,
      valueKey: "id",
      onChange: () => queryOrders(),
    });
    renderChipPicker(querySupplierPicker, querySupplierId, suppliers, {
      allowEmpty: true,
      emptyLabel: "全部供应商",
      keepValue: true,
      valueKey: "id",
      onChange: () => queryOrders(),
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
    renderQueryPickers();
    renderCostPickers();
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
      renderShopManageList();
      renderSupplierManageList();
      await loadManagers();
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
    if (name === "cost" && !isAdmin()) {
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
    if (panelCost) panelCost.hidden = name !== "cost";
    if (panelUsers) panelUsers.hidden = name !== "users";
    if (name === "create") loadRecentOrders();
    if (name === "query") queryOrders();
    if (name === "manage") {
      loadCatalog().catch((err) => showMsg(shopMsg, err.message, false));
    }
    if (name === "cost") {
      loadCosts().catch((err) => showMsg(costMsg, err.message, false));
    }
    if (name === "users") {
      loadCatalog().catch((err) => showMsg(managerMsg, err.message, false));
    }
  }

  function currentMonthISO() {
    return todayISO().slice(0, 7);
  }

  function currentYearValue() {
    return new Date().getFullYear();
  }

  function applyCostPeriodUi() {
    updateCostChartTitle();
  }

  function updateCostChartTitle() {
    if (!costChartTitle) return;
    if (costPeriod === "month") {
      const year = costSelectedYear || currentYearValue();
      costChartTitle.textContent = `${year}年 ▾`;
    } else {
      const parts = String(costSelectedMonth || costSelectedDay || currentMonthISO()).split("-");
      costChartTitle.textContent = parts.length >= 2
        ? `${parts[0]}年${Number(parts[1])}月 ▾`
        : "选择时间 ▾";
    }
  }

  function applyCostChartTypeUi() {
    if (!costChartTypeRow) return;
    costChartTypeRow.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.chart === costChartKind);
    });
  }

  function closeCostTimeModal() {
    if (costTimeModal) costTimeModal.hidden = true;
  }

  function openCostTimeModal() {
    if (!costTimeModal) return;
    if (costTimeYearInput) {
      costTimeYearInput.value = String(costSelectedYear || currentYearValue());
    }
    if (costTimeMonthInput) {
      costTimeMonthInput.value = costSelectedMonth || costSelectedDay.slice(0, 7) || currentMonthISO();
    }
    costTimeModal.hidden = false;
  }

  function applyCostYear(year) {
    const parsed = Number(year);
    if (!Number.isFinite(parsed) || parsed < 2000 || parsed > 2100) return;
    costPeriod = "month";
    costSelectedYear = parsed;
    costSelectedMonth = "";
    closeCostTimeModal();
    loadCosts();
  }

  function applyCostMonth(monthValue) {
    const month = String(monthValue || "").slice(0, 7);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return;
    costPeriod = "day";
    costSelectedMonth = month;
    costSelectedYear = Number(month.slice(0, 4));
    const today = todayISO();
    costSelectedDay = today.startsWith(month) ? today : `${month}-01`;
    closeCostTimeModal();
    loadCosts();
  }

  function renderCostPickers() {
    if (costShopPicker && costShopId) {
      renderChipPicker(costShopPicker, costShopId, shops, {
        allowEmpty: true,
        emptyLabel: "全部店铺",
        keepValue: true,
        valueKey: "id",
        onChange: () => loadCosts(),
      });
    }
  }

  function shiftCostPeriod(delta) {
    if (costPeriod === "month") {
      costSelectedYear = (costSelectedYear || currentYearValue()) + delta;
      costSelectedMonth = "";
    } else {
      const parts = (costSelectedDay || todayISO()).split("-").map(Number);
      const d = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
      d.setMonth(d.getMonth() + delta);
      costSelectedDay = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      costSelectedMonth = costSelectedDay.slice(0, 7);
      costSelectedYear = d.getFullYear();
    }
    loadCosts();
  }

  async function loadCosts() {
    if (!isAdmin() || !costList) return;
    hideMsg(costMsg);
    const params = new URLSearchParams();
    params.set("group_by", "shop");
    params.set("period", costPeriod);
    if (costPeriod === "month") {
      const year = costSelectedYear || currentYearValue();
      params.set("year", String(year));
      if (costSelectedMonth && costSelectedMonth.startsWith(String(year))) {
        params.set("month", costSelectedMonth);
      }
    } else {
      params.set("order_date", costSelectedDay || todayISO());
    }
    params.set("chart", costChartKind || "bar");
    if (costShopId?.value) params.set("shop_id", costShopId.value);
    if (costListMeta) costListMeta.textContent = "加载中…";
    try {
      const res = await api(`/api/costs?${params.toString()}`);
      if (!res.ok) throw new Error(await parseError(res));
      renderCostReport(await res.json());
    } catch (err) {
      renderCostReport({ items: [], total: 0, count: 0, group_by: "shop" });
      showMsg(costMsg, err.message || "查询失败", false);
    }
  }

  function renderCostReport(report) {
    lastCostReport = report;
    const items = report.items || [];
    const kind = "店铺";
    if (costNameHead) costNameHead.textContent = kind;
    if (costList) costList.innerHTML = "";
    if (costTableWrap) costTableWrap.hidden = items.length === 0;
    if (costEmpty) costEmpty.hidden = items.length > 0;
    if (costListMeta) {
      costListMeta.textContent = items.length ? `共 ${items.length} 个${kind}` : "";
    }
    if (costSumMeta) {
      if (!items.length) {
        costSumMeta.hidden = true;
        costSumMeta.textContent = "";
      } else {
        costSumMeta.hidden = false;
        costSumMeta.textContent = `合计 ${Number(report.count || 0)} 笔  ·  ¥${formatMoney(report.total || 0)}`;
      }
    }
    for (const item of items) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-name"></td>
        <td class="num col-count"></td>
        <td class="num col-amount"></td>
      `;
      tr.querySelector(".col-name").textContent = item.name || "";
      tr.querySelector(".col-count").textContent = String(item.count || 0);
      tr.querySelector(".col-amount").textContent = `¥${formatMoney(item.total || 0)}`;
      costList.appendChild(tr);
    }
    renderCostChart(report);
  }

  function selectCostBucket(bucket, selected) {
    if (!bucket?.key || bucket.key === selected) return;
    if (costChartKind === "calendar" && costPeriod === "month" && bucket.key.length >= 10) {
      costPeriod = "day";
      costSelectedDay = bucket.key.slice(0, 10);
      costSelectedMonth = bucket.key.slice(0, 7);
      costSelectedYear = Number(bucket.key.slice(0, 4)) || costSelectedYear;
      loadCosts();
      return;
    }
    if (costPeriod === "month") {
      costSelectedMonth = bucket.key;
    } else {
      costSelectedDay = bucket.key;
      costSelectedMonth = bucket.key.slice(0, 7);
    }
    loadCosts();
  }

  function svgEl(name, attrs) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function bindCostMark(node, bucket, selected) {
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "button");
    const total = Number(bucket.total) || 0;
    node.setAttribute("aria-label", `${bucket.label} ¥${formatMoney(total)}`);
    const title = svgEl("title");
    title.textContent = `${bucket.label}  ¥${formatMoney(total)}  ·  ${bucket.count || 0} 笔`;
    node.appendChild(title);
    const run = () => selectCostBucket(bucket, selected);
    node.addEventListener("click", run);
    node.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        run();
      }
    });
  }

  function renderCostBars(buckets, selected, width) {
    const height = 200;
    const padT = 22;
    const padB = 28;
    const padL = 6;
    const padR = 6;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;
    const n = buckets.length;
    const gap = Math.min(6, innerW / n * 0.22);
    const barW = Math.max(2, (innerW - gap * (n + 1)) / n);
    const maxVal = Math.max(0.01, ...buckets.map((b) => Number(b.total) || 0));
    const dense = n > 16;
    const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height: String(height) });
    svg.appendChild(svgEl("line", {
      x1: padL, x2: width - padR, y1: height - padB, y2: height - padB, class: "cost-chart-axis",
    }));
    buckets.forEach((bucket, i) => {
      const total = Number(bucket.total) || 0;
      const left = padL + gap + i * (barW + gap);
      const h = (total / maxVal) * innerH;
      const top = height - padB - (total > 0 ? Math.max(2, h) : 0);
      const isSel = bucket.key === selected;
      const rect = svgEl("rect", {
        x: left,
        y: top,
        width: barW,
        height: Math.max(0, height - padB - top),
        rx: 3,
        class: isSel ? "cost-bar is-selected" : (total > 0 ? "cost-bar" : "cost-bar is-empty"),
      });
      bindCostMark(rect, bucket, selected);
      svg.appendChild(rect);
      const showLabel = !dense || i === 0 || i === n - 1 || (i + 1) % 5 === 0 || isSel;
      if (showLabel) {
        const text = svgEl("text", { x: left + barW / 2, y: height - 10, class: "cost-chart-label" });
        text.textContent = String(bucket.label || "").replace(/日$|月$/, "");
        svg.appendChild(text);
      }
      if (isSel && total > 0) {
        const value = svgEl("text", { x: left + barW / 2, y: top - 6, class: "cost-chart-value" });
        value.textContent = String(Math.round(total));
        svg.appendChild(value);
      }
    });
    costChart.appendChild(svg);
  }

  function renderCostKline(buckets, selected, width) {
    const height = 200;
    const padT = 22;
    const padB = 28;
    const padL = 6;
    const padR = 6;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;
    const n = buckets.length;
    const gap = Math.min(6, innerW / n * 0.2);
    const slotW = Math.max(3, (innerW - gap * (n + 1)) / n);
    const maxVal = Math.max(0.01, ...buckets.map((b) => Math.max(
      Number(b.high) || 0,
      Number(b.total) || 0,
      Number(b.open) || 0,
      Number(b.close) || 0,
      Number(b.low) || 0,
    )));
    const dense = n > 16;
    const yOf = (value) => height - padB - (Number(value) / maxVal) * innerH;
    const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height: String(height) });
    svg.appendChild(svgEl("line", {
      x1: padL, x2: width - padR, y1: height - padB, y2: height - padB, class: "cost-chart-axis",
    }));
    buckets.forEach((bucket, i) => {
      const left = padL + gap + i * (slotW + gap);
      const cx = left + slotW / 2;
      const high = Math.max(Number(bucket.high) || 0, Number(bucket.total) || 0, Number(bucket.open) || 0, Number(bucket.close) || 0);
      const open = Number(bucket.open) || Number(bucket.total) || 0;
      const close = Number(bucket.close) || Number(bucket.total) || 0;
      const low = Number(bucket.low) > 0 ? Number(bucket.low) : Math.min(open, close, Number(bucket.total) || 0);
      const up = close >= open;
      const cls = high <= 0 ? "cost-kline-empty" : (up ? "cost-kline-up" : "cost-kline-down");
      const hit = svgEl("rect", {
        x: left, y: padT, width: slotW, height: innerH, fill: "transparent",
      });
      bindCostMark(hit, bucket, selected);
      svg.appendChild(hit);
      if (high <= 0) {
        svg.appendChild(svgEl("line", {
          x1: left + 2, x2: left + slotW - 2, y1: height - padB, y2: height - padB, class: "cost-chart-axis",
        }));
      } else {
        svg.appendChild(svgEl("line", {
          x1: cx, x2: cx, y1: yOf(high), y2: yOf(low), class: cls, "stroke-width": 1.5,
        }));
        const bodyW = Math.max(3, slotW * 0.55);
        const yOpen = yOf(open);
        const yClose = yOf(close);
        const top = Math.min(yOpen, yClose);
        const bodyH = Math.max(2, Math.abs(yClose - yOpen));
        const body = svgEl("rect", {
          x: cx - bodyW / 2, y: top, width: bodyW, height: bodyH, rx: 2, class: cls,
        });
        svg.appendChild(body);
      }
      const isSel = bucket.key === selected;
      const showLabel = !dense || i === 0 || i === n - 1 || (i + 1) % 5 === 0 || isSel;
      if (showLabel) {
        const text = svgEl("text", { x: cx, y: height - 10, class: "cost-chart-label" });
        text.textContent = String(bucket.label || "").replace(/日$|月$/, "");
        svg.appendChild(text);
      }
    });
    costChart.appendChild(svg);
  }

  function compactCost(total) {
    if (!(Number(total) > 0)) return "";
    if (total >= 10000) {
      const wan = total / 10000;
      return `${wan >= 10 ? Math.round(wan) : wan.toFixed(1).replace(/\.0$/, "")}万`;
    }
    return String(Math.round(total));
  }

  function paintCalCell(btn, bucket, selected) {
    const total = Number(bucket.total) || 0;
    btn.type = "button";
    btn.className = "cost-cal-cell";
    if (total <= 0) btn.classList.add("is-empty");
    if (bucket.key === selected || (selected.length === 7 && bucket.key.startsWith(selected))) {
      btn.classList.add("is-selected");
    }
    const amount = document.createElement("span");
    amount.className = "cost-cal-amount";
    amount.textContent = compactCost(total) || " ";
    const day = document.createElement("span");
    day.className = "cost-cal-day";
    day.textContent = String(Number(String(bucket.key).slice(-2)));
    btn.appendChild(amount);
    btn.appendChild(day);
    btn.title = `${bucket.label}  ¥${formatMoney(total)}`;
    btn.addEventListener("click", () => selectCostBucket(bucket, selected));
    return btn;
  }

  function weekdayOffset(isoDay) {
    const parts = String(isoDay).split("-").map(Number);
    const d = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
    return d.getDay();
  }

  function renderCostMonthCalendar(buckets, selected) {
    const wrap = document.createElement("div");
    wrap.className = "cost-cal";
    const head = document.createElement("div");
    head.className = "cost-cal-weekdays";
    ["日", "一", "二", "三", "四", "五", "六"].forEach((name) => {
      const span = document.createElement("span");
      span.textContent = name;
      head.appendChild(span);
    });
    wrap.appendChild(head);
    const grid = document.createElement("div");
    grid.className = "cost-cal-grid";
    const offset = weekdayOffset(buckets[0]?.key);
    for (let i = 0; i < offset; i += 1) {
      const pad = document.createElement("span");
      grid.appendChild(pad);
    }
    buckets.forEach((bucket) => {
      grid.appendChild(paintCalCell(document.createElement("button"), bucket, selected));
    });
    wrap.appendChild(grid);
    costChart.appendChild(wrap);
  }

  function renderCostYearCalendar(buckets, selected) {
    const wrap = document.createElement("div");
    wrap.className = "cost-cal-year";
    const byMonth = new Map();
    buckets.forEach((bucket) => {
      const key = String(bucket.key).slice(0, 7);
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key).push(bucket);
    });
    for (let mon = 1; mon <= 12; mon += 1) {
      const monthKey = `${String(buckets[0]?.key || "").slice(0, 4)}-${pad2(mon)}`;
      const days = byMonth.get(monthKey) || [];
      const monthEl = document.createElement("div");
      monthEl.className = "cost-cal-month";
      const title = document.createElement("h4");
      title.textContent = `${mon}月`;
      monthEl.appendChild(title);
      const grid = document.createElement("div");
      grid.className = "cost-cal-grid";
      const offset = days.length ? weekdayOffset(days[0].key) : 0;
      for (let i = 0; i < offset; i += 1) grid.appendChild(document.createElement("span"));
      days.forEach((bucket) => {
        grid.appendChild(paintCalCell(document.createElement("button"), bucket, selected));
      });
      monthEl.appendChild(grid);
      wrap.appendChild(monthEl);
    }
    costChart.appendChild(wrap);
  }

  function renderCostChart(report) {
    const buckets = report.buckets || [];
    const selected = report.selected || (costPeriod === "month"
      ? (costSelectedMonth || String(costSelectedYear || ""))
      : costSelectedDay) || "";
    if (costPeriod === "month") {
      if (selected.length >= 4) costSelectedYear = Number(selected.slice(0, 4)) || costSelectedYear;
      costSelectedMonth = selected.length >= 7 ? selected.slice(0, 7) : "";
    }
    if (costPeriod === "day" && selected.length >= 10) {
      costSelectedDay = selected.slice(0, 10);
      costSelectedMonth = selected.slice(0, 7);
      costSelectedYear = Number(selected.slice(0, 4)) || costSelectedYear;
    }
    updateCostChartTitle();
    applyCostChartTypeUi();
    if (costChartMeta) costChartMeta.textContent = buckets.length ? "点击切换" : "";
    if (costChartCard) costChartCard.hidden = buckets.length === 0;
    if (!costChart) return;
    costChart.innerHTML = "";
    if (!buckets.length) return;
    if (costChartKind === "calendar") {
      if (buckets.length > 40) renderCostYearCalendar(buckets, selected);
      else renderCostMonthCalendar(buckets, selected);
      return;
    }
    const width = Math.max(costChart.clientWidth || 0, 320);
    if (costChartKind === "kline") {
      renderCostKline(buckets, selected, width);
      return;
    }
    renderCostBars(buckets, selected, width);
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
    const seq = ++querySeq;
    try {
      const qs = params.toString();
      const res = await api(`/api/orders${qs ? `?${qs}` : ""}`);
      if (seq !== querySeq) return;
      if (!res.ok) throw new Error(await parseError(res));
      renderOrders(await res.json());
    } catch (err) {
      if (seq !== querySeq) return;
      listMeta.textContent = "";
      renderOrders([]);
      showMsg(queryMsg, err.message || "查询失败", false);
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
    tab.addEventListener("click", () => {
      if (pauseWeb) return;
      switchTab(tab.dataset.tab);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (pauseWeb) return;
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

  if (costForm) {
    costForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await loadCosts();
    });
  }
  if (costChartTitle) costChartTitle.addEventListener("click", openCostTimeModal);
  if (costTimeBackdrop) costTimeBackdrop.addEventListener("click", closeCostTimeModal);
  const costTimeForm = document.getElementById("costTimeForm");
  if (costTimeForm) {
    costTimeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applyCostYear(costTimeYearInput?.value);
    });
  }
  if (costTimeUseYear) {
    costTimeUseYear.addEventListener("click", () => applyCostYear(costTimeYearInput?.value));
  }
  if (costTimeUseMonth) {
    costTimeUseMonth.addEventListener("click", () => applyCostMonth(costTimeMonthInput?.value));
  }
  if (costChartPrev) costChartPrev.addEventListener("click", () => shiftCostPeriod(-1));
  if (costChartNext) costChartNext.addEventListener("click", () => shiftCostPeriod(1));
  if (costChartTypeRow) {
    costChartTypeRow.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.dataset.chart || "bar";
        if (next === costChartKind) return;
        costChartKind = next;
        applyCostChartTypeUi();
        loadCosts();
      });
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

  queryDate.addEventListener("input", () => {
    clearTimeout(queryDateTimer);
    const parsed = parseQueryDateInput(queryDate.value);
    if (!parsed.ok) return;
    queryDateTimer = setTimeout(() => queryOrders(), 280);
  });
  queryDate.addEventListener("change", () => {
    clearTimeout(queryDateTimer);
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
    renderQueryPickers();
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

  if (returnAdminBtn) {
    returnAdminBtn.addEventListener("click", () => {
      returnToAdmin().catch((err) => showMsg(formMsg, err.message || "返回失败", false));
    });
  }

  logoutBtn.addEventListener("click", async () => {
    await api("/api/auth/logout", { method: "POST" });
    location.href = "/login";
  });

  if (androidAppBtn || webPauseDownload) {
    fetch("/api/app/info", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (!info || !info.download_url) return;
        if (androidAppBtn) androidAppBtn.href = info.download_url;
        if (webPauseDownload) webPauseDownload.href = info.download_url;
        if (webPauseMeta) {
          const sizeMb = info.size_bytes ? (info.size_bytes / 1048576).toFixed(1) : "";
          webPauseMeta.hidden = false;
          webPauseMeta.textContent = sizeMb
            ? `最新版本 v${info.version_name} · 约 ${sizeMb} MB`
            : `最新版本 v${info.version_name}`;
        }
      })
      .catch(() => {});
  }

  bindPauseSwitch(pauseWebSwitch, pauseWebMsg);
  bindPauseSwitch(pauseWebSwitchGate, pauseWebMsg);

  orderDate.value = todayISO();
  queryDate.value = todayISO();
  costSelectedDay = todayISO();
  costSelectedMonth = currentMonthISO();
  costSelectedYear = currentYearValue();
  applyCostPeriodUi();
  applyCostChartTypeUi();
  window.addEventListener("resize", () => {
    if (lastCostReport && panelCost && !panelCost.hidden) renderCostChart(lastCostReport);
  });

  (async () => {
    const meRes = await api("/api/auth/me");
    if (!meRes.ok) return;
    currentUserInfo = await meRes.json();
    currentUser.textContent = currentUserInfo.username;
    await loadSettings();
    applyRoleUi();
    if (pauseWeb) return;
    switchTab(isAdmin() ? "cost" : "create");
    await loadCatalog();
  })().catch((err) => {
    if (err.message !== "未登录") {
      showMsg(formMsg, err.message || "加载失败", false);
    }
  });
})();
