import { logger, type Logger } from "./index";

export interface TraceSpan {
  name: string;
  engine?: string;
  event?: string;
  entity?: string;
  entityId?: string;
  correlationId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface Tracer {
  startSpan(name: string, context?: Partial<TraceSpan>): TraceSpan;
  endSpan(span: TraceSpan, error?: unknown): void;
  withSpan<T>(name: string, fn: () => Promise<T>, context?: Partial<TraceSpan>): Promise<T>;
}

const now = () => Date.now();

export function createTracer(log: Logger = logger): Tracer {
  return {
    startSpan(name: string, context?: Partial<TraceSpan>): TraceSpan {
      return {
        name,
        engine: context?.engine,
        event: context?.event,
        entity: context?.entity,
        entityId: context?.entityId,
        correlationId: context?.correlationId,
        startTime: now(),
        metadata: context?.metadata,
      };
    },

    endSpan(span: TraceSpan, error?: unknown): void {
      span.endTime = now();
      span.duration = span.endTime - span.startTime;
      span.error = error instanceof Error ? error.message : error ? String(error) : undefined;

      log.info(`${span.name} completed in ${span.duration}ms`, {
        engine: span.engine,
        event: span.event,
        entity: span.entity,
        entityId: span.entityId,
        correlationId: span.correlationId,
        duration: span.duration,
        error: span.error,
      });
    },

    async withSpan<T>(name: string, fn: () => Promise<T>, context?: Partial<TraceSpan>): Promise<T> {
      const span = this.startSpan(name, context);
      try {
        const result = await fn();
        this.endSpan(span);
        return result;
      } catch (err) {
        this.endSpan(span, err);
        throw err;
      }
    },
  };
}

export const tracer = createTracer();