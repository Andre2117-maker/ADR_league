import "../styles/addbanner.css";

export default function AdBanner({ title, description, color }) {
  return (
    <div className="ad-container" style={{ borderColor: color }}>
      <span className="ad-label">Publicidade</span>
      <h4 className="ad-title" style={{ color: color }}>
        {title}
      </h4>
      <p className="ad-desc">{description}</p>
    </div>
  );
}
