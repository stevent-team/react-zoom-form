import { useCallback, useEffect, useRef, useState } from 'react'
import { ZodIssue, ZodType, z } from 'zod'

import { FormatSchema, chain, getDeepProp, getDefaults, setDeepProp } from './utils'

export interface UseFormOptions<Schema extends z.AnyZodObject> {
  schema: Schema
}

export type SubmitHandler<Schema extends z.AnyZodObject> = (values: z.infer<Schema>) => void

export type RegisterFn = (path: string[], schema: ZodType) => {
  value: string
  onChange: React.ChangeEventHandler<any>
  ref: React.LegacyRef<any>
  name: string
}

/**
 * Hook used to control a form. Takes configuration options and returns an object with state and methods.
 */
export const useForm = <Schema extends z.AnyZodObject>({
  schema,
}: UseFormOptions<Schema>) => {
  const [formValue, setFormValue] = useState(getDefaults(schema))
  const [errors, setErrors] = useState<z.inferFlattenedErrors<Schema, ZodIssue>>()

  // Whether or not to validate fields when anything changes
  const [validateOnChange, setValidateOnChange] = useState(false)

  // Validate by parsing form data with zod schema, and return parsed data if valid
  const validate = useCallback(async () => {
    const parsed = await schema.safeParseAsync(formValue)
    if (parsed.success) {
      setErrors(undefined)
      return parsed.data
    } else {
      setErrors(parsed.error.flatten(issue => issue))
    }
  }, [schema, formValue])

  // Watch for changes in value
  useEffect(() => {
    if (validateOnChange) validate()
  }, [formValue, validateOnChange, validate])

  // Submit handler
  const handleSubmit = (handler: SubmitHandler<Schema>): React.FormEventHandler<HTMLFormElement> => async e => {
    e.preventDefault()
    e.stopPropagation()
    const values = await validate()
    if (values) handler(values)
    setValidateOnChange(true)
  }

  // Register for native elements (input, textarea, select)
  const register: RegisterFn = path => {
    const fieldRef = useRef<any>(null)

    return {
      value: String(getDeepProp(formValue, path) ?? ''),
      onChange: e => setFormValue(setDeepProp(formValue, path, e.currentTarget.value)),
      name: path.join('.'),
      ref: fieldRef,
    } satisfies React.ComponentProps<'input'>
  }

  const fields = new Proxy(schema.shape, {
    get: (_target, key) => chain(schema, [], register)[key]
  }) as FormatSchema<z.infer<Schema>, {
    /**
     * Provides props to pass to native elements (input, textarea, select)
     *
     * @example
     * <input type="text" {...fields.firstName.register()} />
     */
    register: () => ReturnType<RegisterFn>
  }, { _schema: ZodType }>

  return {
    /** Access zod schema and registration functions for your fields. */
    fields,
    /**
     * Higher-order function that intercepts a form's onSubmit event and gives you the values, after validating with the provided zod schema.
     *
     * @example
     * const onSubmit: SubmitHandler<typeof schema> = values => console.log(values)
     *
     * return <form onSubmit={submitHandler(onSubmit)}>
     */
    handleSubmit,
    errors,
  }
}
