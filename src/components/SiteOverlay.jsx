import { useState } from "react";

/**
 * Detail panel for a single site. Everything it shows comes from `site`, so it
 * renders any entry from src/data/sites.json unchanged.
 */
function SiteOverlay({ site }) {
  const [imageBroken, setImageBroken] = useState(false);
  const image = site.images?.[0];
  const showImage = image && !imageBroken;

  return (
    <div className="site-overlay">
      <div className="site-overlay-media">
        {showImage ? (
          <img
            src={image}
            alt={site.name}
            onError={() => setImageBroken(true)}
          />
        ) : (
          <div className="site-overlay-media-fallback">
            <span>{site.name}</span>
          </div>
        )}
      </div>

      <div className="site-overlay-head">
        <h2 className="site-overlay-name">{site.name}</h2>
        <span className="site-overlay-number">{site.number}</span>
      </div>

      {site.approximateAge && (
        <p className="site-overlay-age">
          Approximate Age ~ {site.approximateAge}
        </p>
      )}

      <hr className="overlay-rule" />

      <div className="site-overlay-description">
        {site.description.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}

export default SiteOverlay;
