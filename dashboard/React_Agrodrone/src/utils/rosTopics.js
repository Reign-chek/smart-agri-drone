export const ROS_TOPICS = {
  gpsFix: '/drone/gps/fix',
  battery: '/drone/battery',
  imu: '/drone/imu',
  sprayTelemetry: '/drone/spray/telemetry',
  environment: '/drone/environment',
  fieldBoundary: '/mission/field_boundary',
  missionParameters: '/mission/parameters',
  fieldPlan: '/mission/field_plan',
  cmdVel: '/drone/cmd_vel',
  flightCommand: '/flight_command',
};

export const ROS_MESSAGE_TYPES = {
  gpsFix: 'sensor_msgs/NavSatFix',
  battery: 'sensor_msgs/BatteryState',
  imu: 'sensor_msgs/Imu',
  sprayTelemetry: 'std_msgs/String',
  environment: 'sensor_msgs/FluidPressure',
  fieldBoundary: 'geometry_msgs/PolygonStamped',
  missionParameters: 'std_msgs/String',
  fieldPlan: 'std_msgs/String',
  cmdVel: 'geometry_msgs/Twist',
  flightCommand: 'std_msgs/String',
};
