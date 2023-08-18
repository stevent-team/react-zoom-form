import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { PathSegment, RecursivePartial, fieldChain, getDeepProp, deepEqual, FieldChain, isCheckbox, isRadio, unwrapZodType, setDeepProp } from './utils'

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
  const [formValueState, _setFormValue] = useState(structuredClone(initialValues))
  const formValue = useRef(structuredClone(initialValues))

  // Set the form value state and ref
  const setFormValue = useCallback<typeof _setFormValue>(value => {
    if (typeof value === 'function') {
      _setFormValue(value(formValue.current))
      formValue.current = value(formValue.current)
    } else {
      _setFormValue(value)
      formValue.current = value
    }
  }, [])

  const [formErrors, setFormErrors] = useState<z.ZodError<z.infer<Schema>>>()
  const fieldRefs = useRef<FieldRefs>({})

  // Whether or not to validate fields when anything changes
  const [validateOnChange, setValidateOnChange] = useState(false)

  // Keep track of the initial form values to calculate isDirty
  const [internalInitialValues, setInternalInitialValues] = useState(structuredClone(initialValues))
  const isDirty = useMemo(() => !deepEqual(formValueState, internalInitialValues), [formValueState, internalInitialValues])

  const reset = useCallback<UseFormReturn<Schema>['reset']>((values = initialValues) => {
    setValidateOnChange(false)
    setInternalInitialValues(values)
    setFormValue(values)
  }, [initialValues])

  // Validate by parsing form data with zod schema, and return parsed data if valid
  const validate = useCallback(async () => {
    const parsed = await schema.safeParseAsync(formValue.current)
    if (parsed.success) {
      setFormErrors(undefined)
      return parsed.data
    } else {
      setFormErrors(parsed.error)
    }
  }, [schema])

  // Watch for changes in value
  useEffect(() => {
    if (validateOnChange) validate()

    // Set registered field values
    Object.values(fieldRefs.current).forEach(({ path, ref }) => {
      const value = getDeepProp(formValueState, path) as string | boolean | undefined
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
  }, [formValueState, validateOnChange, validate])

  // Submit handler
  const handleSubmit = useCallback<UseFormReturn<Schema>['handleSubmit']>(handler => async e => {
    e.preventDefault()
    e.stopPropagation()
    const values = await validate()
    if (values) handler(values)
    setValidateOnChange(true)
  }, [validate])

  const fields = useMemo(() => new Proxy({}, {
    get: (_target, key) => fieldChain(schema, [], register, fieldRefs, { formValue, setFormValue, formErrors, setFormErrors })[key]
  }) as unknown as FieldChain<Schema>, [schema, setFormValue, formErrors])

  return {
    fields,
    handleSubmit,
    isDirty,
    reset,
  }
}

/** Options that can be passed to the register fn. */
export type RegisterOptions = {
  ref?: React.ForwardedRef<any>
}

/** Type of the `.register()` function for native elements. */
export type RegisterFn = (
  path: PathSegment[],
  schema: z.ZodType,
  setFormValue: React.Dispatch<React.SetStateAction<RecursivePartial<z.ZodType>>>,
  fieldRefs: React.MutableRefObject<FieldRefs>,
  options: RegisterOptions,
) => {
  onChange: React.ChangeEventHandler<any>
  ref: React.Ref<any>
  name: string
}

// Register for native elements (input, textarea, select)
const register: RegisterFn = (path, fieldSchema, setFormValue, fieldRefs, options) => {
  const name = path.map(p => p.key).join('.')
  const unwrapped = unwrapZodType(fieldSchema)

  return {
    onChange: e => {
      let newValue: string | boolean | undefined = e.currentTarget.value
      if (!(unwrapped instanceof z.ZodString) && newValue === '') {
        newValue = undefined
      }
      // If this field uses a checkbox, read it's `checked` state
      if (e.currentTarget.type?.toLowerCase() === 'checkbox') {
        newValue = e.currentTarget.checked
      }
      setFormValue(v => setDeepProp(v, path, newValue) as typeof v)
    },
    name,
    ref: ref => {
      // Store field ref in an object to dedupe them per field
      if (ref) {
        // If the user has provided their own ref to use as well
        if (options.ref) {
          if (typeof options.ref === 'function') {
            options.ref(ref)
          } else {
            options.ref.current = ref
          }
        }

        // Note, radio fields use the same name per group, so they have to be referenced by value
        const refIndex = isRadio(ref) ? `${name}.${ref.value}` : name
        fieldRefs.current[refIndex] = { path, ref }
      } else {
        delete fieldRefs.current[name]
      }
    },
  } satisfies React.ComponentProps<'input'>
}
