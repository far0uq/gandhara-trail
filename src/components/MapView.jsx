import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import GandharaLogo from "./GandharaLogo";
import "./MapView.css";

const ROUTES = [
  {
    label: "Route#01",
    color: "#FFCF21",
    offset: "translate(18%,15%) scale(0.60)",
    offsetTablet: "translate(12%, 20%) scale(0.70)",
    offsetMobile: "translate(6%, 45%) scale(1)",
    idle: "/paths/route-01/idle.png",
    hover: "/paths/route-01/hover.webm",
    press: "/paths/route-01/press.webm",
    release: "/paths/route-01/release.webm",
  },
  {
    label: "Route#02",
    color: "#FF7D37",
    offset: "translate(-20%, 0%) scale(0.60)",
    offsetTablet: "translate(-14%, 6%) scale(0.70)",
    offsetMobile: "translate(-8%, 30%) scale(1)",
    idle: "/paths/route-02/idle.png",
    hover: "/paths/route-02/hover.webm",
    press: "/paths/route-02/press.webm",
    release: "/paths/route-02/release.webm",
  },
  {
    label: "Route#03",
    color: "#FF3E37",
    offset: "translate(18%, -20%) scale(0.60)",
    offsetTablet: "translate(12%,-13%) scale(0.70)",
    offsetMobile: "translate(6%, 12%) scale(1)",
    idle: "/paths/route-03/idle.png",
    hover: "/paths/route-03/hover.webm",
    press: "/paths/route-03/press.webm",
    release: "/paths/route-03/release.webm",
  },
];

function RoutePath({ route, hovered, pressed, imgRef, videoSrcs }) {
  const hoverVideoRef = useRef(null);
  const pressVideoRef = useRef(null);
  const releaseVideoRef = useRef(null);
  const reverseRaf = useRef(null);
  const wasPressed = useRef(false);
  const [visualState, setVisualState] = useState("idle");

  const cancelReverse = () => {
    if (reverseRaf.current != null) {
      cancelAnimationFrame(reverseRaf.current);
      reverseRaf.current = null;
    }
  };

  // outgoing clips only get hidden via opacity, not stopped - left playing,
  // one can keep advancing in the background and fire a stale "ended" event
  // that yanks the visual state away from whatever's happening by then, which
  // shows up as glitching under rapid presses. Pausing whichever clip isn't
  // the active one on every transition keeps only one ever running.
  const pauseExcept = (keepRef) => {
    [hoverVideoRef, pressVideoRef, releaseVideoRef].forEach((ref) => {
      if (ref !== keepRef && ref.current && !ref.current.paused) {
        ref.current.pause();
      }
    });
  };

  const reverseHoverOut = () => {
    const video = hoverVideoRef.current;
    pauseExcept(hoverVideoRef);
    if (!video || video.currentTime <= 0) {
      setVisualState("idle");
      return;
    }
    // hover ended: scrub the same clip backwards to its start instead of
    // just snapping back to the idle image
    setVisualState("hover");
    video.pause();
    let last = performance.now();
    const step = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      video.currentTime = Math.max(0, video.currentTime - dt);
      if (video.currentTime <= 0.001) {
        reverseRaf.current = null;
        setVisualState("idle");
        return;
      }
      reverseRaf.current = requestAnimationFrame(step);
    };
    reverseRaf.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (pressed) {
      cancelReverse();
      wasPressed.current = true;
      setVisualState("pressed");
      const video = pressVideoRef.current;
      if (video) {
        pauseExcept(pressVideoRef);
        video.currentTime = 0;
        video.play().catch(() => {});
      }
      return cancelReverse;
    }

    if (wasPressed.current) {
      // mouse was just released: play the release clip once, then settle
      // into hover/idle once it finishes (handled by the "ended" effect below)
      wasPressed.current = false;
      cancelReverse();
      setVisualState("released");
      const video = releaseVideoRef.current;
      if (video) {
        pauseExcept(releaseVideoRef);
        video.currentTime = 0;
        video.play().catch(() => {});
      }
      return cancelReverse;
    }

    if (hovered) {
      cancelReverse();
      setVisualState("hover");
      const video = hoverVideoRef.current;
      if (video) {
        pauseExcept(hoverVideoRef);
        video.play().catch(() => {});
      }
      return cancelReverse;
    }

    reverseHoverOut();
    return cancelReverse;
  }, [hovered, pressed]);

  useEffect(() => {
    const video = releaseVideoRef.current;
    if (!video) return undefined;
    const onEnded = () => {
      if (hovered) {
        cancelReverse();
        setVisualState("hover");
        const hoverVideo = hoverVideoRef.current;
        if (hoverVideo) {
          pauseExcept(hoverVideoRef);
          hoverVideo.currentTime = hoverVideo.duration || 0;
        }
      } else {
        reverseHoverOut();
      }
    };
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, [hovered]);

  return (
    <>
      <img
        ref={imgRef}
        className="map-path"
        src={route.idle}
        alt=""
        style={{ opacity: visualState === "idle" ? 1 : 0 }}
      />
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

function MapView() {
  const ctaRef = useRef(null);
  const arrowRef = useRef(null);
  const hoverTl = useRef(null);
  const breakpoint = useBreakpoint();

  const [activeRoute, setActiveRoute] = useState(null);
  const [pressedRoute, setPressedRoute] = useState(null);

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
      [route.hover, route.press, route.release].forEach((path) => {
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
        alphaMaps.current[route.label] = {
          width: canvas.width,
          height: canvas.height,
          data: ctx.getImageData(0, 0, canvas.width, canvas.height).data,
        };
      };
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hitTestRoute = (clientX, clientY) => {
    for (let i = ROUTES.length - 1; i >= 0; i--) {
      const route = ROUTES[i];
      const img = imgRefs.current[route.label];
      const alpha = alphaMaps.current[route.label];
      if (!img || !alpha) continue;

      const rect = img.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      )
        continue;

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
      const alphaValue = alpha.data[(py * alpha.width + px) * 4 + 3];
      if (alphaValue > 10) return route.label;
    }
    return null;
  };

  const handleMapMouseMove = (e) => {
    const label = hitTestRoute(e.clientX, e.clientY);
    setActiveRoute((current) => (current === label ? current : label));
  };

  const handleMapMouseLeave = () => setActiveRoute(null);

  const handleMapMouseDown = (e) => {
    const label = hitTestRoute(e.clientX, e.clientY);
    if (label) handleRoutePress(label);
  };

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
    <div className="map-view">
      <div
        className={`map-paths${activeRoute ? " is-hovering" : ""}`}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleMapMouseLeave}
        onMouseDown={handleMapMouseDown}
      >
        {ROUTES.map((route) => (
          <div
            key={route.label}
            className="map-path-group"
            style={{
              transform: routeOffset(route, breakpoint),
            }}
          >
            <RoutePath
              route={route}
              hovered={activeRoute === route.label}
              pressed={pressedRoute === route.label}
              imgRef={(el) => {
                imgRefs.current[route.label] = el;
              }}
              videoSrcs={{
                hover: videoBlobUrls[route.hover],
                press: videoBlobUrls[route.press],
                release: videoBlobUrls[route.release],
              }}
            />
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
            className="route-row"
            key={route.label}
            onMouseEnter={() => handleRouteEnter(route.label)}
            onMouseLeave={() => handleRouteLeave(route.label)}
            onMouseDown={() => handleRoutePress(route.label)}
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
    </div>
  );
}

export default MapView;
