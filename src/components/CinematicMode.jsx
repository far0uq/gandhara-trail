import { useEffect, useRef, useState } from "react";

// the crawl moves at a constant speed, so each beat is on screen for a time
// proportional to its own length without needing per-beat timings
const PX_PER_SECOND = 24;

// clicks land on the tour rather than the map, so after a few of them the
// exit hint calls attention to itself
const NUDGE_AFTER_CLICKS = 4;
const CLICK_WINDOW_MS = 1400;
const NUDGE_MS = 2000;

/**
 * The storytelling pass over a route: chrome falls away, the narration crawls
 * up the frame as one continuous column, and whichever beat is passing the
 * focal line focuses the pin it is talking about.
 */
function CinematicMode({ story, route, isExiting, onBeat, onExit }) {
  const stageRef = useRef(null);
  const columnRef = useRef(null);
  const progressRef = useRef(null);
  const [nudged, setNudged] = useState(false);
  const clicks = useRef({ count: 0, reset: null, clear: null });

  const beats = story.beats;

  useEffect(() => {
    const stage = stageRef.current;
    const column = columnRef.current;
    if (!stage || !column) return undefined;

    const stageHeight = stage.clientHeight;
    const columnHeight = column.scrollHeight;
    // the column starts fully below the stage and ends fully above it
    const travel = stageHeight + columnHeight;
    const duration = (travel / PX_PER_SECOND) * 1000;

    const centres = [...column.children].map(
      (node) => node.offsetTop + node.offsetHeight / 2,
    );
    // the line a beat has to reach before it counts as the one being told
    const focal = stageHeight * 0.42;

    let frame;
    let lastBeat = -1;
    const started = performance.now();

    const tick = (now) => {
      const elapsed = now - started;
      const ratio = Math.min(1, elapsed / duration);

      const y = stageHeight - travel * ratio;
      column.style.transform = `translate3d(0, ${y}px, 0)`;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${ratio})`;
      }

      let nearest = 0;
      let best = Infinity;
      for (let i = 0; i < centres.length; i++) {
        const distance = Math.abs(y + centres[i] - focal);
        if (distance < best) {
          best = distance;
          nearest = i;
        }
      }
      if (nearest !== lastBeat) {
        lastBeat = nearest;
        const siteId = beats[nearest]?.siteId ?? null;
        const index = siteId
          ? route.sites.findIndex((site) => site.id === siteId)
          : -1;
        onBeat(index >= 0 ? index : null);
      }

      if (elapsed >= duration) {
        onExit();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [beats, route, onBeat, onExit]);

  useEffect(() => {
    const timers = clicks.current;
    return () => {
      clearTimeout(timers.reset);
      clearTimeout(timers.clear);
    };
  }, []);

  const handleClick = () => {
    const state = clicks.current;
    clearTimeout(state.reset);
    state.count += 1;

    if (state.count >= NUDGE_AFTER_CLICKS) {
      state.count = 0;
      setNudged(false);
      // let the class drop before re-adding it, so repeated prodding replays
      requestAnimationFrame(() => setNudged(true));
      clearTimeout(state.clear);
      state.clear = setTimeout(() => setNudged(false), NUDGE_MS);
      return;
    }

    state.reset = setTimeout(() => {
      state.count = 0;
    }, CLICK_WINDOW_MS);
  };

  return (
    // sits over the whole map so clicks land here and do nothing
    <div
      className={`cinematic${isExiting ? " is-exiting" : ""}`}
      onClick={handleClick}
    >
      <div className={`cinematic-hint${nudged ? " is-nudged" : ""}`}>
        <span className="route-hint">
          <span className="route-hint-key">[X]</span> - Exit Cinematic Tour
        </span>
      </div>

      <div ref={stageRef} className="cinematic-stage">
        <div ref={columnRef} className="cinematic-column">
          {beats.map((beat, i) => (
            <p className="cinematic-text" key={beat.siteId ?? `intro-${i}`}>
              {beat.text}
            </p>
          ))}
        </div>
      </div>

      <div className="cinematic-progress">
        <span ref={progressRef} className="cinematic-progress-fill" />
      </div>
    </div>
  );
}

export default CinematicMode;
