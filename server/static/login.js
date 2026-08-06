(() => {
  const form = document.getElementById("loginForm");
  const username = document.getElementById("username");
  const password = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");
  const loginBtn = document.getElementById("loginBtn");
  const loginMsg = document.getElementById("loginMsg");

  togglePassword.addEventListener("click", () => {
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    togglePassword.setAttribute("aria-pressed", show ? "true" : "false");
    togglePassword.setAttribute("aria-label", show ? "隐藏密码" : "显示密码");
    togglePassword.title = show ? "隐藏密码" : "显示密码";
  });

  function showMsg(text, ok) {
    loginMsg.hidden = false;
    loginMsg.textContent = text;
    loginMsg.className = `msg ${ok ? "ok" : "err"}`;
  }

  async function redirectIfLoggedIn() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        location.replace("/");
      }
    } catch {
      /* stay on login */
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginMsg.hidden = true;
    loginBtn.disabled = true;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.value.trim(),
          password: password.value,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "登录失败");
      }
      location.replace("/");
    } catch (err) {
      showMsg(err.message || "登录失败", false);
      loginBtn.disabled = false;
    }
  });

  redirectIfLoggedIn();
})();
