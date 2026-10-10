import { useRef, useState } from 'react';

export default function GimbalJoystick({ heading, pitch, onHeadingChange, onPitchChange }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const active = useRef(false);
  const startingHeading = useRef(heading);
  const startingPitch = useRef(pitch);

  const handlePointerDown = (event) => {
    active.current = true;
    startingHeading.current = heading;
    startingPitch.current = pitch;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromEvent(event);
  };

  const handlePointerMove = (event) => {
    if (!active.current) return;
    updateFromEvent(event);
  };

  const handlePointerUp = (event) => {
    active.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setOffset({ x: 0, y: 0 });
  };

  const updateFromEvent = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (event.clientX - cx) / (rect.width / 2);
    const dy = (event.clientY - cy) / (rect.height / 2);
    const clampedX = Math.max(-1, Math.min(1, dx));
    const clampedY = Math.max(-1, Math.min(1, dy));
    setOffset({ x: clampedX * 16, y: clampedY * 16 });
    onHeadingChange(startingHeading.current + clampedX * 45);
    onPitchChange(startingPitch.current - clampedY * 45);
  };

  return (
    <div className="joystick-stack">
      <div
        className="virtual-joystick"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-label="Gimbal heading and camera pitch"
        aria-valuetext={`${Math.round(heading)}° heading, ${Math.round(pitch)}° camera pitch`}
        aria-valuemin="0"
        aria-valuemax="359"
        aria-valuenow={Math.round(heading)}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            onHeadingChange(heading - 1);
          }
          if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              onPitchChange(pitch + 1);
              return;
            }
            event.preventDefault();
            onHeadingChange(heading + 1);
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            onPitchChange(pitch - 1);
          }
        }}
      >
        <div
          className="joystick-knob"
          style={{ transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))` }}
        />
      </div>
      <div className="joystick-readout">
        <span>Heading</span>
        <strong>{heading.toFixed(0)}°</strong>
        <span>Camera pitch</span>
        <strong>{pitch.toFixed(0)}°</strong>
      </div>
    </div>
  );
}
