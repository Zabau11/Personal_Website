const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  document.documentElement.setAttribute("data-reduced-motion", "true");
}

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

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
  window.scrollTo(0, 0);
});

window.addEventListener("load", () => {
  window.scrollTo(0, 0);
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

        if (index === targetText.length - 1) {
          window.setTimeout(() => {
            typewriterNode.classList.remove("is-typing");
          }, 900);
        }
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
