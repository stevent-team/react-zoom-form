import { z } from 'zod'
import { PathSegment, RecursivePartial, arrayStartsWith, getDeepProp, setDeepProp } from './utils'

export type FieldControls<Schema extends z.ZodType> = {
  schema: Schema
  path: PathSegment[]
  formValue: RecursivePartial<z.infer<Schema>>
  setFormValue: React.Dispatch<React.SetStateAction<RecursivePartial<z.infer<Schema>>>>
  formErrors: z.ZodError<z.infer<Schema>> | undefined
}

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
  value: Partial<T> | undefined
  /** Takes a new value to set `value` of this field. */
  onChange: (value: Partial<T> | undefined) => void
  /** Array of ZodIssues for this field. */
  errors: z.ZodIssue[]
}

/**
 * Control a custom field. Takes the field you want to control from
 * `fields` given by the `useForm` hook, and returns an object with
 * state and methods that you can pass to your custom component.
 */
export const controlled = <T>({ _field }: { _field: FieldControls<z.ZodType<T>> }): Field<T> => {
  const { schema, path, formValue, setFormValue, formErrors } = _field

  const name = path.map(p => p.key).join('.')

  const value = getDeepProp(formValue, path) as Partial<T> | undefined
  const onChange = (value: Partial<T> | undefined) => setFormValue(v => setDeepProp(v, path, value) as typeof v)

  const errors = formErrors?.issues?.filter(issue => arrayStartsWith(issue.path, path.map(p => p.key))) ?? []

  return {
    name,
    schema,
    value,
    onChange,
    errors,
  }
}
