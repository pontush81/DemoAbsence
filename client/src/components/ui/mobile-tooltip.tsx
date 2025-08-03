import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface MobileTooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function MobileTooltip({ 
  content, 
  children, 
  position = 'bottom',
  className = '' 
}: MobileTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  // Stäng tooltip när användaren trycker utanför
  useEffect(() => {
    if (!isVisible) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        tooltipRef.current && 
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    // Använd både mouse och touch events för bästa kompatibilitet
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isVisible]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2 left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'top-full mt-2 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 transform -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 transform -translate-y-1/2';
      default:
        return 'top-full mt-2 left-1/2 transform -translate-x-1/2';
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger element */}
      <div
        ref={triggerRef}
        onClick={showTooltip}
        onTouchStart={showTooltip}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label="Visa mer information"
      >
        {children}
      </div>

      {/* Tooltip content */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-50 px-3 py-2 text-sm text-gray-900 bg-white 
            border border-gray-200 rounded-lg shadow-lg
            max-w-xs min-w-max
            ${getPositionClasses()}
          `}
          role="tooltip"
        >
          {/* Close button for extra control */}
          <Button
            variant="ghost"
            size="sm"
            onClick={hideTooltip}
            className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            aria-label="Stäng"
          >
            ×
          </Button>
          
          {/* Content */}
          <div className="pr-6">
            {content}
          </div>
          
          {/* Arrow pointer */}
          <div className={`
            absolute w-2 h-2 bg-white border transform rotate-45
            ${position === 'top' ? 'top-full -mt-1 left-1/2 -translate-x-1/2 border-b border-r border-gray-200' : ''}
            ${position === 'bottom' ? 'bottom-full -mb-1 left-1/2 -translate-x-1/2 border-t border-l border-gray-200' : ''}
            ${position === 'left' ? 'left-full -ml-1 top-1/2 -translate-y-1/2 border-t border-r border-gray-200' : ''}
            ${position === 'right' ? 'right-full -mr-1 top-1/2 -translate-y-1/2 border-b border-l border-gray-200' : ''}
          `} />
        </div>
      )}
    </div>
  );
}

// Info icon component för enkel användning
export function InfoTooltip({ 
  content, 
  position = 'bottom',
  className = '' 
}: Omit<MobileTooltipProps, 'children'>) {
  return (
    <MobileTooltip content={content} position={position} className={className}>
      <div className="inline-flex items-center justify-center w-5 h-5 text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors">
        <span className="text-xs font-bold">?</span>
      </div>
    </MobileTooltip>
  );
}

// Badge med tooltip för att visa extra info
export function BadgeWithTooltip({ 
  badge, 
  tooltipContent, 
  position = 'top' 
}: {
  badge: React.ReactNode;
  tooltipContent: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}) {
  return (
    <MobileTooltip content={tooltipContent} position={position}>
      {badge}
    </MobileTooltip>
  );
}