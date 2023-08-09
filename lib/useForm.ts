import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { PathSegment, RecursivePartial, fieldChain, getDeepProp, deepEqual, FieldChain, isCheckbox, isRadio } from './utils'
import { register } from './field'

export interface UseFormOptions<Schema extends z.ZodTypeAny> {
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

export interface UseFormReturn<Schema extends z.ZodTypeAny> {
  /** Access zod schema and registration functions for your fields. */
  fields: FieldChain<Schema>
  /**
   * Higher-order function that intercepts a form's onSubmit event and gives you the values, after validating with the provided zod schema.
   *
   * @example
   * const onSubmit: SubmitHandler<typeof schema> = values => console.log(values)
   *
   * return <form onSubmit={submitHandler(onSubmit)}>
   */
  handleSubmit: (handler: SubmitHandler<Schema>) => React.FormEventHandler<HTMLFormElement>
  /** Will check if the form values are not deeply equal with the initialValues passed in the config or provided via `reset()`. */
  isDirty: boolean
  /** Reset the form with provided values, or with initialValues if nothing is passed. */
  reset: (values?: RecursivePartial<z.TypeOf<Schema>>) => void
}

export type SubmitHandler<Schema extends z.ZodTypeAny = z.ZodTypeAny> = (values: z.infer<Schema>) => void

export type FieldRefs = Record<string, { path: PathSegment[], ref: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement }>

/**
 * Hook used to control a form. Takes configuration options and returns an object with state and methods.
 */
export const useForm = <Schema extends z.ZodTypeAny>({
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

  const reset = useCallback<UseFormReturn<Schema>['reset']>((values = initialValues) => {
    setValidateOnChange(false)
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
  const handleSubmit = useCallback<UseFormReturn<Schema>['handleSubmit']>(handler => async e => {
    e.preventDefault()
    e.stopPropagation()
    const values = await validate()
    if (values) handler(values)
    setValidateOnChange(true)
  }, [validate])

  const fields = useMemo(() => new Proxy({}, {
    get: (_target, key) => fieldChain(schema, [], register, fieldRefs, { formValue, setFormValue, formErrors })[key]
  }) as FieldChain<Schema>, [schema, formValue, formErrors])

  return {
    fields,
    handleSubmit,
    isDirty,
    reset,
  }
}
