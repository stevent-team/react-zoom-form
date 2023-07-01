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

export const chain = (schema: z.ZodType, path: string[], register: RegisterFn): any =>
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
        return chain(unwrapped._def.type, [...path, key], register)
      }

      if (!(unwrapped instanceof z.ZodObject)) {
        if (key === 'register') return () => register(path, schema)
        throw new Error(`Expected ZodObject at "${path.join('.')}" got ${schema.constructor.name}`)
      }

      return chain(unwrapped.shape[key], [...path, key], register)
    },
  }) as unknown

// TODO: Correctly set/get array properties
/** Fetch an object's deeply nested property */
export const getDeepProp = <T extends Record<string, unknown>>(obj: T, path: string[]): unknown => {
  if (path.length === 0) return obj
  const [head, ...tail] = path
  const next = obj[head]
  if (typeof next !== 'object' && next !== null)
    return next
  return getDeepProp<T>(next as T, tail)
}

/** Mutate an object's deeply nested property */
export const setDeepProp = <T extends Record<string, unknown>>(obj: T, path: string[], value: unknown): T => {
  if (path.length === 0) throw new Error()

  const [head, ...tail] = path
  if (tail.length === 0) {
    return {...obj, [head as keyof T]: value as T[keyof T] }
  } else {
    if (obj[head] === undefined) return { ...obj, [head]: setDeepProp({}, tail, value) }
    if (typeof obj[head] !== 'object') throw new Error()
    return { ...obj, [head]: setDeepProp(obj[head] as T, tail, value) }
  }
}
