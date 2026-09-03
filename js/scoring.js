function angleDelta(a, b) {
  let delta = (a - b) % 360;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return Math.abs(delta);
}

/**
 * placement: { point: THREE.Vector3, rotationDeg }
 * scene: one entry from scenes.json (world units are metres)
 */
export function scorePlacement(scene, placement) {
  const target = scene.target;
  const [tx, ty, tz] = target.position;

  const positionError = Math.hypot(
    placement.point.x - tx,
    placement.point.y - ty,
    placement.point.z - tz
  );
  const rotationError = target.rotationRequired
    ? angleDelta(placement.rotationDeg, target.rotationDeg)
    : 0;

  const posRatio = positionError / target.toleranceMeters;
  const rotRatio = target.rotationRequired ? rotationError / target.toleranceRotationDeg : 0;
  const combinedRatio = Math.max(posRatio, rotRatio);

  let stars;
  if (combinedRatio <= 1.0) stars = 3;
  else if (combinedRatio <= 2.0) stars = 2;
  else if (combinedRatio <= 3.0) stars = 1;
  else stars = 0;

  const score = Math.round(100 * Math.min(Math.max(1 - combinedRatio / 3, 0), 1));

  return { positionError, rotationError, combinedRatio, stars, score, revealHint: stars <= 1 };
}

export function rankForPercent(percent) {
  if (percent >= 90) return "rank_master";
  if (percent >= 70) return "rank_experienced";
  if (percent >= 50) return "rank_developing";
  return "rank_retry";
}
