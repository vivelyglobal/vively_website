// Vively — shared front-end behaviour (no build step, vanilla JS)

document.addEventListener("DOMContentLoaded", () => {
  /* Mobile nav toggle */
  const burger = document.querySelector(".nav-burger");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (burger && mobileMenu) {
    burger.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
      burger.classList.toggle("is-open");
    });
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => mobileMenu.classList.remove("open"))
    );
  }

  /* Scroll reveal — only switch on the hidden-until-scrolled animation once
     we're actually about to run it, so a JS failure can never leave
     content invisible (see the html.js-reveal gate in style.css). */
  const revealEls = document.querySelectorAll(".reveal, .badge-pop");
  if ("IntersectionObserver" in window && revealEls.length) {
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* Proof clips are declared with data-src and only get a real src once
     they're near the viewport, so the homepage doesn't fetch ~12MB of
     video up front. Poster images render immediately either way. */
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const lazyVideos = document.querySelectorAll("video[data-src]");
  if (lazyVideos.length) {
    const load = (v) => {
      if (v.dataset.src) { v.src = v.dataset.src; delete v.dataset.src; }
      // cards marked data-autoloop play by themselves once loaded, but only
      // for users who haven't asked for reduced motion — otherwise the
      // poster frame stands in as a still image
      if ("autoloop" in v.dataset && !prefersReducedMotion) v.play().catch(() => {});
    };
    if ("IntersectionObserver" in window) {
      const vio = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          if (e.isIntersecting) { load(e.target); vio.unobserve(e.target); }
        }),
        { rootMargin: "300px 0px" }
      );
      lazyVideos.forEach((v) => vio.observe(v));
    } else {
      lazyVideos.forEach(load);
    }
  }

  /* Video cards: play on hover/focus, pause+rewind on leave. Cards are
     keyboard-operable (Enter/Space) since they carry tabindex + role. */
  document.querySelectorAll(".video-card").forEach((card) => {
    const vid = card.querySelector("video");
    if (!vid) return;
    // clips marked data-autoloop start on their own and keep running, so the
    // hover/blur pair must not pause them the moment the pointer leaves
    const autoloop = "autoloop" in vid.dataset;
    const play = () => {
      if (vid.dataset.src) { vid.src = vid.dataset.src; delete vid.dataset.src; }
      vid.play().catch(() => {});
    };
    const stop = () => { vid.pause(); vid.currentTime = 0; };
    const toggle = () => { if (vid.paused) play(); else vid.pause(); };

    if (!autoloop) {
      card.addEventListener("mouseenter", play);
      card.addEventListener("mouseleave", stop);
      card.addEventListener("focus", play);
      card.addEventListener("blur", stop);
    }
    card.addEventListener("click", toggle);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        toggle();
      }
    });
  });

  /* Mobile nav button state for assistive tech */
  if (burger && mobileMenu) {
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-controls", "mobile-menu");
    mobileMenu.id = mobileMenu.id || "mobile-menu";
    const syncBurger = () =>
      burger.setAttribute("aria-expanded", mobileMenu.classList.contains("open") ? "true" : "false");
    burger.addEventListener("click", syncBurger);
    mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", syncBurger));
  }

  /* Tally form embed — only injected when a real form ID has been filled
     in, so the page never shows a broken iframe. Until then the email
     fallback already in the markup stays visible. */
  document.querySelectorAll(".tally-embed").forEach((box) => {
    const id = box.getAttribute("data-tally-form-id");
    if (!id || id === "REPLACE_WITH_TALLY_FORM_ID") return;
    const frame = document.createElement("iframe");
    frame.src = "https://tally.so/embed/" + id +
                "?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";
    frame.title = "문의 폼";
    frame.loading = "lazy";
    frame.height = box.getAttribute("data-tally-height") || "640";
    const fallback = box.querySelector(".tally-fallback");
    if (fallback) fallback.remove();
    box.appendChild(frame);
  });

  /* Dark service list — accordion. Click still toggles a row manually;
     scrolling also auto-opens whichever row's head is nearest the trigger
     line, so the section can "narrate itself" as the user scrolls. */
  const serviceRows = Array.from(document.querySelectorAll(".service-row"));
  if (serviceRows.length) {
    /* Auto-open follows scroll until the user clicks a row. After that they
       have taken control and scrolling stops fighting them — the previous
       "skip one scroll event" flag is what made this feel laggy and random. */
    let userTookControl = false;
    let openRow = serviceRows.find((r) => r.classList.contains("open")) || null;
    const syncRowAria = () =>
      serviceRows.forEach((r) => {
        const h = r.querySelector(".service-row-head");
        if (h) h.setAttribute("aria-expanded", r.classList.contains("open") ? "true" : "false");
      });
    serviceRows.forEach((row) => {
      const head = row.querySelector(".service-row-head");
      if (!head) return;
      head.setAttribute("role", "button");
      head.setAttribute("tabindex", "0");
      const activate = () => {
        const wasOpen = row.classList.contains("open");
        serviceRows.forEach((r) => r.classList.remove("open"));
        if (!wasOpen) row.classList.add("open");
        openRow = wasOpen ? null : row;
        userTookControl = true;
        syncRowAria();
      };
      head.addEventListener("click", activate);
      head.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          activate();
        }
      });
    });
    syncRowAria();
    const triggerFrac = 0.45; // open the row whose head crosses this line
    let rowTicking = false;
    const updateServiceRows = () => {
      if (userTookControl) return;
      const triggerY = window.innerHeight * triggerFrac;
      let current = null;
      serviceRows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        if (rect.top <= triggerY) current = row;
      });
      // above the section, hold the first row open rather than closing
      // everything, so the list never collapses to a bare set of titles
      if (!current) current = serviceRows[0];
      // bail out when nothing changed: rewriting the classes every frame was
      // restarting the height transition mid-flight, which is what "lagged"
      if (current === openRow) return;
      openRow = current;
      serviceRows.forEach((row) => row.classList.toggle("open", row === current));
      syncRowAria();
    };
    const onServiceScroll = () => {
      if (rowTicking) return;
      rowTicking = true;
      requestAnimationFrame(() => { updateServiceRows(); rowTicking = false; });
    };
    document.addEventListener("scroll", onServiceScroll, { passive: true });
    window.addEventListener("resize", onServiceScroll);
  }

  /* Process timeline — two-column zig-zag (odd steps right, even steps
     left) with a reserved empty centre lane. The connecting SVG path is
     rebuilt from each step's real .step-num badge position, always
     stopping a few pixels short of the badge's lane-facing edge, so it
     visually arrives beside every badge but can never be drawn across
     any heading, paragraph, icon, or card. Progressive draw uses
     stroke-dasharray/stroke-dashoffset tied to scroll position; the path
     (and dash values) are fully recomputed on resize. Respects
     prefers-reduced-motion by skipping the animated reveal. */
  const timeline = document.querySelector(".process-timeline");
  if (timeline) {
    const svg = timeline.querySelector(".process-svg");
    const path = svg ? svg.querySelector("path") : null;
    const steps = Array.from(timeline.querySelectorAll(".process-step"));
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const MOBILE_BP = 760;
    const LANE_PAD = 26;   // keep the ink this far inside the empty lane
                           // (generous: the spline can overshoot its own
                           //  waypoints by a few px on wide sweeps)
    let pathLength = 0;

    /* Catmull-Rom spline through a list of waypoints, emitted as cubic
       beziers. Because every control point is derived from its two
       neighbours, the result is C1-continuous — smooth, hand-drawn-feeling
       curves rather than stitched-together straight diagonals — and it can
       pass through a ring of points to form a genuine loop. */
    const splineToPath = (p) => {
      if (p.length < 2) return "";
      const f = (n) => Math.round(n * 100) / 100;
      let d = "M " + f(p[0].x) + " " + f(p[0].y);
      for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[i - 1] || p[i];
        const p1 = p[i];
        const p2 = p[i + 1];
        const p3 = p[i + 2] || p2;
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += " C " + f(c1x) + " " + f(c1y) + ", " + f(c2x) + " " + f(c2y) +
             ", " + f(p2.x) + " " + f(p2.y);
      }
      return d;
    };

    const buildPath = () => {
      if (!svg || !path || steps.length < 2) return 0;
      const svgRect = svg.getBoundingClientRect();
      const isMobile = window.innerWidth <= MOBILE_BP;
      const n = steps.length;

      const badges = steps.map((s) => s.querySelector(".step-num").getBoundingClientRect());
      const ys = badges.map((r) => r.top + r.height / 2 - svgRect.top);
      const pts = [];

      if (isMobile) {
        /* Simplified single-column version: a gentle vertical ripple down
           the badge column, all copy sitting to its right. No loops. */
        const x0 = badges[0].left + badges[0].width / 2 - svgRect.left;
        pts.push({ x: x0, y: ys[0] - 34 });
        for (let i = 0; i < n; i++) {
          pts.push({ x: x0, y: ys[i] });
          if (i < n - 1) {
            const dy = ys[i + 1] - ys[i];
            pts.push({ x: x0 - 9, y: ys[i] + dy * 0.34 });
            pts.push({ x: x0 + 9, y: ys[i] + dy * 0.68 });
          }
        }
        pts.push({ x: x0, y: ys[n - 1] + 34 });
      } else {
        /* Desktop: derive the empty lane from the real column edges, so the
           ink is structurally confined to the gap between the two columns
           and can never reach a heading, paragraph, icon or badge. */
        let laneL = -Infinity, laneR = Infinity;
        steps.forEach((s) => {
          const b = s.getBoundingClientRect();
          if (s.getAttribute("data-side") === "left") laneL = Math.max(laneL, b.right - svgRect.left);
          else laneR = Math.min(laneR, b.left - svgRect.left);
        });
        if (!isFinite(laneL) || !isFinite(laneR) || laneR - laneL < 40) return 0;

        const L = laneL + LANE_PAD;
        const R = laneR - LANE_PAD;
        const C = (L + R) / 2;
        const clampX = (x) => Math.max(L, Math.min(R, x));
        const sideX = (i) => (steps[i].getAttribute("data-side") === "left" ? L : R);

        // The sketch starts level with step 01 (no lead-in above it) and ends
        // with a short tail curving back toward the centre below step 04.
        for (let i = 0; i < n; i++) {
          pts.push({ x: sideX(i), y: ys[i] });
          if (i === n - 1) break;

          const y0 = ys[i], dy = ys[i + 1] - y0;
          const bx = sideX(i + 1);

          // Exactly one waypoint per gap: a single wide sweep that leans past
          // centre toward the next step. One waypoint means one inflection per
          // gap, so the whole path reads as one continuous S — no knots,
          // wiggles or loops.
          pts.push({ x: clampX(C + (bx - C) * 1.3), y: y0 + dy * 0.55 });
        }
        pts.push({ x: clampX(C + (R - C) * 0.5), y: ys[n - 1] + 66 });
      }

      path.setAttribute("d", splineToPath(pts));
      return path.getTotalLength();
    };

    const updateTimeline = () => {
      const rect = timeline.getBoundingClientRect();
      const viewportMid = window.innerHeight * 0.6;
      const progressed = viewportMid - rect.top;
      const pct = Math.max(0, Math.min(1, rect.height > 0 ? progressed / rect.height : 0));
      if (path && pathLength) {
        path.style.strokeDashoffset = reduceMotion ? "0" : String(pathLength * (1 - pct));
      }
      steps.forEach((step, i) => {
        const stepPct = (i + 0.5) / steps.length;
        step.classList.toggle("active", pct >= stepPct);
      });
    };

    const recalc = () => {
      pathLength = buildPath();
      if (path && pathLength) {
        path.style.strokeDasharray = String(pathLength);
        path.style.strokeDashoffset = reduceMotion ? "0" : String(pathLength);
      }
      updateTimeline();
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { updateTimeline(); ticking = false; });
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", recalc);
    recalc();
  }

  /* WORK grid — 5 projects shown, the rest revealed by the toggle. */
  const workMore = document.querySelector(".work-more");
  if (workMore) {
    const hidden = Array.from(document.querySelectorAll(".work-item.is-hidden"));
    const label = workMore.querySelector(".label");
    if (!hidden.length) {
      workMore.parentElement.style.display = "none";
    } else {
      workMore.addEventListener("click", () => {
        const open = workMore.getAttribute("aria-expanded") === "true";
        hidden.forEach((el) => el.classList.toggle("is-hidden", open));
        workMore.setAttribute("aria-expanded", open ? "false" : "true");
        if (label) label.textContent = open ? "프로젝트 더 보기" : "접기";
        if (open) {
          const grid = document.querySelector(".work-grid");
          if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }

  /* 3D text ribbon.
     Each glyph becomes its own element positioned at its true angle on the
     cylinder: we measure the string on a canvas, then convert each glyph's
     cumulative width into degrees. Deriving the radius from the total width
     (r = width / 2π) is what makes the band close on itself exactly, with
     identical letter spacing at every font size — so it stays correct on
     mobile without any hand-tuned breakpoint values. */
  const ribbonStage = document.querySelector(".ribbon-stage");
  if (ribbonStage) {
    const layers = Array.from(ribbonStage.querySelectorAll(".ribbon"));
    const text = ribbonStage.getAttribute("data-text") || "";
    const ctx = document.createElement("canvas").getContext("2d");

    const buildRibbon = () => {
      if (!layers.length || !text || !ctx) return;
      const cs = getComputedStyle(ribbonStage);
      const fs = parseFloat(cs.getPropertyValue("--fs")) || 28;
      ctx.font = "800 " + fs + "px " + cs.fontFamily;

      const chars = Array.from(text);
      const widths = chars.map((ch) => ctx.measureText(ch === " " ? " " : ch).width);
      const total = widths.reduce((a, b) => a + b, 0);
      if (!total) return;

      ribbonStage.style.setProperty("--r", (total / (2 * Math.PI)).toFixed(2) + "px");

      let acc = 0;
      const html = chars.map((ch, i) => {
        const angle = ((acc + widths[i] / 2) / total) * 360;
        acc += widths[i];
        const safe = ch === " "
          ? "&nbsp;"
          : ch.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return '<span class="rc" style="--a:' + angle.toFixed(2) + '">' + safe + "</span>";
      }).join("");

      layers.forEach((layer) => { layer.innerHTML = html; });
    };

    buildRibbon();
    // glyph widths change once the webfont swaps in, so measure again
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(buildRibbon).catch(() => {});
    }
    let ribbonTimer;
    window.addEventListener("resize", () => {
      clearTimeout(ribbonTimer);
      ribbonTimer = setTimeout(buildRibbon, 180);
    });
  }

  /* Founders carousel — the active card is scaled with a transform rather
     than resized, so its layout box never changes and the track's centring
     maths stays exact at every index and viewport width. */
  const fTrack = document.getElementById("f-track");
  if (fTrack) {
    const cards = Array.from(fTrack.querySelectorAll(".f-card"));
    const stage = fTrack.parentElement;
    const story = document.querySelector("#f-story p");
    const cur = document.getElementById("f-cur");
    const total = document.getElementById("f-total");
    const pad = (n) => String(n + 1).padStart(2, "0");
    let idx = 0;

    if (total) total.textContent = pad(cards.length - 1);

    const render = () => {
      const card = cards[idx];
      cards.forEach((c, i) => c.classList.toggle("active", i === idx));
      // centre the active card inside the stage
      const shift = stage.offsetWidth / 2 - (card.offsetLeft + card.offsetWidth / 2);
      fTrack.style.transform = "translate3d(" + shift + "px,0,0)";
      if (story) story.textContent = card.getAttribute("data-story") || "";
      if (cur) cur.textContent = pad(idx);
    };

    const go = (n) => {
      idx = (n + cards.length) % cards.length;
      render();
    };

    cards.forEach((c, i) => c.addEventListener("click", () => go(i)));
    const prev = document.getElementById("f-prev");
    const next = document.getElementById("f-next");
    if (prev) prev.addEventListener("click", () => go(idx - 1));
    if (next) next.addEventListener("click", () => go(idx + 1));
    fTrack.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
    });

    window.addEventListener("resize", render);
    // images affect offsetLeft once loaded, so re-centre after they land
    window.addEventListener("load", render);
    render();
  }

  /* Count-up on the stats strip, once, when it scrolls into view. */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const run = (el) => {
      const target = parseFloat(el.getAttribute("data-count"));
      const prefix = el.getAttribute("data-prefix") || "";
      const suffix = el.getAttribute("data-suffix") || "";
      if (reduce || !isFinite(target)) return;
      const dur = 1600;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        // ease-out cubic: fast start, settles onto the real figure
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(target * eased).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ("IntersectionObserver" in window) {
      const cio = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); }
        }),
        { threshold: 0.5 }
      );
      counters.forEach((el) => cio.observe(el));
    }
  }

  /* Contact form (static demo submit) */
  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const success = document.querySelector(".form-success");
      if (success) {
        success.classList.add("show");
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
    });
  }

  /* Sticky nav shadow on scroll */
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 8) nav.style.boxShadow = "0 1px 0 rgba(0,0,0,.04)";
      else nav.style.boxShadow = "none";
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Footer year */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
