# 控制面配置文件路径与说明

本章覆盖 one-click 控制节点上真正需要维护的控制面配置：

- 全局环境：`.one-click.env`
- `CubeMaster/conf.yaml`
- `CubeAPI` 的 env / flag 配置
- support（MySQL/Redis）compose
- `CubeProxy` / `CoreDNS` / `WebUI` 的生成配置

## 1. one-click 全局环境文件

### 1.1 源文件与安装后路径

| 阶段 | 路径 | 作用 |
|---|---|---|
| 仓库模板 | `deploy/one-click/env.example` | 打包前/安装前填写 |
| 安装后生效文件 | `/usr/local/services/cubetoolbox/.one-click.env` | one-click 运行脚本统一读取 |

`install.sh` 会把安装前 `.env` 复制并规范化为 `.one-click.env`，再由 `scripts/one-click/common.sh` 统一加载。

### 1.2 关键变量分组

#### 部署角色与安装路径

| 变量 | 默认值 | 说明 |
|---|---|---|
| `ONE_CLICK_INSTALL_PREFIX` | `/usr/local/services/cubetoolbox` | 安装根目录 |
| `ONE_CLICK_DEPLOY_ROLE` | `control` | `control` 或 `compute` |
| `ONE_CLICK_RUN_QUICKCHECK` | `1` | 安装完成后是否跑 quickcheck |

#### 依赖容器与凭据

| 变量 | 默认值 | 说明 |
|---|---|---|
| `CUBE_SANDBOX_MYSQL_PORT` | `3306` | MySQL 端口 |
| `CUBE_SANDBOX_REDIS_PORT` | `6379` | Redis 端口 |
| `CUBE_SANDBOX_REDIS_PASSWORD` | `ceuhvu123` | Redis 密码 |
| `CUBE_SANDBOX_MYSQL_DB` | `cube_mvp` | 数据库名 |
| `CUBE_SANDBOX_MYSQL_USER` | `cube` | 业务用户名 |
| `CUBE_SANDBOX_MYSQL_PASSWORD` | `cube_pass` | 业务密码 |

#### 代理 / DNS / WebUI

| 变量 | 默认值 | 说明 |
|---|---|---|
| `CUBE_PROXY_ENABLE` | `1` | one-click 中必须开启 |
| `CUBE_PROXY_DNS_ENABLE` | `1` | one-click 中必须开启 |
| `CUBE_PROXY_HOST_PORT` | `443` | HTTPS 对外端口 |
| `CUBE_PROXY_CERT_DIR` | `${ONE_CLICK_INSTALL_PREFIX}/cubeproxy/certs` | 证书目录 |
| `CUBE_PROXY_DNS_ANSWER_IP` | `${CUBE_SANDBOX_NODE_IP}` | `cube.app` 解析回包 IP |
| `WEB_UI_ENABLE` | `1` | 是否启用 Dashboard |
| `WEB_UI_HOST_PORT` | `12088` | Dashboard 宿主机端口 |
| `WEB_UI_UPSTREAM` | `http://host.docker.internal:3000` | WebUI nginx 反代到 CubeAPI |

#### CubeAPI / Cubemaster

| 变量 | 默认值 | 说明 |
|---|---|---|
| `CUBEMASTER_ADDR` | `127.0.0.1:8089` | quickcheck / 内部脚本访问地址 |
| `CUBE_API_BIND` | `0.0.0.0:3000` | CubeAPI 监听地址 |
| `CUBE_API_HEALTH_ADDR` | `127.0.0.1:3000` | 本机健康检查地址 |
| `CUBE_API_SANDBOX_DOMAIN` | `cube.app` | API 返回的 sandbox 域名 |
| `AUTH_CALLBACK_URL` | 空 | 可选鉴权回调 |

## 2. CubeMaster 配置

### 2.1 路径

| 阶段 | 路径 |
|---|---|
| 仓库内模板 | `configs/single-node/cubemaster.yaml` |
| 安装后生效 | `/usr/local/services/cubetoolbox/CubeMaster/conf.yaml` |
| 进程读取方式 | 通过环境变量 `CUBE_MASTER_CONFIG_PATH` 指向该文件 |

`up.sh` 会显式导出：

```bash
export CUBE_MASTER_CONFIG_PATH="/usr/local/services/cubetoolbox/CubeMaster/conf.yaml"
```

### 2.2 主要配置段说明

#### `common`

控制 Cubemaster 自身的 HTTP 监听与调度周期：

- `http_port`: 控制面端口，默认 `8089`
- `sync_meta_data_interval`: 同步元数据周期
- `sync_metric_data_interval`: 同步指标周期
- `collect_metric_interval`: 指标采集周期

#### `log`

- `path`: 日志目录，默认 `/data/log/CubeMaster`
- `level`: 日志级别
- `file_size` / `file_num`: 单文件大小与轮转数量

#### `cubelet_conf`

这是 Cubemaster 视角下的节点调用参数：

- `grpc.grpc_port`: 默认访问各节点 `9999`
- `create_concurrent_limit` / `destroy_concurent_limit`: 并发控制
- `enable_exposed_port`: 是否允许暴露端口
- `exposed_port_list`: 默认暴露端口白名单

#### `auth`

- `enable`: 当前样例为 `false`
- 如果后续接鉴权，这里是 Cubemaster 自身的开关入口之一

#### `req_template_conf`

定义模板请求默认值和允许透传的字段：

- `whitelist_req_tag`: 请求白名单
- `cube_box_req_template`: 默认模板请求 JSON

运维上要重点看这里，因为很多“新建 sandbox 默认行为”都来自这里，而不是前端。

#### `ossdb_config` / `instance_db_config`

MySQL 连接配置：

- `addr`, `user`, `pwd`, `db_name`
- `max_idle_conns`, `max_open_conns`
- `max_conn_life_time_seconds`

#### `redis` / `redis_read` / `redis_write`

Redis 连接配置：

- `nodes`
- `password`
- `db_no`
- `max_idle`, `max_active`, `idle_timeout`

#### `scheduler`

控制调度策略：

- `priority_select_num`
- `metric_update_timeout`
- `filter.enable_filters`

## 3. CubeAPI 配置

### 3.1 配置来源

CubeAPI **没有单独的 yaml/toml 配置文件**，配置来源按优先级为：

1. CLI flag
2. 环境变量
3. 内建默认值

在 one-click 场景里，环境变量主要来自 `/usr/local/services/cubetoolbox/.one-click.env`。

### 3.2 主要环境变量/默认值

源码在 `CubeAPI/src/config/mod.rs`。

| 配置项 | 默认值 | 来源 |
|---|---|---|
| `CUBE_API_BIND` | `0.0.0.0:3000` | HTTP 监听地址 |
| `CUBE_MASTER_ADDR` | `http://127.0.0.1:8089` | Cubemaster 基地址 |
| `CUBE_API_SANDBOX_DOMAIN` | `cube.app` | 返回给客户端的域名 |
| `LOG_DIR` | `<binary_dir>/log` | 文件日志目录 |
| `LOG_PREFIX` | `cube-api` | 日志前缀 |
| `AUTH_CALLBACK_URL` | 空 | 外部鉴权回调 |
| `RATE_LIMIT_PER_SEC` | `100` | 每 API Key 限速 |
| `INSTANCE_TYPE` | `cubebox` | 默认实例类型 |
| `WORKER_THREADS` | `16` | Tokio 线程数 |
| `LOG_LEVEL` | `info` | 日志等级 |

### 3.3 one-click 启动时的实际覆盖

`up.sh` 启动 `cube-api` 时会注入：

```bash
LOG_DIR=/data/log/CubeAPI
CUBE_API_BIND=0.0.0.0:3000
CUBE_API_SANDBOX_DOMAIN=cube.app
```

如果设置了：

- `CUBE_MASTER_ADDR`
- `AUTH_CALLBACK_URL`

也会一并注入。

## 4. support：MySQL / Redis 配置

### 4.1 路径

| 阶段 | 路径 |
|---|---|
| 仓库模板 | `deploy/one-click/support/docker-compose.yaml.template` |
| 安装后生成 | `/usr/local/services/cubetoolbox/support/docker-compose.yaml` |

### 4.2 配置说明

该 compose 模板负责启动：

- `mysql:8.0`
- `redis:7-alpine`

关键渲染项：

| 配置 | 说明 |
|---|---|
| `__MYSQL_CONTAINER__` | MySQL 容器名 |
| `__MYSQL_DB__` / `__MYSQL_USER__` / `__MYSQL_PASSWORD__` | 业务库与用户 |
| `__MYSQL_VOLUME__` | MySQL 数据卷 |
| `__SQL_DIR__` | 初始化 SQL 目录 |
| `__REDIS_CONTAINER__` | Redis 容器名 |
| `__REDIS_PASSWORD__` | Redis 密码 |
| `__REDIS_VOLUME__` | Redis 数据卷 |

运维上要关注：

- 数据是否在 volume 中持久化
- 端口是否与宿主已有服务冲突
- SQL 初始化脚本是否已按版本升级

## 5. CubeProxy 配置

### 5.1 路径

| 阶段 | 路径 |
|---|---|
| 模板 | `deploy/one-click/cubeproxy/global.conf.template` |
| 安装后生成 | `/usr/local/services/cubetoolbox/cubeproxy/global.conf` |
| compose 模板 | `deploy/one-click/cubeproxy/docker-compose.yaml.template` |
| 安装后 compose | `/usr/local/services/cubetoolbox/cubeproxy/docker-compose.yaml` |

### 5.2 `global.conf` 关键项

模板中实际被渲染的值只有几类：

| 变量 | 作用 |
|---|---|
| `redis_ip` / `redis_port` / `redis_pd` | CubeProxy Lua/OpenResty 访问 Redis |
| `cube_proxy_host_ip` | 当前节点宿主机 IP |
| `timeout_min` / `timeout_max` | 代理超时窗口 |

### 5.3 compose 关键项

生成后的 compose 会：

- 暴露宿主机 `443 -> 容器 8080`
- 暴露宿主机 `80 -> 容器 8081`
- 把证书目录只读挂载到 `/usr/local/openresty/nginx/certs`
- 把生成后的 `global.conf` 挂载到 `/usr/local/openresty/nginx/conf/global/global.conf`
- 使用 `Dockerfile.oneclick` 本地构建镜像

## 6. CoreDNS 配置

### 6.1 路径

| 阶段 | 路径 |
|---|---|
| 模板 | `deploy/one-click/coredns/Corefile.template` |
| 安装后生成 | `/usr/local/services/cubetoolbox/coredns/Corefile` |
| 生成的上游解析 | `/usr/local/services/cubetoolbox/coredns/resolv.conf.upstream` |
| compose | `/usr/local/services/cubetoolbox/coredns/docker-compose.yaml` |

### 6.2 Corefile 行为

CoreDNS 的作用非常明确：

- 对 `cube.app` 返回固定 A 记录
- 对 `*.cube.app` 返回固定 A 记录
- 非命中域名继续使用 `/etc/resolv.conf` 转发

模板逻辑：

- `__CUBE_PROXY_DNS_ANSWER_IP__`：返回给 `cube.app` 的 IP
- `__COREDNS_BIND_ADDR__`：CoreDNS 实际绑定地址

### 6.3 DNS 接管状态文件

`up-dns.sh` / `down-dns.sh` 还会维护：

- `/usr/local/services/cubetoolbox/coredns/host-dns-mode`
- `/usr/local/services/cubetoolbox/coredns/host-dns-interface`

它们用于记录：

- 当前是 `systemd-resolved` 模式还是 `NetworkManager + dnsmasq` 回退模式
- 使用了哪个 link/interface 做 `cube.app` 域名接管

## 7. WebUI 配置

### 7.1 路径

| 阶段 | 路径 |
|---|---|
| nginx 模板 | `deploy/one-click/webui/nginx.conf` |
| 安装后生成 nginx | `/usr/local/services/cubetoolbox/webui/nginx.generated.conf` |
| compose 模板 | `deploy/one-click/webui/docker-compose.yaml.template` |
| 安装后 compose | `/usr/local/services/cubetoolbox/webui/docker-compose.yaml` |
| 静态资源目录 | `/usr/local/services/cubetoolbox/webui/dist` |

### 7.2 nginx 配置说明

这个 nginx 只做两件事：

1. 提供前端静态资源
2. 把 `/cubeapi/` 反代到宿主机 CubeAPI

关键 location：

| 路径 | 作用 |
|---|---|
| `/cubeapi/` | 反代到 `__WEB_UI_UPSTREAM__/cubeapi/` |
| `/assets/` | 静态资源缓存一年 |
| `/` | SPA fallback 到 `index.html` |

### 7.3 compose 说明

生成后的 compose 会：

- 暴露 `WEB_UI_HOST_PORT:80`
- 通过 `extra_hosts` 把 `host.docker.internal` 映射到 `host-gateway`
- 只读挂载 `dist` 和 `nginx.generated.conf`
- 用 `wget http://127.0.0.1/` 做健康检查

## 8. 控制面改配置时的建议顺序

如果要调整控制面行为，建议按下面顺序排查：

1. 先看 `.one-click.env` 是否覆盖了默认值
2. 再看 `CubeMaster/conf.yaml` 中调度与存储配置
3. 再看 `CubeAPI` 的 env / flag 是否被脚本覆盖
4. 如果是入口域名/证书/页面问题，再看 `cubeproxy` / `coredns` / `webui`
5. 改完后运行：

```bash
sudo ./smoke.sh
```

或直接执行安装后的：

```bash
/usr/local/services/cubetoolbox/scripts/one-click/quickcheck.sh
```