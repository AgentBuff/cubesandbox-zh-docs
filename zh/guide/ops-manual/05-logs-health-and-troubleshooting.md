# 日志、健康检查与排障

本章把运维最常用的验证动作收口到一起：

- 看日志去哪里
- 巡检脚本到底检查什么
- 出现“起不来 / 能创建不能访问 / DNS 不通 / guest 进不去”时先看哪里

## 1. 日志路径

### 1.1 控制节点

| 组件 | 默认日志路径 |
|---|---|
| CubeAPI | `/data/log/CubeAPI` |
| CubeMaster | `/data/log/CubeMaster` |
| Cubelet | `/data/log/Cubelet` |
| CubeShim | `/data/log/CubeShim` |
| CubeVmm | `/data/log/CubeVmm` |
| cube-proxy | `/data/log/cube-proxy` |

### 1.2 计算节点

计算节点通常重点看：

| 组件 | 默认日志路径 |
|---|---|
| Cubelet | `/data/log/Cubelet` |
| CubeShim | `/data/log/CubeShim` |
| CubeVmm | `/data/log/CubeVmm` |

### 1.3 CubeAPI 日志文件规则

CubeAPI 代码里使用滚动文件日志：

- 目录：`LOG_DIR`（one-click 默认 `/data/log/CubeAPI`）
- 前缀：`LOG_PREFIX`（默认 `cube-api`）
- 文件名形如：`cube-api-YYYY-MM-DD.log`

## 2. 烟雾巡检入口

### 2.1 最外层入口

```bash
sudo ./smoke.sh
```

它本质上会调用安装后的：

```bash
/usr/local/services/cubetoolbox/scripts/one-click/quickcheck.sh
```

### 2.2 `quickcheck.sh` 实际检查项

#### control 角色

1. `network-agent /healthz`
2. `network-agent /readyz`
3. `cubemaster /notify/health`
4. `cube-api /health`
5. 以下关键文件/套接字是否存在：
   - `/data/cubelet/cubelet.sock`
   - `/tmp/cube/network-agent-grpc.sock`
   - `CubeAPI/bin/cube-api`
   - `CubeMaster/conf.yaml`
   - `Cubelet/config/config.toml`
   - `Cubelet/dynamicconf/conf.yaml`
   - `cube-shim/conf/config-cube.toml`

#### compute 角色

1. `network-agent /healthz`
2. `network-agent /readyz`
3. `cubemaster /notify/health`
4. 节点是否已注册到 `/internal/meta/nodes/<node-ip>`
5. 以下关键文件/套接字是否存在：
   - `/data/cubelet/cubelet.sock`
   - `/tmp/cube/network-agent-grpc.sock`
   - `Cubelet/config/config.toml`
   - `Cubelet/dynamicconf/conf.yaml`
   - `cube-shim/conf/config-cube.toml`
   - `cube-kernel-scf/vmlinux`
   - `cube-image/cube-guest-image-cpu.img`

## 3. 常用人工检查命令

### 3.1 看组件是否已监听

```bash
ss -lntp | rg '3000|8089|9999|12088|443|80'
```

### 3.2 看关键 socket / 配置是否存在

```bash
test -S /data/cubelet/cubelet.sock
test -S /tmp/cube/network-agent-grpc.sock
test -f /usr/local/services/cubetoolbox/CubeMaster/conf.yaml
test -f /usr/local/services/cubetoolbox/Cubelet/config/config.toml
test -f /usr/local/services/cubetoolbox/Cubelet/dynamicconf/conf.yaml
test -f /usr/local/services/cubetoolbox/cube-shim/conf/config-cube.toml
```

### 3.3 直接打健康检查

```bash
curl -fsS http://127.0.0.1:19090/healthz
curl -fsS http://127.0.0.1:19090/readyz
curl -fsS http://127.0.0.1:8089/notify/health
curl -fsS http://127.0.0.1:3000/health
curl -fsS http://127.0.0.1:12088/cubeapi/v1/health
```

## 4. 典型问题与排查路径

### 4.1 `install.sh` 成功了，但 `smoke.sh` 失败

优先检查：

1. `.one-click.env` 是否存在并含当前角色/IP
2. support compose 是否成功启动
3. `network-agent` 和 `cubelet` socket 是否存在
4. `CubeMaster/conf.yaml` 与 `Cubelet/config/config.toml` 是否被错误覆盖

建议顺序：

```bash
cat /usr/local/services/cubetoolbox/.one-click.env
/usr/local/services/cubetoolbox/scripts/one-click/quickcheck.sh
```

### 4.2 `cube-api` 正常，但 Dashboard 打不开

优先检查：

1. `WEB_UI_HOST_PORT` 是否监听
2. `webui/nginx.generated.conf` 是否生成
3. `webui/dist/index.html` 是否存在
4. `/cubeapi/v1/health` 是否能被 WebUI nginx 反代

建议命令：

```bash
curl -I http://127.0.0.1:12088/
curl -fsS http://127.0.0.1:12088/cubeapi/v1/health
```

### 4.3 `cube.app` 域名不通 / 解析不对

优先检查：

1. `coredns/Corefile` 是否渲染出当前节点 IP
2. `host-dns-mode` 记录了哪种接管模式
3. `host-dns-interface` 是否对应仍然存在的 link
4. CoreDNS 容器是否还在运行

建议命令：

```bash
cat /usr/local/services/cubetoolbox/coredns/Corefile
cat /usr/local/services/cubetoolbox/coredns/host-dns-mode
cat /usr/local/services/cubetoolbox/coredns/host-dns-interface
```

### 4.4 sandbox 能创建，但无法进入 guest

优先检查 `cube-runtime login` 这条链：

```bash
cubecli container list --all --sandbox
cube-runtime login <sandbox-id>
```

再检查：

- `/run/vc/vm/<sandbox-id>/cube.sock` 是否存在
- guest debug console 默认端口 `1026` 是否仍可用
- `CubeShim` / `CubeVmm` 日志是否出现握手错误

### 4.5 计算节点没有注册到控制面

优先检查：

1. `Cubelet/dynamicconf/conf.yaml` 中 `meta_server_endpoint`
2. `CUBE_SANDBOX_NODE_IP` 是否正确写入 `.one-click.env`
3. 控制节点是否能访问 `9999/tcp`
4. 计算节点是否能访问控制节点 `8089/tcp`

建议命令：

```bash
rg 'meta_server_endpoint' /usr/local/services/cubetoolbox/Cubelet/dynamicconf/conf.yaml
curl -fsS http://<control-plane>:8089/internal/meta/nodes/<node-ip>
```

### 4.6 PVM 环境已部署，但运行时似乎仍在走普通 guest 内核

优先检查三件事：

1. 宿主机是否真的启动在 PVM 宿主机内核上（`uname -r` 是否包含 `cube.pvm.host`）
2. `.one-click.env` 是否写入 `CUBE_PVM_ENABLE=1`
3. 安装日志中是否出现 `installed PVM guest kernel as .../cube-kernel-scf/vmlinux`

建议命令：

```bash
uname -r
grep CUBE_PVM_ENABLE /usr/local/services/cubetoolbox/.one-click.env
lsmod | grep kvm_pvm
ls -l /usr/local/services/cubetoolbox/cube-kernel-scf/vmlinux
```

如果是自建发布包，还应回到构建侧检查是否设置了 `ONE_CLICK_CUBE_KERNEL_PVM_VMLINUX`。没有这个构建输入，发布包不会包含 `vmlinux-pvm`。

## 5. 高危命令提示

以下命令应在手册中明确标红，执行前最好先确认数据目录和备份：

| 命令 | 风险 |
|---|---|
| `cubecli unsafe destroytap` | 清理所有宿主 tap 设备 |
| `cubecli unsafe restoredb` | 回写元数据数据库 |
| `cubecli unsafe rmi --all` | 删除所有镜像 |
| `cubecli storage cleanup` | 删除块文件 / 存储池内容 |
| `down.sh` | 停止整套 one-click 服务 |

## 6. 线上排障推荐顺序

建议统一采用下面这条路线，效率最高：

1. `smoke.sh` / `quickcheck.sh`
2. 看 `.one-click.env`
3. 看关键配置：`conf.yaml` / `config.toml` / `conf.yaml`
4. 看关键 socket：`cubelet.sock` / `network-agent-grpc.sock`
5. 看运行时目录：`/run/vc/vm/<sandbox-id>`
6. 看日志：`/data/log/Cube*`
7. 最后再做高危修复命令

## 7. 建议后续补成文档网站的子页面

如果后续做 CubeSandbox 文档网站，建议本章再拆成：

- **巡检与健康检查**
- **日志位置**
- **DNS / Proxy 排障**
- **sandbox 登录与 guest 调试**
- **高危命令说明**

这样运维同学遇到故障时能直接跳到对应 runbook。