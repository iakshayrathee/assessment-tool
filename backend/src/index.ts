import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import assessmentRoutes from './routes/assessments';
import centerRoutes from './routes/centers';
import schoolRoutes from './routes/schools';
import parentRoutes from './routes/parents';
import fileRoutes from './routes/files';
import adminRoutes from './routes/admin';
import specialEducatorRoutes from './routes/specialEducators';
import superSpecialEducatorRoutes from './routes/superSpecialEducators';
import reportRoutes from './routes/reports';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000' || 'https://knowledai.vercel.app/',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 600,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Knowled Backend API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/special-educators', specialEducatorRoutes);
app.use('/api/super-special-educators', superSpecialEducatorRoutes);
app.use('/api/reports', reportRoutes);

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  if (error.code === 'P2002') {
    return res.status(400).json({
      success: false,
      error: 'A record with this information already exists'
    });
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found'
    });
  }
  
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Knowled Backend API is running on port ${PORT}`);
});

export default app;
