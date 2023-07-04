import { FieldControls, RegisterFn } from '.'
import { z } from 'zod'

// Creates the type for the field chain
type recursiveFormatSchemaFields<Schema extends z.ZodType, Value> = z.infer<Schema> extends Value ? z.infer<Schema>
  : Schema extends z.AnyZodTuple ? {
    [K in keyof z.infer<Schema>]: FormatSchemaFields<Schema['_type'][K], Value>
  } : Schema extends z.ZodArray<any> ? {
    [k: number]: FormatSchemaFields<Schema['_def']['type'], Value>
  } : Schema extends z.AnyZodObject ? {
    [K in keyof z.infer<Schema>]: FormatSchemaFields<Schema['shape'][K], Value>
  } : Schema extends z.ZodDefault<any> ?
    FormatSchemaFields<Schema['_def']['innerType'], Value>
  : Value
export type FormatSchemaFields<Schema extends z.ZodType, Value> = { _field: FieldControls<Schema> } & recursiveFormatSchemaFields<NonNullable<Schema>, Value>

/** Recursively make a nested object structure partial */
export type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object | undefined ? RecursivePartial<T[P]> :
    T[P]
}

export const unwrapZodType = (type: z.ZodType): z.ZodType => {
  if (type instanceof z.ZodObject || type instanceof z.ZodArray) return type

  if (type instanceof z.ZodEffects) return unwrapZodType(type.innerType())

  const anyType = type as any
  if (anyType._def?.innerType) return unwrapZodType(anyType._def.innerType)

  return type
}

export type PathSegment = {
  /** If type is array, key should be castable to a number */
  key: string
  type: 'object' | 'array'
}

/**
 * Recursive proxy chain function.
 *
 * Thanks to [react-zorm](https://github.com/esamattis/react-zorm) for the inspiration.
 */
export const chain = <S extends z.ZodType>(schema: S, path: PathSegment[], register: RegisterFn, controls: Omit<FieldControls<z.ZodTypeAny>, 'schema' | 'path'>): any =>
  new Proxy(schema, {
    get: (_target, key) => {
      if (typeof key !== 'string') {
        throw new Error(`${String(key)} must be a string`)
      }

      if (key === '_field') {
        return {
          schema,
          path,
          formValue: controls.formValue,
          setFormValue: controls.setFormValue,
        } satisfies FieldControls<z.ZodTypeAny>
      }

      const unwrapped = unwrapZodType(schema)

      // Support arrays
      if (unwrapped instanceof z.ZodArray && !isNaN(Number(key))) {
        return chain(unwrapped._def.type, [...path, { key, type: 'array' }], register, controls)
      }

      if (!(unwrapped instanceof z.ZodObject)) {
        if (key === 'register') return () => register(path, schema)
        throw new Error(`Expected ZodObject at "${path.map(p => p.key).join('.')}" got ${schema.constructor.name}`)
      }

      return chain(unwrapped.shape[key], [...path, { key, type: 'object' }], register, controls)
    },
  }) as unknown

type Obj = Record<string, unknown> | unknown[]

/**
 * Fetch an object's deeply nested property using a path of keys
 * Will attempt to coerce the key to an integer if an array is encountered
 **/
export const getDeepProp = <T extends Obj>(obj: T, path: PathSegment[]): unknown => {
  // No path left, return the current value
  if (path.length === 0 || obj === undefined || obj === null) return obj

  // Get head of path
  const [head, ...tail] = path

  // Is the current value an array? Can we coerce the key to a number?
  if (Array.isArray(obj) && head.type === 'array') {
    const key = parseInt(head.key)
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
 * Mutate an object's deeply nested property
 * Will respect existing arrays and coerce keys to integers when applicable
 * Cannot currently create new arrays when keys are integer. Unsure if this is wanted.
 **/
export const setDeepProp = <T extends Obj>(obj: T, path: PathSegment[], value: unknown): T => {
  // Finished recursing and didn't set?
  if (path.length === 0) throw new Error('Empty path')

  // Get next part of path
  const [head, ...tail] = path

  // If we are at the end of the path, set the value
  if (tail.length === 0) {
    // Is the object at this depth an array?
    if (Array.isArray(obj) && head.type === 'array') {
      const key = parseInt(head.key)
      if (!isNaN(key)) {
        obj[key] = value
        return obj
      } else {
        throw new Error('Object at current depth is an array but the key is not an integer')
      }
    } else {
      return {...obj, [head.key as keyof T]: value as T[keyof T] }
    }
  }

  // Is the object at this depth an array?
  if (Array.isArray(obj) && head.type === 'array') {
    // Attempt to coerce next key as a number
    const key = parseInt(head.key)
    if (!isNaN(key)) {
      obj[key] = setDeepProp(obj[key as keyof T] as T, tail, value)
      return obj
    } else {
      throw new Error('Object at current depth is an array but the key is not an integer')
    }
  }

  // Is there nothing at this point?
  // Create an object for us to continue traversing into
  if (obj[head.key as keyof T] === undefined) {
    // If type of path segment is an array, create an empty array
    obj[head.key as keyof T] = tail[0].type === 'array' ? [] : {}
  }

  // Is this value primitive? We can't traverse that so error
  if (typeof obj[head.key as keyof T] !== 'object') throw new Error(`Can't traverse primitive: ${obj[head.key as keyof T]}`)

  // Recurse into this object
  return {
    ...obj,
    [head.key]: setDeepProp(obj[head.key as keyof T] as T, tail, value)
  }
}

type Primitive = null | undefined | string | number | boolean | symbol | bigint
const isPrimitive = (value: unknown): value is Primitive => value === null || value === undefined || typeof value !== 'object'
const isDateObject = (value: unknown): value is Date => value instanceof Date
const isObject = <T extends object>(value: unknown): value is T => value !== null && value !== undefined && !Array.isArray(value) && typeof value === 'object' && !isDateObject(value)

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
