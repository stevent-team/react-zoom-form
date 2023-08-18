import { Field, FieldRefs, RegisterFn, RegisterOptions } from '.'
import { z } from 'zod'

// A Zod object that can hold nested data
type AnyZodContainer = z.AnyZodObject | z.AnyZodTuple | z.ZodArray<any> | z.ZodRecord | z.ZodMap | z.ZodSet

// Intersect everything inside an array after running each through the FieldChain type
type FieldChainEach<Schema extends z.ZodType, ArraySchema extends z.ZodType[]> = ArraySchema extends [infer First extends z.ZodType, ...infer Rest extends z.ZodType[]]
  ? FieldChain<Schema, First> & FieldChainEach<Schema, Rest>
  : unknown

// Creates the type for the field chain by recusively travelling through the Zod schema
type RecursiveFieldChain<Schema extends z.ZodType, LeafValue> =
  z.infer<Schema> extends LeafValue ? z.infer<Schema>
  : Schema extends z.AnyZodTuple ? { [K in keyof z.infer<Schema>]: FieldChain<Schema['_type'][K]> }
  : Schema extends z.ZodArray<any> ? { [k: number]: FieldChain<Schema['_def']['type']> }
  : Schema extends z.AnyZodObject ? { [K in keyof z.infer<Schema>]: FieldChain<Schema['shape'][K]> }
  : Schema extends z.ZodIntersection<any, any> ? FieldChain<Schema, Schema['_def']['left']> & FieldChain<Schema, Schema['_def']['right']>
  : Schema extends (z.ZodUnion<any> | z.ZodDiscriminatedUnion<string, any>) ? FieldChainEach<Schema, Schema['options']>
  : Schema extends (z.ZodDefault<AnyZodContainer> | z.ZodOptional<AnyZodContainer> | z.ZodNullable<AnyZodContainer>) ? FieldChain<Schema, Schema['_def']['innerType']>
  : Schema extends z.ZodEffects<AnyZodContainer> ? FieldChain<Schema, Schema['_def']['schema']>
  : Schema extends z.ZodLazy<AnyZodContainer> ? FieldChain<Schema, ReturnType<Schema['_def']['getter']>>
  : Schema extends z.ZodPipeline<AnyZodContainer, AnyZodContainer> ? FieldChain<Schema, Schema['_def']['out']>
  : LeafValue

/**
 * Provides the type of the `fields` object from the `useForm` hook.
 * You can use this if you intend to pass `fields` down through components to build a nested form.
 */
export type FieldChain<Schema extends z.ZodType, InnerSchema extends z.ZodType = Schema> = Field<Schema> & Required<RecursiveFieldChain<InnerSchema, {
  /**
   * Provides props to pass to native elements (input, textarea, select)
   *
   * @example
   * <input type="text" {...fields.firstName.register()} />
   */
  register: (options?: RegisterOptions) => ReturnType<RegisterFn>
  /**
   * Get the name of this field used by the register function.
   *
   * @example
   * <label htmlFor={fields.firstName.name()}>First name</label>
   *
   * @example
   * fields.location.address.line1.name() === 'location.address.line1'
   */
  name: () => string
}>>

/** Recursively make a nested object structure partial */
export type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object | undefined ? RecursivePartial<T[P]> :
    T[P]
}

/** Same behaviour as Partial but does not affect arrays. */
export type PartialObject<T> = T extends any[] ? T : Partial<T>

/** Excludes undefined from a type, but keeps null */
export type NonUndefined<T> = T extends undefined ? never : T

const getZodObjectShape = (type: z.ZodType) => {
  const unwrapped = unwrapZodType(type)
  if (unwrapped instanceof z.ZodObject) return unwrapped.shape
  return {}
}

export const unwrapZodType = (type: z.ZodType): z.ZodType => {
  if (type instanceof z.ZodObject || type instanceof z.ZodArray) return type

  if (type instanceof z.ZodEffects) return unwrapZodType(type.innerType())

  if ((type instanceof z.ZodDiscriminatedUnion || type instanceof z.ZodUnion) && Array.isArray(type.options)) {
    return z.ZodObject.create(type.options.reduce((a, o) => ({ ...a, ...getZodObjectShape(o) }), {}))
  }

  if (type instanceof z.ZodIntersection) {
    return z.ZodObject.create({ ...getZodObjectShape(type._def.left), ...getZodObjectShape(type._def.right) })
  }

  const anyType = type as any
  if (anyType._def?.innerType) return unwrapZodType(anyType._def.innerType)

  return type
}

export type PathSegment = {
  /** If type is array, key should be coercable to a number */
  key: string | number
  type: 'object' | 'array'
}

/**
 * Recursive proxy field chain function.
 *
 * Thanks to [react-zorm](https://github.com/esamattis/react-zorm) for the inspiration.
 */
export const fieldChain = <S extends z.ZodType>(
  schema: S,
  path: PathSegment[],
  register: RegisterFn,
  fieldRefs: React.MutableRefObject<FieldRefs>,
  controls: Omit<Field<z.ZodTypeAny>['_field'], 'schema' | 'path'>,
): any =>
  new Proxy({}, {
    get: (_target, key) => {
      // Handle attempts at accessing symbols
      if (key === Symbol.toStringTag) return schema.toString()
      if (key === Symbol.toPrimitive) return () => schema.toString()
      if (typeof key === 'symbol') return schema

      // Ensure key is a string
      if (typeof key !== 'string') {
        throw new Error(`${String(key)} must be a string`)
      }

      // If hidden _field prop is accessed by a method like controlled or fieldErrors
      if (key === '_field') {
        return {
          schema,
          path,
          ...controls,
        } satisfies Field<z.ZodTypeAny>['_field']
      }

      // Attempt to unwrap the Zod type if it's inside a ZodDefault, ZodOptional, ect.
      const unwrapped = unwrapZodType(schema)

      // Support arrays by checking if the Zod schema at this point is an array, and the key is coercible to a number
      if (unwrapped instanceof z.ZodArray && !isNaN(Number(key))) {
        return fieldChain(unwrapped._def.type, [...path, { key: Number(key), type: 'array' }], register, fieldRefs, controls)
      }

      if (unwrapped instanceof z.ZodObject) {
        return fieldChain(unwrapped.shape[key], [...path, { key, type: 'object' }], register, fieldRefs, controls)
      }

      // Leaf node functions
      if (key === 'register') return (options: RegisterOptions = {}) => register(path, schema, controls.setFormValue, fieldRefs, options)
      if (key === 'name') return () => path.map(p => p.key).join('.')

      // Attempted to access a property that didn't exist
      throw new Error(`Unsupported type at "${path.map(p => p.key).join('.')}" got ${schema.constructor.name}`)
    }
  }) as unknown // Never let them know your next move...

type Obj = Record<string, unknown> | unknown[]

/**
 * Fetch an object's deeply nested property using a path of keys.
 * Will attempt to coerce the key to an integer if an array is encountered.
 */
export const getDeepProp = <T extends Obj>(obj: T, path: PathSegment[]): unknown => {
  // No path left, return the current value
  if (path.length === 0 || obj === undefined || obj === null) return obj

  // Get head of path
  const [head, ...tail] = path

  // Is the current value an array? Can we coerce the key to a number?
  if (Array.isArray(obj) && head.type === 'array') {
    const key = Number(head.key)
    if (!isNaN(key)) {
      return getDeepProp<T>(obj[key] as T, tail)
    } else {
      return undefined
    }
  } else {
    // Get value from obj
    const next = obj[head.key as keyof T]

    // Is it a value we can index?
    if (typeof next === 'object' && next !== null) {
      return getDeepProp(next as T, tail)
    }

    return next
  }
}

/**
 * Mutate an object's deeply nested property.
 * Will respect existing arrays and coerce keys to integers when applicable, and create
 * arrays if the type of that path segment is `array`.
 */
export const setDeepProp = (obj: Obj, path: PathSegment[], value: unknown): Obj => {
  // Finished recursing and didn't set?
  if (path.length === 0) throw new Error('Empty path')

  // Get next part of path
  const [head, ...tail] = path

  // If we are at the end of the path, set the value
  if (tail.length === 0) {
    // Is the object at this depth an array?
    if (Array.isArray(obj) && head.type === 'array') {
      const key = Number(head.key)
      if (!isNaN(key)) {
        obj[key] = value
        return obj
      } else {
        throw new Error('Object at current depth is an array but the key is not an integer')
      }
    } else {
      return {...obj, [head.key]: value }
    }
  }

  // Is the object at this depth an array?
  if (Array.isArray(obj) && head.type === 'array') {
    // Attempt to coerce next key as a number
    const key = Number(head.key)
    if (!isNaN(key)) {
      obj[key] = setDeepProp(obj[key] as Obj, tail, value)
      return obj
    } else {
      throw new Error('Object at current depth is an array but the key is not an integer')
    }
  }

  // Is there nothing at this point?
  // Create an object for us to continue traversing into
  if (obj[head.key as keyof Obj] === undefined) {
    // If type of path segment is an array, create an empty array
    (obj as Record<string, unknown>)[head.key] = tail[0].type === 'array' ? [] : {}
  }

  // Is this value primitive? We can't traverse that so error
  if (typeof obj[head.key as keyof Obj] !== 'object')
    throw new Error(`Can't traverse primitive: ${obj[head.key as keyof Obj]}`)

  // Recurse into this object
  return {
    ...obj,
    [head.key]: setDeepProp(obj[head.key as keyof Obj] as Obj, tail, value)
  }
}

/**
 * Check if an array begins with the same elements as another array.
 *
 * @param array1 The full array to check against
 * @param array2 The array that may match the start of array1
 *
 * @example
 * arrayStartsWith(['a', 'b', 'c'], ['a', 'b']) === true
 * arrayStartsWith(['a', 'b', 'c'], ['a', 'x']) === false
 */
export const arrayStartsWith = (array1: Array<string | number>, array2: Array<string | number>) => {
  if (array1.length < array2.length) return false

  for (let i = 0; i < array2.length; i++) {
    if (array1[i] !== array2[i]) {
      return false
    }
  }

  return true
}

type Primitive = null | undefined | string | number | boolean | symbol | bigint
const isPrimitive = (value: unknown): value is Primitive => value === null || value === undefined || typeof value !== 'object'
const isDateObject = (value: unknown): value is Date => value instanceof Date
const isObject = <T extends object>(value: unknown): value is T => value !== null && value !== undefined && !Array.isArray(value) && typeof value === 'object' && !isDateObject(value)

/**
 * Recursively check if two objects (or arrays) are deeply equal to each other.
 */
export const deepEqual = (object1: any, object2: any) => {
  if (isPrimitive(object1) || isPrimitive(object2)) {
    return object1 === object2
  }

  if (isDateObject(object1) && isDateObject(object2)) {
    return object1.getTime() === object2.getTime()
  }

  const [keys1, keys2] = [Object.keys(object1), Object.keys(object2)]

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (!keys2.includes(key)) return false

    const [val1, val2] = [object1[key], object2[key]]

    if (
      (isDateObject(val1) && isDateObject(val2)) ||
      (isObject(val1) && isObject(val2)) ||
      (Array.isArray(val1) && Array.isArray(val2))
        ? !deepEqual(val1, val2)
        : val1 !== val2
    ) return false
  }

  return true
}

/** Check if an element is a checkbox */
export const isCheckbox = (element: HTMLElement): element is HTMLInputElement =>
  element.tagName.toLowerCase() === 'input' && (element as HTMLInputElement).type?.toLowerCase() === 'checkbox'

/** Check if an element is a radio input */
export const isRadio = (element: HTMLElement): element is HTMLInputElement =>
  element.tagName.toLowerCase() === 'input' && (element as HTMLInputElement).type?.toLowerCase() === 'radio'
