import { forwardRef } from 'react'

interface FieldProps {
  label: string
  optional?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}

export function Field({ label, optional, error, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[color:rgb(var(--text-primary))]">
        {label}
        {optional && (
          <span className="text-stone-400"> (optional)</span>
        )}
      </span>
      <div className="mt-1">{children}</div>
      {hint && !error && (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </label>
  )
}

const inputClass =
  'w-full rounded border border-stone-300 bg-card px-3 py-2 text-sm shadow-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:bg-stone-800 dark:focus:border-stone-100 dark:focus:ring-stone-100'

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input(props, ref) {
    return (
      <input
        ref={ref}
        {...props}
        type={props.type ?? 'text'}
        className={`${inputClass} ${props.className ?? ''}`}
      />
    )
  },
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea(props, ref) {
  return (
    <textarea
      ref={ref}
      {...props}
      className={`${inputClass} ${props.className ?? ''}`}
    />
  )
})

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select(props, ref) {
  return (
    <select
      ref={ref}
      {...props}
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
      'bg-stone-200 text-stone-900 hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost:
      'bg-transparent text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
  }
  return (
    <button
      type="button"
      {...props}
      className={`rounded px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className ?? ''}`}
    />
  )
}

export function Checkbox({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-start gap-2 text-sm text-[color:rgb(var(--text-primary))]">
      <input
        type="checkbox"
        {...props}
        className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 dark:border-stone-600 dark:bg-stone-800"
      />
      <span>{label}</span>
    </label>
  )
}
