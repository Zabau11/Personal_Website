const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rootElement = document.documentElement;
const shouldForceTopOnRestore = document.querySelector(".logo-button") instanceof HTMLAnchorElement;
const themeToggle = document.querySelector("[data-theme-toggle]");

const getTheme = () => rootElement.dataset.theme === "light" ? "light" : "dark";

const setTheme = (theme) => {
  rootElement.dataset.theme = theme;

  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Theme still works for the current page when storage is unavailable.
  }

  if (themeToggle instanceof HTMLButtonElement) {
    const nextTheme = theme === "light" ? "dark" : "light";
    themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
  }

};

if (!rootElement.dataset.theme) {
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  rootElement.dataset.theme = prefersLight ? "light" : "dark";
}

setTheme(getTheme());

if (themeToggle instanceof HTMLButtonElement) {
  themeToggle.addEventListener("click", () => {
    setTheme(getTheme() === "light" ? "dark" : "light");
  });
}

if (prefersReducedMotion) {
  document.documentElement.setAttribute("data-reduced-motion", "true");
}

if (shouldForceTopOnRestore && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const forceScrollTop = () => {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

const forceScrollTopAfterRestore = () => {
  forceScrollTop();
  window.requestAnimationFrame(() => {
    forceScrollTop();
  });
  window.setTimeout(() => {
    forceScrollTop();
  }, 80);
};

const getNavigationType = () => {
  const [navigationEntry] = performance.getEntriesByType("navigation");

  if (navigationEntry && "type" in navigationEntry) {
    return navigationEntry.type;
  }

  if ("navigation" in performance) {
    switch (performance.navigation.type) {
      case performance.navigation.TYPE_RELOAD:
        return "reload";
      case performance.navigation.TYPE_BACK_FORWARD:
        return "back_forward";
      default:
        return "navigate";
    }
  }

  return "navigate";
};

const navigationType = getNavigationType();

let blurEdgeFrame = 0;

const updateBlurEdgeState = () => {
  blurEdgeFrame = 0;

  const scrollTop = Math.max(window.scrollY, rootElement.scrollTop, document.body.scrollTop);
  const scrollHeight = Math.max(rootElement.scrollHeight, document.body.scrollHeight);
  const maxScroll = Math.max(0, scrollHeight - window.innerHeight);
  const edgeThreshold = 2;

  rootElement.classList.toggle("is-at-top", scrollTop <= edgeThreshold);
  rootElement.classList.toggle("is-at-bottom", maxScroll - scrollTop <= edgeThreshold);
};

const scheduleBlurEdgeStateUpdate = () => {
  if (blurEdgeFrame > 0) {
    return;
  }

  blurEdgeFrame = window.requestAnimationFrame(updateBlurEdgeState);
};

updateBlurEdgeState();
window.addEventListener("scroll", scheduleBlurEdgeStateUpdate, { passive: true });
window.addEventListener("resize", scheduleBlurEdgeStateUpdate);
window.addEventListener("load", scheduleBlurEdgeStateUpdate);
window.addEventListener("pageshow", scheduleBlurEdgeStateUpdate);

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
};

const logoButton = document.querySelector(".logo-button");

if (logoButton instanceof HTMLAnchorElement) {
  logoButton.addEventListener("click", (event) => {
    event.preventDefault();
    scrollToTop();
  });
}

const siteTitle = document.querySelector(".intro h1");

if (siteTitle instanceof HTMLElement) {
  siteTitle.classList.add("title-scroll-trigger");
  siteTitle.setAttribute("tabindex", "0");

  siteTitle.addEventListener("click", () => {
    scrollToTop();
  });

  siteTitle.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    scrollToTop();
  });
}

window.addEventListener("beforeunload", () => {
  if (shouldForceTopOnRestore) {
    forceScrollTop();
  }
});

window.addEventListener("load", () => {
  if (shouldForceTopOnRestore) {
    forceScrollTopAfterRestore();
  }
});

window.addEventListener("pageshow", () => {
  if (shouldForceTopOnRestore && navigationType === "reload") {
    forceScrollTopAfterRestore();
  }
});

const typewriterNode = document.querySelector("[data-typewriter]");

if (typewriterNode instanceof HTMLElement) {
  const targetText = typewriterNode.dataset.text ?? typewriterNode.textContent ?? "";

  if (prefersReducedMotion || targetText.length === 0) {
    typewriterNode.textContent = targetText;
  } else {
    typewriterNode.textContent = "";
    typewriterNode.classList.add("is-typing");

    const startDelay = 220;
    const typingStep = 72;

    Array.from(targetText).forEach((character, index) => {
      window.setTimeout(() => {
        typewriterNode.textContent += character;
      }, startDelay + index * typingStep);
    });
  }
}

const mobileScrollerQuery = window.matchMedia("(max-width: 768px)");
const projectsScrollers = document.querySelectorAll(".projects-scroller");

const bindMobileScrollerBlur = (scroller) => {
  let clearScrollingStateTimer = 0;

  const setScrollingState = () => {
    scroller.classList.add("is-scrolling");

    if (clearScrollingStateTimer > 0) {
      window.clearTimeout(clearScrollingStateTimer);
    }

    clearScrollingStateTimer = window.setTimeout(() => {
      scroller.classList.remove("is-scrolling");
      clearScrollingStateTimer = 0;
    }, 140);
  };

  scroller.addEventListener("scroll", () => {
    if (!mobileScrollerQuery.matches) {
      scroller.classList.remove("is-scrolling");
      return;
    }

    setScrollingState();
  }, { passive: true });

  scroller.addEventListener("touchstart", () => {
    if (!mobileScrollerQuery.matches) {
      return;
    }

    setScrollingState();
  }, { passive: true });
};

projectsScrollers.forEach((scroller) => {
  if (scroller instanceof HTMLElement) {
    bindMobileScrollerBlur(scroller);
  }
});

const CODE_DROP_GLYPHS = ["@", "#", "%", "*", "+", "=", "-", ":"];

const startCodeDrop = () => {
  const root = document.querySelector(".code-drop");

  if (!(root instanceof HTMLElement)) {
    return;
  }

  const columnCount = Math.max(18, Math.min(56, Math.floor(window.innerWidth / 18)));
  const fragment = document.createDocumentFragment();

  for (let column = 0; column < columnCount; column += 1) {
    const xNorm = column / Math.max(columnCount - 1, 1);
    const centerWeight = Math.exp(-((xNorm - 0.5) * 1.7) ** 2);

    if (centerWeight < 0.12) {
      continue;
    }

    const stack = centerWeight > 0.55 ? 2 : 1;

    for (let index = 0; index < stack; index += 1) {
      const col = document.createElement("span");
      col.className = "code-drop__col";
      col.style.opacity = String(0.45 + centerWeight * 0.55);

      const glyph = document.createElement("span");
      glyph.className = "code-drop__glyph";
      glyph.textContent = CODE_DROP_GLYPHS[Math.floor(Math.random() * CODE_DROP_GLYPHS.length)];
      glyph.style.setProperty("--dur", `${3.4 + Math.random() * 3.8}s`);
      glyph.style.setProperty("--delay", `${(-Math.random() * 6).toFixed(2)}s`);
      col.append(glyph);
      fragment.append(col);
    }
  }

  root.replaceChildren(fragment);
};

startCodeDrop();
window.addEventListener("resize", () => {
  window.clearTimeout(startCodeDrop.resizeTimer);
  startCodeDrop.resizeTimer = window.setTimeout(startCodeDrop, 180);
});

