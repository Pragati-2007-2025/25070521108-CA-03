export default function Headphones3D() {
  function tilt(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty('--pointer-x', `${x * 24}deg`);
    event.currentTarget.style.setProperty('--pointer-y', `${y * -18}deg`);
  }

  function resetTilt(event) {
    event.currentTarget.style.setProperty('--pointer-x', '0deg');
    event.currentTarget.style.setProperty('--pointer-y', '0deg');
  }

  return (
    <div className="model-stage" onPointerMove={tilt} onPointerLeave={resetTilt} aria-label="Animated three-dimensional headphone model">
      <div className="model-aura" />
      <div className="model-orbit orbit-back" />
      <div className="model-orbit orbit-front" />
      <div className="model-floor-shadow" />
      <div className="headphone-model" aria-hidden="true">
        <div className="headphone-band"><span /></div>
        <div className="headphone-yoke yoke-left" />
        <div className="headphone-yoke yoke-right" />
        <div className="headphone-cup cup-left"><span className="cup-hinge" /><span className="cup-shell"><i /></span></div>
        <div className="headphone-cup cup-right"><span className="cup-hinge" /><span className="cup-shell"><i /></span></div>
      </div>
      <span className="model-spec spec-top"><i /> 40 MM CUSTOM DRIVER</span>
      <span className="model-spec spec-bottom">SONIC ARC <b>·</b> SPATIAL AUDIO</span>
      <span className="model-hint">MOVE TO EXPLORE <span>↗</span></span>
    </div>
  );
}
