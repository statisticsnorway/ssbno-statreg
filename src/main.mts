import express from 'express'
import ViteExpress from 'vite-express'

const app = express()

app.get('/', (_, res) => {
  res.send('Hello World!')
})

const port = 8080
ViteExpress.listen(app, port, () => console.log(`Server is listening on port ${port}...`))
