import { SubmitHandler, useForm, ControlledField, controlled, getValue, Errors } from '@stevent-team/react-zoom-form'
import { z } from 'zod'
import Output from '../Output'

const schema = z.object({
  requiredString: z.string().trim().min(1, 'This field is required').default(''),
  optionalString: z.string().trim().nullish(),
  defaultString: z.string().trim().default('Default value'),
  number: z.coerce.number().min(3).max(10),
  nested: z.object({
    inside: z.object({
      here: z.string().trim().min(1),
    }),
  }).optional(),
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

const issueMap = (issue: z.ZodIssue) => `${issue.message} (${issue.code})`

const initialValues = {
  defaultString: 'Default value',
}

const KitchenSink = () => {
  const { fields, handleSubmit, isDirty, reset } = useForm({ schema, initialValues })

  const onSubmit: SubmitHandler<typeof schema> = values => {
    console.log(values)
    reset(values)
  }

  return <>
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor={fields.requiredString.name()}>Required string</label>
      <input {...fields.requiredString.register()} id={fields.requiredString.name()} type="text" />
      <Errors field={fields.requiredString} issueMap={issueMap} className="error" />

      <label htmlFor={fields.optionalString.name()}>Optional string</label>
      <input {...fields.optionalString.register()} id={fields.optionalString.name()} type="text" />
      <Errors field={fields.optionalString} issueMap={issueMap} className="error" />

      <label htmlFor={fields.defaultString.name()}>Default string</label>
      <input {...fields.defaultString.register()} id={fields.defaultString.name()} type="text" />
      <Errors field={fields.defaultString} issueMap={issueMap} className="error" />

      <label htmlFor={fields.nested.inside.here.name()}>Nested string</label>
      <input {...fields.nested.inside.here.register()} id={fields.nested.inside.here.name()} type="text" />
      <Errors field={fields.nested} issueMap={issueMap} className="error" />

      <label htmlFor={fields.array[0].prop.name()}>Array value</label>
      <input {...fields.array[0].prop.register()} id={fields.array[0].prop.name()} type="text" />
      <Errors field={fields.array} issueMap={issueMap} className="error" />

      <label htmlFor={fields.number.name()}>Number</label>
      <input {...fields.number.register()} id={fields.number.name()} type="number" />
      <Errors field={fields.number} issueMap={issueMap} className="error" />

      <label>Link (custom component)</label>
      <LinkField field={controlled(fields.link)} />

      <label style={{ marginBlock: '1em' }}>
        <input {...fields.condition.register()} type="checkbox" />
        <span>Show conditional field?</span>
      </label>
      <Errors field={fields.condition} issueMap={issueMap} className="error" />

      {getValue(fields.condition) && <>
        <label htmlFor={fields.conditional.name()}>Conditional field</label>
        <input {...fields.conditional.register()} id={fields.conditional.name()} type="text" />
        <Errors field={fields.conditional} issueMap={issueMap} className="error" />
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
      <Errors field={fields.radio} issueMap={issueMap} className="error" />

      <button>Save changes</button>
    </form>

    <Output isDirty={isDirty} fields={fields} />
  </>
}

interface Link {
  label: string
  url: string
}

const LinkField = ({ field }: { field: ControlledField<Link> }) => {
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

export default KitchenSink
