import { SubmitHandler, useForm, Errors } from '@stevent-team/react-zoom-form'
import { z } from 'zod'
import Output from '../Output'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.coerce.number().min(13),
})

const Basic = () => {
  const { fields, handleSubmit, isDirty } = useForm({ schema })

  const onSubmit: SubmitHandler<typeof schema> = values => {
    console.log(values)
  }

  return <>
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor={fields.name.name()}>Name</label>
      <input {...fields.name.register()} id={fields.name.name()} type="text" />
      <Errors field={fields.name} className="error" />

      <label htmlFor={fields.age.name()}>Age</label>
      <input {...fields.age.register()} id={fields.age.name()} type="number" />
      <Errors field={fields.age} className="error" />

      <button>Save changes</button>
    </form>

    <Output isDirty={isDirty} fields={fields} />
  </>
}

export default Basic
