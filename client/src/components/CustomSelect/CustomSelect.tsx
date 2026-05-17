import { useState, useEffect, useRef } from 'react';
import './CustomSelect.css';

interface CustomSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}

export const CustomSelect = ({ options, value, onChange, placeholder, disabled = false, className }: CustomSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find(o => o.value === value)?.label ?? '';

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleToggle = () => {
    if (!disabled) setOpen(prev => !prev);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className={`cs-wrapper${open ? ' cs-wrapper--open' : ''}${disabled ? ' cs-wrapper--disabled' : ''}${className ? ` ${className}` : ''}`}
      ref={ref}
    >
      <div className="cs-trigger" onClick={handleToggle} role="button" aria-expanded={open}>
        <span className={value ? 'cs-value' : 'cs-placeholder'}>
          {value ? selectedLabel : placeholder}
        </span>
        <svg
          className={`cs-arrow${open ? ' cs-arrow--open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && (
        <ul className="cs-list" role="listbox">
          {options.map(opt => (
            <li
              key={opt.value}
              className={`cs-option${opt.value === value ? ' cs-option--selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
              role="option"
              aria-selected={opt.value === value}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
