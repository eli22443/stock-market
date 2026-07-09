# Performance & Load Testing

Measured metrics from the production FastAPI backend on AWS EC2 (`t3.micro`, `eu-north-1`).

## Light load (production dashboard)

Captured from the live API dashboard (`GET /metrics`) on 2026-07-06 with normal traffic (1 client, 5 symbol subscriptions, 44h+ uptime).

| Metric | Avg | Last |
|--------|-----|------|
| REST API | ~20 ms | ~1.9 ms |
| WebSocket command handling | ~0.2 ms | ~0.3 ms |
| Finnhub fan-out | ~0.2 ms | ~0.1 ms |
| AI Chat (Gemini) | ~1.5 s | ~1.8 s |

![API metrics dashboard](images/api-metrics.png)

Also visible on the dashboard: message counters (WS sent/received, Finnhub messages, HTTP requests), CPU/memory usage, and recent activity log.

**View live:** [api.stock-market-seven-delta.app](https://api.stock-market-seven-delta.app) → Backend Monitoring panel.

## k6 load test (`/health`)

Script: [`docs/load-tests/health-test.js`](load-tests/health-test.js)

### Configuration

- **Target:** `https://api.stock-market-seven-delta.app/health`
- **Stages:** ramp 50 VUs (1m) → 100 VUs (2m) → hold 100 VUs (2m)
- **Think time:** 200 ms per iteration

### Results (2026-07-06)

| Metric | Value |
|--------|-------|
| Virtual users (max) | 100 |
| Duration | 5 minutes |
| Total requests | 79,099 |
| Throughput | ~263 req/s |
| Success rate | 100% |
| Avg latency | ~83 ms |
| p95 latency | ~85 ms |
| Max latency | ~431 ms |

### Reproduce

Install [k6](https://grafana.com/docs/k6/latest/get-started/installation/), then:

```bash
k6 run docs/load-tests/health-test.js
```

To test a local backend, change the URL in the script to `http://localhost:8000/health`.

## Notes

- **Light load vs load test:** Dashboard ~20 ms reflects few clients; k6 ~85 ms p95 reflects 100 concurrent virtual users at ~263 req/s.
- **Endpoint tested:** `/health` only — lightweight JSON response. WebSocket and AI chat have different latency profiles.
- **Instance:** Single `t3.micro` EC2 with Nginx reverse proxy and Uvicorn (1 worker).
