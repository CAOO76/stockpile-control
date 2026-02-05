/**
 * M3TextField Component
 * Material Design 3 Text Field con autocomplete='off' obligatorio
 * Para formularios de campo con seguridad de inputs
 */

import React from 'react';
import './M3TextField.css';

export interface M3TextFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'number' | 'date' | 'time' | 'email';
    required?: boolean;
    disabled?: boolean;
    error?: string;
    placeholder?: string;
    helperText?: string;
}

export const M3TextField: React.FC<M3TextFieldProps> = ({
    label,
    value,
    onChange,
    type = 'text',
    required = false,
    disabled = false,
    error,
    placeholder,
    helperText,
}) => {
    const hasError = Boolean(error);
    const hasValue = value.length > 0;

    return (
        <div className="m3-text-field-container">
            <div className={`m3-text-field ${hasError ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
                <input
                    type={type}
                    className="m3-text-field-input"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder || ' '}
                    required={required}
                    disabled={disabled}
                    autoComplete="off" // OBLIGATORIO - Seguridad de inputs
                    aria-label={label}
                    aria-invalid={hasError}
                    aria-describedby={error ? `${label}-error` : undefined}
                />
                <label className={`m3-text-field-label ${hasValue ? 'filled' : ''}`}>
                    {label}
                    {required && <span className="required-indicator"> *</span>}
                </label>
                <div className="m3-text-field-underline"></div>
            </div>

            {error && (
                <div id={`${label}-error`} className="m3-text-field-error">
                    {error}
                </div>
            )}

            {helperText && !error && (
                <div className="m3-text-field-helper">
                    {helperText}
                </div>
            )}
        </div>
    );
};
