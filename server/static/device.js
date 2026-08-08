(() => {
  const MOBILE_UA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|HarmonyOS|MiuiBrowser|HuaweiBrowser/i;
  const BREAKPOINT = 768;

  function isMobileDevice() {
    const ua = navigator.userAgent || "";
    const byUA = MOBILE_UA.test(ua);
    const iPadDesktopUA =
      navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1;
    const byWidth = window.matchMedia(`(max-width: ${BREAKPOINT}px)`).matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    return byUA || iPadDesktopUA || (byWidth && coarsePointer) || byWidth;
  }

  function applyDeviceClass() {
    const mobile = isMobileDevice();
    const root = document.documentElement;
    const prev = root.dataset.device;
    const next = mobile ? "mobile" : "pc";
    root.classList.toggle("is-mobile", mobile);
    root.classList.toggle("is-pc", !mobile);
    root.dataset.device = next;
    if (prev && prev !== next) {
      window.dispatchEvent(
        new CustomEvent("devicechange", { detail: { device: next, mobile } })
      );
    }
  }

  applyDeviceClass();

  let timer = null;
  const onChange = () => {
    clearTimeout(timer);
    timer = setTimeout(applyDeviceClass, 120);
  };

  window.addEventListener("resize", onChange);
  window.addEventListener("orientationchange", onChange);
  if (window.matchMedia) {
    window.matchMedia(`(max-width: ${BREAKPOINT}px)`).addEventListener("change", onChange);
  }
})();
