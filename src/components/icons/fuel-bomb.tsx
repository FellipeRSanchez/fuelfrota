import React from 'react';

interface FuelBombIconProps {
  /** CSS classes to apply to the SVG */
  className?: string;
  /** Width and height of the icon (in pixels) */
  size?: number;
}

/**
 * Fuel pump icon component
 * Renders a simple fuel pump SVG
 */
const FuelBombIcon: React.FC<FuelBombIconProps> = ({ 
  className = '', 
  size = 24 
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Pump body */}
      <rect x="4" y="6" width="16" height="12" rx="2" />
      {/* Pump display */}
      <rect x="8" y="8" width="8" height="4" rx="1" />
      {/* Pump nozzle */}
      <path d="M8 18h4" />
      <path d="M10 22h4" />
      <path d="M12 18v4" />
    </svg>
  );
};

export default FuelBombIcon;