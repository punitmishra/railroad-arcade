// ============================================
// Logger Utility
// ============================================
// Structured logging for API routes and server-side code.
// Supports different log levels and can be extended to
// send logs to external services in production.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

const LOG_COLORS = {
  debug: '\x1b[90m', // gray
  info: '\x1b[36m',  // cyan
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
};

const RESET = '\x1b[0m';

function formatLog(entry: LogEntry): string {
  const { timestamp, level, message, context } = entry;
  const color = LOG_COLORS[level];
  const prefix = `${color}[${level.toUpperCase()}]${RESET}`;
  const time = `\x1b[90m${timestamp}${RESET}`;

  let log = `${time} ${prefix} ${message}`;

  if (context && Object.keys(context).length > 0) {
    log += ` ${JSON.stringify(context)}`;
  }

  return log;
}

function createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };
}

function shouldLog(level: LogLevel): boolean {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  return levels.indexOf(level) >= levels.indexOf(logLevel as LogLevel);
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      const entry = createLogEntry('debug', message, context);
      console.log(formatLog(entry));
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      const entry = createLogEntry('info', message, context);
      console.log(formatLog(entry));
    }
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) {
      const entry = createLogEntry('warn', message, context);
      console.warn(formatLog(entry));
    }
  },

  error(message: string, context?: LogContext): void {
    if (shouldLog('error')) {
      const entry = createLogEntry('error', message, context);
      console.error(formatLog(entry));
    }
  },

  // Log API request/response
  api(method: string, path: string, status: number, duration: number, context?: LogContext): void {
    const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    const message = `${method} ${path} ${status} ${duration}ms`;
    this[level](message, context);
  },

  // Log with timing
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = Math.round(performance.now() - start);
      this.debug(`${label} completed`, { duration: `${duration}ms` });
    };
  },
};

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
