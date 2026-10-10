import { useCallback, useEffect, useRef } from 'react';
import ROSLIB from 'roslib';
import useTelemetryStore from '../store/useTelemetryStore';
import { ROS_MESSAGE_TYPES, ROS_TOPICS } from '../utils/rosTopics';

const defaultRosbridgeUrl = 'ws://192.168.1.100:9090';

export function useRos2Bridge(url = import.meta.env.VITE_ROSBRIDGE_URL || defaultRosbridgeUrl) {
  const { rosConnected, setRosConnection } = useTelemetryStore();
  const publishersRef = useRef(null);
  const connectedRef = useRef(false);
  const pendingPlanRef = useRef(null);

  const publishToRos = useCallback((plan) => {
    const publishers = publishersRef.current;
    if (!connectedRef.current || !publishers) return false;

    try {
      publishers.fieldBoundary.publish(plan.boundaryMessage);
      publishers.missionParameters.publish(plan.missionParametersMessage);
      publishers.fieldPlan.publish(plan.fieldPlanMessage);
      return true;
    } catch (error) {
      console.error('Failed to publish the field plan to ROS:', error);
      return false;
    }
  }, []);

  const publishFieldPlan = useCallback((plan) => {
    pendingPlanRef.current = plan;
    if (!publishToRos(plan)) return false;
    pendingPlanRef.current = null;
    return true;
  }, [publishToRos]);

  useEffect(() => {
    const ros = new ROSLIB.Ros({ url });

    ros.on('connection', () => {
      const publishers = {
        fieldBoundary: new ROSLIB.Topic({
          ros,
          name: ROS_TOPICS.fieldBoundary,
          messageType: ROS_MESSAGE_TYPES.fieldBoundary,
          latch: true,
        }),
        missionParameters: new ROSLIB.Topic({
          ros,
          name: ROS_TOPICS.missionParameters,
          messageType: ROS_MESSAGE_TYPES.missionParameters,
          latch: true,
        }),
        fieldPlan: new ROSLIB.Topic({
          ros,
          name: ROS_TOPICS.fieldPlan,
          messageType: ROS_MESSAGE_TYPES.fieldPlan,
          latch: true,
        }),
      };
      Object.values(publishers).forEach((publisher) => publisher.advertise());
      publishersRef.current = publishers;
      connectedRef.current = true;
      setRosConnection(true);

      if (pendingPlanRef.current) {
        if (publishToRos(pendingPlanRef.current)) pendingPlanRef.current = null;
      }
    });

    ros.on('error', (error) => {
      console.error(`ROS bridge connection error (${url}):`, error);
      connectedRef.current = false;
      publishersRef.current = null;
      setRosConnection(false);
    });

    ros.on('close', () => {
      connectedRef.current = false;
      publishersRef.current = null;
      setRosConnection(false);
    });

    return () => {
      connectedRef.current = false;
      publishersRef.current = null;
      ros.close();
    };
  }, [publishToRos, setRosConnection, url]);

  return { connected: rosConnected, publishFieldPlan };
}
