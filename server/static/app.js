(() => {
  const form = document.getElementById("orderForm");
  const orderDate = document.getElementById("orderDate");
  const shopName = document.getElementById("shopName");
  const supplierName = document.getElementById("supplierName");
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
  const queryShop = document.getElementById("queryShop");
  const querySupplier = document.getElementById("querySupplier");
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
  const tabs = document.querySelectorAll(".tab");

  const shopForm = document.getElementById("shopForm");
  const newShopName = document.getElementById("newShopName");
  const shopMsg = document.getElementById("shopMsg");
  const shopManageList = document.getElementById("shopManageList");

  const supplierForm = document.getElementById("supplierForm");
  const newSupplierName = document.getElementById("newSupplierName");
  const supplierMsg = document.getElementById("supplierMsg");
  const supplierManageList = document.getElementById("supplierManageList");

  const dupModal = document.getElementById("dupModal");
  const dupTitle = document.getElementById("dupTitle");
  const dupText = document.getElementById("dupText");
  const dupYes = document.getElementById("dupYes");
  const dupNo = document.getElementById("dupNo");
  const currentUser = document.getElementById("currentUser");
  const logoutBtn = document.getElementById("logoutBtn");
  const recentList = document.getElementById("recentList");
  const recentTableWrap = document.getElementById("recentTableWrap");
  const recentEmpty = document.getElementById("recentEmpty");
  const recentMeta = document.getElementById("recentMeta");

  let dupResolve = null;
  let shops = [];
  let suppliers = [];

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

  function openModal({ title, text, yesText, noText }) {
    dupTitle.textContent = title;
    dupText.textContent = text;
    dupYes.textContent = yesText;
    dupNo.textContent = noText;
    dupModal.hidden = false;
    return new Promise((resolve) => {
      dupResolve = resolve;
    });
  }

  function closeModal(result) {
    dupModal.hidden = true;
    if (dupResolve) {
      const resolve = dupResolve;
      dupResolve = null;
      resolve(result);
    }
  }

  dupYes.addEventListener("click", () => closeModal(true));
  dupNo.addEventListener("click", () => closeModal(false));
  dupModal.querySelector(".modal-backdrop").addEventListener("click", () => closeModal(false));

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

  function fillSelect(select, items, placeholder, keepValue) {
    const current = keepValue ? select.value : "";
    select.innerHTML = "";
    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    if (placeholder.startsWith("请选择")) first.disabled = true;
    select.appendChild(first);
    for (const item of items) {
      const opt = document.createElement("option");
      opt.value = item.name;
      opt.textContent = item.name;
      select.appendChild(opt);
    }
    if (current && items.some((x) => x.name === current)) {
      select.value = current;
    } else if (placeholder.startsWith("请选择")) {
      select.selectedIndex = 0;
    }
  }

  function renderManageList(ul, items, onDelete) {
    ul.innerHTML = "";
    for (const item of items) {
      const li = document.createElement("li");
      li.innerHTML = `<span class="name"></span><button type="button" class="delete-btn">删除</button>`;
      li.querySelector(".name").textContent = item.name;
      li.querySelector(".delete-btn").addEventListener("click", () => onDelete(item));
      ul.appendChild(li);
    }
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

    fillSelect(shopName, shops, "请选择店铺", true);
    fillSelect(supplierName, suppliers, "请选择供应商", true);
    fillSelect(queryShop, shops, "全部店铺", true);
    fillSelect(querySupplier, suppliers, "全部供应商", true);
    renderManageList(shopManageList, shops, deleteShop);
    renderManageList(supplierManageList, suppliers, deleteSupplier);
  }

  async function deleteShop(item) {
    const ok = await openModal({
      title: "确认删除",
      text: `确认删除店铺「${item.name}」？`,
      yesText: "确定删除",
      noText: "取消",
    });
    if (!ok) return;
    const res = await api(`/api/shops/${item.id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      showMsg(shopMsg, await parseError(res), false);
      return;
    }
    showMsg(shopMsg, "店铺已删除", true);
    await loadCatalog();
  }

  async function deleteSupplier(item) {
    const ok = await openModal({
      title: "确认删除",
      text: `确认删除供应商「${item.name}」？`,
      yesText: "确定删除",
      noText: "取消",
    });
    if (!ok) return;
    const res = await api(`/api/suppliers/${item.id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      showMsg(supplierMsg, await parseError(res), false);
      return;
    }
    showMsg(supplierMsg, "供应商已删除", true);
    await loadCatalog();
  }

  function switchTab(name) {
    tabs.forEach((tab) => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    panelCreate.hidden = name !== "create";
    panelQuery.hidden = name !== "query";
    panelManage.hidden = name !== "manage";
    if (name === "create") loadRecentOrders();
    if (name === "query") queryOrders();
    if (name === "manage") loadCatalog().catch((err) => showMsg(shopMsg, err.message, false));
  }

  function renderRecentOrders(orders) {
    recentList.innerHTML = "";
    const hasItems = orders.length > 0;
    recentEmpty.hidden = hasItems;
    recentEmpty.textContent = "暂无提交记录";
    recentTableWrap.hidden = !hasItems;
    recentMeta.textContent = hasItems ? `最近 ${orders.length} 条` : "";

    for (const order of orders) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-date"></td>
        <td class="col-shop"></td>
        <td class="col-supplier"></td>
        <td class="num col-amount"></td>
      `;
      tr.querySelector(".col-date").textContent = order.order_date;
      tr.querySelector(".col-shop").textContent = order.shop_name;
      tr.querySelector(".col-supplier").textContent = order.supplier_name;
      tr.querySelector(".col-amount").textContent = `¥${formatMoney(order.daily_total)}`;
      recentList.appendChild(tr);
    }
  }

  async function loadRecentOrders() {
    try {
      const res = await api("/api/orders?limit=5");
      if (!res.ok) throw new Error(await parseError(res));
      renderRecentOrders(await res.json());
    } catch (err) {
      renderRecentOrders([]);
      recentMeta.textContent = "";
      recentEmpty.hidden = false;
      recentEmpty.textContent = err.message || "加载最近提交失败";
    }
  }

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
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-date"></td>
        <td class="col-shop"></td>
        <td class="col-supplier"></td>
        <td class="num col-amount"></td>
        <td class="ops"><button type="button" class="delete-btn">删除</button></td>
      `;
      tr.querySelector(".col-date").textContent = order.order_date;
      tr.querySelector(".col-shop").textContent = order.shop_name;
      tr.querySelector(".col-supplier").textContent = order.supplier_name;
      tr.querySelector(".col-amount").textContent = `¥${formatMoney(order.daily_total)}`;
      tr.querySelector(".delete-btn").addEventListener("click", () => {
        deleteOrder(order.id);
      });
      orderList.appendChild(tr);
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
    if (queryShop.value) params.set("shop_name", queryShop.value);
    if (querySupplier.value) params.set("supplier_name", querySupplier.value);

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
    const confirmed = await openModal({
      title: "确认删除",
      text: "确认删除这条订单？",
      yesText: "确定删除",
      noText: "取消",
    });
    if (!confirmed) return;
    try {
      const res = await api(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(await parseError(res));
      showMsg(queryMsg, "已删除", true);
      await queryOrders();
    } catch (err) {
      showMsg(queryMsg, err.message || "删除失败", false);
    }
  }

  async function findExistingOrder(payload) {
    const res = await api(
      `/api/orders?order_date=${encodeURIComponent(payload.order_date)}`
    );
    if (!res.ok) return null;
    const orders = await res.json();
    return (
      orders.find(
        (o) =>
          o.order_date === payload.order_date &&
          o.shop_name === payload.shop_name &&
          o.supplier_name === payload.supplier_name
      ) || null
    );
  }

  async function createOrder(payload) {
    const res = await api("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 409) {
      const isDup = await openModal({
        title: "是否重复",
        text: "订单信息已存在，是否重复？",
        yesText: "是，取消提交",
        noText: "否",
      });
      if (isDup) {
        showMsg(formMsg, "已取消提交（判定为重复）", false);
        return false;
      }
      throw new Error(await parseError(res));
    }
    if (!res.ok) throw new Error(await parseError(res));
    return true;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg(formMsg);

    const payload = {
      order_date: orderDate.value,
      shop_name: shopName.value.trim(),
      supplier_name: supplierName.value.trim(),
      daily_total: Number(dailyTotal.value),
    };

    if (!payload.shop_name || !payload.supplier_name) {
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
        const sameAmount = almostEqual(existing.daily_total, payload.daily_total);
        const text = sameAmount
          ? "订单信息一模一样，是否重复？"
          : `该店铺该日该供应商已有订单（金额 ¥${formatMoney(existing.daily_total)}），是否重复？`;
        const isDup = await openModal({
          title: "是否重复",
          text,
          yesText: "是，取消提交",
          noText: "否，继续提交",
        });
        if (isDup) {
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

  shopForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg(shopMsg);
    const name = newShopName.value.trim();
    if (!name) {
      showMsg(shopMsg, "请输入店铺名", false);
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
    showMsg(shopMsg, "店铺已添加", true);
    await loadCatalog();
  });

  supplierForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg(supplierMsg);
    const name = newSupplierName.value.trim();
    if (!name) {
      showMsg(supplierMsg, "请输入供应商名", false);
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
    queryShop.value = "";
    querySupplier.value = "";
    rangeAnchor = null;
    setCalOpen(false);
    queryOrders();
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
    const me = await meRes.json();
    currentUser.textContent = me.username;
    await Promise.all([loadCatalog(), loadRecentOrders()]);
  })().catch((err) => {
    if (err.message !== "未登录") {
      showMsg(formMsg, err.message || "加载失败", false);
    }
  });
})();
