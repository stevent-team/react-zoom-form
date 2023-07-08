---
"@stevent-team/react-zoom-form": minor
---

Remove useField hook and replace with a "controlled" method.

This allows for more ergonomic usage of custom elements, as you can now wrap a custom field with `controlled` like so and it will give you `value`, `onChange` etc.

```ts
const schema = z.object({ myInput: z.string() })

const { fields } = useForm({ schema })

const { value, onChange } = controlled(fields.myInput)
```
