# 🌲 React Zoom Form

[![npm version](https://img.shields.io/npm/v/@stevent-team/react-zoom-form)](https://www.npmjs.com/package/@stevent-team/react-zoom-form)
[![minzip size](https://img.shields.io/bundlephobia/minzip/@stevent-team/react-zoom-form)](https://bundlephobia.com/package/@stevent-team/react-zoom-form)

> **Warning**<br>
> React Zoom Form is in alpha, and the API may change entirely within minor releases. Please use at your own risk.

Typescript-first, hook-based forms using React, powered by [Zod](https://github.com/colinhacks/zod). Inspired by [react-hook-form](https://github.com/react-hook-form/react-hook-form) and [react-zorm](https://github.com/esamattis/react-zorm).

## Usage

Install `react-zoom-form` and `zod`

```bash
yarn add @stevent-team/react-zoom-form zod
```

Example usage:

```tsx
import { useForm, useField, Field } from '@stevent-team/react-zoom-form'
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
  const { fields, handleSubmit, errors } = useForm({ schema })

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
    {errors._errors.length > 0 && <div>{errors._errors.map(err => err.message).join(', ')}</div>}
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

## Contributing

You can install dependencies by running `yarn` after cloning this repo, and `yarn dev` to start the example.

This library uses [changesets](https://github.com/changesets/changesets), if the changes you've made would constitute a version bump, run `yarn changeset` and follow the prompts to document the changes you've made. Changesets are consumed on releases, and used to generate a changelog and bump version number.

## License

Created by Stevent and licensed under MIT
