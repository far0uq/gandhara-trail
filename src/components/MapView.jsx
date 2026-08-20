import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import GandharaLogo from "./GandharaLogo";
import "./MapView.css";

const ROUTES = [
  {
    label: "Route#01",
    color: "#FFCF21",
    offset: "translate(18%,16%) scale(0.62)",
    hitbox: "39.5% 14.7% 39% 14.6%",
    idle: "/paths/route-01/idle.png",
    hover: "/paths/route-01/hover.webm",
    click: "/paths/route-01/click.webm",
  },
  {
    label: "Route#02",
    color: "#FF7D37",
    offset: "translate(-20%, 0%) scale(0.62)",
    hitbox: "38.9% 14.3% 39.4% 14.6%",
    idle: "/paths/route-02/idle.png",
    hover: "/paths/route-02/hover.webm",
    click: "/paths/route-02/click.webm",
  },
  {
    label: "Route#03",
    color: "#FF3E37",
    offset: "translate(18%, -18%) scale(0.62)",
    hitbox: "25.8% 15.6% 25.9% 16.2%",
    idle: "/paths/route-03/idle.png",
    hover: "/paths/route-03/hover.webm",
    click: "/paths/route-03/click.webm",
  },
];

function RoutePath({ route, hovered, selected, onEnter, onLeave, onClick }) {
  const hoverVideoRef = useRef(null);
  const clickVideoRef = useRef(null);
  const reverseRaf = useRef(null);
  const [visualState, setVisualState] = useState("idle");

  const cancelReverse = () => {
    if (reverseRaf.current != null) {
      cancelAnimationFrame(reverseRaf.current);
      reverseRaf.current = null;
    }
  };

  useEffect(() => {
    const video = hoverVideoRef.current;
    if (!video) return undefined;

    if (selected) {
      cancelReverse();
      setVisualState("clicked");
      return cancelReverse;
    }

    if (hovered) {
      cancelReverse();
      setVisualState("hover");
      video.play().catch(() => {});
      return cancelReverse;
    }

    if (video.currentTime > 0) {
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
    } else {
      setVisualState("idle");
    }

    return cancelReverse;
  }, [hovered, selected]);

  useEffect(() => {
    const video = clickVideoRef.current;
    if (!video || !selected) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }, [selected]);

  return (
    <div
      className="map-path-hit"
      style={{ inset: route.hitbox }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <img
        className="map-path"
        src={route.idle}
        alt=""
        style={{ opacity: visualState === "idle" ? 1 : 0 }}
      />
      <video
        ref={hoverVideoRef}
        className="map-path"
        src={route.hover}
        muted
        playsInline
        style={{ opacity: visualState === "hover" ? 1 : 0 }}
      />
      <video
        ref={clickVideoRef}
        className="map-path"
        src={route.click}
        muted
        playsInline
        style={{ opacity: visualState === "clicked" ? 1 : 0 }}
      />
    </div>
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

function MapView() {
  const ctaRef = useRef(null);
  const arrowRef = useRef(null);
  const hoverTl = useRef(null);

  const [activeRoute, setActiveRoute] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const handleRouteEnter = (label) => setActiveRoute(label);
  const handleRouteLeave = (label) =>
    setActiveRoute((current) => (current === label ? null : current));
  const handleRouteClick = (label) =>
    setSelectedRoute((current) => (current === label ? null : label));

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
      <div className="map-paths">
        {ROUTES.map((route) => (
          <div
            key={route.label}
            className="map-path-group"
            style={{ transform: route.offset }}
          >
            <RoutePath
              route={route}
              hovered={activeRoute === route.label}
              selected={selectedRoute === route.label}
              onEnter={() => handleRouteEnter(route.label)}
              onLeave={() => handleRouteLeave(route.label)}
              onClick={() => handleRouteClick(route.label)}
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
            className={`route-row${selectedRoute === route.label ? " is-selected" : ""}`}
            key={route.label}
            onMouseEnter={() => handleRouteEnter(route.label)}
            onMouseLeave={() => handleRouteLeave(route.label)}
            onClick={() => handleRouteClick(route.label)}
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
