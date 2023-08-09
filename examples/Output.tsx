import { Field, fieldErrors, getValue } from '@stevent-team/react-zoom-form'
import { useCallback, useEffect, useState } from 'react'

interface OutputProps {
  isDirty: boolean
  fields: Field
}

const Output = ({ isDirty, fields }: OutputProps) => {
  const [submittedValue, setSubmittedValue] = useState()

  const handleSubmit = useCallback((e: Event) => {
    if (e instanceof CustomEvent) setSubmittedValue(e.detail)
  }, [])

  useEffect(() => {
    document.addEventListener('zoomSubmit', handleSubmit)
    return () => document.removeEventListener('zoomSubmit', handleSubmit)
  })

  return <output>
    <div><strong>isDirty:</strong> {isDirty ? 'true' : 'false'}</div>
    <div><strong>value:</strong> {JSON.stringify(getValue(fields), null, 2)}</div>
    <div><strong>errors:</strong> {JSON.stringify(fieldErrors(fields), null, 2)}</div>
    {submittedValue && <>
      <div><strong>submitted value:</strong> {JSON.stringify(submittedValue, null, 2)}</div>
      <div><em>Also view the submitted value in the console</em></div>
    </>}
  </output>
}

export default Output
