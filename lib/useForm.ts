import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { PathSegment, RecursivePartial, fieldChain, getDeepProp, deepEqual, FormatSchemaFields, isCheckbox, isRadio } from './utils'
import { RegisterFn, register } from './field'

export interface UseFormOptions<Schema extends z.AnyZodObject> {
  /**
   * The zod schema to use when parsing the values.
   *
   * @important
   * If you're calculating this, be sure to memoize the value.
   */
  schema: Schema
  /** Initialise the fields with values. By default they will be set to undefined. */
  initialValues?: RecursivePartial<z.infer<Schema>>
}

export type SubmitHandler<Schema extends z.AnyZodObject> = (values: z.infer<Schema>) => void

export type FieldRefs = Record<string, { path: PathSegment[], ref: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement }>

/**
 * Hook used to control a form. Takes configuration options and returns an object with state and methods.
 */
export const useForm = <Schema extends z.AnyZodObject>({
  schema,
  initialValues = {},
}: UseFormOptions<Schema>) => {
  const [formValue, setFormValue] = useState(structuredClone(initialValues))
  const [formErrors, setFormErrors] = useState<z.ZodError<z.infer<Schema>>>()
  const fieldRefs = useRef<FieldRefs>({})

  // Whether or not to validate fields when anything changes
  const [validateOnChange, setValidateOnChange] = useState(false)

  // Keep track of the initial form values to calculate isDirty
  const [internalInitialValues, setInternalInitialValues] = useState(structuredClone(initialValues))
  const isDirty = useMemo(() => !deepEqual(formValue, internalInitialValues), [formValue, internalInitialValues])

  const reset = useCallback((values: RecursivePartial<z.infer<Schema>> = initialValues) => {
    setInternalInitialValues(values)
    setFormValue(values)
  }, [initialValues])

  // Validate by parsing form data with zod schema, and return parsed data if valid
  const validate = useCallback(async () => {
    const parsed = await schema.safeParseAsync(formValue)
    if (parsed.success) {
      setFormErrors(undefined)
      return parsed.data
    } else {
      setFormErrors(parsed.error)
    }
  }, [schema, formValue])

  // Watch for changes in value
  useEffect(() => {
    if (validateOnChange) validate()

    // Set registered field values
    Object.values(fieldRefs.current).forEach(({ path, ref }) => {
      const value = getDeepProp(formValue, path) as string | boolean | undefined
      if (isRadio(ref)) {
        if (ref.value === value) {
          ref.checked = true
        } else {
          ref.checked = false
        }
      } else if (isCheckbox(ref)) {
        ref.checked = Boolean(value)
      } else {
        ref.value = String(value ?? '')
      }
    })
  }, [formValue, validateOnChange, validate])

  // Submit handler
  const handleSubmit = useCallback((handler: SubmitHandler<Schema>): React.FormEventHandler<HTMLFormElement> => async e => {
    e.preventDefault()
    e.stopPropagation()
    const values = await validate()
    if (values) handler(values)
    setValidateOnChange(true)
  }, [validate])

  const fields = useMemo(() => new Proxy(schema.shape, {
    get: (_target, key) => fieldChain(schema, [], register, fieldRefs, { formValue, setFormValue, formErrors })[key]
  }) as FormatSchemaFields<Schema, {
    /**
     * Provides props to pass to native elements (input, textarea, select)
     *
     * @example
     * <input type="text" {...fields.firstName.register()} />
     */
    register: () => ReturnType<RegisterFn>
    /**
     * Get the name of this field used by the register function.
     *
     * @example
     * <label htmlFor={field.firstName.name()}>First name</label>
     */
    name: () => string
  }>, [schema, formValue, formErrors])

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
    /** Will check if the form values are not deeply equal with the initialValues passed in the config or provided via `reset()`. */
    isDirty,
    /** Reset the form with provided values, or with initialValues if nothing is passed. */
    reset,
  }
}
