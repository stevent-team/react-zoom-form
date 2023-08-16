import { Errors, SubmitHandler, getValue, useForm } from '@stevent-team/react-zoom-form'
import { z } from 'zod'
import Output from '../Output'

export const schema = z.intersection(
  z.object({
    common: z.string(),
  }),
  z.discriminatedUnion('size', [
    z.object({
      size: z.literal('small'),
      smallProperty: z.string(),
    }),
    z.object({
      size: z.literal('large'),
      largeProperty: z.string(),
    }),
  ]),
)

const Intersection = ({ onSubmit }: { onSubmit: SubmitHandler<typeof schema> }) => {
  const { fields, handleSubmit, isDirty } = useForm({ schema, initialValues: { size: 'small' } })

  return <>
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor={fields.common.name()}>Common field</label>
      <input {...fields.common.register()} id={fields.common.name()} type="text" />
      <Errors field={fields.common} className="error" />

      <label htmlFor={fields.size.name()}>Size</label>
      <select {...fields.size.register()} id={fields.size.name()}>
        <option value="small">Small</option>
        <option value="large">Large</option>
      </select>
      <Errors field={fields.size} className="error" />

      {getValue(fields.size) === 'small' ? <>
        <label htmlFor={fields.smallProperty.name()}>Small property</label>
        <input {...fields.smallProperty.register()} id={fields.smallProperty.name()} type="text" />
        <Errors field={fields.smallProperty} className="error" />
      </> : <>
        <label htmlFor={fields.largeProperty.name()}>Large property</label>
        <input {...fields.largeProperty.register()} id={fields.largeProperty.name()} type="text" />
        <Errors field={fields.largeProperty} className="error" />
      </>}

      <button>Save changes</button>
    </form>

    <Output isDirty={isDirty} fields={fields} />
  </>
}

export default Intersection
