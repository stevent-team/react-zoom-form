import { SubmitHandler, useForm } from '@stevent-team/fir'
import { ZodIssue, z } from 'zod'

// Define the structure and validation of your form
const schema = z.object({
  requiredString: z.string().trim().min(1, 'This field is required').default(''),
  optionalString: z.string().trim().default(''),
  defaultString: z.string().trim().default('Default value'),
  number: z.coerce.number().min(3).max(10),
  nested: z.object({
    inside: z.object({
      here: z.string().trim().default(''),
    }),
  }),
  array: z.array(
    z.object({
      prop: z.string().trim().default(''),
    }),
  ),
  link: z.object({
    label: z.string(),
    url: z.string().url(),
  }).default({ label: 'a', url: 'https://test.com' }),
})

const Error = ({ errors }: { errors: ZodIssue[] | undefined }) =>
  errors && errors.length > 0 ? <span className="error">{errors.map(e => `${e.message} (${e.code})`).join(', ')}</span> : null

const initialValues = {
  defaultString: 'Default value',
}

const App = () => {
  const { fields, handleSubmit, errors, isDirty, reset } = useForm({ schema, initialValues })

  const onSubmit: SubmitHandler<typeof schema> = values => {
    console.log(values)
    reset(values)
  }

  return <form onSubmit={handleSubmit(onSubmit)}>
    <label htmlFor="requiredString">Required string</label>
    <input {...fields.requiredString.register()} type="text" />
    <Error errors={errors?.fieldErrors.requiredString} />

    <label htmlFor="optionalString">Optional string</label>
    <input {...fields.optionalString.register()} type="text" />
    <Error errors={errors?.fieldErrors.optionalString} />

    <label htmlFor="defaultString">Default string</label>
    <input {...fields.defaultString.register()} type="text" />
    <Error errors={errors?.fieldErrors.defaultString} />

    <label htmlFor="nested.inside.here">Nested string</label>
    <input {...fields.nested.inside.here.register()} type="text" />
    <Error errors={errors?.fieldErrors.nested} />

    <label htmlFor="array.0.prop">Array value</label>
    <input {...fields.array[0].prop.register()} type="text" />
    <Error errors={errors?.fieldErrors.array} />

    <label htmlFor="number">Number</label>
    <input {...fields.number.register()} type="number" />
    <Error errors={errors?.fieldErrors.number} />

    <button>Save changes</button>

    <output>
      <span>isDirty: {isDirty ? 'true' : 'false'}</span>
    </output>
  </form>
}

export default App
