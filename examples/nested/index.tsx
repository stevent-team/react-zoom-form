import { SubmitHandler, useForm, Errors } from '@stevent-team/react-zoom-form'
import { z } from 'zod'
import Output from '../Output'

export const schema = z.object({
  name: z.object({
    first: z.string(),
    last: z.string(),
  }),
  address: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string(),
  }),
})

const Nested = ({ onSubmit }: { onSubmit: SubmitHandler<typeof schema> }) => {
  const { fields, handleSubmit, isDirty } = useForm({ schema })

  return <>
    <form onSubmit={handleSubmit(onSubmit)}>
      <fieldset>
        <legend>Name</legend>

        <label>
          First name
          <input {...fields.name.first.register()} type="text" />
        </label>

        <label>
          Last name
          <input {...fields.name.last.register()} type="text" />
        </label>
      </fieldset>
      <Errors field={fields.name} className="error" />

      <fieldset>
        <legend>Address</legend>

        <label>
          Street
          <input {...fields.address.street.register()} type="text" />
        </label>

        <label>
          City
          <input {...fields.address.city.register()} type="text" />
        </label>

        <label>
          Country
          <input {...fields.address.country.register()} type="text" />
        </label>
      </fieldset>
      <Errors field={fields.address} className="error" />

      <button>Save changes</button>
    </form>

    <Output isDirty={isDirty} fields={fields} />
  </>
}

export default Nested
