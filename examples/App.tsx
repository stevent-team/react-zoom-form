import { Route, Switch, Link, useLocation } from 'wouter'
import KitchenSink from './kitchen-sink'

interface Example {
  name: string
  path: string
  component: () => JSX.Element
}

const EXAMPLES: Example[] = [
  {
    name: 'Kitchen Sink',
    path: '/kitchen-sink',
    component: KitchenSink,
  },
]

const App = () => {
  const [location] = useLocation()

  return <>
    <nav>
      {'🏎️ '}<a href="https://github.com/stevent-team/react-zoom-form" target="_blank" rel="nofollow noreferrer">React Zoom Form</a>
      <h2>Examples</h2>
      <ul>
        {EXAMPLES.map(example => {
          const active = location.startsWith(example.path)

          return <li key={example.path} className={active ? 'active' : undefined}>
            {active ? <span>{example.name}</span> : <Link to={example.path}>{example.name}</Link>}
            {' '}(<a href={`https://github.com/stevent-team/react-zoom-form/blob/main/examples${example.path}/index.tsx`} target="_blank" rel="nofollow noreferrer">code</a>)
          </li>
        })}
      </ul>
    </nav>

    <main>
      <Switch>
        {EXAMPLES.map(example => <Route key={example.path} path={example.path} component={example.component} />)}

        <Route>Example not found</Route>
      </Switch>
    </main>
  </>
}

export default App
