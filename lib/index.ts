import { ZodObject, ZodRawShape } from 'zod'

export interface UseFormOptions<TShape extends ZodRawShape> {
  schema: ZodObject<TShape>
}

export const useForm = <TShape extends ZodRawShape>({ schema }: UseFormOptions<TShape>) => {
  const field = (name: keyof TShape) => schema.shape[name]

  return { field }
}
