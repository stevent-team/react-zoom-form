import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { z } from 'zod'
import { SubmitHandler } from '@stevent-team/react-zoom-form'
import userEvent from '@testing-library/user-event'
import Basic, { schema } from '.'


describe('Simple flat form with text values', () => {
  const setup = (onSubmit?: SubmitHandler<typeof schema>) => ({
    user: userEvent.setup(),
    ...render(<Basic onSubmit={onSubmit ?? (() => void {})} />)
  })

  it('renders inputs with the given names', async () => {
    // Render the form
    const { container } = setup()

    // Look for the inputs
    for (const inputName of Object.keys(schema.shape)) {
      const input = container.querySelector(`#${inputName}`)
      expect(input?.getAttribute('name')).toBe(inputName)
    }
  })

  it('submit recieves registered values', async () => {
    // Render form + track values
    let formValues = null
    const { user, container } = setup((values: z.infer<typeof schema>) => {
      formValues = values
    })

    const submitButton = screen.getByRole('button')
    const nameInput = container.querySelector('#name')
    const ageInput = container.querySelector('#age')

    expect(nameInput).not.toBeNull()
    expect(ageInput).not.toBeNull()

    await user.type(nameInput as Element, 'john')
    await user.type(ageInput as Element, '18')
    await user.click(submitButton)

    expect(formValues).toBeTruthy()
    expect(formValues).toEqual({
      name: 'john',
      age: 18,
    })
  })

  it('validates missing fields', async () => {
    // Render form + spy on submissions
    const onSubmit = vi.fn()
    const { user, container } = setup(onSubmit)

    // Enter a name but not an age
    const submitButton = screen.getByRole('button')
    const nameInput = container.querySelector('#name')
    await user.type(nameInput as Element, 'john')
    await user.click(submitButton)

    // Validation should fail because missing age
    // thus shouldn't call on submit
    expect(onSubmit).not.toHaveBeenCalled()

    // Should show errors
    expect(container.querySelectorAll('.error')).toHaveLength(1)
  })
})
