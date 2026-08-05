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
  const queryShop = document.getElementById("queryShop");
  const querySupplier = document.getElementById("querySupplier");
  const queryBtn = document.getElementById("queryBtn");
  const resetQueryBtn = document.getElementById("resetQueryBtn");
  const queryMsg = document.getElementById("queryMsg");

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
    const params = new URLSearchParams();
    if (queryDate.value) params.set("order_date", queryDate.value);
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

  resetQueryBtn.addEventListener("click", () => {
    queryDate.value = todayISO();
    queryShop.value = "";
    querySupplier.value = "";
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
