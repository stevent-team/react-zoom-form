import { useForm } from '@stevent-team/fir'
import { z } from 'zod'

// Define the structure and validation of your form
const schema = z.object({
  name: z.string().min(3).max(100),
  age: z.coerce.number().min(13).optional(),
  link: z.object({
    label: z.string(),
    url: z.string().url(),
  }),
})

const App = () => {
  const { field } = useForm({ schema })
  console.log(field('name'))

  return <form>
    <input type="text" />
    <button>Save changes</button>
  </form>
}

export default App
