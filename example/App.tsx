import { SubmitHandler, useForm, Field, useField } from '@stevent-team/fir'
import { ZodIssue, z } from 'zod'

// Define the structure and validation of your form
const schema = z.object({
  requiredString: z.string().trim().min(1, 'This field is required').default(''),
  optionalString: z.string().trim().default(''),
  defaultString: z.string().trim().default('Default value'),
  number: z.coerce.number().min(3).max(10),
  nested: z.object({
    inside: z.object({
      here: z.string().trim().min(1),
    }),
  }),
  array: z.array(
    z.object({
      prop: z.string().trim().min(1),
    }),
  ),
  link: z.object({
    label: z.string(),
    url: z.string().url(),
  }).default({ label: 'default from zod', url: 'https://example.com' }),
  condition: z.boolean(),
  conditional: z.string(),
})

const Error = ({ errors }: { errors: { _errors: ZodIssue[] } }) =>
  errors._errors.length > 0 ? <span className="error">{errors._errors.map(e => `${e.message} (${e.code})`).join(', ')}</span> : null

const initialValues = {
  defaultString: 'Default value',
}

const App = () => {
  const { fields, handleSubmit, errors, isDirty, reset, value } = useForm({ schema, initialValues })

  const onSubmit: SubmitHandler<typeof schema> = values => {
    console.log(values)
    reset(values)
  }

  return <form onSubmit={handleSubmit(onSubmit)}>
    <label htmlFor={fields.requiredString.name()}>Required string</label>
    <input {...fields.requiredString.register()} type="text" />
    <Error errors={errors.requiredString} />

    <label htmlFor={fields.optionalString.name()}>Optional string</label>
    <input {...fields.optionalString.register()} type="text" />
    <Error errors={errors.optionalString} />

    <label htmlFor={fields.defaultString.name()}>Default string</label>
    <input {...fields.defaultString.register()} type="text" />
    <Error errors={errors.defaultString} />

    <label htmlFor={fields.nested.inside.here.name()}>Nested string</label>
    <input {...fields.nested.inside.here.register()} type="text" />
    <Error errors={errors.nested} />

    <label htmlFor={fields.array[0].prop.name()}>Array value</label>
    <input {...fields.array[0].prop.register()} type="text" />
    <Error errors={errors.array} />

    <label htmlFor={fields.number.name()}>Number</label>
    <input {...fields.number.register()} type="number" />
    <Error errors={errors.number} />

    <label>Link (custom component)</label>
    <LinkField field={fields.link} />

    <div style={{ marginBlock: '1em', display: 'flex', gap: '.5em' }}>
      <input {...fields.condition.register()} type="checkbox" />
      <label htmlFor={fields.condition.name()}>Show conditional field?</label>
    </div>
    <Error errors={errors.condition} />

    {value.condition && <>
      <label htmlFor={fields.conditional.name()}>Conditional field</label>
      <input {...fields.conditional.register()} type="text" />
      <Error errors={errors.conditional} />
    </>}

    <button>Save changes</button>

    <output>
      <div>isDirty: {isDirty ? 'true' : 'false'}</div>
      <div>value: {JSON.stringify(value, null, 2)}</div>
      <div>errors: {JSON.stringify(errors._errors, null, 2)}</div>
    </output>
  </form>
}

interface Link {
  label: string
  url: string
}

const LinkField = ({ field }: { field: Field<Link> }) => {
  const { value, onChange, errors } = useField(field)

  return <>
    <div style={{ display: 'flex', gap: '.5em' }}>
      <input
        type="text"
        placeholder="Label"
        value={value?.label ?? ''}
        onChange={e => onChange({ ...value, label: e.currentTarget.value })}
      />
      <input
        type="url"
        placeholder="URL"
        value={value?.url ?? ''}
        onChange={e => onChange({ ...value, url: e.currentTarget.value })}
      />
    </div>
    {errors.length > 0 && <span className="error">{errors.map(e => `${e.message} (${e.code})`).join(', ')}</span>}
  </>
}

export default App
