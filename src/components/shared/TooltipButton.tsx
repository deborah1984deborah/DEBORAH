import React from 'react';

export const TooltipButton: React.FC<{
    onClick?: () => void;
    icon: React.ReactNode;
    label: string;
    style?: React.CSSProperties; // Added style prop for flexibility
}> = ({ onClick, icon, label, style }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div style={{ position: 'relative', ...style }}>
            <button
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: isHovered ? 'white' : '#94a3b8',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.2s'
                }}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {icon}
            </button>
            {/* Custom Tooltip */}
            <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.5rem',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '4px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.75rem',
                color: '#e2e8f0',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'translateY(0)' : 'translateY(-5px)',
                transition: 'all 0.2s ease',
                zIndex: 50,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(4px)'
            }}>
                {label}
            </div>
        </div>
    );
};
