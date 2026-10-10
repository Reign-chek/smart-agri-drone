import { geoArea, pathLength } from './geo.js';

const EARTH_RADIUS_METERS = 6378137;
const toRadians = (degrees) => degrees * Math.PI / 180;

function toLocalEnu(point, origin) {
  const latitude = toRadians(point.lat);
  const originLatitude = toRadians(origin.lat);
  const longitudeDelta = toRadians(point.lng - origin.lng);
  const cosineAngularDistance = Math.sin(originLatitude) * Math.sin(latitude) +
    Math.cos(originLatitude) * Math.cos(latitude) * Math.cos(longitudeDelta);
  const angularDistance = Math.acos(Math.max(-1, Math.min(1, cosineAngularDistance)));
  const scale = angularDistance < 1e-12
    ? 1
    : angularDistance / Math.sin(angularDistance);

  return {
    x: EARTH_RADIUS_METERS * scale * Math.cos(latitude) * Math.sin(longitudeDelta),
    y: EARTH_RADIUS_METERS * scale * (
      Math.cos(originLatitude) * Math.sin(latitude) -
      Math.sin(originLatitude) * Math.cos(latitude) * Math.cos(longitudeDelta)
    ),
    z: 0,
  };
}

function rosTimestamp(date) {
  const milliseconds = date.getTime();
  const seconds = Math.floor(milliseconds / 1000);
  return {
    secs: seconds,
    nsecs: (milliseconds - seconds * 1000) * 1_000_000,
  };
}

export function createRosFieldPlan({
  boundary,
  activePath,
  mission,
  routeMode,
  action = 'plan',
  now = new Date(),
}) {
  const vertices = action === 'plan' ? boundary : [];
  const origin = vertices[0] ?? null;
  const timestamp = rosTimestamp(now);
  const areaHa = action === 'plan' ? geoArea(vertices) : 0;
  const routeDistanceMeters = action === 'plan' ? pathLength(activePath) : 0;
  const fluidRequiredLitres = areaHa * mission.dosage;

  const localVertices = origin
    ? vertices.map((vertex) => toLocalEnu(vertex, origin))
    : [];
  const closedVertices = localVertices.length > 0
    ? [...localVertices, localVertices[0]]
    : [];
  const boundaryMessage = {
    header: {
      stamp: timestamp,
      frame_id: 'field_origin',
    },
    polygon: {
      points: closedVertices,
    },
  };

  const parameters = {
    schema_version: 1,
    action,
    frame_id: 'field_origin',
    origin_wgs84: origin
      ? { latitude: origin.lat, longitude: origin.lng, altitude: 0 }
      : null,
    area_ha: areaHa,
    swath_width_m: action === 'plan' ? mission.swath : 0,
    headland_margin_m: action === 'plan' ? mission.margin : 0,
    target_dosage_l_ha: action === 'plan' ? mission.dosage : 0,
    fluid_required_l: fluidRequiredLitres,
    route_mode: action === 'plan' ? routeMode : null,
    route_distance_m: routeDistanceMeters,
    vertex_count: vertices.length,
    generated_at: now.toISOString(),
  };

  const fieldPlan = {
    schema_version: 1,
    action,
    coordinate_reference: 'WGS84',
    boundary: vertices.map(({ lat, lng }) => ({ latitude: lat, longitude: lng })),
    ...parameters,
  };

  return {
    boundaryMessage,
    missionParametersMessage: { data: JSON.stringify(parameters) },
    fieldPlanMessage: { data: JSON.stringify(fieldPlan) },
  };
}
