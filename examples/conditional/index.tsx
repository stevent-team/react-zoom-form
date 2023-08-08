import { SubmitHandler, useForm, Errors, getValue } from '@stevent-team/react-zoom-form'
import { z } from 'zod'
import Output from '../Output'

export const schema = z.object({
  subscribe: z.coerce.boolean(),
  email: z.string().email().optional(),
}).refine(values => !values.subscribe || values.email !== undefined, {
  message: 'Email is required if you want to subscribe',
  path: ['email'],
})

const Conditional = ({ onSubmit }: { onSubmit: SubmitHandler<typeof schema> }) => {
  const { fields, handleSubmit, isDirty } = useForm({ schema })

  return <>
    <form onSubmit={handleSubmit(onSubmit)}>
      <label style={{ marginBlock: '1em' }}>
        <input {...fields.subscribe.register()} type="checkbox" />
        <span>Subscribe to the newsletter?</span>
      </label>
      <Errors field={fields.subscribe} className="error" />

      {getValue(fields.subscribe) && <>
        <label htmlFor={fields.email.name()}>Email address</label>
        <input {...fields.email.register()} id={fields.email.name()} type="email" />
        <Errors field={fields.email} className="error" />
      </>}

      <button>Save changes</button>
    </form>

    <Output isDirty={isDirty} fields={fields} />
  </>
}

export default Conditional
