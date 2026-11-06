/** Accessible form field primitives for the admin (works in server & client components). */
import styles from "../admin.module.css";

type Common = {
  name: string;
  label: string;
  hint?: React.ReactNode;
  error?: string;
  defaultValue?: string;
};

function describedBy(name: string, hint?: React.ReactNode, error?: string) {
  return [hint ? `${name}-hint` : null, error ? `${name}-error` : null].filter(Boolean).join(" ") || undefined;
}

function Meta({ name, hint, error }: { name: string; hint?: React.ReactNode; error?: string }) {
  return (
    <>
      {hint && (
        <span id={`${name}-hint`} className={styles.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={`${name}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </>
  );
}

export function TextField({
  name,
  label,
  hint,
  error,
  defaultValue,
  type = "text",
  required,
  readOnly,
  ...rest
}: Common & {
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  step?: string;
  min?: string | number;
  max?: string | number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        readOnly={readOnly}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        className={styles.input}
        {...rest}
      />
      <Meta name={name} hint={hint} error={error} />
    </div>
  );
}

export function TextArea({ name, label, hint, error, defaultValue, rows = 4 }: Common & { rows?: number }) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        className={styles.textarea}
      />
      <Meta name={name} hint={hint} error={error} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  hint,
  error,
  defaultValue,
  options,
}: Common & { options: Array<{ value: string; label: string }> }) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        className={styles.select}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Meta name={name} hint={hint} error={error} />
    </div>
  );
}

export function Checkbox({
  name,
  label,
  hint,
  error,
  defaultChecked,
}: Omit<Common, "defaultValue"> & { defaultChecked?: boolean }) {
  return (
    <div className={styles.field}>
      <label className={styles.checkbox}>
        <input
          type="checkbox"
          name={name}
          id={name}
          defaultChecked={defaultChecked}
          aria-describedby={describedBy(name, hint, error)}
        />
        <span>{label}</span>
      </label>
      <Meta name={name} hint={hint} error={error} />
    </div>
  );
}
