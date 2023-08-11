import { z } from 'zod'
import { NonUndefined, PartialObject, PathSegment, RecursivePartial, arrayStartsWith, getDeepProp, setDeepProp } from './utils'

/** The controls that each path along the field chain can access under `_field`. */
export type Field<Schema extends z.ZodType = z.ZodType> = {
  _field: {
    schema: Schema
    path: PathSegment[]
    formValue: React.MutableRefObject<RecursivePartial<z.TypeOf<Schema>>>
    setFormValue: React.Dispatch<React.SetStateAction<RecursivePartial<z.ZodType>>>
    formErrors: z.ZodError<z.ZodType> | undefined
  }
}

/**
 * Return type of `controlled`. Can be used to restrict a custom field to a certain type.
 *
 * @example
 * ```tsx
 * interface Link {
 *   label: string
 *   url: string
 * }
 *
 * const LinkField = ({ value, onChange }: ControlledField<Link>) => <>...</>
 * ```
 */
export type ControlledField<T> = {
  /**
   * The name of this field.
   *
   * @example
   * `location.address.line1`
   */
  name: string
  /** The zod schema for this field. */
  schema: z.ZodType<T | undefined>
  /** Reactive value of this field. */
  value: PartialObject<T> | undefined
  /** Takes a new value to set `value` of this field. */
  onChange: (value: PartialObject<T> | undefined) => void
  /** Array of ZodIssues for this field. */
  errors: z.ZodIssue[]
}

/**
 * Control a custom field. Takes the field you want to control from
 * `fields` given by the `useForm` hook, and returns an object with
 * state and methods that you can pass to your custom component.
 *
 * @example
 * ```tsx
 * <CustomField {...controlled(fields.myCustomField)} />
 * ```
 */
export const controlled = <T>({ _field }: Field<z.ZodType<T>>): ControlledField<NonUndefined<T>> => {
  const { schema, path, formValue, setFormValue, formErrors } = _field

  return {
    schema: schema as z.ZodType<NonUndefined<T>, z.ZodTypeDef, NonUndefined<T>>,
    name: path.map(p => p.key).join('.'),
    value: getDeepProp(formValue.current, path) as PartialObject<NonUndefined<T>> | undefined,
    onChange: value => setFormValue(v => setDeepProp(v, path, value) as typeof v),
    errors: formErrors?.issues?.filter(issue => arrayStartsWith(issue.path, path.map(p => p.key))) ?? [],
  }
}

/**
 * Get the errors for a field. Useful for showing errors for a native
 * input, unlike `controlled` which also gives you the errors for that field.
 *
 * @example
 * ```tsx
 * <input type="text" {...fields.myInput.register()} />
 * <span>{fieldErrors(fields.myInput).map(e => e.message).join(', ')}</span>
 * ```
 */
export const fieldErrors = <T>({ _field: { formErrors, path } }: Field<z.ZodType<T>>): z.ZodIssue[] =>
  formErrors?.issues?.filter(issue => arrayStartsWith(issue.path, path.map(p => p.key))) ?? []

/**
 * Get the value of a field. You can also use the base `fields` object to
 * watch all values in the form.
 *
 * @example
 * ```ts
 * const myInputValue = getValue(fields.myInput)
 * const formValue = getValue(fields)
 * ```
 */
export const getValue = <T>({ _field: { formValue, path } }: Field<z.ZodType<T>>) =>
  getDeepProp(formValue.current, path) as PartialObject<NonUndefined<T>> | undefined

/**
 * Set the value of a field directly.
 *
 * @example
 * ```ts
 * setValue(fields.myInput, 'Hi there!')
 * setValue(fields.myInput, currentValue => `${currentValue}!!`)
 * ```
 */
export const setValue = <T>(
  { _field: { setFormValue, path } }: Field<z.ZodType<T>>,
  newValue: PartialObject<NonUndefined<T>> | undefined | ((currentValue: PartialObject<NonUndefined<T>> | undefined) => PartialObject<NonUndefined<T>> | undefined)
) => {
  if (typeof newValue === 'function') {
    setFormValue(v => setDeepProp(v, path, newValue(getDeepProp(v, path) as PartialObject<NonUndefined<T>> | undefined)) as typeof v)
  } else {
    setFormValue(v => setDeepProp(v, path, newValue) as typeof v)
  }
}
