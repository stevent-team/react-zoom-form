import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ZodIssue, z } from 'zod'
import { SubmitHandler, useForm } from '@stevent-team/react-zoom-form'
import userEvent from '@testing-library/user-event'

const schema = z.object({
  givenName: z.string().min(1, 'Field is required').default(''),
  familyName: z.string().min(1, 'Field is required').default(''),
})

const FormError = ({ errors }: { errors: { _errors: ZodIssue[] } }) =>
  errors._errors.length > 0 ? <span className="error" role="alert">{errors._errors.map(e => `${e.message} (${e.code})`).join(', ')}</span> : null

const BasicForm = ({ onSubmit }: { onSubmit: SubmitHandler<typeof schema> }) => {
  const { fields, handleSubmit, errors } = useForm({ schema })

  return <form onSubmit={handleSubmit(onSubmit)}>
    <input {...fields.givenName.register()} type="text" placeholder="givenName" />
    <FormError errors={errors.givenName} />

    <input {...fields.familyName.register()} type="text" placeholder="familyName" />
    <FormError errors={errors.familyName} />

    <button type="submit">Submit</button>
  </form>
}


describe('Simple flat form with text values', () => {

  const setup = (onSubmit?: SubmitHandler<typeof schema>) => ({
    user: userEvent.setup(),
    ...render(<BasicForm onSubmit={onSubmit ?? (() => void {})} />)
  })

  it('renders inputs with the given names', async () => {
    // Render the form
    setup()

    // Look for the inputs
    for (const inputName of Object.keys(schema.shape)) {
      const input = screen.getByPlaceholderText(inputName)
      expect(input.getAttribute('name')).toBe(inputName)
    }
  })

  it('submit recieves registered values', async () => {
    // Render form + track values
    let formValues = null
    const { user } = setup((values: z.infer<typeof schema>) => {
      formValues = values
    })

    const submitButton = screen.getByRole('button')
    const givenNameInput = screen.getByPlaceholderText('givenName')
    const familyNameInput = screen.getByPlaceholderText('familyName')

    await user.type(givenNameInput, 'john')
    await user.type(familyNameInput, 'green')
    await user.click(submitButton)

    expect(formValues).toBeTruthy()
    expect(formValues).toEqual({
      givenName: 'john',
      familyName: 'green',
    })
  })

  it('validates missing fields', async () => {
    // Render form + spy on submissions
    const onSubmit = vi.fn()
    const { user } = setup(onSubmit)

    // Enter a given name but not a family name
    const submitButton = screen.getByRole('button')
    const givenNameInput = screen.getByPlaceholderText('givenName')
    await user.type(givenNameInput, 'john')
    await user.click(submitButton)

    // Validation should fail because missing familyName
    // thus shouldn't call on submit
    expect(onSubmit).not.toHaveBeenCalled()

    // Should show errors
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByText(/field is required/i)).toBeTruthy()
  })
})
