import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes); // Main router mounts early-access and admin routes under /api

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
