import { $api } from './api'

function App() {
  const { data, error, isLoading } = $api.useQuery('get', '/releases/{id}', { params: { path: { id: '1' } } })

  if (isLoading || !data) {
    return <p>Loading release...</p>
  }

  if (error) {
    //handle error
  }

  return (
    <div>
      <h1>Release {data.id}</h1>
      <ul>
        <li>From {data.period_from}</li>
        <li>To {data.period_to}</li>
      </ul>
    </div>
  )
}

export default App
