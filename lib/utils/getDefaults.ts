import { z } from 'zod'

export const getDefaults = <Schema extends z.AnyZodObject>(schema: Schema) =>
  Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => {
      if (value instanceof z.ZodDefault) return [key, value._def.defaultValue()]
      if (value instanceof z.ZodString || value instanceof z.ZodNumber) return [key, '']
      return [key, undefined]
    })
  ) as Record<keyof Schema['shape'], unknown>

