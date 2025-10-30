import express from 'express';
import ViteExpress from 'vite-express';
import controllerRouter from './controllers/controllerRouter';

const app = express();

app.get('/', (_req, res) => {
  res.send('Hello World!');
});

controllerRouter(app);

ViteExpress.listen(app, 3000, () => console.log('Server is listening on port 3000...'));
