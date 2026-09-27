import * as React from 'react';

export interface ModalProps {
    /** Whether the dialog is shown. */
    open: boolean;
    /** Dialog heading. */
    title: React.ReactNode;
    /** Called by the Close link. */
    onClose?: () => void;
    /** Maximum width in px (default 760). */
    width?: number;
    children?: React.ReactNode;
}

/** A centred dialog over a dark backdrop (`.modal-backdrop` + `.modal`), used for quizzes, imports and quiz links. */
export function Modal({ open, title, onClose, width, children }: ModalProps) {
    if (!open) return null;
    return (
        <div className="modal-backdrop">
            <div className="modal" role="dialog" aria-modal="true" style={width ? { maxWidth: width } : undefined}>
                <div className="modal-head">
                    <h2>{title}</h2>
                    <button className="linkish" type="button" onClick={onClose}>Close</button>
                </div>
                {children}
            </div>
        </div>
    );
}
