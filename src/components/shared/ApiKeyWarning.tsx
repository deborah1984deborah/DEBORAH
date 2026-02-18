import React from 'react';

interface ApiKeyWarningProps {
    currentSystem: 'MOMMY' | 'WOMB';
}

export const ApiKeyWarning: React.FC<ApiKeyWarningProps> = ({ currentSystem }) => {
    // For now, always show the warning to design the UI.
    // Logic will be added later when the user approves.

    const handleClick = () => {
        alert("API Key Setup Required:\n\n1. Open the project folder.\n2. Rename '.env.example' to '.env' (or create a new '.env' file).\n3. Open '.env' and add your API Key:\n   VITE_API_KEY=sk-your-key-here\n4. Restart the development server.");
    };

    // Dynamic Positioning based on System Mode to track the Switch Button
    // MOMMY Button: bottom 15%, right 10.5%
    // WOMB Button: bottom 5%, right 3.5%
    const positionStyle: React.CSSProperties = currentSystem === 'MOMMY'
        ? { bottom: '25%', right: '10.5%' }  // Above MOMMY button
        : { bottom: '16%', right: '3.5%' };  // Above WOMB button

    return (
        <div
            onClick={handleClick}
            style={{
                position: 'fixed',
                ...positionStyle,
                background: 'rgba(255, 255, 255, 0.15)', // White glassmorphism
                border: '1px solid rgba(255, 255, 255, 0.4)',
                padding: '10px 16px', // Slightly larger padding
                borderRadius: '8px',
                color: '#ffffff', // White text
                fontSize: '1rem', // Larger font size
                fontWeight: 'bold',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                zIndex: 9999,
                transition: 'all 0.5s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                userSelect: 'none'
            }}
            title="Click for setup instructions"
        >
            {/* Icon removed as requested */}
            <span>API Key Setup Required</span>
        </div>
    );
};
