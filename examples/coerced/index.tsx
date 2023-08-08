import { SubmitHandler, useForm, Errors } from '@stevent-team/react-zoom-form'
import { z } from 'zod'
import Output from '../Output'

export const schema = z.object({
  number: z.coerce.number(),
  boolean: z.coerce.boolean(),
  date: z.coerce.date(),
})

const Coerced = ({ onSubmit }: { onSubmit: SubmitHandler<typeof schema> }) => {
  const { fields, handleSubmit, isDirty } = useForm({ schema })

  return <>
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor={fields.number.name()}>Number</label>
      <input {...fields.number.register()} id={fields.number.name()} type="number" />
      <Errors field={fields.number} className="error" />

      <label style={{ marginBlock: '1em' }}>
        <input {...fields.boolean.register()} type="checkbox" />
        <span>Boolean</span>
      </label>
      <Errors field={fields.boolean} className="error" />

      <label htmlFor={fields.date.name()}>Date</label>
      <input {...fields.date.register()} id={fields.date.name()} type="date" />
      <Errors field={fields.date} className="error" />

      <button>Save changes</button>
    </form>

    <Output isDirty={isDirty} fields={fields} />
  </>
}

export default Coerced
