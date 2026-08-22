import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import GandharaLogo from "./GandharaLogo";
import RoutePins from "./RoutePins";
import OverlayPanel from "./OverlayPanel";
import SiteOverlay from "./SiteOverlay";
import PathOverlay from "./PathOverlay";
import useExitTransition from "../hooks/useExitTransition";
import SITES from "../data/sites.json";
import SEGMENTS from "../data/segments.json";
import "./MapView.css";

const ROUTES = [
  {
    label: "Route#01",
    color: "#FFCF21",
    offset: "translate(18%,15%) scale(0.60)",
    offsetTablet: "translate(12%, 20%) scale(0.70)",
    offsetMobile: "translate(6%, 45%) scale(1)",
    // pin is the site's dot on the idle artwork, as a fraction of its width
    // and height - detected from the dark markers drawn into the PNG
    sites: [
      { id: "taxila-museum", name: "Taxila Museum", pin: [0.1902, 0.4704] },
      {
        id: "dharmarajika",
        name: "Dharmarajika Stupa & Monastery",
        pin: [0.4831, 0.5381],
      },
      { id: "julian", name: "Julian", pin: [0.5387, 0.5534] },
      { id: "bhamala-stupa", name: "Bhamala Stupa", pin: [0.6759, 0.4652] },
      {
        id: "gurudwara-sri-panja-sahib",
        name: "Gurudwara Sri Panja Sahib",
        pin: [0.809, 0.4427],
      },
    ],
    idle: "/paths/route-01/idle.png",
    hover: "/paths/route-01/hover.webm",
    leave: "/paths/route-01/leave.webm",
    press: "/paths/route-01/press.webm",
    release: "/paths/route-01/release.webm",
  },
  {
    label: "Route#02",
    color: "#FF7D37",
    offset: "translate(-20%, 0%) scale(0.60)",
    offsetTablet: "translate(-14%, 6%) scale(0.70)",
    offsetMobile: "translate(-8%, 30%) scale(1)",
    sites: [
      { id: "hund-museum", name: "Hund Museum", pin: [0.1911, 0.4854] },
      { id: "aziz-dheri", name: "Aziz Dheri", pin: [0.2823, 0.5277] },
      { id: "peshawar-museum", name: "Peshawar Museum", pin: [0.5242, 0.5534] },
      {
        id: "gor-ghatri",
        name: "Gor Ghatri, Heritage Trail, Sethi House",
        pin: [0.6016, 0.483],
      },
      {
        id: "khyber-pass",
        name: "Khyber Pass, Jamrud Fort",
        pin: [0.6948, 0.4351],
      },
      { id: "shapola-stupa", name: "Shapola Stupa", pin: [0.8081, 0.5425] },
    ],
    idle: "/paths/route-02/idle.png",
    hover: "/paths/route-02/hover.webm",
    leave: "/paths/route-02/leave.webm",
    press: "/paths/route-02/press.webm",
    release: "/paths/route-02/release.webm",
  },
  {
    label: "Route#03",
    color: "#FF3E37",
    offset: "translate(18%, -20%) scale(0.60)",
    offsetTablet: "translate(12%,-13%) scale(0.70)",
    offsetMobile: "translate(6%, 12%) scale(1)",
    // NOTE: this route branches, so the left-to-right order the dots were
    // detected in may not match the real visiting order - reorder if needed
    sites: [
      { id: "takht-i-bahi", name: "Takht-i-Bahi", pin: [0.2037, 0.5372] },
      {
        id: "ashoka-rock-edicts",
        name: "Ashoka Rock Edicts",
        pin: [0.3535, 0.6118],
      },
      { id: "jamal-ghari", name: "Jamal Ghari", pin: [0.3977, 0.38] },
      { id: "baziri-barikot", name: "Baziri Barikot", pin: [0.4221, 0.3086] },
      { id: "ghaznavi-mosque", name: "Ghaznavi Mosque", pin: [0.5409, 0.6894] },
      {
        id: "saidu-stupa",
        name: "Saidu Stupa, Swat Museum",
        pin: [0.7014, 0.6698],
      },
      {
        id: "amluk-dara-stupa",
        name: "Amluk Dara Stupa Swat",
        pin: [0.7895, 0.4526],
      },
    ],
    idle: "/paths/route-03/idle.png",
    hover: "/paths/route-03/hover.webm",
    leave: "/paths/route-03/leave.webm",
    press: "/paths/route-03/press.webm",
    release: "/paths/route-03/release.webm",
  },
];

function RoutePath({ route, hovered, pressed, imgRef, videoSrcs }) {
  const hoverVideoRef = useRef(null);
  const leaveVideoRef = useRef(null);
  const pressVideoRef = useRef(null);
  const releaseVideoRef = useRef(null);
  const wasPressed = useRef(false);
  // whether the path is currently showing something other than idle, so the
  // leave clip only runs when there is actually a hover to come out of
  const isRaised = useRef(false);
  const [visualState, setVisualState] = useState("idle");

  // outgoing clips only get hidden via opacity, not stopped - left playing,
  // one can keep advancing in the background and fire a stale "ended" event
  // that yanks the visual state away from whatever's happening by then, which
  // shows up as glitching under rapid presses. Pausing whichever clip isn't
  // the active one on every transition keeps only one ever running.
  const pauseExcept = (keepRef) => {
    [hoverVideoRef, leaveVideoRef, pressVideoRef, releaseVideoRef].forEach(
      (ref) => {
        if (ref !== keepRef && ref.current && !ref.current.paused) {
          ref.current.pause();
        }
      },
    );
  };

  const playLeave = () => {
    const video = leaveVideoRef.current;
    if (!isRaised.current || !video) {
      pauseExcept(null);
      isRaised.current = false;
      setVisualState("idle");
      return;
    }
    isRaised.current = false;
    pauseExcept(leaveVideoRef);
    setVisualState("leaving");
    video.currentTime = 0;
    video.play().catch(() => {});
  };

  useEffect(() => {
    if (pressed) {
      isRaised.current = true;
      wasPressed.current = true;
      setVisualState("pressed");
      const video = pressVideoRef.current;
      if (video) {
        pauseExcept(pressVideoRef);
        video.currentTime = 0;
        video.play().catch(() => {});
      }
      return;
    }

    if (wasPressed.current) {
      // mouse was just released: play the release clip once, then settle
      // into hover/leave once it finishes (handled by the "ended" effect below)
      wasPressed.current = false;
      setVisualState("released");
      const video = releaseVideoRef.current;
      if (video) {
        pauseExcept(releaseVideoRef);
        video.currentTime = 0;
        video.play().catch(() => {});
      }
      return;
    }

    if (hovered) {
      isRaised.current = true;
      setVisualState("hover");
      const video = hoverVideoRef.current;
      if (video) {
        pauseExcept(hoverVideoRef);
        video.play().catch(() => {});
      }
      return;
    }

    playLeave();
  }, [hovered, pressed]);

  // the leave clip runs once and hands back to the idle image
  useEffect(() => {
    const video = leaveVideoRef.current;
    if (!video) return undefined;
    const onEnded = () => setVisualState("idle");
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, [videoSrcs.leave]);

  useEffect(() => {
    const video = releaseVideoRef.current;
    if (!video) return undefined;
    const onEnded = () => {
      if (hovered) {
        setVisualState("hover");
        const hoverVideo = hoverVideoRef.current;
        if (hoverVideo) {
          pauseExcept(hoverVideoRef);
          hoverVideo.currentTime = hoverVideo.duration || 0;
        }
      } else {
        playLeave();
      }
    };
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, [hovered]);

  return (
    <>
      {/* the idle art stays put underneath and the clips play over it - fading
          it out in step with them left both layers part-transparent mid-swap,
          which showed as a flash of the map through the path */}
      <img ref={imgRef} className="map-path" src={route.idle} alt="" />
      {videoSrcs.hover && (
        <video
          ref={hoverVideoRef}
          className="map-path"
          src={videoSrcs.hover}
          preload="auto"
          muted
          playsInline
          style={{ opacity: visualState === "hover" ? 1 : 0 }}
        />
      )}
      {videoSrcs.leave && (
        <video
          ref={leaveVideoRef}
          className="map-path"
          src={videoSrcs.leave}
          preload="auto"
          muted
          playsInline
          style={{ opacity: visualState === "leaving" ? 1 : 0 }}
        />
      )}
      {videoSrcs.press && (
        <video
          ref={pressVideoRef}
          className="map-path"
          src={videoSrcs.press}
          preload="auto"
          muted
          playsInline
          style={{ opacity: visualState === "pressed" ? 1 : 0 }}
        />
      )}
      {videoSrcs.release && (
        <video
          ref={releaseVideoRef}
          className="map-path"
          src={videoSrcs.release}
          preload="auto"
          muted
          playsInline
          style={{ opacity: visualState === "released" ? 1 : 0 }}
        />
      )}
    </>
  );
}
function ArrowIcon({ ref }) {
  return (
    <svg
      ref={ref}
      className="map-cta-arrow"
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="18"
      viewBox="0 0 17 18"
      fill="none"
    >
      <path
        d="M16.7186 0.983609C16.7096 0.431399 16.2546 -0.00891798 15.7024 0.000134397L6.70357 0.147656C6.15136 0.156709 5.71104 0.611703 5.72009 1.16391C5.72915 1.71612 6.18414 2.15644 6.73635 2.14739L14.7353 2.01626L14.8664 10.0152C14.8755 10.5674 15.3305 11.0077 15.8827 10.9987C16.4349 10.9896 16.8752 10.5346 16.8661 9.9824L16.7186 0.983609ZM0.71875 16.5L1.43735 17.1954L16.4374 1.69542L15.7187 1L15.0001 0.304579L0.000147879 15.8046L0.71875 16.5Z"
        fill="#FCFAE9"
      />
    </svg>
  );
}

const CTA_LABEL = "Book your tickets";

// three tiers so each route's map position/scale can be tuned per device
// class: desktop (default), tablet (768-1024px, matches the app's existing
// mobile CSS breakpoint), and phone (<768px)
function getBreakpoint() {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia("(max-width: 767px)").matches) return "mobile";
  if (window.matchMedia("(max-width: 1024px)").matches) return "tablet";
  return "desktop";
}

function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(getBreakpoint);

  useEffect(() => {
    const mqlPhone = window.matchMedia("(max-width: 767px)");
    const mqlTablet = window.matchMedia("(max-width: 1024px)");
    const onChange = () => setBreakpoint(getBreakpoint());
    mqlPhone.addEventListener("change", onChange);
    mqlTablet.addEventListener("change", onChange);
    return () => {
      mqlPhone.removeEventListener("change", onChange);
      mqlTablet.removeEventListener("change", onChange);
    };
  }, []);

  return breakpoint;
}

function routeOffset(route, breakpoint) {
  if (breakpoint === "mobile") return route.offsetMobile;
  if (breakpoint === "tablet") return route.offsetTablet;
  return route.offset;
}

// written out rather than "none" so the browser can interpolate the zoom
// smoothly in both directions
const IDENTITY_TRANSFORM = "translate(0px, 0px) scale(1)";

// how much of the frame the focus view keeps clear for the header, legend,
// site list and CTA, as a fraction of the container
const FOCUS_INSET = {
  desktop: { x: 0.18, top: 0.2, bottom: 0.3 },
  tablet: { x: 0.13, top: 0.16, bottom: 0.32 },
  mobile: { x: 0.08, top: 0.14, bottom: 0.44 },
};

// keep in step with .map-pin in MapView.css - the zoom has to reserve room
// above the path for the pins, which stand well clear of the artwork
const PIN_WIDTH_RATIO = 0.04;
const PIN_ASPECT = 178 / 80;

// must match the route-focus-out animation in MapView.css
const FOCUS_UI_EXIT_MS = 350;

// must match the .map-paths transform transition in MapView.css
const ZOOM_MS = 850;

// must match the overlay-slide-out animation in Overlay.css
const OVERLAY_EXIT_MS = 320;

function MapView() {
  const ctaRef = useRef(null);
  const arrowRef = useRef(null);
  const hoverTl = useRef(null);
  const breakpoint = useBreakpoint();

  const [activeRoute, setActiveRoute] = useState(null);
  const [pressedRoute, setPressedRoute] = useState(null);
  const [focusedRoute, setFocusedRoute] = useState(null);
  const [showDistances, setShowDistances] = useState(false);
  const [focusTransform, setFocusTransform] = useState(IDENTITY_TRANSFORM);
  const pathsRef = useRef(null);

  // the focus panels outlive focusedRoute by one animation so they can play
  // their entrance in reverse on the way out instead of vanishing
  const [uiRoute, setUiRoute] = useState(null);
  const [uiExiting, setUiExiting] = useState(false);
  const uiExitTimer = useRef(null);

  // route queued up behind a zoom-out when switching between routes
  const [pendingRoute, setPendingRoute] = useState(null);
  const pendingFocusTimer = useRef(null);

  // { type: "site" | "path", data } - the trigger points on the map don't
  // exist yet, so for now L and P step through the sample data
  const [overlay, setOverlay] = useState(null);
  const [shownOverlay, overlayExiting] = useExitTransition(
    overlay,
    OVERLAY_EXIT_MS,
  );
  const overlayRef = useRef(null);

  // clicking the pin whose overlay is already open closes it again
  const handlePinSelect = (site, number) => {
    setOverlay((current) =>
      current?.type === "site" && current.data.id === site.id
        ? null
        : {
            type: "site",
            data: { ...SITES[site.id], id: site.id, name: site.name, number },
          },
    );
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key !== "p") return;

      setOverlay((current) => {
        if (current?.type !== "path") return { type: "path", data: SEGMENTS[0] };
        // same key again steps to the next entry, and closes after the last
        const next =
          SEGMENTS.findIndex((item) => item.id === current.data.id) + 1;
        return next < SEGMENTS.length
          ? { type: "path", data: SEGMENTS[next] }
          : null;
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!overlay) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOverlay(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlay]);

  useEffect(
    () => () => {
      if (uiExitTimer.current) clearTimeout(uiExitTimer.current);
      if (pendingFocusTimer.current) clearTimeout(pendingFocusTimer.current);
    },
    [],
  );

  const handleRouteEnter = (label) => setActiveRoute(label);
  const handleRouteLeave = (label) =>
    setActiveRoute((current) => (current === label ? null : current));
  const handleRoutePress = (label) => setPressedRoute(label);

  // release fires globally so a route never gets stuck "pressed" if the
  // mouse is released after moving off it
  useEffect(() => {
    const onUp = () => setPressedRoute(null);
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

  // browsers don't reliably honor preload="auto" for off-screen/invisible
  // <video> elements, so the hover/press/release clips can still be
  // mid-decode the first time they're revealed. Fetching them into memory
  // ourselves and handing the video elements a blob: URL sidesteps that
  // network/decode negotiation entirely.
  const [videoBlobUrls, setVideoBlobUrls] = useState({});

  useEffect(() => {
    let cancelled = false;
    const urls = [];
    ROUTES.forEach((route) => {
      [route.hover, route.leave, route.press, route.release].forEach((path) => {
        fetch(path)
          .then((res) => res.blob())
          .then((blob) => {
            if (cancelled) return;
            const url = URL.createObjectURL(blob);
            urls.push(url);
            setVideoBlobUrls((prev) => ({ ...prev, [path]: url }));
          })
          .catch(() => {});
      });
    });
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // the routes' bounding boxes now overlap on screen, so hovering/clicking
  // the drawn artwork itself has to hit-test against the actual opaque
  // pixels of each route's idle image, not a rectangle
  const imgRefs = useRef({});
  const alphaMaps = useRef({});

  useEffect(() => {
    let cancelled = false;
    ROUTES.forEach((route) => {
      const img = new Image();
      img.src = route.idle;
      img.onload = () => {
        if (cancelled) return;
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        // the drawn stroke only occupies part of the frame, so track its
        // bounds too - that's what the route focus view zooms to
        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            if (data[(y * canvas.width + x) * 4 + 3] <= 10) continue;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }

        alphaMaps.current[route.label] = {
          width: canvas.width,
          height: canvas.height,
          data,
          bbox: { minX, minY, maxX, maxY },
        };
      };
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isPointOnRoute = (label, clientX, clientY) => {
    const img = imgRefs.current[label];
    const alpha = alphaMaps.current[label];
    if (!img || !alpha) return false;

    const rect = img.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    )
      return false;

    const u = (clientX - rect.left) / rect.width;
    const v = (clientY - rect.top) / rect.height;
    const px = Math.min(
      alpha.width - 1,
      Math.max(0, Math.floor(u * alpha.width)),
    );
    const py = Math.min(
      alpha.height - 1,
      Math.max(0, Math.floor(v * alpha.height)),
    );
    return alpha.data[(py * alpha.width + px) * 4 + 3] > 10;
  };

  const hitTestRoute = (clientX, clientY) => {
    for (let i = ROUTES.length - 1; i >= 0; i--) {
      if (isPointOnRoute(ROUTES[i].label, clientX, clientY))
        return ROUTES[i].label;
    }
    return null;
  };

  const handleMapMouseMove = (e) => {
    if (focusedRoute) return;
    const label = hitTestRoute(e.clientX, e.clientY);
    setActiveRoute((current) => (current === label ? current : label));
  };

  const handleMapMouseLeave = () => setActiveRoute(null);

  const handleMapMouseDown = (e) => {
    if (focusedRoute) return;
    const label = hitTestRoute(e.clientX, e.clientY);
    if (label) handleRoutePress(label);
  };

  // scales/pans the whole path layer so the clicked route's drawn artwork
  // fills the clear area of the frame
  const computeFocusTransform = (label) => {
    const container = pathsRef.current;
    const img = imgRefs.current[label];
    const alpha = alphaMaps.current[label];
    if (!container || !img || !alpha) return IDENTITY_TRANSFORM;

    // measure against the un-zoomed layout, so the result doesn't compound
    // with a transform that's already applied
    const prevTransform = container.style.transform;
    const prevTransition = container.style.transition;
    container.style.transition = "none";
    container.style.transform = IDENTITY_TRANSFORM;
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    container.style.transform = prevTransform;
    container.style.transition = prevTransition;

    const { bbox, width: aw, height: ah } = alpha;
    const contentX =
      imgRect.left + (bbox.minX / aw) * imgRect.width - containerRect.left;
    const contentY =
      imgRect.top + (bbox.minY / ah) * imgRect.height - containerRect.top;
    const contentW = ((bbox.maxX - bbox.minX) / aw) * imgRect.width;
    const contentH = ((bbox.maxY - bbox.minY) / ah) * imgRect.height;
    if (!contentW || !contentH) return IDENTITY_TRANSFORM;

    // the pins rise above the dots, so fit the path plus that headroom
    const pinHeight = PIN_WIDTH_RATIO * imgRect.width * PIN_ASPECT;
    const fitY = contentY - pinHeight;
    const fitH = contentH + pinHeight;

    const inset = FOCUS_INSET[breakpoint] ?? FOCUS_INSET.desktop;
    const { width: W, height: H } = containerRect;
    const availLeft = W * inset.x;
    const availTop = H * inset.top;
    const availW = W - availLeft * 2;
    const availH = H - availTop - H * inset.bottom;

    const scale = Math.max(1, Math.min(availW / contentW, availH / fitH, 3));
    const tx = availLeft + availW / 2 - scale * (contentX + contentW / 2);
    const ty = availTop + availH / 2 - scale * (fitY + fitH / 2);

    return `translate(${tx}px, ${ty}px) scale(${scale})`;
  };

  const clearPendingFocus = () => {
    if (pendingFocusTimer.current) {
      clearTimeout(pendingFocusTimer.current);
      pendingFocusTimer.current = null;
    }
    setPendingRoute(null);
  };

  const focusNow = (label) => {
    if (uiExitTimer.current) {
      clearTimeout(uiExitTimer.current);
      uiExitTimer.current = null;
    }
    setActiveRoute(null);
    setPressedRoute(null);
    setShowDistances(false);
    setFocusedRoute(label);
    setUiRoute(label);
    setUiExiting(false);
    setFocusTransform(computeFocusTransform(label));
  };

  const enterFocus = (label) => {
    // already zoomed into this one - don't replay the zoom
    if (label === focusedRoute) return;
    clearPendingFocus();

    // coming straight from another route: unwind to the whole map first, so
    // the switch reads as zoom out then zoom in rather than one slide across
    if (focusedRoute) {
      exitFocus();
      setPendingRoute(label);
      pendingFocusTimer.current = setTimeout(() => {
        pendingFocusTimer.current = null;
        setPendingRoute(null);
        focusNow(label);
      }, ZOOM_MS);
      return;
    }

    focusNow(label);
  };

  const exitFocus = () => {
    clearPendingFocus();
    if (!focusedRoute) return;
    // the zoom starts unwinding straight away, the panels animate out alongside
    setFocusedRoute(null);
    setFocusTransform(IDENTITY_TRANSFORM);
    setUiExiting(true);
    if (uiExitTimer.current) clearTimeout(uiExitTimer.current);
    uiExitTimer.current = setTimeout(() => {
      setUiRoute(null);
      setUiExiting(false);
      uiExitTimer.current = null;
    }, FOCUS_UI_EXIT_MS);
  };

  const handleMapClick = (e) => {
    // an open overlay takes the click - dismiss it and stay zoomed in
    if (overlay) {
      setOverlay(null);
      return;
    }
    // while zoomed in, only the focused path counts as "on the route" - the
    // others are still in the DOM but invisible. Clicking off it zooms back out.
    if (focusedRoute) {
      if (!isPointOnRoute(focusedRoute, e.clientX, e.clientY)) exitFocus();
      return;
    }
    const label = hitTestRoute(e.clientX, e.clientY);
    if (label) {
      enterFocus(label);
      return;
    }
    // clicking away mid-switch cancels the queued route
    if (pendingRoute) clearPendingFocus();
  };

  const focusedRouteData = ROUTES.find((r) => r.label === uiRoute);

  useEffect(() => {
    if (!focusedRoute && !pendingRoute) return undefined;
    const onKeyDown = (e) => {
      // an open overlay takes Escape first
      if (e.key === "Escape" && !overlay) exitFocus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusedRoute, pendingRoute, overlay]);

  // the zoom is measured in pixels, so it has to be recomputed whenever the
  // frame or the routes' own per-breakpoint offsets change
  useEffect(() => {
    if (!focusedRoute) return undefined;
    const onResize = () =>
      setFocusTransform(computeFocusTransform(focusedRoute));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [focusedRoute, breakpoint]);

  const { contextSafe } = useGSAP({ scope: ctaRef });

  const handleEnter = contextSafe(() => {
    hoverTl.current?.kill();
    const letters = ctaRef.current.querySelectorAll(".map-cta-letter");

    hoverTl.current = gsap
      .timeline()
      // text bolds left to right
      .to(letters, {
        fontWeight: 700,
        duration: 0.12,
        stagger: 0.025,
        ease: "none",
      })
      // arrow goes bold
      .to(arrowRef.current, {
        scale: 1.25,
        duration: 0.15,
        ease: "power2.out",
      });
  });

  const handleLeave = contextSafe(() => {
    hoverTl.current?.kill();
    const letters = ctaRef.current.querySelectorAll(".map-cta-letter");

    hoverTl.current = gsap
      .timeline()
      .to(
        letters,
        { fontWeight: 500, duration: 0.15, stagger: 0.015, ease: "none" },
        0,
      )
      .to(arrowRef.current, { rotate: 0, scale: 1, duration: 0.2 }, 0);
  });

  return (
    <div
      className={`map-view${uiRoute ? " is-route-focused" : ""}${
        uiExiting ? " is-focus-exiting" : ""
      }`}
    >
      <div
        ref={pathsRef}
        className={`map-paths${activeRoute ? " is-hovering" : ""}`}
        style={{ transform: focusTransform }}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleMapMouseLeave}
        onMouseDown={handleMapMouseDown}
        onClick={handleMapClick}
      >
        {ROUTES.map((route) => (
          <div
            key={route.label}
            className="map-path-group"
            style={{
              transform: routeOffset(route, breakpoint),
              opacity:
                focusedRoute && focusedRoute !== route.label ? 0 : 1,
            }}
          >
            <RoutePath
              route={route}
              hovered={!focusedRoute && activeRoute === route.label}
              pressed={!focusedRoute && pressedRoute === route.label}
              imgRef={(el) => {
                imgRefs.current[route.label] = el;
              }}
              videoSrcs={{
                hover: videoBlobUrls[route.hover],
                leave: videoBlobUrls[route.leave],
                press: videoBlobUrls[route.press],
                release: videoBlobUrls[route.release],
              }}
            />
            {uiRoute === route.label && (
              <RoutePins
                route={route}
                isExiting={uiExiting}
                onSelect={handlePinSelect}
              />
            )}
          </div>
        ))}
      </div>

      <header className="map-header">
        <GandharaLogo />
        <h1 className="map-title">The Gandhara Trail</h1>
      </header>

      <div className="map-legend">
        {ROUTES.map((route) => (
          <div
            className={`route-row${
              focusedRoute === route.label ? " is-focused" : ""
            }${focusedRoute && focusedRoute !== route.label ? " is-dimmed" : ""}`}
            key={route.label}
            style={{ borderColor: route.color }}
            onMouseEnter={() => !focusedRoute && handleRouteEnter(route.label)}
            onMouseLeave={() => !focusedRoute && handleRouteLeave(route.label)}
            onMouseDown={() => !focusedRoute && handleRoutePress(route.label)}
            onClick={() => enterFocus(route.label)}
          >
            <div className="route-top">
              <span
                className="route-swatch"
                style={{ background: route.color }}
              />
              <span className="route-label">{route.label}</span>
            </div>
            <span className="route-line" />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="map-cta"
        ref={ctaRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <span className="map-cta-text">
          {[...CTA_LABEL].map((char, i) => (
            <span key={i} className="map-cta-letter">
              {char}
            </span>
          ))}
        </span>
        <ArrowIcon ref={arrowRef} />
      </button>

      {focusedRouteData && (
        <>
          <div className="route-hints">
            <span className="route-hint">
              <span className="route-hint-key">[esc]</span> - Exit Route View
            </span>
            <span className="route-hint">
              <span className="route-hint-key">[X]</span> - Route Cinematic Tour
            </span>
          </div>

          <div className="route-panel">
            <button
              type="button"
              className={`route-toggle${showDistances ? " is-on" : ""}`}
              onClick={() => setShowDistances((v) => !v)}
              aria-pressed={showDistances}
            >
              <span className="route-toggle-track">
                <span className="route-toggle-thumb" />
              </span>
              <span className="route-toggle-label">Toggle Distances</span>
            </button>

            <ol
              className="route-sites"
              style={{
                gridTemplateRows: `repeat(${Math.ceil(
                  focusedRouteData.sites.length / 2,
                )}, auto)`,
              }}
            >
              {focusedRouteData.sites.map((site, i) => (
                <li className="route-site" key={site.id}>
                  <span className="route-site-num">{i + 1}.</span>
                  <span className="route-site-name">{site.name}</span>
                </li>
              ))}
            </ol>
          </div>

        </>
      )}

      {shownOverlay && (
        <OverlayPanel
          panelRef={overlayRef}
          isExiting={overlayExiting}
          label={
            shownOverlay.type === "site" ? "Site details" : "Path details"
          }
        >
          {shownOverlay.type === "site" ? (
            <SiteOverlay site={shownOverlay.data} />
          ) : (
            <PathOverlay
              key={shownOverlay.data.id}
              segment={shownOverlay.data}
            />
          )}
        </OverlayPanel>
      )}
    </div>
  );
}

export default MapView;
