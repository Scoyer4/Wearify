import './Marquee.css';

const TEXTO = 'NEW DROPS · STREETWEAR CURADO · LIMITED EDITION · COLLECTORS ONLY · ';

export default function Marquee() {
  return (
    <div className="marquee-wrapper">
      <div className="marquee-track">
        <span>{TEXTO}</span>
        <span>{TEXTO}</span>
        <span>{TEXTO}</span>
      </div>
    </div>
  );
}
