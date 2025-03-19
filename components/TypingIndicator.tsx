import React from 'react';

interface TypingIndicatorProps {
  position: {
    x: number;
    y: number;
  };
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ position }) => {
  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '2px',
        height: '16px',
        backgroundColor: '#2563eb',
        borderRadius: '1px',
        animation: 'blink 1s infinite',
        pointerEvents: 'none',
        zIndex: 1000,
        transform: 'translateY(-50%)',
      }}
    />
  );
};

export default TypingIndicator; 