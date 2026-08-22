/**
 * Numbered pins dropped onto a route's location dots. Positions come from each
 * site's `pin` fraction, so the markers stay locked to the artwork at any zoom.
 */
function RoutePins({ route, isExiting, focusItems, onFocus, onSelect }) {
  // focus can come from more than one place at once - an open overlay holds
  // its marker lit while the pointer lights another - so a pin only dims when
  // nothing currently in focus covers it
  const dimmed = (index) => {
    if (!focusItems.length) return false;
    return !focusItems.some((focus) =>
      focus.type === "segment"
        ? index === focus.index || index === focus.index + 1
        : focus.index === index,
    );
  };

  return (
    <div className={`map-pins${isExiting ? " is-exiting" : ""}`}>
      {route.sites.map((site, i) =>
        site.pin ? (
          <button
            type="button"
            key={site.id}
            className={`map-pin${dimmed(i) ? " is-dimmed" : ""}`}
            style={{
              left: `${site.pin[0] * 100}%`,
              top: `${site.pin[1] * 100}%`,
            }}
            aria-label={site.name}
            onMouseEnter={() => onFocus({ type: "site", index: i })}
            onMouseLeave={() => onFocus(null)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(site, i + 1);
            }}
          >
            {/* the drop animation lives in here so the button is free to fade
                on its own when another pin is focused */}
            <span
              className="map-pin-drop"
              style={{
                // a custom property rather than animation-delay, so the exit
                // rule's shorthand can reset the stagger back to zero
                "--pin-delay": `${0.05 * i}s`,
              }}
            >
              <svg viewBox="0 0 80 178" aria-hidden="true">
              <rect x="38.6" y="96" width="2.8" height="82" fill="#350C00" />
              <path
                d="M40 0C17.9 0 0 17.9 0 40c0 24.1 27.1 51.8 36.4 60.5a5.3 5.3 0 0 0 7.2 0C52.9 91.8 80 64.1 80 40 80 17.9 62.1 0 40 0z"
                fill="#350C00"
              />
              <circle cx="40" cy="39" r="26" fill="#FCFAE9" />
              <text
                x="40"
                y="39"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#350C00"
                fontFamily="'Plus Jakarta Sans', sans-serif"
                fontSize="34"
                fontWeight="800"
              >
                {i + 1}
              </text>
              </svg>
            </span>
          </button>
        ) : null,
      )}
    </div>
  );
}

export default RoutePins;
