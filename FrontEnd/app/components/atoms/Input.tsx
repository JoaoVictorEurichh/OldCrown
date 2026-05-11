import React from 'react';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'tel';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export default function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full rounded-md border border-[#4c4c4c] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/40 ${className}`}
    />
  );
}