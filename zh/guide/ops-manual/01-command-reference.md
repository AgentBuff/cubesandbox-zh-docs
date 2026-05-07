# 命令总览与 CLI 参考

本章只收录**运维入口**和**线上可用 CLI**。其中：

- 发布/部署命令：用于构建 one-click 包、安装、启停、巡检
- 控制面 CLI：主要是 `cubemastercli` 与 `cube-api`
- 节点/运行时 CLI：主要是 `cubecli` 与 `cube-runtime`

## 1. 发布与部署脚本

### 1.1 根目录 / 打包构建入口

| 命令 | 作用 | 典型场景 |
|---|---|---|
| `make builder-image` | 构建统一 builder 镜像 | 首次准备构建环境 |
| `make builder-shell` | 进入 builder 容器 | 需要在受控环境里编译时 |
| `make all` | 编译主要组件 | 本地开发或 dev-env 同步前 |
| `deploy/one-click/build-release-bundle-builder.sh` | 在 builder 容器中编译并生成发布包 | 官方推荐的一键打包入口 |
| `deploy/one-click/build-release-bundle.sh` | 使用现成产物生成 one-click 发布包 | 已有预编译二进制时 |
| `deploy/pvm/build-pvm-host-kernel-pkg.sh` | 构建 PVM 宿主机内核安装包 | 云服务器无嵌套虚拟化，需要交付 PVM host kernel 时 |
| `deploy/pvm/build-pvm-guest-vmlinux.sh` | 构建 PVM guest 内核（`vmlinux-pvm`） | 需要制作可启用 PVM 的 one-click 发布包时 |
| `deploy/pvm/pvm_setup.sh` | 一键串起 PVM 构建、安装、GRUB 配置与 guest kernel 投放 | 需要快速准备 PVM 环境时 |

### 1.2 one-click 安装与生命周期命令

| 命令 | 作用 | 说明 |
|---|---|---|
| `sudo ./install.sh` | 安装控制节点（默认 control 角色） | 同时部署控制面和本机节点能力 |
| `sudo ./install-compute.sh` | 安装计算节点 | 只安装 `Cubelet`/`network-agent`/运行时 |
| `sudo ./smoke.sh` | 调起 quickcheck 烟雾巡检 | 适合安装后确认 |
| `sudo ./down.sh` | 停止 one-click 全部组件 | 会带下 support / proxy / dns / webui / 本机进程 |
| `./deploy-manual.sh` | 手工升级/替换组件辅助脚本 | 用于发布包升级场景 |

### 1.2 PVM 相关变量与典型命令

PVM 路径统一使用以下术语：

- **PVM 宿主机内核**：安装到目标机并提供 `kvm_pvm`
- **PVM guest 内核（`vmlinux-pvm`）**：打包时注入 one-click，启用后安装为运行时 `cube-kernel-scf/vmlinux`

构建与安装阶段最关键的变量：

| 变量 | 阶段 | 作用 |
|---|---|---|
| `ONE_CLICK_CUBE_KERNEL_PVM_VMLINUX` | 构建时 | 指定要打进发布包的 PVM guest 内核路径 |
| `CUBE_PVM_ENABLE=1` | 安装时 | 告知 one-click 安装器把 `vmlinux-pvm` 安装为运行时内核 |

典型命令：

```bash
./deploy/pvm/pvm_setup.sh --yes
./deploy/pvm/pvm_setup.sh --host-only --yes
./deploy/pvm/pvm_setup.sh --guest-only --yes

export ONE_CLICK_CUBE_KERNEL_PVM_VMLINUX=/abs/path/to/vmlinux-pvm
CUBE_PVM_ENABLE=1 ./install.sh
```

### 1.3 安装后目标机脚本入口

安装完成后，主机上实际调用的是 `/usr/local/services/cubetoolbox/scripts/one-click/` 下的脚本：

| 脚本 | 作用 |
|---|---|
| `up-with-deps.sh` | 先拉起 support / proxy / dns / webui，再拉起本机进程 |
| `up.sh` | 启动 `network-agent`、`cubemaster`、`cube-api`、`cubelet` |
| `up-compute.sh` | 只启动计算节点所需的 `network-agent` 和 `cubelet` |
| `up-support.sh` | 生成并启动 MySQL / Redis compose |
| `up-cube-proxy.sh` | 生成 `global.conf` 与 compose，构建并启动 `cube-proxy` |
| `up-dns.sh` | 生成 CoreDNS `Corefile`、启动 DNS，并接管 `cube.app` 路由 |
| `up-webui.sh` | 生成 WebUI nginx 配置和 compose，启动 Dashboard |
| `quickcheck.sh` | 进行健康检查与文件/套接字检查 |
| `down-local.sh` | 停止宿主机进程 |
| `down-support.sh` / `down-cube-proxy.sh` / `down-dns.sh` / `down-webui.sh` | 分组件下线 |

## 2. `cubemastercli`：控制面运维 CLI

### 2.1 全局参数

`cubemastercli` 入口定义在 `CubeMaster/cmd/cubemastercli/app/main.go`。

其中模板命令主名是 `template`，源码里还保留了别名 `tpl`，所以线上看到这两种写法都正常：

```bash
cubemastercli template ...
cubemastercli tpl ...
```

| 参数 | 默认值 | 作用 |
|---|---|---|
| `--address`, `-a` | `0.0.0.0` | Cubemaster 地址 |
| `--port`, `-p` | `8089` | Cubemaster 端口 |
| `--timeout` | `35s` | 请求超时 |

### 2.2 常用顶级命令

| 命令 | 作用 |
|---|---|
| `cubemastercli version` | 查看 client/server 版本 |
| `cubemastercli list` | 列出 sandbox |
| `cubemastercli info` | 查询 sandbox 详情 |
| `cubemastercli destroy <sandbox-id...>` | 销毁 sandbox |
| `cubemastercli node list` | 查看节点状态 |
| `cubemastercli listinventory` | 查看库存/资源条目 |
| `cubemastercli template ...` | 模板全生命周期管理 |

### 2.3 模板命令（重点）

`template` 子命令是当前控制面最重要的运维入口之一：

| 命令 | 作用 |
|---|---|
| `cubemastercli tpl create -f req.json` | 按请求文件创建模板 |
| `cubemastercli tpl create-from-image --image <ref>` | 从 OCI 镜像构建 rootfs 并异步建模板 |
| `cubemastercli tpl watch --job-id <id>` | 持续观察 create-from-image 任务进度 |
| `cubemastercli tpl status --job-id <id>` | 查询任务状态 |
| `cubemastercli tpl info --template-id <id>` | 查看模板元数据与副本 |
| `cubemastercli tpl render --template-id <id>` | 预览模板最终渲染请求 |
| `cubemastercli tpl delete --template-id <id>` | 删除模板元数据与节点副本 |
| `cubemastercli tpl commit --sandbox-id <id> --template-id <tpl>` | 把已有 sandbox 提交为模板 |
| `cubemastercli tpl redo --template-id <tpl>` | 在失败节点或指定节点重做模板 |

### 2.4 典型命令示例

```bash
cubemastercli tpl create-from-image \
  --image docker.io/library/nginx:latest \
  --template-id tpl-nginx \
  --expose-port 80 \
  --cpu 2000 \
  --memory 2000

cubemastercli tpl watch --job-id <job-id>
cubemastercli node list --json
cubemastercli list --all --wide
```

## 3. `cube-api`：API 服务启动参数

`cube-api` 不是运维查询 CLI，而是服务进程入口。源码在 `CubeAPI/src/main.rs`。

### 3.1 主要启动参数

| 参数 | 作用 |
|---|---|
| `--bind` | HTTP 监听地址 |
| `--cubemaster-url` | Cubemaster 基地址 |
| `--auth-callback-url` | 鉴权回调地址 |
| `--worker-threads` | Tokio worker 数 |
| `--log-level` | 日志级别 |
| `--log-dir` | 文件日志目录 |
| `--log-prefix` | 滚动日志前缀 |
| `--rate-limit-per-sec` | 每 API Key 限速 |
| `--instance-type` | 默认实例类型，默认 `cubebox` |
| `--sandbox-domain` | API 返回的域名，默认 `cube.app` |
| `--export-openapi <path>` | 导出 OpenAPI YAML 后退出 |

### 3.2 启动示例

```bash
cube-api \
  --bind 0.0.0.0:3000 \
  --cubemaster-url http://127.0.0.1:8089 \
  --sandbox-domain cube.app
```

## 4. `cubecli`：节点与容器运行时 CLI

`cubecli` 入口定义在 `Cubelet/cmd/cubecli/app/main.go`。

### 4.1 全局参数

| 参数 | 默认值 | 作用 |
|---|---|---|
| `--address`, `-a` | `/data/cubelet/cubelet.sock` | Cubelet gRPC Unix Socket |
| `--tcpaddress`, `-ta` | `0.0.0.0:9999` | Cubelet TCP gRPC 地址 |
| `--state` | `/data/cubelet/state` | 状态目录 |
| `--timeout` | `60s` | 命令总超时 |
| `--connect-timeout` | 空 | 连接 containerd 超时 |
| `--namespace`, `-n` | `default` | containerd namespace |
| `--debug` | `false` | 调试日志 |

### 4.2 主要命令族

| 命令族 | 核心子命令 | 作用 |
|---|---|---|
| `cubecli container` | `list` / `info` / `exec` / `delete` / `taps` | 查看和管理容器/沙箱 |
| `cubecli cubebox` | `list` / `create` / `destroy` / `update` / `snapshot` | Cubebox 生命周期与 AppSnapshot |
| `cubecli image` | `ls` / `pull` / `inspect` / `rmi` / `load` / `imagefsinfo` / `emount` / `fix` | 镜像运维 |
| `cubecli storage` | `ls` / `cleanup` | 本地磁盘池与块文件清理 |
| `cubecli network` | `ls` | 查看 tap 网络资源 |
| `cubecli meta` | `dbs` / `view` | 只读查看元数据 DB |
| `cubecli vm` | `counter` | 查看 VM 计数信息 |
| `cubecli unsafe` | `restoredb` / `destroytap` / `rmi --all` / `volumedb` / `init` | 高危修复/清理命令 |
| `cubecli volume` | `resetvolumeref` / `resetVolumeRefExec` | 卷引用修复 |
| `cubecli version` | - | 查看版本 |

### 4.3 常用命令示例

```bash
cubecli container list --all --sandbox
cubecli container info <container-id>
cubecli container exec -ti <container-id> /bin/sh

cubecli image ls
cubecli image pull docker.io/library/python:3.11
cubecli image inspect <image-ref>

cubecli storage ls --bucket normal
cubecli storage cleanup --bucket normal --format 1Gi

cubecli network ls --config /usr/local/services/cubetoolbox/Cubelet/config/config.toml
cubecli meta dbs
cubecli meta view --db <db-name> <bucket>
```

### 4.4 `cubecli cubebox snapshot`

这是与 `cube-runtime snapshot` 打通的业务化入口。源码说明里明确它会完成：

1. 先创建一个 cubebox sandbox
2. 再调用 `cube-runtime snapshot`
3. 无论成功失败都回收 sandbox

示例：

```bash
cubecli cubebox snapshot ./cubebox_request.json
cubecli cubebox snapshot --snapshot-dir /data/templates ./cubebox_request.json
```

## 5. `cube-runtime`：运行时与登录 sandbox

`cube-runtime` 定义在 `CubeShim/cube-runtime/src/parser.rs`，当前有 3 个子命令：

| 命令 | 作用 |
|---|---|
| `cube-runtime snapshot` | 直接执行快照/模板快照逻辑 |
| `cube-runtime login` | 进入 guest debug console |
| `cube-runtime completions` | 生成 shell completion |

### 5.1 `cube-runtime login`（补充点）

这是之前最容易遗漏但非常实用的运维命令。

```bash
cube-runtime login <sandbox-id>
cube-runtime login <sandbox-id> --port 1026 --timeout 10
```

关键行为（源码已确认）：

- `sandbox-id` 必填
- 默认 debug console 端口是 `1026`
- 默认连接超时是 `10s`
- 它会连接宿主机上的 Unix Socket：`/run/vc/vm/<sandbox-id>/cube.sock`
- 连接后先发送 `CONNECT <port>` 做握手，收到 `OK` 才进入 raw terminal 模式
- 成功后可直接进入 guest 调试控制台

默认 debug console 端口来自 CubeShim 生成的内核参数：

- `agent.debug_console`
- `agent.debug_console_vport=1026`

### 5.2 如何拿到 `sandbox-id`

常用方式：

```bash
cubecli container list --all --sandbox
cubemastercli list --all
```

### 5.3 `cube-runtime snapshot`

`cube-runtime snapshot` 适合做底层快照调试，参数要求比业务命令更原始：

| 参数 | 必填 | 说明 |
|---|---|---|
| `--path` | 是 | 快照输出目录 |
| `--disk` | 是 | 磁盘 JSON |
| `--resource` | 是 | `VmResource` JSON |
| `--pmem` | 是 | PMEM JSON |
| `--kernel` | 是 | guest kernel 路径 |
| `--notap` | 否 | 不创建 tap |
| `--force` | 否 | 强制执行 |
| `--app-snapshot` | 否 | 应用快照模式 |
| `--vm-id` | 条件必填 | `--app-snapshot` 时需要 |

### 5.4 `cube-runtime completions`

用于生成 shell 补全，适合运维主机长期使用：

```bash
cube-runtime completions
```

## 6. `network-agent`：进程启动参数

虽然 `network-agent` 通常由脚本拉起，但它也有完整 CLI 参数。源码在 `network-agent/cmd/network-agent/main.go`。

| 参数 | 默认值 | 作用 |
|---|---|---|
| `--listen` | `unix:///tmp/cube/network-agent.sock` | HTTP API 监听 |
| `--grpc-listen` | `unix:///tmp/cube/network-agent-grpc.sock` | gRPC 监听 |
| `--health-listen` | `127.0.0.1:19090` | 健康检查 |
| `--tap-fd-listen` | `unix:///tmp/cube/network-agent-tap.sock` | TAP FD 监听 |
| `--cubelet-config` | 空 | 从 Cubelet TOML 继承网络参数 |
| `--eth-name` | 空 | 上行网卡名 |
| `--cidr` | `192.168.0.0/18` | 沙箱 IP 池 |
| `--state-dir` | 代码默认值 | 状态目录 |
| `--host-proxy-bind-ip` | `127.0.0.1` | Host Proxy 绑定地址 |

one-click 实际启动示例：

```bash
network-agent --cubelet-config /usr/local/services/cubetoolbox/Cubelet/config/config.toml \
  --state-dir /usr/local/services/cubetoolbox/network-agent/state
```

## 7. `containerd-shim-cube-rs`

`containerd-shim-cube-rs` 是 containerd Shim v2 组件，正常情况下**不作为手工运维 CLI 直接调用**。它由 containerd 按 runtime type 自动拉起。

日常运维更常接触的是：

- `cubecli`
- `cube-runtime`
- `/usr/local/bin/containerd-shim-cube-rs` 是否存在
- `Cubelet/config/config.toml` 中的 runtime 注册是否正确
