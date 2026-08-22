// the artwork's own pixel size - pin fractions map straight onto it
const ART_W = 977;
const ART_H = 648;

const LEG_COLOUR = "#380E01";

/** Smooth polyline: curve through the midpoints, using each point as the
 *  control handle, so the traced centreline reads as a flowing path. */
function smoothPath(points) {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M${points[0][0]} ${points[0][1]}L${points[1][0]} ${points[1][1]}`;
  }
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    d += `Q${cx} ${cy} ${(cx + nx) / 2} ${(cy + ny) / 2}`;
  }
  const last = points[points.length - 1];
  d += `L${last[0]} ${last[1]}`;
  return d;
}

/** Point roughly half way along the polyline, measured by length rather than
 *  by index, so the label sits at the visual middle of the leg. */
function midpointOf(points) {
  let total = 0;
  const spans = [];
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.hypot(
      points[i + 1][0] - points[i][0],
      points[i + 1][1] - points[i][1],
    );
    spans.push(len);
    total += len;
  }
  let walked = 0;
  for (let i = 0; i < spans.length; i++) {
    if (walked + spans[i] >= total / 2) {
      const t = spans[i] ? (total / 2 - walked) / spans[i] : 0;
      return [
        points[i][0] + (points[i + 1][0] - points[i][0]) * t,
        points[i][1] + (points[i + 1][1] - points[i][1]) * t,
      ];
    }
    walked += spans[i];
  }
  return points[Math.floor(points.length / 2)];
}

/**
 * The "Toggle Distances" layer: each leg follows the route's own centreline
 * between neighbouring pins, labelled with the distance and clickable to open
 * that segment's details.
 */
function RouteDistances({
  route,
  segments,
  legs,
  isExiting,
  focusItem,
  onFocus,
  onSelect,
}) {
  // a leg's line and its label live in separate groups so the labels can all
  // paint last, which rules out :hover for this
  const dimmed = (index) => {
    if (!focusItem) return false;
    // focusing a pin pushes every leg back
    if (focusItem.type === "site") return true;
    return focusItem.index !== index;
  };

  const drawn = [];
  for (let i = 0; i < route.sites.length - 1; i++) {
    const from = route.sites[i];
    const to = route.sites[i + 1];
    if (!from.pin || !to.pin) continue;

    const key = `${from.id}--${to.id}`;
    // fall back to a straight run if a leg was never traced
    const norm = legs[key] ?? [from.pin, to.pin];
    const points = norm.map(([x, y]) => [x * ART_W, y * ART_H]);
    drawn.push({ index: i, key, points });
  }

  return (
    <svg
      className={`map-distances${isExiting ? " is-exiting" : ""}${
        focusItem?.type === "segment" ? " is-raised" : ""
      }`}
      viewBox={`0 0 ${ART_W} ${ART_H}`}
    >
      {/* every leg is drawn before any label, so a neighbouring leg can never
          end up painted across a distance pill */}
      {drawn.map(({ key, index, points }) => {
        const d = smoothPath(points);
        return (
          <g
            key={key}
            className={`map-distance${dimmed(index) ? " is-dimmed" : ""}`}
            onMouseEnter={() => onFocus({ type: "segment", index })}
            onMouseLeave={() => onFocus(null)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(index);
            }}
          >
            <path
              d={d}
              fill="none"
              stroke={LEG_COLOUR}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* invisible, but wide enough to be comfortable to click */}
            <path
              d={d}
              fill="none"
              stroke="none"
              strokeWidth="30"
              pointerEvents="stroke"
            />
          </g>
        );
      })}

      {drawn.map(({ key, index, points }) => {
        const record = segments[key];
        const label = record ? `${record.distanceKm}km` : "";
        const pillW = label.length * 6.4 + 15;
        const [midX, midY] = midpointOf(points);
        // sits just above the leg - any higher and it runs into the pin
        // balloons, whose stems are 82 units tall
        const pillY = midY - 34;

        return (
          <g
            key={key}
            className={`map-distance${dimmed(index) ? " is-dimmed" : ""}`}
            onMouseEnter={() => onFocus({ type: "segment", index })}
            onMouseLeave={() => onFocus(null)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(index);
            }}
          >
            <line
              x1={midX}
              y1={midY}
              x2={midX}
              y2={pillY + 19}
              stroke={LEG_COLOUR}
              strokeWidth="2.2"
            />
            <rect
              x={midX - pillW / 2}
              y={pillY}
              width={pillW}
              height={19}
              rx="9.5"
              fill="#FCFAE9"
              stroke={LEG_COLOUR}
              strokeWidth="2"
            />
            <text
              x={midX}
              y={pillY + 9.5}
              textAnchor="middle"
              dominantBaseline="central"
              fill={LEG_COLOUR}
              fontFamily="'Plus Jakarta Sans', sans-serif"
              fontSize="10"
              fontWeight="800"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default RouteDistances;
