import { useCallback, useState } from 'react';

export default function useGoogleMapPlanner() {
  const [vertices, setVertices] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [boundaryLocked, setBoundaryLocked] = useState(false);

  const addPoint = useCallback((point) => {
    setVertices((current) => [...current, point]);
    setBoundaryLocked(false);
  }, []);

  const undoPoint = useCallback(() => {
    setVertices((current) => current.slice(0, -1));
    setBoundaryLocked(false);
  }, []);
  const clear = useCallback(() => {
    setVertices([]);
    setBoundaryLocked(false);
    setDrawing(false);
  }, []);

  return {
    boundary: vertices,
    drawing,
    setDrawing,
    boundaryLocked,
    setBoundaryLocked,
    addPoint,
    undoPoint,
    clear,
  };
}
