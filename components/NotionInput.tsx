import React, { useState, useEffect, useRef } from 'react';
import TypingIndicator from './TypingIndicator';

interface NotionInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
}

const NotionInput: React.FC<NotionInputProps> = ({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  className = '',
  autoFocus = false,
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [selectionStart, setSelectionStart] = useState(0);

  // 更新光标位置
  const updateCursorPosition = () => {
    if (!inputRef.current || !containerRef.current || !measureRef.current) return;

    const input = inputRef.current;
    const container = containerRef.current;
    const measure = measureRef.current;

    // 获取输入框的位置和样式
    const rect = container.getBoundingClientRect();
    const inputStyle = window.getComputedStyle(input);
    const paddingLeft = parseFloat(inputStyle.paddingLeft);
    const fontSize = parseFloat(inputStyle.fontSize);
    const fontFamily = inputStyle.fontFamily;

    // 设置测量元素的样式
    measure.style.fontSize = `${fontSize}px`;
    measure.style.fontFamily = fontFamily;
    measure.style.whiteSpace = 'pre';
    measure.style.position = 'absolute';
    measure.style.visibility = 'hidden';
    measure.style.height = '0';
    measure.style.overflow = 'hidden';

    // 计算文本宽度
    const textBeforeCursor = value.slice(0, selectionStart);
    measure.textContent = textBeforeCursor || placeholder;
    const textWidth = measure.offsetWidth;

    // 计算光标位置
    const cursorX = rect.left + paddingLeft + textWidth;
    const cursorY = rect.top + (rect.height / 2);

    setCursorPosition({ x: cursorX, y: cursorY });
  };

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    setSelectionStart(e.target.selectionStart || 0);
  };

  // 处理选择变化
  const handleSelect = () => {
    if (inputRef.current) {
      setSelectionStart(inputRef.current.selectionStart || 0);
    }
  };

  // 处理焦点变化
  const handleFocus = () => {
    setIsFocused(true);
    if (inputRef.current) {
      setSelectionStart(inputRef.current.selectionStart || 0);
    }
  };

  // 处理失焦
  const handleBlur = () => {
    setIsFocused(false);
  };

  // 监听输入事件
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleInput = () => {
      setSelectionStart(input.selectionStart || 0);
    };

    input.addEventListener('input', handleInput);
    input.addEventListener('keyup', handleInput);
    input.addEventListener('keydown', handleInput);
    input.addEventListener('mouseup', handleInput);
    input.addEventListener('click', handleInput);

    return () => {
      input.removeEventListener('input', handleInput);
      input.removeEventListener('keyup', handleInput);
      input.removeEventListener('keydown', handleInput);
      input.removeEventListener('mouseup', handleInput);
      input.removeEventListener('click', handleInput);
    };
  }, []);

  // 更新光标位置
  useEffect(() => {
    if (isFocused) {
      updateCursorPosition();
    }
  }, [value, selectionStart, isFocused]);

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (isFocused) {
        updateCursorPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFocused]);

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
        className={`
          w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          placeholder-gray-400
          ${className}
        `}
        style={{ caretColor: 'transparent' }}
      />
      <span ref={measureRef} className="invisible absolute whitespace-pre" />
      {isFocused && <TypingIndicator position={cursorPosition} />}
    </div>
  );
};

export default NotionInput; 