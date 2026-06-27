import { SimulatorProvider } from './context/SimulatorContext'
import ACLSSimulator from './components/ACLSSimulator'

export default function App() {
  return (
    <SimulatorProvider>
      <ACLSSimulator />
    </SimulatorProvider>
  )
}
