# React Zoom Form <img width="300" align="right" src="https://github.com/stevent-team/react-zoom-form/assets/16392483/e7898088-ccfc-4899-9f35-a32faaf8964c" alt="car">

[![npm version](https://img.shields.io/npm/v/@stevent-team/react-zoom-form)](https://www.npmjs.com/package/@stevent-team/react-zoom-form)
[![minzip size](https://img.shields.io/bundlephobia/minzip/@stevent-team/react-zoom-form)](https://bundlephobia.com/package/@stevent-team/react-zoom-form)

- 💎 Type-safe and powered by [Zod](https://github.com/colinhacks/zod)
- 🪝 Hook-based API
- 🌳 Under 3 KB (minified & gzipped), and tree-shakable
- 🗂️ Supports nested object and array fields
- 🍱 Easily control 3rd party fields

Inspired by [react-hook-form](https://github.com/react-hook-form/react-hook-form) and [react-zorm](https://github.com/esamattis/react-zorm).

## Usage

Install `react-zoom-form` and `zod`

```bash
yarn add @stevent-team/react-zoom-form zod
```

### Basic Example

```tsx
import { useForm } from '@stevent-team/react-zoom-form'
import { z } from 'zod'

// Define the structure and validation of your form
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.coerce.number().min(13),
})

const EditPage = () => {
  const { fields, handleSubmit } = useForm({ schema })

  const onSubmit = values => {
    console.log(values)
  }

  return <form onSubmit={handleSubmit(onSubmit)}>
    <input {...fields.name.register()} type="text" />
    <input {...fields.age.register()} type="number" />
    <button>Save changes</button>
  </form>
}
```

### Error Handling

A basic `Errors` component is provided that will take a field and display comma separated error messages in a span. See the [`Errors` API reference](#errors) for more info.

```tsx
<input {...fields.name.register()} type="text" />
<Errors field={fields.name} />
```

There is also a `fieldErrors` function you can wrap a field in to get an array of [`ZodIssue`](https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md)s for that field. See the [`fieldErrors` API reference](#fielderrors) for more info.

```tsx
<input {...fields.name.register()} type="text" />
{fieldErrors(fields.name).map(issue => <span>{issue.message}</span>)}
```

<details>
<summary>

#### Custom Error Messages

</summary>

You can customize the error messages in several ways.

1. Set a custom error message in your Zod schema
    ```ts
    const schema = z.object({
      description: z.string().max(100, 'The description is too long!')
    })
    ```
2. Look at the issue code when rendering errors (see a [list of codes](https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md#zodissuecode))
    ```ts
    fieldErrors(fields.description).map(issue => {
      if (issue.code === 'too_big') {
        return 'The description is too long!'
      }
      return issue.message
    })
    ```
3. Register a custom [ZodErrorMap](https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md#customizing-errors-with-zoderrormap)
    ```ts
    const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
      if (issue.code === 'invalid_type') {
        if (issue.expected === 'string') {
          return { message: 'bad type!' }
        }
      }
      if (issue.code === 'custom') {
        return { message: `less-than-${(issue.params || {}).minimum}` }
      }
      return { message: ctx.defaultError }
    }

    z.setErrorMap(customErrorMap)
    ```
</details>

#### Manually Set and Clear Errors

Use the `setError` function to set or clear errors for a particular field, or the entire form.

```tsx
setError(fields.image, { code: 'custom', message: 'Server failed to upload' })

// Clear all errors
setError(fields, undefined)
```

### Coercion and Validation

Importantly, native HTML `input`, `textarea` and `select` all use strings to store their values. Because of this, `undefined` or `null` are not valid values for native fields, and the following schema defines a string that is _not_ required*.

```ts
const schema = z.object({
  notRequired: z.string()
})
```

<details>
<summary>* Actually, it <em>is</em> required unless you pass <code>initialValues</code></summary>

Because the form value is initially an empty object, `notRequired` may actually be set to `undefined` initially, until something is typed into the input, even if it's deleted.

There are a few ways to mitigate this:

1. Treat both `invalid_type` and `too_small` errors as _required_. You can use a custom [ZodErrorMap](https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md#customizing-errors-with-zoderrormap) for this purpose.
    ```ts
    const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
      if (
        (issue.code === 'invalid_type' && issue.received === 'undefined')
        || (issue.code === 'too_small' && issue.minimum === 1)
      ) {
        return { message: 'This field is required' }
      }
      return { message: ctx.defaultError }
    }

    z.setErrorMap(customErrorMap)
    ```
2. Pass `initialValues` to the `useForm` hook. This will allow you to provide an initial value of `''` for that field, preventing it from ever being `undefined`.
    ```ts
    const { fields } = useForm({ schema, initialValues: { notRequired: '' } })
    ```
3. Make the field `optional` in the schema. This will allow your field to actually be `undefined`, which may be what you want anyway.
    ```ts
    const schema = z.object({
      notRequired: z.string().optional()
    })
    ```
</details>

In order to make a field "required", you need to add `min(1)` to ensure that it has at least 1 character:

```ts
const schema = z.object({
  minOne: z.string().min(1)
})
```

#### Number Fields

You can use the [`coerce`](https://github.com/colinhacks/zod/tree/master#coercion-for-primitives) functionality in Zod to handle number fields if you'd like your parsed value to be a number.

```tsx
const schema = z.object({
  age: z.coerce.number(),
})

const onSubmit = values => {
  console.log(typeof values.age) // 'number'
}

<input {...fields.age.register()} type="number" />
```

#### Checkboxes

Checkboxes will be detected and coerced into booleans automatically, so you don't need to do anything special.

```tsx
const schema = z.object({
  acceptedAgreement: z.boolean(),
})

const onSubmit = values => {
  console.log(typeof values.acceptedAgreement) // 'boolean'
}

<input {...fields.acceptedAgreement.register()} type="checkbox" />
```

#### Radio Fields

It's recommended to use an enum type to validate radio groups.

```tsx
const schema = z.object({
  favoriteColor: z.enum(['red', 'green', 'blue']),
})

const { fields } = useForm({ schema })

return <form>
  <label>
    <input {...fields.favoriteColor.register()} type="radio" value="red" />
    <span>Red</span>
  </label>
  <label>
    <input {...fields.favoriteColor.register()} type="radio" value="green" />
    <span>Green</span>
  </label>
  <label>
    <input {...fields.favoriteColor.register()} type="radio" value="blue" />
    <span>Blue</span>
  </label>
</form>
```

### Nested Fields

React Zoom Form supports nested object and array fields. You can access them on the fields object as you'd expect.

```tsx
const schema = z.object({
  address: z.object({
    street: z.string().min(1),
    country: z.string().min(1),
  }),
  tasks: z.array(
    z.object({
      name: z.string().min(1),
      isCompleted: z.boolean(),
    })
  )
})

const { fields } = useForm({ schema })

// Register a native input for street
<input {...fields.address.street.register()} type="text" />

// Register a native input for task completion
<input {...fields.tasks[0].isCompleted.register()} type="checkbox" />

// Get errors for any fields in the address object
fieldErrors(fields.address)
```

### Controlled Fields

A `controlled` helper function is provided to make interacting with 3rd party field components or creating your own complex fields easy. See the [API reference for `controlled`](#controlled).

Note that `ControlledField<string[]>` is used to type the props of the `MultiSelectField` component, which will only allow a field of that type to be passed in. This allows components to define the data shape they can handle, while still being useable outside of a form with a normal `useState` hook.

```tsx
import { useForm, controlled, ControlledField } from '@stevent-team/react-zoom-form'
import { z } from 'zod'

const schema = z.object({
  colors: z.array(z.string()).min(2),
})

const Page = () => {
  const { fields, handleSubmit } = useForm({ schema })

  const onSubmit = values => {
    console.log(values)
  }

  return <form onSubmit={handleSubmit(onSubmit)}>
    <MultiSelectField
      {...controlled(fields.colors)}
      options={['green', 'purple', 'orange', 'lavender']}
    />
    <button>Save changes</button>
  </form>
}

const MultiSelectField = ({ value, onChange, errors, options }: ControlledField<string[]> & { options: string[] }) => <>
  <div>
    {options.map(option => <label key={option}>
      <input
        type="checkbox"
        checked={value.includes(option)}
        onChange={e => {
          if (e.currentTarget.checked) {
            onChange({ ...value, option })
          } else {
            onChange(value.filter(c => c !== option))
          }
        }}
      />
      <span>{option}</span>
    </label>)}
  </div>
  {errors.length > 0 && <span>{errors.map(e => e.message).join(', ')}</span>}
</>
```

### Get/Set Values Programmatically

Two helper functions are provided to get and set values directly. See API documentation for [getValue](#getvalue) and [setValue](#setvalue).

```ts
const schema = z.object({
  password: z.string().min(8),
})

const { fields } = useForm({ schema })

const password = getValue(fields.password)

useEffect(() => {
  if (!loginResponse.ok) {
    setValue(fields.password, '')
  }
}, [loginResponse])
```

### Conditional Fields

You can set up conditional fields using Zod's `refine` method.

```tsx
const schema = z.object({
  joinNewsletter: z.boolean(),
  email: z.string().email().optional(),
}).refine(values => {
  if (values.joinNewsletter === false) return true

  return values.email !== undefined && values.email !== ''
}, 'Email is required')

const { fields } = useForm({ schema })

const joinNewsletter = getValue(fields.joinNewsletter)

return <form>
  <input {...fields.joinNewsletter.register()} type="checkbox" />
  {joinNewsletter && <input {...fields.email.register()} type="email" />}
</form>
```

### Initial Values and Resetting

You can provide `initialValues` to the `useForm` hook if you'd like your fields to start with an initial value. This is also what determines the `isDirty` state of your form. By default, `initialValues` is an empty object.

At any time, you can reset your form data to `initialValues` by calling `reset`, which is provided by the `useForm` hook.

Note that `reset` behaves like setting `initialValues`, and so will correctly calculate the state of `isDirty`.

```ts
const { fields, reset, isDirty } = useForm({ schema })

useEffect(() => {
  reset(apiData)
}, [apiData])

return <form>
  <>...</>
  <button disabled={!isDirty}>Save changes</button>
</form>
```

### Custom Reference

If you also need access to the `ref` of an input you're using `register()` on, you can pass it to the options of register like so:

```tsx
const { fields } = useForm({ schema })

const myInputRef = useRef<HTMLInputElement>(null)

return <form>
  <input {...fields.myInput.register({ ref: myInputRef })} />

  <button
    type="button"
    onClick={() => myInputRef.current.focus()}
  >Focus my input</button>
</form>
```

### Tips

- If you're computing your schema inside the react component that calls `useForm`, be sure to memoize the schema so rerenders of the component do not recalculate the schema. This also goes for `initialValues`.

## API Reference

### `useForm`

```ts
const { fields, handleSubmit, isDirty, reset } = useForm(options)
```

#### Options

| Option | Type | Description |
| --- | --- | --- |
| `schema` | `AnyZodObject` | Your Zod schema used to validate the form. |
| `initialValues` | `RecursivePartial<z.infer<Schema>> \| undefined` | Optionally pass initial values for the fields. |

#### Returns

| Property | Type | Description |
| --- | --- | --- |
| `fields` | `FieldChain<Schema>` | Field chain for the form. Types are based off the provided Zod schema. |
| `handleSubmit` | `(handler: SubmitHandler<Schema>) => React.FormEventHandler<HTMLFormElement>` | Higher-order function for handling form submission event. Takes a function that it will call with parsed values on submit. |
| `isDirty` | `boolean` | Deeply compares the `initialValues` of a form with the current value to tell you if any of the fields have changed. |
| `reset` | `(values?: RecursivePartial<z.TypeOf<Schema>>) => void` | Resets a form's value to `initialValues`, or data you pass in directly. |

The `fields` object will match the shape of your Zod schema, and also provides a `register` and `name` function at each leaf node.

| Property | Type | Description |
| --- | --- | --- |
| `register` | `(options?: RegisterOptions) => ReturnType<RegisterFn>` | Takes options and returns `onChange`, `name` and `ref` props that you can pass to a native `input`, `textarea` or `select` element. |
| `name` | `() => string` | Returns a unique name for this field. Useful for linking `label` elements. |

### `controlled`

Takes a field from the `fields` property of the `useForm` hook.

```ts
const { name, schema, value, onChange, errors } = controlled(field)
```

#### Returns

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Unique name for this field. |
| `schema` | `z.ZodType<T>` | The Zod schema for this field. Can be used to parse internally. |
| `value` | `PartialObject<T> \| undefined` | The value of this field. |
| `onChange` | `(value: PartialObject<T> \| undefined) => void` | Call to change the value of this field. |
| `errors` | `z.ZodIssue[]` | An array of ZodIssues for this field. If there are no issues the array will be empty. |

### `fieldErrors`

Takes a field from the `fields` property of the `useForm` hook.

```ts
const errors = fieldErrors(field)
```

| Property | Type | Description |
| --- | --- | --- |
| `errors` | `z.ZodIssue[]` | An array of ZodIssues for this field. If there are no issues the array will be empty. |

### `getValue`

Takes a field from the `fields` property of the `useForm` hook.

```ts
const value = getValue(field)
```

| Property | Type | Description |
| --- | --- | --- |
| `value` | `PartialObject<NonNullable<T>> \| undefined` | The value of this field. |

### `setValue`

```ts
setValue(field, newValue)
```

| Argument | Type | Description |
| --- | --- | --- |
| `field` | `Field` | A field from the `fields` property of the `useForm` hook. |
| `newValue` | `PartialObject<NonNullable<T>> \| undefined \| ((currentValue: PartialObject<NonNullable<T>> \| undefined) => PartialObject<NonNullable<T>> \| undefined)` | Takes a value to set this field to, or a function from the current value to the desired value.

### `Errors`

Renders a `span`.

```tsx
<Errors field={field} max={undefined} issueMap={issue => issue.message} separator=", " />
```

| Property | Type | Description |
| --- | --- | --- |
| `field` | `Field` | A field from the `fields` property of the `useForm` hook. |
| `max` | `number \| undefined` | The maximum number of errors to show. |
| `issueMap` | `((issue: ZodIssue) => string) \| undefined` | Change the data displayed for an issue. |
| `separator` | `string \| undefined` | The separator used to join all the issues. |

## Contributing

You can install dependencies by running `yarn` after cloning this repo, and `yarn dev` to start the example.

This library uses [changesets](https://github.com/changesets/changesets), if the changes you've made would constitute a version bump, run `yarn changeset` and follow the prompts to document the changes you've made. Changesets are consumed on releases, and used to generate a changelog and bump version number.

## License

**React Zoom Form** is created by [Stevent](https://github.com/stevent-team) and licensed under MIT

*Car image created by [Ewan Breakey](https://ewanb.me) and licensed under [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)*
