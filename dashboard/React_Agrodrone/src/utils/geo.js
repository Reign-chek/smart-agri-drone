const EARTH_RADIUS = 6378137;
const METERS_PER_DEGREE = 111320;
const toRadians = (value) => (value * Math.PI) / 180;

export function geoArea(vertices) {
  if (!Array.isArray(vertices) || vertices.length < 3) return 0;

  let sphericalArea = 0;
  vertices.forEach((point, index) => {
    const next = vertices[(index + 1) % vertices.length];
    sphericalArea += (toRadians(next.lng) - toRadians(point.lng)) *
      (2 + Math.sin(toRadians(point.lat)) + Math.sin(toRadians(next.lat)));
  });
  return Math.abs(sphericalArea * EARTH_RADIUS * EARTH_RADIUS / 2) / 10000;
}

function orientation(a, b, c) {
  const value = (b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng);
  if (Math.abs(value) < 1e-12) return 0;
  return value > 0 ? 1 : -1;
}

function onSegment(a, b, point) {
  return point.lng >= Math.min(a.lng, b.lng) - 1e-12 &&
    point.lng <= Math.max(a.lng, b.lng) + 1e-12 &&
    point.lat >= Math.min(a.lat, b.lat) - 1e-12 &&
    point.lat <= Math.max(a.lat, b.lat) + 1e-12;
}

export function segmentCross(a, b, c, d) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  if (o1 * o2 < 0 && o3 * o4 < 0) return true;
  return (o1 === 0 && onSegment(a, b, c)) ||
    (o2 === 0 && onSegment(a, b, d)) ||
    (o3 === 0 && onSegment(c, d, a)) ||
    (o4 === 0 && onSegment(c, d, b));
}

export function validBoundary(vertices) {
  if (!Array.isArray(vertices) || vertices.length < 3) return false;
  if (vertices.some((point) => !point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng))) return false;
  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      if (
        Math.abs(vertices[i].lat - vertices[j].lat) < 1e-10 &&
        Math.abs(vertices[i].lng - vertices[j].lng) < 1e-10
      ) return false;
    }
  }
  if (geoArea(vertices) <= 0.0001) return false;

  for (let i = 0; i < vertices.length; i += 1) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    for (let j = i + 1; j < vertices.length; j += 1) {
      const c = vertices[j];
      const d = vertices[(j + 1) % vertices.length];
      if (i === j || (i + 1) % vertices.length === j || i === (j + 1) % vertices.length) continue;
      if (segmentCross(a, b, c, d)) return false;
    }
  }
  return true;
}

export function inside(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let contained = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const current = polygon[i];
    const previous = polygon[j];
    const crosses = (current.lat > point.lat) !== (previous.lat > point.lat) &&
      point.lng < ((previous.lng - current.lng) * (point.lat - current.lat)) /
        (previous.lat - current.lat) + current.lng;
    if (crosses) contained = !contained;
  }
  return contained;
}

export function insetPolygon(polygon, marginMeters = 0) {
  if (!Array.isArray(polygon) || polygon.length < 3 || marginMeters <= 0) return [...(polygon ?? [])];
  const center = polygon.reduce(
    (sum, point) => ({ lat: sum.lat + point.lat / polygon.length, lng: sum.lng + point.lng / polygon.length }),
    { lat: 0, lng: 0 },
  );
  return polygon.map((point) => {
    const latitudeMeters = (point.lat - center.lat) * METERS_PER_DEGREE;
    const longitudeMeters = (point.lng - center.lng) * METERS_PER_DEGREE * Math.cos(toRadians(center.lat));
    const distance = Math.hypot(latitudeMeters, longitudeMeters);
    const factor = distance === 0 ? 0 : Math.max(0, (distance - marginMeters) / distance);
    return {
      lat: center.lat + ((point.lat - center.lat) * factor),
      lng: center.lng + ((point.lng - center.lng) * factor),
    };
  });
}

export function generateLawnmower(polygon, swath = 14, margin = 0) {
  if (!validBoundary(polygon) || swath <= 0) return [];
  const inset = insetPolygon(polygon, margin);
  if (!validBoundary(inset)) return [];
  const centerLat = inset.reduce((sum, point) => sum + point.lat, 0) / inset.length;
  const bounds = inset.reduce(
    (acc, point) => ({
      minLat: Math.min(acc.minLat, point.lat),
      maxLat: Math.max(acc.maxLat, point.lat),
      minLng: Math.min(acc.minLng, point.lng),
      maxLng: Math.max(acc.maxLng, point.lng),
    }),
    { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity },
  );
  const step = swath / METERS_PER_DEGREE;
  const rows = [];
  let rowIndex = 0;

  for (let lat = bounds.minLat + step / 2; lat < bounds.maxLat; lat += step) {
    const intersections = [];
    for (let i = 0; i < inset.length; i += 1) {
      const a = inset[i];
      const b = inset[(i + 1) % inset.length];
      if ((a.lat <= lat && b.lat > lat) || (b.lat <= lat && a.lat > lat)) {
        intersections.push(a.lng + ((lat - a.lat) * (b.lng - a.lng)) / (b.lat - a.lat));
      }
    }
    intersections.sort((a, b) => a - b);
    for (let i = 0; i + 1 < intersections.length; i += 2) {
      const from = { lat, lng: intersections[i] };
      const to = { lat, lng: intersections[i + 1] };
      rows.push(rowIndex % 2 === 0 ? [from, to] : [to, from]);
      rowIndex += 1;
    }
  }
  return rows;
}

function distanceBetween(a, b) {
  const meanLat = toRadians((a.lat + b.lat) / 2);
  const north = toRadians(b.lat - a.lat) * EARTH_RADIUS;
  const east = toRadians(b.lng - a.lng) * EARTH_RADIUS * Math.cos(meanLat);
  return Math.hypot(north, east);
}

export function pathLength(path) {
  const points = Array.isArray(path?.[0]) ? path.flat() : path;
  if (!Array.isArray(points) || points.length < 2) return 0;
  return points.slice(1).reduce((total, point, index) => total + distanceBetween(points[index], point), 0);
}

export function pointOnPath(path, distanceMeters) {
  const points = Array.isArray(path?.[0]) ? path.flat() : path;
  if (!Array.isArray(points) || points.length === 0) return null;
  if (points.length === 1) return { ...points[0], heading: 0 };
  let remaining = Math.max(0, distanceMeters);
  for (let i = 1; i < points.length; i += 1) {
    const start = points[i - 1];
    const end = points[i];
    const segmentLength = distanceBetween(start, end);
    if (remaining <= segmentLength || i === points.length - 1) {
      const ratio = segmentLength === 0 ? 0 : Math.min(1, remaining / segmentLength);
      const y = Math.sin(toRadians(end.lng - start.lng)) * Math.cos(toRadians(end.lat));
      const x = Math.cos(toRadians(start.lat)) * Math.sin(toRadians(end.lat)) -
        Math.sin(toRadians(start.lat)) * Math.cos(toRadians(end.lat)) *
        Math.cos(toRadians(end.lng - start.lng));
      return {
        lat: start.lat + (end.lat - start.lat) * ratio,
        lng: start.lng + (end.lng - start.lng) * ratio,
        heading: (Math.atan2(y, x) * 180 / Math.PI + 360) % 360,
      };
    }
    remaining -= segmentLength;
  }
  return { ...points[points.length - 1], heading: 0 };
}

export function updateFumigation({ speed = 0, swathWidth = 14, targetDosage = 28, tankLitres = 20, windSpeed = 0 }) {
  const flowRate = (targetDosage * speed * swathWidth) / 600;
  const driftRisk = windSpeed < 10 ? 'LOW' : windSpeed < 20 ? 'MODERATE' : 'HIGH WARNING';
  return {
    flowRate: Number(flowRate.toFixed(2)),
    driftRisk,
    returnOnEmpty: tankLitres < 1,
  };
}
