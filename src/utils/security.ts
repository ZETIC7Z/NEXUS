/**
 * security.ts
 * Implements high-level devtools protection, context-menu blocking,
 * keyboard shortcut restrictions, and anti-tamper debugging loops.
 */

if (typeof window !== "undefined") {
  // 1. Disable Right-Click Context Menu
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // 2. Disable DevTools Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    // Disable F12
    if (e.key === "F12") {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+I (Inspector), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element Selector)
    if (
      e.ctrlKey &&
      e.shiftKey &&
      (e.key === "I" ||
        e.key === "J" ||
        e.key === "C" ||
        e.key === "i" ||
        e.key === "j" ||
        e.key === "c")
    ) {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+U (View Source)
    if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+S (Save Page)
    if (e.ctrlKey && (e.key === "S" || e.key === "s")) {
      e.preventDefault();
      return false;
    }
  });

  // 3. Continuous anti-devtools debugger loop (freezes inspector if opened)
  const antiDevTools = () => {
    try {
      (function () {
        (function a() {
          try {
            (function b(i) {
              if (
                ("" + i / i).length !== 1 ||
                i % 20 === 0
              ) {
                (function () {}.constructor("debugger")());
              } else {
                debugger;
              }
              b(++i);
            })(0);
          } catch (e) {
            setTimeout(a, 1000);
          }
        })();
      })();
    } catch (e) {
      // ignore
    }
  };

  // Run the debugger loop in production-like builds to deter inspect element
  if (import.meta.env.PROD) {
    setInterval(antiDevTools, 1000);
  }
}
