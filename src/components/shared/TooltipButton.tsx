import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipButtonProps {
    onClick?: () => void;
    icon: React.ReactNode;
    label: string;
    style?: React.CSSProperties;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    variant?: 'default' | 'neon-blue';
}

export const TooltipButton: React.FC<TooltipButtonProps> = ({
    onClick,
    icon,
    label,
    style,
    placement = 'bottom',
    variant = 'default'
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleMouseEnter = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            let top = 0;
            let left = 0;
            const gap = 8; // 0.5rem approx

            // Calculate rounded coordinates to prevent subpixel jitter
            switch (placement) {
                case 'top':
                    top = rect.top - gap;
                    left = rect.left + rect.width / 2;
                    break;
                case 'bottom':
                    top = rect.bottom + gap;
                    left = rect.left + rect.width / 2;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2;
                    left = rect.left - gap;
                    break;
                case 'right':
                    top = rect.top + rect.height / 2;
                    left = rect.right + gap;
                    break;
            }

            // Round coordinates to avoid sub-pixel rendering artifacts
            setCoords({
                top: Math.round(top),
                left: Math.round(left)
            });
            setIsHovered(true);
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    // Dynamic styles based on variant
    const buttonColor = variant === 'neon-blue'
        ? (isHovered ? '#38bdf8' : 'rgba(56, 189, 248, 0.7)')
        : (isHovered ? 'white' : '#94a3b8');

    const tooltipBg = variant === 'neon-blue'
        ? 'rgba(15, 23, 42, 0.95)'
        : 'rgba(15, 23, 42, 0.95)';

    const tooltipBorder = variant === 'neon-blue'
        ? '1px solid rgba(56, 189, 248, 0.5)'
        : '1px solid rgba(148, 163, 184, 0.2)';

    const tooltipTextColor = variant === 'neon-blue'
        ? '#38bdf8'
        : '#e2e8f0';

    return (
        <div style={{ position: 'relative', ...style }}>
            <button
                ref={buttonRef}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: buttonColor,
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    filter: variant === 'neon-blue' && isHovered ? 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.5))' : 'none'
                }}
                onClick={onClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {icon}
            </button>

            {/* Portal Tooltip */}
            {isHovered && createPortal(
                <div style={{
                    position: 'fixed',
                    top: coords.top,
                    left: coords.left,
                    // Use CS transforms to center, matching original CSS logic but accounting for self-width/height
                    transform: placement === 'top' ? 'translate(-50%, -100%)' :
                        placement === 'bottom' ? 'translate(-50%, 0)' :
                            placement === 'left' ? 'translate(-100%, -50%)' :
                                'translate(0, -50%)',
                    backgroundColor: tooltipBg,
                    border: tooltipBorder,
                    borderRadius: '4px',
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem',
                    color: tooltipTextColor,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 99999, // Ensure visibility above modals
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(4px)'
                }}>
                    {label}
                </div>,
                document.body
            )}
        </div>
    );
};
