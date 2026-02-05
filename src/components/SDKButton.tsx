/**
 * SDKButton Component
 * Material Design 3 Button con variantes Primary, Secondary, Tertiary
 * Flat Design - Sin degradados
 */

import React from 'react';
import './SDKButton.css';

export interface SDKButtonProps {
    variant?: 'primary' | 'secondary' | 'tertiary';
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    fullWidth?: boolean;
    type?: 'button' | 'submit' | 'reset';
}

export const SDKButton: React.FC<SDKButtonProps> = ({
    variant = 'primary',
    onClick,
    children,
    disabled = false,
    fullWidth = false,
    type = 'button',
}) => {
    return (
        <button
            type={type}
            className={`sdk-button sdk-button-${variant} ${fullWidth ? 'full-width' : ''}`}
            onClick={onClick}
            disabled={disabled}
        >
            <span className="sdk-button-label">{children}</span>
        </button>
    );
};
