import React, { useState, useRef, useEffect } from 'react';
import TypingIndicator from './TypingIndicator';

interface NotionInputProps {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const NotionInput: React.FC<NotionInputProps> = ({
  type,
  value,
  onChange,
  placeholder,
  required,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [selectionStart, setSelectionStart] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateCursorPosition = () => {
    if (isFocused && inputRef.current && containerRef.current) {
      requestAnimationFrame(() => {
        const rect = containerRef.current!.getBoundingClientRect();
        const selStart = inputRef.current!.selectionStart || 0;
        const textWidth = getTextWidth(value.substring(0, selStart));
        const paddingLeft = parseInt(window.getComputedStyle(inputRef.current!).paddingLeft);
        
        setCursorPosition({
          x: rect.left + textWidth + paddingLeft,
          y: rect.top + (rect.height * 0.125),
        });
      });
    }
  };

  useEffect(() => {
    updateCursorPosition();
  }, [isFocused, value, selectionStart]);

  useEffect(() => {
    if (isFocused) {
      window.addEventListener('scroll', updateCursorPosition);
      window.addEventListener('resize', updateCursorPosition);
      return () => {
        window.removeEventListener('scroll', updateCursorPosition);
        window.removeEventListener('resize', updateCursorPosition);
      };
    }
  }, [isFocused]);

  const getTextWidth = (text: string) => {
    if (!inputRef.current) return 0;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      const computedStyle = window.getComputedStyle(inputRef.current);
      context.font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
      return context.measureText(text).width;
    }
    return 0;
  };

  const handleSelect = () => {
    if (inputRef.current) {
      const selStart = inputRef.current.selectionStart || 0;
      if (selStart !== selectionStart) {
        setSelectionStart(selStart);
        updateCursorPosition();
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    handleSelect();
    // Force cursor position update after a short delay
    setTimeout(updateCursorPosition, 10);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type={type === 'email' ? 'text' : type} // Use text type for email to avoid browser interference
        inputMode={type === 'email' ? 'email' : undefined} // Preserve email keyboard on mobile
        pattern={type === 'email' ? '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$' : undefined} // Add email validation pattern
        value={value}
        onChange={handleInput}
        onKeyUp={handleSelect}
        onKeyDown={handleSelect}
        onMouseUp={handleSelect}
        onClick={handleSelect}
        onSelect={handleSelect}
        onFocus={() => {
          setIsFocused(true);
          handleSelect();
        }}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        required={required}
        className={`
          block w-full px-3 py-2.5
          bg-transparent
          border-0 border-b-2 border-gray-200
          focus:ring-0 focus:border-blue-500
          transition-colors duration-200
          outline-none
          ${className}
        `}
        style={{ caretColor: 'transparent' }}
        autoComplete={type === 'email' ? 'email' : undefined}
      />
      <div 
        style={{ 
          left: `${cursorPosition.x}px`, 
          top: `${cursorPosition.y}px`,
          position: 'fixed',
          height: containerRef.current ? `${containerRef.current.offsetHeight * 0.75}px` : 'auto',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      >
        <TypingIndicator isVisible={isFocused} />
      </div>
      <style jsx>{`
        input::placeholder {
          color: #999;
          opacity: 0.6;
          font-weight: 400;
        }
        input:focus::placeholder {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default NotionInput; 