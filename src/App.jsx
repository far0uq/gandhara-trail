import { useState } from 'react'
import LoadingScreen from './components/LoadingScreen'
import MapView from './components/MapView'

function App() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      <MapView />
    </>
  )
}

export default App
