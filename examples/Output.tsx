import { Field, fieldErrors, getValue } from '@stevent-team/react-zoom-form'

interface OutputProps {
  isDirty: boolean
  fields: Field
}

const Output = ({ isDirty, fields }: OutputProps) => <output>
  <div><strong>isDirty:</strong> {isDirty ? 'true' : 'false'}</div>
  <div><strong>value:</strong> {JSON.stringify(getValue(fields), null, 2)}</div>
  <div><strong>errors:</strong> {JSON.stringify(fieldErrors(fields), null, 2)}</div>
</output>

export default Output
