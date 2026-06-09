import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import * as Sentry from "@sentry/node";

import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';


const app = express();


// Security
app.use(helmet());

app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: [
    'GET',
    'POST',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],
}));


// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended:true }));


// API Routes
app.use('/api', routes);


// 404 ALWAYS AFTER ROUTES
app.use((req,res)=>{
  res.status(404).json({
    success:false,
    message:"Not Found",
  });
});


// Sentry error handler
Sentry.setupExpressErrorHandler(app);


// Your custom error handler LAST
app.use(errorHandler);


export default app;