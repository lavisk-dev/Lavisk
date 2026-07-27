export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  engine?: string;
  event?: string;
  entity?: string;
  entityId?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, meta?: Partial<LogEntry>): void;
  info(message: string, meta?: Partial<LogEntry>): void;
  warn(message: string, meta?: Partial<LogEntry>): void;
  error(message: string, meta?: Partial<LogEntry>): void;
  child(meta: Partial<LogEntry>): Logger;
}

function formatLog(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level}]`,
    entry.correlationId ? `[cid:${entry.correlationId}]` : "",
    entry.engine ? `[${entry.engine}]` : "",
    entry.message,
  ];
  return parts.filter(Boolean).join(" ");
}

export function createLogger(defaultMeta?: Partial<LogEntry>): Logger {
  const log = (level: LogLevel, message: string, meta?: Partial<LogEntry>) => {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...defaultMeta,
      ...meta,
    };

    switch (level) {
      case "ERROR":
        console.error(formatLog(entry), entry.error ?? "", entry.metadata ?? "");
        break;
      case "WARN":
        console.warn(formatLog(entry), entry.metadata ?? "");
        break;
      case "DEBUG":
        console.debug(formatLog(entry));
        break;
      default:
        console.log(formatLog(entry));
    }
  };

  return {
    debug: (msg, meta) => log("DEBUG", msg, meta),
    info: (msg, meta) => log("INFO", msg, meta),
    warn: (msg, meta) => log("WARN", msg, meta),
    error: (msg, meta) => log("ERROR", msg, meta),
    child: (meta) => createLogger({ ...defaultMeta, ...meta }),
  };
}

export const logger = createLogger();
export { tracer, createTracer, type Tracer, type TraceSpan } from "./tracer";