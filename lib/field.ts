import { z } from 'zod'
import { PathSegment, RecursivePartial, arrayStartsWith, getDeepProp, isRadio, setDeepProp, unwrapZodType } from './utils'
import { FieldRefs } from './useForm'

export type FieldControls<Schema extends z.ZodType = z.ZodType> = {
  schema: Schema
  path: PathSegment[]
  formValue: RecursivePartial<z.ZodType>
  setFormValue: React.Dispatch<React.SetStateAction<RecursivePartial<z.ZodType>>>
  formErrors: z.ZodError<z.ZodType> | undefined
}

type PartialObject<T> = T extends any[] ? T : Partial<T>

export type Field<T> = {
  /**
   * The name of this field.
   *
   * @example
   * `location.address.line1`
   */
  name: string
  /** The zod schema for this field. */
  schema: z.ZodType<T>
  /** Reactive value of this field. */
  value: PartialObject<T> | undefined
  /** Takes a new value to set `value` of this field. */
  onChange: (value: PartialObject<T> | undefined) => void
  /** Array of ZodIssues for this field. */
  errors: z.ZodIssue[]
}

export type RegisterFn = (
  path: PathSegment[],
  schema: z.ZodType,
  setFormValue: React.Dispatch<React.SetStateAction<RecursivePartial<z.ZodType>>>,
  fieldRefs: React.MutableRefObject<FieldRefs>,
) => {
  onChange: React.ChangeEventHandler<any>
  ref: React.Ref<any>
  name: string
}

// Register for native elements (input, textarea, select)
export const register: RegisterFn = (path, fieldSchema, setFormValue, fieldRefs) => {
  const name = path.map(p => p.key).join('.')
  const unwrapped = unwrapZodType(fieldSchema)

  return {
    onChange: e => {
      let newValue: string | boolean | undefined = e.currentTarget.value
      if (!(unwrapped instanceof z.ZodString) && newValue === '') {
        newValue = undefined
      }
      if (e.currentTarget.type?.toLowerCase() === 'checkbox') {
        newValue = e.currentTarget.checked
      }
      setFormValue(v => setDeepProp(v, path, newValue) as typeof v)
    },
    name,
    ref: ref => {
      if (ref) {
        const refIndex = isRadio(ref) ? `${name}.${ref.value}` : name
        fieldRefs.current[refIndex] = { path, ref }
      } else {
        delete fieldRefs.current[name]
      }
    },
  } satisfies React.ComponentProps<'input'>
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
export const controlled = <T>({ _field }: { _field: FieldControls<z.ZodType<NonNullable<T>>> }): Field<NonNullable<T>> => {
  const { schema, path, formValue, setFormValue, formErrors } = _field

  return {
    schema,
    name: path.map(p => p.key).join('.'),
    value: getDeepProp(formValue, path) as PartialObject<NonNullable<T>> | undefined,
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
 * <span>{errors(fields.myInput).map(e => e.message).join(', ')}</span>
 * ```
 */
export const errors = <T>({ _field: { formErrors, path } }: { _field: FieldControls<z.ZodType<T>> }): z.ZodIssue[] =>
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
export const getValue = <T>({ _field: { formValue, path } }: { _field: FieldControls<z.ZodType<T>> }) =>
  getDeepProp(formValue, path) as PartialObject<NonNullable<T>> | undefined

/**
 * Set the value of a field directly.
 *
 * @example
 * ```ts
 * setValue(fields.myInput, 'Hi there!')
 * ```
 */
export const setValue = <T>(
  { _field: { setFormValue, path } }: { _field: FieldControls<z.ZodType<T>> },
  newValue: PartialObject<NonNullable<T>> | undefined | ((currentValue: PartialObject<NonNullable<T>> | undefined) => PartialObject<NonNullable<T>> | undefined)
) => {
  if (typeof newValue === 'function') {
    setFormValue(v => setDeepProp(v, path, newValue(getDeepProp(v, path) as PartialObject<NonNullable<T>> | undefined)) as typeof v)
  } else {
    setFormValue(v => setDeepProp(v, path, newValue) as typeof v)
  }
}
