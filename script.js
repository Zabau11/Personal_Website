const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rootElement = document.documentElement;
const shouldForceTopOnRestore = document.querySelector(".logo-button") instanceof HTMLAnchorElement;

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
