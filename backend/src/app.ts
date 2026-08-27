import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import apiRoutes from './routes/index';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// CORS — restrict to the configured frontend URL, allowing local dev ports
const allowedOrigins = [env.frontendUrl];
if (env.isDevelopment) {
  allowedOrigins.push('http://localhost:5173');
  allowedOrigins.push('http://localhost:5174');
  allowedOrigins.push('http://localhost:5175');
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRoutes);

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handler — must be last
app.use(errorHandler);

export default app;
