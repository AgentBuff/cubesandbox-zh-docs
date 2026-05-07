# 鉴权配置

Cube API Server 默认不启用鉴权，所有请求直接放通。如需鉴权，启动时指定一个回调地址即可。启用后，每个入站请求的凭证 header 都会被转发到你的回调服务——Cube API Server 仅负责转发，鉴权决策由回调方完成。

## 启用鉴权

通过 `--auth-callback-url` 启动参数或对应的环境变量指定回调地址：

```bash
# 启动参数
./cube-api --auth-callback-url https://your-auth-service/verify

# 或环境变量
export AUTH_CALLBACK_URL=https://your-auth-service/verify
./cube-api
```

未设置 `AUTH_CALLBACK_URL` 时（默认），所有请求无需凭证即可通过。

## 工作原理

请求到达时，Cube API Server 按以下流程处理：

1. 从请求 header 中提取凭证（`Authorization: Bearer` 优先于 `X-API-Key`）。
2. 向回调地址发送 `POST` 请求，透传凭证 header 和原始请求路径。
3. 回调返回 **HTTP 200** → 放行请求。
4. 其他状态码 → 返回客户端 **HTTP 401 Unauthorized**。

```
客户端 ──→ Cube API Server
                │
                ├─ 提取凭证（Bearer / API Key）
                │
                └─ POST → 你的鉴权服务
                                │
                       200 ─────┤──→ 放行请求
                    非 200 ─────┘──→ 401 Unauthorized
```

## SDK 侧配置

E2B SDK 会将 `E2B_API_KEY` 的值以 `Authorization: Bearer <key>` 的形式附加到每个请求中：

```bash
export E2B_API_KEY=your-actual-api-key
```

如果不使用 E2B SDK，也可以直接发送 `X-API-Key`：

```
X-API-Key: your-actual-api-key
```

两种格式均支持。两者同时存在时，`Authorization: Bearer` 优先。

## 回调请求格式

Cube API Server 向回调地址发送的 `POST` 请求包含以下 header：

| Header | 值 |
|--------|----|
| `Authorization` | `Bearer <token>` — 客户端使用 Bearer 鉴权时透传 |
| `X-API-Key` | `<key>` — 客户端使用 API Key 鉴权时透传 |
| `X-Request-Path` | 原始请求路径，如 `/v1/sandboxes` |

两个凭证 header 互斥，回调方收到哪个取决于客户端发送的是哪种格式。

### 回调示例（Python/FastAPI）

```python
from fastapi import FastAPI, Request
from fastapi.responses import Response

app = FastAPI()

VALID_KEYS = {"secret-key-1", "secret-key-2"}

@app.post("/verify")
async def verify(request: Request):
    # Bearer token
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.removeprefix("Bearer ").strip()
        if token in VALID_KEYS:
            return {}               # 200 → 放行
        return Response(status_code=403)

    # API Key
    key = request.headers.get("X-API-Key", "")
    if key in VALID_KEYS:
        return {}                   # 200 → 放行

    return Response(status_code=401)
```

## 错误响应

| 场景 | HTTP 状态码 |
|------|------------|
| 请求未携带凭证 | `401 Unauthorized` |
| 回调返回非 200 | `401 Unauthorized` |
| 回调地址不可达 | `500 Internal Server Error` |
