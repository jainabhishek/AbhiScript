import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number()
    .port()
    .default(3001),
  
  DATABASE_URL: Joi.string()
    .required()
    .description('Database connection URL'),
  
  OPENAI_API_KEY: Joi.string()
    .required()
    .description('OpenAI API key'),
  
  OPENAI_ORG_ID: Joi.string()
    .optional()
    .description('OpenAI Organization ID'),
  
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT signing secret'),
  
  MAX_FILE_SIZE: Joi.string()
    .default('500MB')
    .description('Maximum file upload size'),
  
  UPLOAD_PATH: Joi.string()
    .default('./uploads')
    .description('File upload directory'),
  
  PROCESSED_PATH: Joi.string()
    .default('./data/processed')
    .description('Processed files directory'),
  
  AUDIO_CHUNK_SIZE: Joi.string()
    .default('25MB')
    .description('Audio chunk size for processing'),
  
  MAX_PROCESSING_TIME: Joi.number()
    .default(3600)
    .description('Maximum processing time in seconds'),
  
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  
  LOG_FILE: Joi.string()
    .default('./logs/app.log')
    .description('Log file path'),
  
  CORS_ORIGIN: Joi.string()
    .default('http://localhost:3000')
    .description('CORS allowed origin'),
  
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .default(900000)
    .description('Rate limit window in milliseconds'),
  
  RATE_LIMIT_MAX: Joi.number()
    .default(100)
    .description('Maximum requests per window'),
}).unknown();

export function validateEnv(): void {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    throw new Error(`Environment validation error: ${error.details.map(x => x.message).join(', ')}`);
  }
  
  // Update process.env with validated values
  Object.assign(process.env, value);
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  openaiApiKey: string;
  openaiOrgId?: string;
  jwtSecret: string;
  maxFileSize: string;
  uploadPath: string;
  processedPath: string;
  audioChunkSize: string;
  maxProcessingTime: number;
  logLevel: string;
  logFile: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

export function getConfig(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001'),
    databaseUrl: process.env.DATABASE_URL!,
    openaiApiKey: process.env.OPENAI_API_KEY!,
    openaiOrgId: process.env.OPENAI_ORG_ID,
    jwtSecret: process.env.JWT_SECRET!,
    maxFileSize: process.env.MAX_FILE_SIZE || '500MB',
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    processedPath: process.env.PROCESSED_PATH || './data/processed',
    audioChunkSize: process.env.AUDIO_CHUNK_SIZE || '25MB',
    maxProcessingTime: parseInt(process.env.MAX_PROCESSING_TIME || '3600'),
    logLevel: process.env.LOG_LEVEL || 'info',
    logFile: process.env.LOG_FILE || './logs/app.log',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  };
} 