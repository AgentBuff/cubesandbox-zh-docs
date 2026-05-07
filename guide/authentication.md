# Authentication

By default, Cube API Server allows all requests without any authentication. To enable authentication, start the server with an auth callback URL. When configured, every incoming request is validated by forwarding the credential header to your callback service — Cube API Server acts purely as a passthrough proxy for the auth decision.

## Enabling Authentication

Pass `--auth-callback-url` at startup, or set the equivalent environment variable:

```bash
# CLI flag
./cube-api --auth-callback-url https://your-auth-service/verify

# Or via environment variable
export AUTH_CALLBACK_URL=https://your-auth-service/verify
./cube-api
```

When `AUTH_CALLBACK_URL` is not set (the default), all requests are allowed without any credential check.

## How It Works

When a request arrives, Cube API Server:

1. Extracts the credential from the request header (`Authorization: Bearer` takes priority over `X-API-Key`).
2. Forwards a `POST` request to the callback URL with the credential header and the original request path.
3. If the callback returns **HTTP 200**, the request is allowed through.
4. Any other status code causes the request to be rejected with **HTTP 401 Unauthorized**.

```
Client ──→ Cube API Server
                │
                ├─ extract credential (Bearer / API Key)
                │
                └─ POST → your auth service
                                │
                       200 ─────┤──→ allow request
                    non-200 ────┘──→ 401 Unauthorized
```

## Sending Credentials from the SDK

The E2B SDK passes the value of `E2B_API_KEY` as `Authorization: Bearer <key>` on every request.

```bash
export E2B_API_KEY=your-actual-api-key
```

You can also send `X-API-Key` directly if your integration does not use the E2B SDK:

```
X-API-Key: your-actual-api-key
```

Both formats are accepted. `Authorization: Bearer` takes priority if both are present.

## Callback Request Format

Cube API Server sends a `POST` to your callback URL with the following headers:

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` — present when the client used Bearer auth |
| `X-API-Key` | `<key>` — present when the client used API Key auth |
| `X-Request-Path` | The original request path (e.g. `/v1/sandboxes`) |

The two credential headers are mutually exclusive. Your callback receives whichever one the client sent.

### Example callback (Python/FastAPI)

```python
from fastapi import FastAPI, Request

app = FastAPI()

VALID_KEYS = {"secret-key-1", "secret-key-2"}

@app.post("/verify")
async def verify(request: Request):
    # Bearer token
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.removeprefix("Bearer ").strip()
        if token in VALID_KEYS:
            return {}           # 200 → allow
        return Response(status_code=403)

    # API Key
    key = request.headers.get("X-API-Key", "")
    if key in VALID_KEYS:
        return {}               # 200 → allow

    return Response(status_code=401)
```

## Error Responses

| Scenario | HTTP Status |
|----------|-------------|
| No credential provided | `401 Unauthorized` |
| Callback returned non-200 | `401 Unauthorized` |
| Callback unreachable | `500 Internal Server Error` |
