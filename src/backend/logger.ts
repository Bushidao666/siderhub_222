/*
 * Temporary logger wrapper. Replace with structured logger (e.g. Pino) later.
 */

export interface Logger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

const consoleLogger: Logger = {
  debug: (message, context) => console.debug(`[debug] ${message}`, context ?? {}),
  info: (message, context) => console.info(`[info] ${message}`, context ?? {}),
  warn: (message, context) => console.warn(`[warn] ${message}`, context ?? {}),
  error: (message, context) => console.error(`[error] ${message}`, context ?? {}),
};

export function createLogger(namespace: string): Logger {
  return {
    debug: (message, context) => consoleLogger.debug(`${namespace}: ${message}`, context),
    info: (message, context) => consoleLogger.info(`${namespace}: ${message}`, context),
    warn: (message, context) => consoleLogger.warn(`${namespace}: ${message}`, context),
    error: (message, context) => consoleLogger.error(`${namespace}: ${message}`, context),
  };
}

export const logger = createLogger('backend');
