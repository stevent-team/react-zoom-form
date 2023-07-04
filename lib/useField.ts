import { z } from 'zod'
import { PathSegment, RecursivePartial, arrayStartsWith, getDeepProp, setDeepProp } from './utils'
import { useCallback, useMemo } from 'react'

export type FieldControls<Schema extends z.ZodType> = {
  schema: Schema
  path: PathSegment[]
  formValue: RecursivePartial<z.infer<Schema>>
  setFormValue: React.Dispatch<React.SetStateAction<RecursivePartial<z.infer<Schema>>>>
  formErrors: z.ZodError<z.infer<Schema>> | undefined
}

export type Field<T> = { _field: FieldControls<z.ZodType<T>> }

/**
 * Hook used to control a custom field. Takes the field you want to control from
 * `fields` given by the `useForm` hook, and returns an object with state and methods.
 */
export const useField = <T>({ _field }: Field<T>) => {
  const { schema, path, formValue, setFormValue, formErrors } = _field

  const name = path.map(p => p.key).join('.')

  const value = useMemo(() => getDeepProp(formValue, path) as Partial<T> | undefined, [formValue, name])
  const onChange = useCallback((value: Partial<T>) => setFormValue(v => setDeepProp(v, path, value) as typeof v), [formValue, name])

  const errors = useMemo(() => formErrors?.issues?.filter(issue => arrayStartsWith(issue.path, path.map(p => p.key))) ?? [], [formErrors])

  return {
    /** The zod schema for this field. */
    schema,
    /** Reactive value of this field. */
    value,
    /** Takes a new value to set `value` of this field. */
    onChange,
    /** Array of ZodIssues for this field. */
    errors,
  }
}
