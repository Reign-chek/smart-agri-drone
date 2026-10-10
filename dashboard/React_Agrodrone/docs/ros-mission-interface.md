# ROS 2 field mission interface

The dashboard connects to rosbridge over WebSocket. Set the Raspberry Pi 5 address in
`.env.local` (copy `.env.example` and replace the host), for example:

```text
VITE_ROSBRIDGE_URL=ws://<raspberry-pi-ip>:9090
```

The Pi must run ROS 2 with `rosbridge_server` reachable from the dashboard computer.
Restart Vite after changing the environment file. The dashboard does not start, arm,
or execute a mission when it publishes a plan.

## Topics

The dashboard advertises these latched topics after connecting:

| Topic | ROS message type | Purpose |
| --- | --- | --- |
| `/mission/field_boundary` | `geometry_msgs/PolygonStamped` | Closed field perimeter in local east/north metres |
| `/mission/parameters` | `std_msgs/String` | JSON planning parameters and the WGS84 origin |
| `/mission/field_plan` | `std_msgs/String` | Atomic JSON plan containing the WGS84 vertices and parameters |

Subscribe to `/mission/field_plan` for a complete plan in one message. `data` is JSON
with `schema_version: 1`, `action: "plan" | "clear"`, `coordinate_reference: "WGS84"`,
`boundary` as `{ "latitude": number, "longitude": number }` objects, and the planning
fields described below. The `clear` action has an empty `boundary` and zeroed area,
route distance, and fluid requirement.

`/mission/field_boundary` is provided for ROS nodes that consume standard planar ROS
geometry. Its `header.frame_id` is `field_origin`. `polygon.points` are `geometry_msgs/Point32`
values in metres: `x` is east, `y` is north, and `z` is zero. The ring is explicitly
closed by repeating its first point. The first WGS84 vertex is the local origin.
The ROS navigation node must align/transform `field_origin` to its `map` frame using
the provided origin; these local coordinates are not themselves global map coordinates.

`/mission/parameters` publishes the same planning metadata as a JSON string:

```json
{
  "schema_version": 1,
  "action": "plan",
  "frame_id": "field_origin",
  "origin_wgs84": { "latitude": 0.0, "longitude": 0.0, "altitude": 0.0 },
  "area_ha": 0.0,
  "swath_width_m": 14,
  "headland_margin_m": 8,
  "target_dosage_l_ha": 28,
  "fluid_required_l": 0.0,
  "route_mode": "Lawnmower",
  "route_distance_m": 0.0,
  "vertex_count": 0,
  "generated_at": "ISO-8601 timestamp"
}
```

The example's origin and calculated values are placeholders. Actual values come from
the locked user-drawn boundary. `area_ha` is computed geodesically, fluid requirement
is `area_ha * target_dosage_l_ha`, and route distance uses the selected coverage path.
The browser validates the polygon before publishing and republishes the latest plan
when boundary or planning parameters change. If rosbridge is offline, only the latest
plan is queued and published when it reconnects.

The ROS mission-planning node remains responsible for validating the received plan,
transforming the local field frame into its navigation frame, generating its executable
coverage trajectory, and applying its own safety checks.
