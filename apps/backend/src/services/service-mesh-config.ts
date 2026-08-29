export interface GatewayRoute { path: string; target: string; methods: string[]; authRequired: boolean; } 

export const gatewayRoutes: GatewayRoute[] = [
  { path: '/api/v1/auth/**', target: 'auth-user-service', methods: ['GET', 'POST'], authRequired: true },
  { path: '/api/v1/classes/**', target: 'classroom-roster-service', methods: ['GET', 'POST', 'PATCH'], authRequired: true },
  { path: '/api/v1/schedule/**', target: 'schedule-sync-service', methods: ['GET'], authRequired: true },
  { path: '/api/v1/ai/**', target: 'ai-ocr-execution-service', methods: ['POST'], authRequired: true },
  { path: '/api/v1/notifications/**', target: 'notification-messaging-service', methods: ['POST'], authRequired: true },
  { path: '/api/v1/billing/**', target: 'billing-marketplace-service', methods: ['GET', 'POST'], authRequired: true },
];

export function buildGatewayConfig(): Record<string, unknown> {
  return {
    plugins: ['rate-limiting', 'jwt', 'request-termination', 'prometheus'],
    circuitBreakers: {
      default: { errorThreshold: 50, minRequestCount: 20, timeoutMs: 3000 },
    },
    tracing: {
      serviceName: 'classsync-gateway',
      propagation: ['traceparent', 'baggage'],
    },
    tls: {
      mode: 'mTLS',
      upstreams: ['auth-user-service', 'classroom-roster-service', 'schedule-sync-service'],
    },
  };
}
