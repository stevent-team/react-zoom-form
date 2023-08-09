import { SubmitHandler, useForm, Errors, getValue, setValue } from '@stevent-team/react-zoom-form'
import { z } from 'zod'
import Output from '../Output'

export const schema = z.object({
  flowers: z.array(z.string().min(1)).min(1).max(10),
})

const Arrays = ({ onSubmit }: { onSubmit: SubmitHandler<typeof schema> }) => {
  const { fields, handleSubmit, isDirty } = useForm({ schema, initialValues: { flowers: [''] } })

  return <>
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>Flower names</label>

      {getValue(fields.flowers)?.map((_value, i) =>
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <input {...fields.flowers[i].register()} placeholder={`Flower ${i + 1}`} type="text" />
          <button
            type="button"
            onClick={() => setValue(fields.flowers, value => value?.filter((_, j) => j !== i))}
            style={{ margin: 0, width: 100 }}
          >Delete</button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setValue(fields.flowers, value => [...value ?? [], ''])}
      >Add flower</button>

      <Errors field={fields.flowers} className="error" />

      <button>Save changes</button>
    </form>

    <Output isDirty={isDirty} fields={fields} />
  </>
}

export default Arrays
