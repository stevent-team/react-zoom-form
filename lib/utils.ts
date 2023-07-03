import { RegisterFn } from '.'
import { z } from 'zod'

type recursiveFormatSchema<TSchema, Value, Union> = TSchema extends Value ? TSchema
  : TSchema extends [any, ...any[]] ? {
    [K in keyof TSchema]: FormatSchema<TSchema[K], Value, Union>
  } : TSchema extends any[] ? {
    [k: number]: FormatSchema<TSchema[number], Value, Union>
  } : TSchema extends object ? {
    [K in keyof TSchema]: FormatSchema<TSchema[K], Value, Union>
  } : Value
export type FormatSchema<TSchema, Value, Union = unknown> = Union & recursiveFormatSchema<NonNullable<TSchema>, Value, Union>

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

export const chain = (schema: z.ZodType, path: PathSegment[], register: RegisterFn): any =>
  new Proxy(schema, {
    get: (_target, key) => {
      if (typeof key !== 'string') {
        throw new Error(`${String(key)} must be a string`)
      }

      if (key === '_schema') {
        return schema
      }

      const unwrapped = unwrapZodType(schema)

      // Support arrays
      if (unwrapped instanceof z.ZodArray && !isNaN(Number(key))) {
        return chain(unwrapped._def.type, [...path, { key, type: 'array' }], register)
      }

      if (!(unwrapped instanceof z.ZodObject)) {
        if (key === 'register') return () => register(path, schema)
        throw new Error(`Expected ZodObject at "${path.join('.')}" got ${schema.constructor.name}`)
      }

      return chain(unwrapped.shape[key], [...path, { key, type: 'object' }], register)
    },
  }) as unknown

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

type Obj = Record<string, unknown> | unknown[]

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
