import React from 'react';

interface SimpleInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
}

const SimpleInput: React.FC<SimpleInputProps> = ({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  className = '',
  autoFocus = false,
  required = false,
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      required={required}
      className={`
        w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        placeholder-gray-400
        ${className}
      `}
    />
  );
};

export default SimpleInput; 