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

const statusClock = document.querySelector("[data-status-clock]");
const formatStatusClock = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

if (statusClock instanceof HTMLElement) {
  const tickStatusClock = () => {
    statusClock.textContent = formatStatusClock(new Date());
  };

  tickStatusClock();
  window.setInterval(tickStatusClock, 1000);
}

const runSliceGlitch = () => {
  if (prefersReducedMotion) {
    return;
  }

  const drop = document.querySelector(".code-drop");
  const split = drop?.closest(".tty-split");
  const sliceEls = [...document.querySelectorAll(".code-drop__slice")];

  if (!drop || !split || sliceEls.length === 0) {
    return;
  }

  const SLICE_COLS = 8;
  const sliceLines = (el) => (el.textContent || "").replace(/\n$/, "").split("\n");
  const linesPerSlice = Math.max(...sliceEls.map((el) => sliceLines(el).length));
  const sliceWidth = Math.max(
    ...sliceEls.flatMap((el) => sliceLines(el).map((line) => line.length))
  );
  const rows = Math.ceil(sliceEls.length / SLICE_COLS) * linesPerSlice;
  const cols = SLICE_COLS * sliceWidth;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(" "));

  sliceEls.forEach((el, index) => {
    const sliceCol = index % SLICE_COLS;
    const sliceRow = Math.floor(index / SLICE_COLS);

    sliceLines(el).forEach((line, lineIndex) => {
      const y = sliceRow * linesPerSlice + lineIndex;

      for (let x = 0; x < line.length; x += 1) {
        grid[y][sliceCol * sliceWidth + x] = line[x];
      }
    });
  });

  const minVisibleRow = Math.floor(rows * 0.6);
  const occupied = [];

  for (let y = minVisibleRow; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (grid[y][x] !== " ") {
        occupied.push([x, y]);
      }
    }
  }

  if (occupied.length === 0) {
    return;
  }

  const density = occupied.map(([x, y]) => {
    let count = 0;

    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        if (grid[y + dy]?.[x + dx] && grid[y + dy][x + dx] !== " ") {
          count += 1;
        }
      }
    }

    return count;
  });
  const densityTotal = density.reduce((sum, value) => sum + value, 0);

  const live = document.createElement("pre");
  live.className = "code-drop__live";
  live.setAttribute("aria-hidden", "true");
  split.appendChild(live);

  let lastKey = "";

  const pickSeed = () => {
    let roll = Math.random() * densityTotal;

    for (let i = 0; i < occupied.length; i += 1) {
      roll -= density[i];
      if (roll <= 0) {
        return occupied[i];
      }
    }

    return occupied[occupied.length - 1];
  };

  const runOnRow = (y, approxStart, length) => {
    let start = Math.max(0, Math.min(cols - 1, approxStart));
    let end = Math.max(start + 1, Math.min(cols, start + length));

    while (start < end && grid[y][start] === " ") {
      start += 1;
    }

    while (end > start && grid[y][end - 1] === " ") {
      end -= 1;
    }

    if (end - start < 2) {
      return null;
    }

    return { y, start, end };
  };

  const pickRuns = () => {
    const [seedX, seedY] = pickSeed();
    const maxHeight = Math.min(5, rows - minVisibleRow);
    const height = 2 + Math.floor(Math.random() * Math.max(1, maxHeight - 1));
    const startRow = Math.max(
      minVisibleRow,
      Math.min(rows - height, seedY - Math.floor(Math.random() * height))
    );
    const runs = [];
    let cursor = seedX;
    let prevLength = 0;

    for (let i = 0; i < height; i += 1) {
      let length = 4 + Math.floor(Math.random() * 18);

      for (let n = 0; n < 6 && Math.abs(length - prevLength) < 4; n += 1) {
        length = 3 + Math.floor(Math.random() * 20);
      }

      cursor += Math.floor(Math.random() * 13) - 6;
      const run = runOnRow(startRow + i, cursor - Math.floor(length * 0.35), length);

      if (run) {
        runs.push(run);
        prevLength = run.end - run.start;
        cursor = run.start + Math.floor((run.end - run.start) * 0.4);
      }
    }

    return runs;
  };

  const pulse = () => {
    let runs = [];

    for (let attempt = 0; attempt < 10; attempt += 1) {
      runs = pickRuns();
      const key = runs.map((run) => `${run.y}:${run.start}:${run.end}`).join("|");

      if (runs.length >= 2 && key !== lastKey) {
        lastKey = key;
        break;
      }
    }

    if (runs.length === 0) {
      window.setTimeout(pulse, 400);
      return;
    }

    const minX = Math.min(...runs.map((run) => run.start));
    const minY = Math.min(...runs.map((run) => run.y));
    const maxY = Math.max(...runs.map((run) => run.y));
    const lines = [];

    for (let y = minY; y <= maxY; y += 1) {
      const run = runs.find((item) => item.y === y);

      if (!run) {
        lines.push("");
        continue;
      }

      lines.push(
        `${" ".repeat(run.start - minX)}${grid[y].slice(run.start, run.end).join("")}`
      );
    }

    const dropRect = drop.getBoundingClientRect();
    const splitRect = split.getBoundingClientRect();
    const style = window.getComputedStyle(drop);
    const cellW = dropRect.width / cols;
    const cellH = dropRect.height / rows;

    live.textContent = lines.join("\n");
    live.style.left = `${dropRect.left - splitRect.left + minX * cellW}px`;
    live.style.top = `${dropRect.top - splitRect.top + minY * cellH}px`;
    live.style.fontFamily = style.fontFamily;
    live.style.fontSize = style.fontSize;
    live.style.fontWeight = style.fontWeight;
    live.style.letterSpacing = style.letterSpacing;
    live.style.lineHeight = style.lineHeight;
    live.classList.remove("is-on");
    void live.offsetWidth;
    live.classList.add("is-on");

    window.setTimeout(() => {
      live.classList.remove("is-on");
      live.textContent = "";
      window.setTimeout(pulse, 240 + Math.random() * 820);
    }, 340);
  };

  pulse();
};

runSliceGlitch();

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

