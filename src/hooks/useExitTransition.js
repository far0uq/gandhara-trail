import { useEffect, useRef, useState } from "react";

/**
 * Keeps a value mounted for `exitMs` after it is cleared, so outgoing content
 * can play an exit animation instead of vanishing.
 *
 * Returns [rendered, isExiting] - render from `rendered`, and apply the exit
 * animation while `isExiting` is true.
 */
export default function useExitTransition(value, exitMs) {
  const [rendered, setRendered] = useState(value ?? null);
  const [isExiting, setIsExiting] = useState(false);
  const timer = useRef(null);
  const renderedRef = useRef(rendered);

  renderedRef.current = rendered;

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    if (value) {
      setRendered(value);
      setIsExiting(false);
      return;
    }

    if (!renderedRef.current) return;

    setIsExiting(true);
    timer.current = setTimeout(() => {
      setRendered(null);
      setIsExiting(false);
      timer.current = null;
    }, exitMs);
  }, [value, exitMs]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return [rendered, isExiting];
}
