import { SubmitHandler, useForm, Field, controlled, errors, FieldControls } from '@stevent-team/react-zoom-form'
import { z } from 'zod'

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
  radio: z.enum(['option1', 'option2', 'option3']),
})

const Error = ({ field }: { field: { _field: FieldControls } }) => {
  const fieldErrors = errors(field)
  return fieldErrors.length > 0 ? <span className="error">{fieldErrors.map(e => `${e.message} (${e.code})`).join(', ')}</span> : null
}

const initialValues = {
  defaultString: 'Default value',
}

const App = () => {
  const { fields, handleSubmit, isDirty, reset, value } = useForm({ schema, initialValues })

  const onSubmit: SubmitHandler<typeof schema> = values => {
    console.log(values)
    reset(values)
  }

  return <form onSubmit={handleSubmit(onSubmit)}>
    <label htmlFor={fields.requiredString.name()}>Required string</label>
    <input {...fields.requiredString.register()} id={fields.requiredString.name()} type="text" />
    <Error field={fields.requiredString} />

    <label htmlFor={fields.optionalString.name()}>Optional string</label>
    <input {...fields.optionalString.register()} id={fields.optionalString.name()} type="text" />
    <Error field={fields.optionalString} />

    <label htmlFor={fields.defaultString.name()}>Default string</label>
    <input {...fields.defaultString.register()} id={fields.defaultString.name()} type="text" />
    <Error field={fields.defaultString} />

    <label htmlFor={fields.nested.inside.here.name()}>Nested string</label>
    <input {...fields.nested.inside.here.register()} id={fields.nested.inside.here.name()} type="text" />
    <Error field={fields.nested} />

    <label htmlFor={fields.array[0].prop.name()}>Array value</label>
    <input {...fields.array[0].prop.register()} id={fields.array[0].prop.name()} type="text" />
    <Error field={fields.array} />

    <label htmlFor={fields.number.name()}>Number</label>
    <input {...fields.number.register()} id={fields.number.name()} type="number" />
    <Error field={fields.number} />

    <label>Link (custom component)</label>
    <LinkField field={controlled(fields.link)} />

    <label style={{ marginBlock: '1em' }}>
      <input {...fields.condition.register()} type="checkbox" />
      <span>Show conditional field?</span>
    </label>
    <Error field={fields.condition} />

    {value.condition && <>
      <label htmlFor={fields.conditional.name()}>Conditional field</label>
      <input {...fields.conditional.register()} id={fields.conditional.name()} type="text" />
      <Error field={fields.conditional} />
    </>}

    <label>Radio field</label>
    <label>
      <input {...fields.radio.register()} value="option1" type="radio" />
      <span>Option 1</span>
    </label>
    <label>
      <input {...fields.radio.register()} value="option2" type="radio" />
      <span>Option 2</span>
    </label>
    <label>
      <input {...fields.radio.register()} value="option3" type="radio" />
      <span>Option 3</span>
    </label>
    <Error field={fields.radio} />

    <button>Save changes</button>

    <output>
      <div>isDirty: {isDirty ? 'true' : 'false'}</div>
      <div>value: {JSON.stringify(value, null, 2)}</div>
      <div>errors: {JSON.stringify(errors(fields), null, 2)}</div>
    </output>
  </form>
}

interface Link {
  label: string
  url: string
}

const LinkField = ({ field }: { field: Field<Link> }) => {
  const { value, onChange, errors } = field

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
