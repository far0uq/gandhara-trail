import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import "./LoadingScreen.css";

function LoadingScreen({ onComplete }) {
  const screenRef = useRef(null);
  const bgRef = useRef(null);
  const borderRef = useRef(null);
  const titleRef = useRef(null);
  const logoRef = useRef(null);

  useGSAP(
    () => {
      const startDelay = 0.2;
      // line 2's CSS fade-in (transparent -> #fff) completes at 78.034% of
      // its 11.498296s keyframe loop
      const loadDuration = 14 * 0.78034;

      // fade each image in only once it has actually finished loading, so
      // neither the background nor the logo ever shows a broken/blank flash
      const fadeInWhenLoaded = (src, target) => {
        const img = new Image();
        img.onload = () =>
          gsap.to(target, { opacity: 1, duration: 0.8, ease: "power2.out" });
        img.src = src;
        if (img.complete) img.onload();
      };
      fadeInWhenLoaded("/Loading_Screen.jpg", bgRef.current);
      fadeInWhenLoaded("/gandhara_trail_logo.png", logoRef.current);

      const tl = gsap.timeline({
        delay: startDelay,
        onComplete: () => onComplete?.(),
      });

      // border traces the full perimeter like a snake, closing the loop
      // right as loading finishes, then the screen slides away
      const borderLength = borderRef.current.getTotalLength();
      gsap.set(borderRef.current, {
        strokeDasharray: borderLength,
        strokeDashoffset: borderLength,
      });

      tl.to(
        borderRef.current,
        { strokeDashoffset: 0, duration: loadDuration, ease: "none" },
        0,
      )
        // heading fades in once, right as the screen appears
        .from(
          titleRef.current,
          { opacity: 0, duration: 0.9, ease: "power2.out" },
          0,
        )
        .to(screenRef.current, {
          yPercent: -100,
          duration: 0.8,
          ease: "power3.inOut",
          delay: 0.5,
        });
    },
    { scope: screenRef },
  );

  return (
    <div className="loading-screen" ref={screenRef}>
      <div className="loading-bg" ref={bgRef} />
      <svg className="loading-border">
        <rect ref={borderRef} x="0" y="0" width="100%" height="100%" />
      </svg>
      <div className="loading-content">
        <img
          className="loading-logo"
          ref={logoRef}
          src="/gandhara_trail_logo.png"
          alt="The Gandhara Trail"
        />
        <h1 ref={titleRef} className="loading-title">
          The Gandhara Trail
        </h1>
        <div className="loading-info">
          <p className="loading-info-line1">
            The Gandhara Trail holds archaeological gems from ancient history.
          </p>
          <p className="loading-info-line2">
            Browse through ancient archaeological sites, discover their history
            and book tickets for the whole experience.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
