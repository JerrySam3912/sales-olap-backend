import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { sendError } from './utils/response.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', routes);

app.use((req, res) => {
  return sendError(res, 'Route not found', 404);
});

app.use((error, req, res, next) => {
  console.error(error);
  return sendError(res);
});

export default app;
