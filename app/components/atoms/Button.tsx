import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  onClick?: () => void;
}

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  onClick,
}: ButtonProps) {
  const base = 'py-2 px-4 rounded font-semibold transition-all';
  const styles =
    variant === 'primary'
      ? 'bg-[#C6A75E] text-black hover:bg-[#b8954a]'
      : variant === 'secondary'
      ? 'bg-gray-700 text-white hover:bg-gray-600'
      : 'bg-red-600 text-white hover:bg-red-500';

  return (
    <button type={type} className={`${base} ${styles} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}