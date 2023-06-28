import { SubmitHandler, useForm } from '@stevent-team/fir'
import { ZodIssue, z } from 'zod'

// Define the structure and validation of your form
const schema = z.object({
  requiredString: z.string().trim().min(1, 'This field is required'),
  optionalString: z.string().trim(),
  defaultString: z.string().trim().default('Default value'),
  number: z.coerce.number().min(3).max(10),
  // link: z.object({
  //   label: z.string(),
  //   url: z.string().url(),
  // }).default({ label: 'a', url: 'https://test.com' }),
})

const Error = ({ errors }: { errors: ZodIssue[] | undefined }) =>
  errors && errors.length > 0 ? <span className="error">{errors.map(e => `${e.message} (${e.code})`).join(', ')}</span> : null

const App = () => {
  const { register, handleSubmit, errors } = useForm({ schema })

  const onSubmit: SubmitHandler<typeof schema> = values => {
    console.log(values)
  }

  return <form onSubmit={handleSubmit(onSubmit)}>
    <label htmlFor="requiredString">Required string</label>
    <input {...register('requiredString')} type="text" />
    <Error errors={errors?.fieldErrors.requiredString} />

    <label htmlFor="optionalString">Optional string</label>
    <input {...register('optionalString')} type="text" />
    <Error errors={errors?.fieldErrors.optionalString} />

    <label htmlFor="defaultString">Default string</label>
    <input {...register('defaultString')} type="text" />
    <Error errors={errors?.fieldErrors.defaultString} />

    <label htmlFor="number">Number</label>
    <input {...register('number')} type="number" />
    <Error errors={errors?.fieldErrors.number} />

    <button>Save changes</button>
  </form>
}

export default App
