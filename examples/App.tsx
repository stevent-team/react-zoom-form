import { Route, Switch, Link, useLocation } from 'wouter'
import { SubmitHandler } from '@stevent-team/react-zoom-form'
import { repository } from '../package.json'

import Basic from './basic'
import Arrays from './arrays'
import Nested from './nested'
import Coerced from './coerced'
import Conditional from './conditional'
import KitchenSink from './kitchen-sink'

interface Example {
  name: string
  path: string
  component: ({ onSubmit }: { onSubmit: SubmitHandler }) => JSX.Element
}

const EXAMPLES: Example[] = [
  {
    name: 'Basic',
    path: '/basic',
    component: Basic,
  },
  {
    name: 'Array field',
    path: '/arrays',
    component: Arrays,
  },
  {
    name: 'Nested fields',
    path: '/nested',
    component: Nested,
  },
  {
    name: 'Coerced fields',
    path: '/coerced',
    component: Coerced,
  },
  {
    name: 'Conditional field',
    path: '/conditional',
    component: Conditional,
  },
  {
    name: 'Kitchen Sink',
    path: '/kitchen-sink',
    component: KitchenSink,
  },
]

// Shared submit handler
const onSubmit: SubmitHandler = values => {
  console.log(values)
  document.dispatchEvent(new CustomEvent('zoomSubmit', { detail: values }))
}

const App = () => {
  const [location] = useLocation()

  return <>
    <nav>
      {'🏎️ '}<a href={repository} target="_blank" rel="nofollow noreferrer">React Zoom Form</a>
      <h2>Examples</h2>
      <ul>
        {EXAMPLES.map((example, i) => {
          const active = location === (i === 0 ? '/' : example.path)

          return <li key={example.path} className={active ? 'active' : undefined}>
            {active ? <span>{example.name}</span> : <Link to={i === 0 ? '/' : example.path}>{example.name}</Link>}
            {' '}(<a href={`${repository}/blob/main/examples${example.path}`} target="_blank" rel="nofollow noreferrer">code</a>)
          </li>
        })}
      </ul>
    </nav>

    <main>
      <Switch>
        {EXAMPLES.map((example, i) => <Route key={example.path} path={i === 0 ? '/' : example.path}>
          <example.component onSubmit={onSubmit} />
        </Route>)}

        <Route>Example not found</Route>
      </Switch>
    </main>
  </>
}

export default App
