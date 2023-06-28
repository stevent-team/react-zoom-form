import { createRoot } from 'react-dom/client'

import App from './App'

const root = createRoot(document.querySelector('#app') as Element)
root.render(<App />)
