import { z } from 'zod'
import { PathSegment, RecursivePartial, getDeepProp, setDeepProp } from './utils'
import { useCallback, useMemo } from 'react'

export type FieldControls<Schema extends z.ZodType> = {
  schema: Schema
  path: PathSegment[]
  formValue: RecursivePartial<z.infer<Schema>>
  setFormValue: React.Dispatch<React.SetStateAction<RecursivePartial<z.infer<Schema>>>>
}

export type Field<T> = { _field: FieldControls<z.ZodType<T>> }

export const useField = <T>({ _field }: Field<T>) => {
  const { schema, path, formValue, setFormValue } = _field

  const name = path.map(p => p.key).join('.')

  const value = useMemo(() => getDeepProp(formValue, path) as Partial<T> | undefined, [formValue, name])
  const onChange = useCallback((value: Partial<T>) => setFormValue(v => setDeepProp(v, path, value)), [formValue, name])

  return { schema, value, onChange }
}
