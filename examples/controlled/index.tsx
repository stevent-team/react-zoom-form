import { SubmitHandler, useForm, ControlledField, controlled } from '@stevent-team/react-zoom-form'
import { z } from 'zod'
import Output from '../Output'
import { useState } from 'react'

export const schema = z.object({
  price: z.number(),
})

const Controlled = ({ onSubmit }: { onSubmit: SubmitHandler<typeof schema> }) => {
  const { fields, handleSubmit, isDirty } = useForm({ schema })

  return <>
    <form onSubmit={handleSubmit(onSubmit)}>
      <CurrencyField label="Price (dollars)" {...controlled(fields.price)} />

      <button>Save changes</button>
    </form>

    <Output isDirty={isDirty} fields={fields} />
  </>
}

const CurrencyField = ({ label, value, onChange, name, errors }: ControlledField<number> & { label: string }) => {
  const [innerValue, setInnerValue] = useState(value !== undefined ? (value / 100).toFixed(2) : '')

  return <>
    <label htmlFor={name}>{label}</label>
    <input
      id={name}
      type="number"
      step="0.01"
      inputMode="decimal"
      min="0"
      placeholder="0"
      value={innerValue}
      onChange={e => {
        setInnerValue(e.target.value)
        onChange(e.target.value !== '' ? Math.trunc(Math.abs(Number(e.target.value) * 100)) : 0)
      }}
      onBlur={e => {
        if (e.target.value !== '' && !isNaN(Number(e.target.value))) {
          setInnerValue(Math.abs(Number(e.target.value)).toFixed(2))
        }
      }}
    />
    {errors.length > 0 && <span className="error">{errors.map(issue => issue.message).join(', ')}</span>}
  </>
}

export default Controlled
