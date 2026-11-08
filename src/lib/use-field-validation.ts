import { useCallback, useState } from "react";

export type FieldErrors = Record<string, string>;

/**
 * Inline validation for a whole form, driven by the same `validate(formData)`
 * used on submit, so blur-time and submit-time messages never disagree.
 *
 *  - blur: checks a field once the person has typed something into it
 *    (tabbing past an empty field doesn't nag);
 *  - change: re-checks only fields already flagged, so an error clears the
 *    moment it is fixed.
 *
 * Spread `fieldHandlers` on the <form>; React's focus/change events bubble.
 */
export function useFieldValidation(validate: (fd: FormData) => FieldErrors) {
  const [errors, setErrors] = useState<FieldErrors>({});

  const check = useCallback(
    (form: HTMLFormElement, name: string) => {
      const message = validate(new FormData(form))[name];
      setErrors((prev) => {
        if (prev[name] === message) return prev;
        const next = { ...prev };
        if (message) next[name] = message;
        else delete next[name];
        return next;
      });
    },
    [validate],
  );

  const onBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || !t.name || t.type === "checkbox" || t.tabIndex < 0) return;
    if (!t.value.trim() && !errors[t.name]) return;
    check(e.currentTarget, t.name);
  };

  const onChange = (e: React.FormEvent<HTMLFormElement>) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || !t.name || !errors[t.name]) return;
    check(e.currentTarget, t.name);
  };

  return { errors, setErrors, fieldHandlers: { onBlur, onChange } };
}
