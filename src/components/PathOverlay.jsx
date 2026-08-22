import { useState } from "react";
import TravelIcon from "./TravelIcons";

const MODE_LABELS = {
  car: "By car",
  bike: "By bike",
  walk: "On foot",
};

function SegmentPreview({ preview }) {
  if (!preview) return null;
  const { d, color = "#FF7D37", from, to } = preview;

  return (
    <svg className="path-overlay-preview" viewBox="0 0 620 360" role="img">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="34"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        fill="none"
        stroke="#7a4a22"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="18 16"
        opacity="0.5"
      />
      {from && <ellipse cx={from[0]} cy={from[1]} rx="15" ry="10" fill="#391701" />}
      {to && <ellipse cx={to[0]} cy={to[1]} rx="15" ry="10" fill="#391701" />}
    </svg>
  );
}

/**
 * Detail panel for the leg between two sites. Driven entirely by `segment`, so
 * it renders any entry from src/data/segments.json unchanged.
 */
function PathOverlay({ segment }) {
  const [mode, setMode] = useState(segment.travel[0]?.mode);
  const active =
    segment.travel.find((t) => t.mode === mode) ?? segment.travel[0];

  return (
    <div className="path-overlay">
      <div className="path-overlay-stops">
        <div className="path-overlay-rail">
          <span className="path-overlay-stop-num">{segment.from.number}</span>
          <span className="path-overlay-rail-link" aria-hidden="true" />
          <span className="path-overlay-stop-num">{segment.to.number}</span>
        </div>
        <div className="path-overlay-stop-names">
          <span>{segment.from.name}</span>
          <span>{segment.to.name}</span>
        </div>
      </div>

      <hr className="overlay-rule" />

      <div className="path-overlay-map">
        <SegmentPreview preview={segment.preview} />
      </div>

      <hr className="overlay-rule" />

      <div className="path-overlay-modes">
        {segment.travel.map((option) => (
          <button
            type="button"
            key={option.mode}
            className={`path-overlay-mode${
              option.mode === active.mode ? " is-active" : ""
            }`}
            onClick={() => setMode(option.mode)}
            aria-pressed={option.mode === active.mode}
            aria-label={MODE_LABELS[option.mode] ?? option.mode}
          >
            <TravelIcon mode={option.mode} />
            <span>{option.minutes} min</span>
          </button>
        ))}
      </div>

      <hr className="overlay-rule" />

      <div className="path-overlay-summary">
        <div className="path-overlay-distance">
          <span className="path-overlay-label">TOTAL DISTANCE:</span>
          <span className="path-overlay-distance-value">
            {segment.distanceKm} KM
          </span>
          <span className="path-overlay-via">{segment.distanceVia}</span>
        </div>

        <div className="path-overlay-eta">
          <span className="path-overlay-label">Estimated</span>
          <span className="path-overlay-eta-value">
            <strong>{active.minutes}</strong>
            <span>mins</span>
          </span>
          <span className="path-overlay-via">{segment.estimatedVia}</span>
        </div>
      </div>
    </div>
  );
}

export default PathOverlay;
