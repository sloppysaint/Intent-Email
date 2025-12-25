/**
 * Production-ready logger utility
 * Only logs in development mode to avoid cluttering production logs
 */

const isDevelopment = process.env.NODE_ENV === 'development';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface Logger {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

/**
 * Logger that respects NODE_ENV
 * - In development: logs everything
 * - In production: only logs errors (console.error is kept for production error tracking)
 */
export const logger: Logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production (but without emojis/debug info)
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, log clean error messages without debug formatting
      const cleanArgs = args.map(arg => {
        if (typeof arg === 'string') {
          // Remove emojis and formatting for production logs
          return arg.replace(/[❌✅⚠️📤📥🔄🔍📖]/g, '').trim();
        }
        return arg;
      });
      console.error(...cleanArgs);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

// For client-side logging (browser console)
export const clientLogger: Logger = {
  log: (...args: any[]) => {
    if (isDevelopment || process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true') {
      console.log(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment || process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true') {
      console.info(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment || process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true') {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors in browser for debugging
    console.error(...args);
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment || process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true') {
      console.debug(...args);
    }
  },
};

