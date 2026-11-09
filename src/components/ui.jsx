import { motion, useReducedMotion } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, FileText, LoaderCircle, X } from "lucide-react";

export function Button({ children, variant = "primary", className = "", type = "button", ...props }) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type={type}
      whileHover={reduced ? undefined : { y: -1 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      className={`button button-${variant} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function Card({ children, className = "", ...props }) {
  return <section className={`card ${className}`} {...props}>{children}</section>;
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }) {
  const label = String(status || "unknown");
  return <span className={`status-badge status-${label.toLowerCase()}`}>{label}</span>;
}

export function EmptyState({ title = "Nothing here yet", description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><FileText size={22} /></span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={20} /> <span>{label}</span></div>;
}

export function NoteGridSkeleton({ count = 6 }) {
  return <div className="note-grid" aria-label="Loading notes" aria-busy="true">{Array.from({ length: count }, (_, index) => <div className="note-skeleton" key={index}><span /><i /><i /><i /></div>)}</div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state">
      <AlertCircle size={20} />
      <div><strong>We couldn’t load this content</strong><p>{message}</p></div>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Modal({ open, onOpenChange, title, description, children, className = "" }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className={`dialog-content ${className}`}>
          <div className="dialog-header">
            <div>
              <Dialog.Title className="dialog-title">{title}</Dialog.Title>
              {description && <Dialog.Description className="dialog-description">{description}</Dialog.Description>}
            </div>
            <Dialog.Close asChild><button className="icon-button" aria-label="Close"><X size={18} /></button></Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Field({ label, error, className = "", ...props }) {
  return (
    <label className={`field ${className}`}>
      {label && <span>{label}</span>}
      <input className={error ? "input input-error" : "input"} {...props} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
