# 🌲 Fir - Forms in React

Typescript-first, hook-based forms using React, powered by [Zod](https://github.com/colinhacks/zod).

## Usage

Install `fir` and `zod`

```bash
yarn add @stevent-team/fir zod
```

Example usage:

```tsx
import { useForm, useField, FieldProps } from '@stevent-team/fir'
import { z } from 'zod'

// Define the structure and validation of your form
const schema = z.object({
  name: z.string().min(3).max(100),
  age: z.coerce.number().optional().min(13),
  link: z.object({
    label: z.string(),
    url: z.string().url(),
  }),
})

const EditPage = () => {
  const { field, control, handleSubmit } = useForm({ schema })

  const onSubmit = values => {
    console.log(values)
  }

  return <form onSubmit={handleSubmit(onSubmit)}>
    <input {...field('name')} type="text" />
    <input {...field('age')} type="number" />
    <LinkField field={field('link')} />
    <button>Save changes</button>
  </form>
}

// An example component that has a custom value type of Link
interface Link {
  label: string
  url: string
}

const LinkField = ({ field }: { field: FieldProps<Link> }) => {
  const { value, onChange } = useField(field)

  return <div>
    <input
      type="text"
      value={value.label}
      onChange={e => onChange({ ...value, label: e.currentTarget.value })}
    />
    <input
      type="url"
      value={value.url}
      onChange={e => onChange({ ...value, url: e.currentTarget.value })}
    />
  </div>
}
```

## License

Created by Stevent and licensed under MIT
