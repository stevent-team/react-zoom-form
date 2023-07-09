# @stevent-team/react-zoom-form

## 0.3.0

### Minor Changes

- 616791d: Introduce `errors` helper fn.

  This is a breaking change that removes the `errors` object from the return of `useForm`, and instead introduces a global function `errors()` that takes a field and returns an array of ZodIssues.

### Patch Changes

- dccb92c: Update packages

## 0.2.1

### Patch Changes

- f889c10: Don't apply Partial to custom field if type is an array

## 0.2.0

### Minor Changes

- 8c6590a: Remove useField hook and replace with a "controlled" method.

  This allows for more ergonomic usage of custom elements, as you can now wrap a custom field with `controlled` like so and it will give you `value`, `onChange` etc.

  ```ts
  const schema = z.object({ myInput: z.string() });

  const { fields } = useForm({ schema });

  const { value, onChange } = controlled(fields.myInput);
  ```

## 0.1.0

### Minor Changes

- 1b854ed: Add support for radio fields

### Patch Changes

- 7f71035: Allow symbol access to proxies for introspection

## 0.0.3

### Patch Changes

- 721abd5: Always init Proxy with object

## 0.0.2

### Patch Changes

- 97a35ee: Remove peer deps from bundle

## 0.0.1

### Patch Changes

- b850d0b: Initial release
