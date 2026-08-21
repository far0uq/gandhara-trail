import "./Overlay.css";

/**
 * Slide-in panel chrome shared by the site and path overlays. Owns only the
 * frame and the enter/exit motion - the contents come from `children`.
 */
function OverlayPanel({ panelRef, isExiting, label, children }) {
  return (
    <aside
      ref={panelRef}
      className={`overlay${isExiting ? " is-exiting" : ""}`}
      role="dialog"
      aria-label={label}
    >
      <div className="overlay-inner">{children}</div>
    </aside>
  );
}

export default OverlayPanel;
