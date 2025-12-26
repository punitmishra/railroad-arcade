// ============================================
// Logger Utility
// ============================================
// Structured logging for API routes and server-side code.
// - JSON output in production for log aggregation
// - Colored output in development for readability
// - Child loggers for service-specific context
// - Error serialization with stack traces

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service?: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_COLORS = {
  debug: '\x1b[90m', // gray
  info: '\x1b[36m',  // cyan
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
};

const RESET = '\x1b[0m';

const isProduction = process.env.NODE_ENV === 'production';

function formatLog(entry: LogEntry): string {
  // In production, output JSON for log aggregation services
  if (isProduction) {
    return JSON.stringify(entry);
  }

  // In development, output colored human-readable format
  const { timestamp, level, message, service, context, error } = entry;
  const color = LOG_COLORS[level];
  const prefix = `${color}[${level.toUpperCase()}]${RESET}`;
  const time = `\x1b[90m${timestamp}${RESET}`;
  const svc = service ? `\x1b[35m[${service}]${RESET} ` : '';

  let log = `${time} ${prefix} ${svc}${message}`;

  if (context && Object.keys(context).length > 0) {
    log += ` ${JSON.stringify(context)}`;
  }

  if (error) {
    log += `\n  ${color}Error: ${error.message}${RESET}`;
    if (error.stack) {
      log += `\n${error.stack}`;
    }
  }

  return log;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  service?: string,
  error?: Error
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    service,
    context: context && Object.keys(context).length > 0 ? context : undefined,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined,
  };
}

function shouldLog(level: LogLevel): boolean {
  const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  return levels.indexOf(level) >= levels.indexOf(logLevel as LogLevel);
}

function outputLog(entry: LogEntry): void {
  const formatted = formatLog(entry);
  switch (entry.level) {
    case 'debug':
    case 'info':
      console.log(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

// ============================================
// Logger Class for Child Loggers
// ============================================

class Logger {
  private service?: string;
  private baseContext: LogContext;

  constructor(service?: string, baseContext: LogContext = {}) {
    this.service = service;
    this.baseContext = baseContext;
  }

  child(context: LogContext): Logger {
    return new Logger(this.service, { ...this.baseContext, ...context });
  }

  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      const entry = createLogEntry('debug', message, { ...this.baseContext, ...context }, this.service);
      outputLog(entry);
    }
  }

  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      const entry = createLogEntry('info', message, { ...this.baseContext, ...context }, this.service);
      outputLog(entry);
    }
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    if (shouldLog('warn')) {
      const entry = createLogEntry('warn', message, { ...this.baseContext, ...context }, this.service, error);
      outputLog(entry);
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (shouldLog('error')) {
      const err = error instanceof Error ? error : undefined;
      const entry = createLogEntry('error', message, { ...this.baseContext, ...context }, this.service, err);
      outputLog(entry);
    }
  }

  // Log API request/response
  api(method: string, path: string, status: number, duration: number, context?: LogContext): void {
    const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    const message = `${method} ${path} ${status} ${duration}ms`;
    if (shouldLog(level)) {
      const entry = createLogEntry(level, message, { ...this.baseContext, ...context }, this.service);
      outputLog(entry);
    }
  }

  // Log with timing
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = Math.round(performance.now() - start);
      this.debug(`${label} completed`, { durationMs: duration });
    };
  }
}

// ============================================
// Default Logger & Service Loggers
// ============================================

export const logger = new Logger();

// Service-specific loggers for better filtering
export const paymentLogger = new Logger('payment');
export const authLogger = new Logger('auth');
export const tournamentLogger = new Logger('tournament');
export const queueLogger = new Logger('queue');
export const gameLogger = new Logger('game');

// ============================================
// Request Logger Helper
// ============================================
// Use in API routes for consistent logging

export interface RequestLogContext {
  userId?: string;
  method: string;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
}

export function logRequest(ctx: RequestLogContext): void {
  logger.info('API Request', {
    method: ctx.method,
    path: ctx.path,
    userId: ctx.userId || 'anonymous',
    query: ctx.query,
  });
}

export function logResponse(ctx: RequestLogContext, status: number, duration: number): void {
  logger.api(ctx.method, ctx.path, status, duration, { userId: ctx.userId });
}

export function logError(error: Error, ctx?: RequestLogContext): void {
  logger.error(error.message, {
    name: error.name,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: ctx?.path,
    method: ctx?.method,
  });
}

export default logger;
