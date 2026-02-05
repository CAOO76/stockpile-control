/**
 * M3Switch Component
 * Material Design 3 Switch siguiendo especificaciones Flat Design
 * Para control de georeferenciación y otras opciones toggle
 */

import React from 'react';
import './M3Switch.css';

export interface M3SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
}

export const M3Switch: React.FC<M3SwitchProps> = ({
    checked,
    onChange,
    label,
    disabled = false,
}) => {
    const handleChange = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    return (
        <div className="m3-switch-container">
            <label className={`m3-switch-label ${disabled ? 'disabled' : ''}`}>
                <span className="m3-switch-text">{label}</span>
                <button
                    role="switch"
                    aria-checked={checked}
                    aria-label={label}
                    className={`m3-switch ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={handleChange}
                    disabled={disabled}
                    type="button"
                >
                    <span className="m3-switch-track">
                        <span className="m3-switch-thumb"></span>
                    </span>
                </button>
            </label>
        </div>
    );
};
