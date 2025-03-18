import React from 'react';

interface TypingIndicatorProps {
  isVisible: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="typing-indicator">
      <style jsx>{`
        .typing-indicator {
          position: absolute;
          width: 2.5px;
          height: 75%;
          background-color: #2563eb;
          animation: blink 1.2s ease-in-out infinite;
          border-radius: 2px;
          top: 12.5%;
        }

        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator; 