import { useEffect, useRef, useState } from 'react'
import { ZodIssue, z } from 'zod'

import { getDefaults } from './utils/getDefaults'

export interface UseFormOptions<Schema extends z.AnyZodObject> {
  schema: Schema
}

export type SubmitHandler<Schema extends z.AnyZodObject> = (values: z.infer<Schema>) => void

export const useForm = <Schema extends z.AnyZodObject>({
  schema,
}: UseFormOptions<Schema>) => {
  const [formValue, setFormValue] = useState(getDefaults(schema))
  const [errors, setErrors] = useState<z.inferFlattenedErrors<Schema, ZodIssue>>()

  useEffect(() => {
    console.log('rawValue', formValue)
  }, [formValue])

  const handleSubmit = (handler: SubmitHandler<Schema>): React.FormEventHandler<HTMLFormElement> => e => {
    e.preventDefault()
    const parsed = schema.safeParse(formValue)
    if (parsed.success) {
      handler(parsed.data)
      setErrors(undefined)
    } else {
      setErrors(parsed.error.flatten(issue => issue))
    }
  }

  const register = (name: keyof z.infer<Schema>) => {
    const fieldRef = useRef<HTMLInputElement>(null)

    if (typeof formValue[name] === 'object') {
      throw new Error(`Field ${String(name)} is an object`)
    }

    return {
      value: String(formValue[name] ?? ''),
      onChange: e => setFormValue({ ...formValue, [name]: e.currentTarget.value }),
      name: String(name),
      ref: fieldRef,
    } satisfies React.ComponentProps<'input'>
  }

  return { register, handleSubmit, errors }
}
