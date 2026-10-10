export default function CompassHeading({ heading, lat, lng }) {
  return (
    <div className="compass-panel">
      <div className="compass-ring">
        <div
          className="compass-needle"
          style={{ transform: `translate(-50%, -100%) rotate(${heading}deg)` }}
        />
      </div>
      <div className="compass-copy">
        <span>Heading</span>
        <strong>{heading.toFixed(0)}°</strong>
        {Number.isFinite(lat) && Number.isFinite(lng) && (
          <span>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
        )}
      </div>
    </div>
  );
}
