export function formatCoordinates(lat, lng, digits = 4) {
  return `${Number(lat).toFixed(digits)}, ${Number(lng).toFixed(digits)}`;
}

export function formatPct(value) {
  return `${Number(value).toFixed(0)}%`;
}

export function formatSpeed(value) {
  return `${Number(value).toFixed(1)} m/s`;
}
