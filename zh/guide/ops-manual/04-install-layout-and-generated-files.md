# 安装目录、生成文件与落盘路径

本章把“仓库里有哪些模板文件”和“安装到目标机后真正落成什么样”分开说明，方便后续直接接入文档网站的信息架构。

## 1. 默认安装根目录

one-click 默认安装到：

```bash
/usr/local/services/cubetoolbox
```

对应变量：

```bash
ONE_CLICK_INSTALL_PREFIX=/usr/local/services/cubetoolbox
```

## 2. 安装后目录结构（control 节点）

```text
/usr/local/services/cubetoolbox/
├── .one-click.env
├── CubeAPI/bin/cube-api
├── CubeMaster/
│   ├── bin/cubemaster
│   ├── bin/cubemastercli
│   └── conf.yaml
├── Cubelet/
│   ├── bin/cubelet
│   ├── bin/cubecli
│   ├── config/config.toml
│   └── dynamicconf/conf.yaml
├── network-agent/
│   ├── bin/network-agent
│   ├── network-agent.yaml
│   └── state/
├── cube-shim/
│   ├── bin/containerd-shim-cube-rs
│   ├── bin/cube-runtime
│   └── conf/config-cube.toml
├── cube-kernel-scf/vmlinux
├── cube-image/cube-guest-image-cpu.img
├── cubeproxy/
├── coredns/
├── webui/
├── support/
├── scripts/one-click/
└── sql/
```

## 3. 仓库文件到目标机路径映射

| 仓库文件/目录 | 安装后路径 | 说明 |
|---|---|---|
| `configs/single-node/cubemaster.yaml` | `CubeMaster/conf.yaml` | Cubemaster 主配置 |
| `Cubelet/config/` | `Cubelet/config/` | Cubelet 静态配置 |
| `Cubelet/dynamicconf/` | `Cubelet/dynamicconf/` | Cubelet 动态配置 |
| `configs/single-node/network-agent.yaml` | `network-agent/network-agent.yaml` | network-agent 配置占位文件 |
| `deploy/one-click/config-cube.toml` | `cube-shim/conf/config-cube.toml` | Cube runtime 路径契约 |
| `deploy/one-click/support/` | `support/` | MySQL/Redis 模板与 mkcert |
| `deploy/one-click/cubeproxy/` | `cubeproxy/` | OpenResty / proxy 模板 |
| `deploy/one-click/webui/` | `webui/` | Dashboard nginx 与静态资源 |
| `deploy/one-click/coredns/` | `coredns/` | CoreDNS 模板 |
| `deploy/one-click/scripts/one-click/` | `scripts/one-click/` | 启停与巡检脚本 |
| `deploy/pvm/` | 不直接整体复制到目标机 | 构建 PVM 宿主机内核、PVM guest 内核与一键 setup 的源码入口 |

## 4. 安装时生成的文件

以下文件并不是仓库里固定内容，而是安装/启动过程中渲染或创建出来的：

### 4.1 全局环境生效文件

| 路径 | 生成时机 | 说明 |
|---|---|---|
| `/usr/local/services/cubetoolbox/.one-click.env` | `install.sh` | 由安装前 `.env` 拷贝并补齐角色/IP 等 |

### 4.2 support 依赖 compose

| 路径 | 生成时机 | 说明 |
|---|---|---|
| `/usr/local/services/cubetoolbox/support/docker-compose.yaml` | `up-support.sh` | 渲染 MySQL/Redis compose |

### 4.3 CubeProxy 生成物

| 路径 | 生成时机 | 说明 |
|---|---|---|
| `/usr/local/services/cubetoolbox/cubeproxy/global.conf` | `up-cube-proxy.sh` | 注入 Redis 与宿主机 IP |
| `/usr/local/services/cubetoolbox/cubeproxy/docker-compose.yaml` | `up-cube-proxy.sh` | 构建并启动 cube-proxy |
| `/usr/local/services/cubetoolbox/cubeproxy/certs/cube.app+3.pem` | `up-cube-proxy.sh` | 使用 mkcert 生成 |
| `/usr/local/services/cubetoolbox/cubeproxy/certs/cube.app+3-key.pem` | `up-cube-proxy.sh` | 使用 mkcert 生成 |

### 4.4 CoreDNS 生成物

| 路径 | 生成时机 | 说明 |
|---|---|---|
| `/usr/local/services/cubetoolbox/coredns/Corefile` | `up-dns.sh` | 渲染域名应答与转发策略 |
| `/usr/local/services/cubetoolbox/coredns/resolv.conf.upstream` | `up-dns.sh` | 过滤 stub DNS 后的真实上游解析 |
| `/usr/local/services/cubetoolbox/coredns/docker-compose.yaml` | `up-dns.sh` | CoreDNS 容器 compose |
| `/usr/local/services/cubetoolbox/coredns/host-dns-mode` | `up-dns.sh` | 记录 `systemd-resolved` 或 `NetworkManager` 模式 |
| `/usr/local/services/cubetoolbox/coredns/host-dns-interface` | `up-dns.sh` | 记录用于 DNS 路由的 link/interface |

### 4.5 WebUI 生成物

| 路径 | 生成时机 | 说明 |
|---|---|---|
| `/usr/local/services/cubetoolbox/webui/nginx.generated.conf` | `up-webui.sh` | 注入 `WEB_UI_UPSTREAM` 和端口 |
| `/usr/local/services/cubetoolbox/webui/docker-compose.yaml` | `up-webui.sh` | WebUI compose |

## 5. 安装时创建的宿主机目录

`install.sh` 会额外确保以下目录存在：

| 路径 | 用途 |
|---|---|
| `/usr/local/services/cubetoolbox/cube-vs/network` | CubeVS 网络对象目录 |
| `/usr/local/services/cubetoolbox/cube-snapshot` | 快照相关目录 |
| `/data/log/Cubelet` | Cubelet 日志 |
| `/data/log/CubeShim` | CubeShim 日志 |
| `/data/log/CubeVmm` | VMM 日志 |
| `/data/log/CubeAPI` | CubeAPI 日志（control 节点） |
| `/data/log/CubeMaster` | CubeMaster 日志（control 节点） |
| `/data/log/cube-proxy` | proxy 日志（control 节点） |
| `/data/cube-shim/disks` | runtime/snapshot 磁盘目录 |
| `/data/snapshot_pack/disks` | 快照打包磁盘目录 |

## 5.1 PVM 相关路径补充

PVM 路径下最容易误解的是：**运行时仍只认一个标准 guest kernel 路径**。

| 路径 | 角色 | 说明 |
|---|---|---|
| `deploy/one-click/assets/kernel-artifacts/vmlinux` | 构建期 | 默认普通 guest 内核路径；`pvm_setup.sh` 也可能把 guest kernel 投放到这里 |
| `deploy/one-click/assets/kernel-artifacts/vmlinux-pvm` | 构建期（可选） | 构建发布包时可显式注入的 PVM guest 内核名 |
| `/usr/local/services/cubetoolbox/cube-kernel-scf/vmlinux` | 运行时 | 标准 guest kernel 落盘路径；启用 PVM 时其内容会被 PVM guest 内核替换 |

也就是说，PVM 并不会把运行时路径改成另一个新文件名，而是通过安装流程把 `vmlinux-pvm` 落到统一的 `vmlinux` 契约路径。

## 6. 安装时创建的软链接

为了让运维可以直接在 PATH 中使用命令，`install.sh` 会创建：

```bash
/usr/local/bin/containerd-shim-cube-rs
/usr/local/bin/cube-runtime
/usr/local/bin/cubecli
/usr/local/bin/cubemastercli   # compute 节点不会保留
```

这也是线上运维最常用的命令入口。

## 7. 运行时 socket / 文件路径

### 7.1 节点 socket

| 路径 | 作用 |
|---|---|
| `/data/cubelet/cubelet.sock` | Cubelet gRPC Unix Socket |
| `/tmp/cube/network-agent.sock` | network-agent HTTP API |
| `/tmp/cube/network-agent-grpc.sock` | network-agent gRPC |
| `/tmp/cube/network-agent-tap.sock` | network-agent tap fd socket |

### 7.2 sandbox 运行时路径

| 路径 | 作用 |
|---|---|
| `/run/vc/vm/<sandbox-id>/cube.sock` | sandbox vsock / debug console 入口 |
| `/run/vc/vm/<sandbox-id>/chapi` | hypervisor 控制接口 |
| `/data/cubelet/root/pausevm/<sandbox-id>` | pause VM snapshot 目录 |

## 8. 计算节点与控制节点的差异

### 8.1 计算节点只保留的组件

计算节点模式下，安装器只复制：

- `network-agent`
- `Cubelet`
- `cube-shim`
- `cube-kernel-scf`
- `cube-image`
- `scripts`

### 8.2 计算节点不会安装/启动的组件

- `CubeAPI`
- `CubeMaster`
- `support` (MySQL/Redis)
- `cubeproxy`
- `coredns`
- `webui`

## 9. dev-env 文件同步入口

如果是开发环境而不是正式 one-click 节点，常用的是：

```bash
./dev-env/sync_to_vm.sh bin
./dev-env/sync_to_vm.sh bin cubelet cubecli cubemaster
./dev-env/sync_to_vm.sh files --remote-dir /tmp ./configs/foo.toml
```

这个脚本只负责：

- 把本地 `_output/bin` 下的二进制复制进 VM
- 备份远端旧文件为 `.bak`
- 不会自动重启服务

因此 dev-env 里的变更应用链路通常是：

1. `make all`
2. `./dev-env/sync_to_vm.sh bin ...`
3. 登录 VM
4. `systemctl restart cube-sandbox-oneclick.service`

## 10. 站点化建议

如果后续做文档网站，本章建议拆成两个菜单：

- **安装布局**：目录结构、映射关系、软链接
- **运行时生成物**：compose、证书、Corefile、nginx.generated.conf、`.one-click.env`

这样用户在“看源码模板”和“看线上主机落盘文件”之间不会混淆。