import { createContext, forwardRef, useContext, useId } from 'react'

// ─── FieldContext ───────────────────────────────────────────────────────
//
// Field passes the input's id and a11y descriptors (describedby for
// hint/error, invalid, required) down to Input/Textarea/Select via this
// context. That way callers can write:
//
//   <Field label="Production name" required error={errors.name?.message}>
//     <Input {...register('name')} />
//   </Field>
//
// …and Input automatically picks up `id`, `aria-describedby`, `aria-
// invalid`, `aria-required` — no per-caller plumbing. When Input is
// used outside a Field (rare; mostly tests or one-offs), it falls back
// to whatever the caller passes directly.

interface FieldContextValue {
  inputId: string
  /** Set on hint/error span; null when there's neither. */
  descriptionId: string | null
  invalid: boolean
  required: boolean
}

const FieldContext = createContext<FieldContextValue | null>(null)

function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext)
}

interface FieldProps {
  label: string
  /** Marks the field as required — adds a visible asterisk and wires
   *  `aria-required="true"` on the underlying input. Required and
   *  optional are mutually exclusive; passing both is a caller bug. */
  required?: boolean
  /** Adds "(optional)" after the label. Use for fields users might
   *  reasonably skip. */
  optional?: boolean
  /** Validation error from react-hook-form / zod. When present, the
   *  field renders the message and sets `aria-invalid="true"` +
   *  `aria-describedby` on the input. */
  error?: string
  /** Subdued helper text below the input. Hidden when an error is
   *  present (the error takes the same slot). */
  hint?: string
  children: React.ReactNode
}

export function Field({
  label,
  required,
  optional,
  error,
  hint,
  children,
}: FieldProps) {
  const inputId = useId()
  const descId = useId()
  const hasDescription = !!(hint || error)
  const ctx: FieldContextValue = {
    inputId,
    descriptionId: hasDescription ? descId : null,
    invalid: !!error,
    required: !!required,
  }
  return (
    <FieldContext.Provider value={ctx}>
      <div className="block">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[color:rgb(var(--text-primary))]"
        >
          {label}
          {required && (
            <span
              aria-hidden="true"
              className="ml-0.5 text-[rgb(var(--accent))]"
            >
              *
            </span>
          )}
          {optional && (
            <span className="text-muted"> (optional)</span>
          )}
        </label>
        <div className="mt-1">{children}</div>
        {hint && !error && (
          <span
            id={descId}
            className="mt-1 block text-xs text-muted"
          >
            {hint}
          </span>
        )}
        {error && (
          <span
            id={descId}
            role="alert"
            className="mt-1 block text-xs text-red-600 dark:text-red-400"
          >
            {error}
          </span>
        )}
      </div>
    </FieldContext.Provider>
  )
}

const inputClass =
  'w-full rounded border border-surface-border bg-card px-3 py-2 text-sm shadow-sm focus:border-[rgb(var(--accent))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--accent))] dark:bg-[rgb(var(--surface-elev))]'

/** Spread context-derived a11y attrs onto an input. Context wins over
 *  caller-supplied values so e.g. a stale `id` from a caller can't
 *  break the htmlFor-to-id pairing the Field set up. */
function contextAttrs(ctx: FieldContextValue | null) {
  if (!ctx) return {}
  return {
    id: ctx.inputId,
    ...(ctx.descriptionId ? { 'aria-describedby': ctx.descriptionId } : {}),
    ...(ctx.invalid ? { 'aria-invalid': true as const } : {}),
    ...(ctx.required ? { 'aria-required': true as const } : {}),
  }
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input(props, ref) {
    const ctx = useFieldContext()
    return (
      <input
        ref={ref}
        type={props.type ?? 'text'}
        {...props}
        {...contextAttrs(ctx)}
        className={`${inputClass} ${props.className ?? ''}`}
      />
    )
  },
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea(props, ref) {
  const ctx = useFieldContext()
  return (
    <textarea
      ref={ref}
      {...props}
      {...contextAttrs(ctx)}
      className={`${inputClass} ${props.className ?? ''}`}
    />
  )
})

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select(props, ref) {
  const ctx = useFieldContext()
  return (
    <select
      ref={ref}
      {...props}
      {...contextAttrs(ctx)}
      className={`${inputClass} ${props.className ?? ''}`}
    />
  )
})

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const variants = {
    primary:
      'bg-[rgb(var(--accent))] text-[rgb(var(--on-accent))] hover:bg-[rgb(var(--accent-hover))]',
    secondary:
      'bg-surface-border/40 text-[rgb(var(--text-primary))] hover:bg-surface-border/60',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost:
      'bg-transparent text-muted hover:bg-surface-border/20',
  }
  return (
    <button
      type="button"
      {...props}
      className={`rounded px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className ?? ''}`}
    />
  )
}

// ─── IconButton + standard icons ────────────────────────────────────────
//
// Small square buttons for row-level actions that don't need text. Built
// for the destructive-action demotion pattern (list-row Delete used to
// shout in solid red; now it whispers as a trash icon that turns red on
// hover). Always requires an `aria-label` so screen-reader users know
// what the button does — TypeScript enforces it.

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** SR-announced action name. e.g. "Delete contact: Avery Stone".
   *  Be specific — bare "Delete" multiplied across a list of rows is
   *  worse than no label. */
  'aria-label': string
  /** Color treatment.
   *  - `default`: muted by default, accent on hover (neutral actions).
   *  - `danger`:  muted by default, red on hover (destructive). */
  tone?: 'default' | 'danger'
}

export function IconButton({
  tone = 'default',
  className,
  children,
  ...props
}: IconButtonProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400'
      : 'text-muted hover:bg-surface-border/30 hover:text-[rgb(var(--text-primary))]'
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-9 w-9 items-center justify-center rounded transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${className ?? ''}`}
    >
      {children}
    </button>
  )
}

/** Trash icon for IconButton children. 16px square, currentColor stroke. */
export function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 4h11" />
      <path d="M6 4V2.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V4" />
      <path d="M3.5 4l.7 9a1.5 1.5 0 0 0 1.5 1.4h4.6a1.5 1.5 0 0 0 1.5-1.4l.7-9" />
      <path d="M6.5 7v5" />
      <path d="M9.5 7v5" />
    </svg>
  )
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Optional explanatory text rendered as a muted second line beneath
   *  the label. Use this rather than cramming an explanation into the
   *  label itself — keeps the SR-announced label tight and the visual
   *  hierarchy clear. */
  hint?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, hint, ...props }, ref) {
    return (
      <label className="flex items-start gap-2 text-sm text-[color:rgb(var(--text-primary))]">
        <input
          ref={ref}
          type="checkbox"
          {...props}
          className="mt-0.5 h-4 w-4 rounded border-surface-border text-accent focus:ring-accent"
        />
        <span>
          <span>{label}</span>
          {hint && (
            <span className="mt-0.5 block text-xs text-muted">{hint}</span>
          )}
        </span>
      </label>
    )
  },
)
