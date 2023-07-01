# 🌲 Fir - Forms in React

> **Warning**<br>
> Fir is in alpha, and the API may change entirely within minor releases. Please use at your own risk.

Typescript-first, hook-based forms using React, powered by [Zod](https://github.com/colinhacks/zod). Inspired by [react-hook-form](https://github.com/react-hook-form/react-hook-form) and [react-zorm](https://github.com/esamattis/react-zorm).

## Usage

Install `fir` and `zod`

```bash
yarn add @stevent-team/fir zod
```

Example usage:

```tsx
import { useForm, useField } from '@stevent-team/fir'
import { z } from 'zod'

// Define the structure and validation of your form
const schema = z.object({
  name: z.string().min(1, 'This field is required').default(''),
  age: z.coerce.number().min(13),
  address: z.object({
    street: z.string().default(''),
    city: z.string().default(''),
  }),
  link: z.object({
    label: z.string(),
    url: z.string().url(),
  }).default({ label: '', url: '' }),
})

const EditPage = () => {
  const { fields, handleSubmit } = useForm({ schema })

  const onSubmit = values => {
    console.log(values)
  }

  return <form onSubmit={handleSubmit(onSubmit)}>
    <input {...fields.name.register()} type="text" />
    <input {...fields.age.register()} type="number" />
    <input {...fields.address.street.register()} type="text" />
    <input {...fields.address.city.register()} type="text" />
    <LinkField field={fields.link} />
    <button>Save changes</button>
  </form>
}

// An example component that has a custom value type of Link
interface Link {
  label: string
  url: string
}

const LinkField = ({ field }: { field: Field<Link> }) => {
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
