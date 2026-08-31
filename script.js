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
  const canvas = document.createElement("canvas");
  canvas.className = "code-drop";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);

  const context = canvas.getContext("2d", { alpha: true });

  if (!(context instanceof CanvasRenderingContext2D)) {
    canvas.remove();
    return;
  }

  const drops = [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let color = "#aebfd1";
  let frame = 0;
  let lastTime = 0;

  const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

  const readColor = () => {
    const styles = getComputedStyle(rootElement);
    const nextColor = styles.getPropertyValue("--dev-blue").trim();
    color = nextColor || (getTheme() === "light" ? "#4c6376" : "#aebfd1");
  };

  const resetDrop = (drop, spawnAnywhere) => {
    const xNorm = drop.column / Math.max(drop.columnCount - 1, 1);
    drop.glyph = randomItem(CODE_DROP_GLYPHS);
    drop.speed = 10 + Math.random() * 18;
    drop.y = spawnAnywhere ? Math.random() * height : -12 - Math.random() * 48;
    drop.centerWeight = Math.exp(-((xNorm - 0.5) * 2.15) ** 2);
  };

  const rebuildDrops = () => {
    drops.length = 0;
    const columnWidth = 18;
    const columnCount = Math.max(8, Math.floor(width / columnWidth));

    for (let column = 0; column < columnCount; column += 1) {
      const xNorm = column / Math.max(columnCount - 1, 1);
      const centerWeight = Math.exp(-((xNorm - 0.5) * 2.15) ** 2);

      if (centerWeight < 0.12 && Math.random() > 0.22) {
        continue;
      }

      const stack = centerWeight > 0.55 ? 2 : 1;

      for (let index = 0; index < stack; index += 1) {
        const drop = {
          column,
          columnCount,
          x: (column + 0.5) * (width / columnCount),
          y: 0,
          glyph: "@",
          speed: 16,
          centerWeight,
        };
        resetDrop(drop, true);
        drops.push(drop);
      }
    }
  };

  const resize = () => {
    const nextPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    pixelRatio = nextPixelRatio;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.font = '13px "American Typewriter", "Courier New", Courier, monospace';
    context.textAlign = "center";
    context.textBaseline = "middle";
    rebuildDrops();
  };

  const draw = (time) => {
    const delta = lastTime === 0 ? 0.016 : Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    context.clearRect(0, 0, width, height);
    context.fillStyle = color;

    for (const drop of drops) {
      if (!prefersReducedMotion) {
        drop.y += drop.speed * delta;

        if (drop.y > height + 14) {
          resetDrop(drop, false);
        }
      }

      const fall = Math.max(0, Math.min(1, drop.y / height));
      const opacity = fall * drop.centerWeight * 0.72;

      if (opacity < 0.02) {
        continue;
      }

      context.globalAlpha = opacity;
      context.fillText(drop.glyph, drop.x, drop.y);
    }

    context.globalAlpha = 1;

    if (!prefersReducedMotion && !document.hidden) {
      frame = window.requestAnimationFrame(draw);
    }
  };

  const play = () => {
    if (prefersReducedMotion || document.hidden) {
      lastTime = 0;
      draw(performance.now());
      return;
    }

    if (frame > 0) {
      return;
    }

    lastTime = 0;
    frame = window.requestAnimationFrame(draw);
  };

  const pause = () => {
    if (frame > 0) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  readColor();
  resize();
  play();

  window.addEventListener("resize", () => {
    pause();
    resize();
    play();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pause();
      return;
    }

    play();
  });

  const themeObserver = new MutationObserver(() => {
    readColor();

    if (prefersReducedMotion) {
      draw(performance.now());
    }
  });

  themeObserver.observe(rootElement, { attributes: true, attributeFilter: ["data-theme"] });
};

startCodeDrop();

