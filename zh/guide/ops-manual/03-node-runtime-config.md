# 节点与运行时配置文件路径与说明

本章覆盖运行 sandbox 必须维护的节点侧组件：

- `Cubelet`
- `Cubelet/dynamicconf`
- `network-agent`
- `CubeShim`
- `cube-runtime`
- guest kernel / guest image / VM socket / snapshot 路径

## 1. Cubelet 静态配置 `config.toml`

### 1.1 路径

| 阶段 | 路径 |
|---|---|
| 仓库源文件 | `Cubelet/config/config.toml` |
| 安装后生效 | `/usr/local/services/cubetoolbox/Cubelet/config/config.toml` |

启动方式：

```bash
cubelet --config /usr/local/services/cubetoolbox/Cubelet/config/config.toml \
  --dynamic-conf-path /usr/local/services/cubetoolbox/Cubelet/dynamicconf/conf.yaml
```

### 1.2 文件头部与全局路径

| 配置项 | 说明 |
|---|---|
| `root = "/data/cubelet/root"` | containerd / overlayfs 数据根目录 |
| `state = "/data/cubelet/state"` | 元数据与状态目录 |
| `pid_file = "/run/cube-let.pid"` | pid 文件 |
| `dynamic_config_path` | 指向动态配置 yaml |

### 1.3 核心监听项

| 配置段 | 关键字段 | 说明 |
|---|---|---|
| `[http]` | `address = ":9998"` | HTTP 接口 |
| `[grpc]` | `address = "/data/cubelet/cubelet.sock"`, `tcp_address = ":9999"` | Unix / TCP gRPC |
| `[cubetap]` | `address = "/data/cubelet/cubetap.sock"` | tap 相关 socket |
| `[operation_server]` | `cubelet-operation.sock` | 运维操作 socket |
| `[debug]` | `address = ":9966"` | debug 接口 |

### 1.4 `plugins` 重点配置

#### `io.cubelet.internal.v1.shimlog`

- `root_path = "/data/cubelet/shimlog"`
- 存放 shim 日志临时目录

#### `io.cubelet.internal.v1.cleanup`

- `root_path = "/data/cubelet/cleanup"`
- 清理流程工作目录

#### `io.cubelet.internal.v1.cgroup`

负责宿主与 VM 的资源开销估算：

| 字段 | 作用 |
|---|---|
| `pool_size`, `pool_workers` | cgroup 资源池规模 |
| `vm_cpu_overhead` | VM CPU overhead |
| `vm_memory_overhead_base` / `vm_memory_overhead_coefficient` | VM 内存额外开销 |
| `host_cpu_overhead`, `host_memory_overhead_base` | 宿主侧开销 |
| `vm_snapshot_specs_config` | 快照规格文件，默认 `/usr/local/services/cubetoolbox/cube-snapshot/spec.json` |
| `snapshot_disk_dir` | 模板/快照磁盘目录，默认 `/data/snapshot_pack/disks` |

#### `io.cubelet.internal.v1.network`

这是节点网络的主配置来源，也是 `network-agent` 继承配置的上游。

| 字段 | 说明 |
|---|---|
| `object_dir` | CubeVS 网络对象目录，默认 `/usr/local/services/cubetoolbox/cube-vs/network` |
| `eth_name` | 节点上行网卡名 |
| `tap_init_num` | 预分配 tap 数量 |
| `cidr` | sandbox IP 地址池 |
| `mvm_inner_ip` / `mvm_gw_dest_ip` | guest 内部 IP / 网关 |
| `mvm_mac_addr` / `mvm_gw_mac_addr` | guest / gateway MAC |
| `mvm_mtu` | guest MTU |
| `default_exposed_ports` | 默认暴露端口 |
| `enable_network_agent` | 是否启用 network-agent |
| `network_agent_endpoint` | network-agent gRPC endpoint |
| `network_agent_tap_socket` | network-agent tap socket |
| `redis_conf_path` | 旧网络事件流配置 |

#### `io.cubelet.internal.v1.storage`

本地磁盘池配置：

| 字段 | 说明 |
|---|---|
| `data_path = "/data/cubelet/storage"` | 块文件/磁盘池目录 |
| `pool_type = "copy_reflink"` | 存储池类型 |
| `disksize = "400Gi"` | 默认磁盘规格 |
| `snapshot_base_path = "/data/cube-shim/disks"` | snapshot 基础目录 |
| `snapshot_format_size_list` | 快照块文件规格 |

#### `io.cubelet.internal.v1.images`

- `runtime_type = "io.containerd.cube.v2"`
- 说明镜像相关逻辑默认走 cube runtime 类型

#### `io.cubelet.internal.v1.cubebox`

这是运行时注册入口：

| 字段 | 说明 |
|---|---|
| `default_runtime_name = "cube"` | 默认 runtime |
| `runtime_type = "io.containerd.cube.rs"` | cube runtime 类型 |
| `runtime_cfg_path = "/usr/local/services/cubetoolbox/cube-shim/conf/config-cube.toml"` | 指向 CubeShim 配置文件 |
| `cubetool_base_dir` | `/usr/local/services/cubetoolbox` |

#### 其它值得关注的段

- `io.cubelet.images-service.v1.images-service.image_gc`: 镜像 GC 阈值与周期
- `io.cubelet.internal.v1.gc-service`: 全局 GC 周期
- `io.containerd.snapshotter.v1.overlayfs`: overlayfs 元数据和数据目录
- `io.containerd.metadata.v1.bolt`: bolt metadata 根目录
- `io.cubelet.chi.v1.vsocket-manager.proxyPort = 1032`: vsocket 代理端口

## 2. Cubelet 动态配置 `dynamicconf/conf.yaml`

### 2.1 路径

| 阶段 | 路径 |
|---|---|
| 仓库源文件 | `Cubelet/dynamicconf/conf.yaml` |
| 安装后生效 | `/usr/local/services/cubetoolbox/Cubelet/dynamicconf/conf.yaml` |

### 2.2 配置段说明

#### `common`

| 字段 | 说明 |
|---|---|
| `enable_pf_mode` | 是否启用 PF 模式 |
| `sandbox_exec_cmd_time_out` | sandbox 内执行命令超时 |
| `enable_sandbox_exec_cmd_before_exist` | sandbox 退出前是否执行清理命令 |
| `default_dns_servers` | guest 默认 DNS |

#### `host`

| 字段 | 说明 |
|---|---|
| `scheduler_label` | 节点调度标签 |
| `quota.mcpu_limit` / `mem_limit` / `mvm_limit` | 节点资源上限 |
| `gc.code_expiration_time` | 代码/工作目录保留时间 |
| `gc.image_expiration_time` | 镜像保留时间 |

#### `meta_server_config`

| 字段 | 说明 |
|---|---|
| `meta_server_endpoint` | 控制面元数据服务地址 |
| `status_update_frequency` | 节点状态上报周期 |
| `node_status_max_images` | 节点状态中汇报的最大镜像数 |

计算节点安装时，`install-compute.sh` / `up-compute.sh` 会重点检查这里的 `meta_server_endpoint` 是否存在并正确指向控制面。

## 3. network-agent 配置

### 3.1 路径

| 阶段 | 路径 |
|---|---|
| 仓库模板 | `configs/single-node/network-agent.yaml` |
| 安装后文件 | `/usr/local/services/cubetoolbox/network-agent/network-agent.yaml` |
| 状态目录 | `/usr/local/services/cubetoolbox/network-agent/state` |

### 3.2 一个重要事实：YAML 不是最终生效源

虽然安装包会携带 `network-agent.yaml`，而且 `up.sh` 会先检查它存在，但当前 one-click 启动命令并**不会**把它作为启动参数传给 `network-agent`。

实际启动方式是：

```bash
network-agent --cubelet-config /usr/local/services/cubetoolbox/Cubelet/config/config.toml \
  --state-dir /usr/local/services/cubetoolbox/network-agent/state
```

因此当前 one-click 下，network-agent 的**真实配置优先级**是：

1. 命令行 flag
2. `--cubelet-config` 指向的 `Cubelet/config/config.toml`
3. network-agent 代码内默认值

`network-agent.yaml` 当前更像“打包期保留的配置占位文件”。

### 3.3 `network-agent.yaml` 当前内容

当前仓库样例只保存基础监听项：

- `listen`
- `health_listen`
- `grpc_listen`

如果后续文档网站要强化 network-agent 专章，建议明确区分：

- **部署包携带的 yaml**
- **运行时真正生效的 flag/TOML**

## 4. CubeShim 与运行时配置 `config-cube.toml`

### 4.1 路径

| 阶段 | 路径 |
|---|---|
| 仓库模板 | `deploy/one-click/config-cube.toml` |
| 安装后生效 | `/usr/local/services/cubetoolbox/cube-shim/conf/config-cube.toml` |

### 4.2 这个文件的定位

当前开源版 `config-cube.toml` 内容非常保守，主要作用是**把运行时资产路径固定为 on-disk contract**。也就是说，它更偏向“路径契约文件”，而不是一个复杂的 tunable runtime config。

文件中列出的标准资产路径包括：

| 资产 | 标准路径 |
|---|---|
| shim binary | `/usr/local/services/cubetoolbox/cube-shim/bin/containerd-shim-cube-rs` |
| `cube-runtime` | `/usr/local/services/cubetoolbox/cube-shim/bin/cube-runtime` |
| guest kernel | `/usr/local/services/cubetoolbox/cube-kernel-scf/vmlinux` |
| guest image | `/usr/local/services/cubetoolbox/cube-image/cube-guest-image-cpu.img` |

这里有一个容易混淆但必须统一的点：无论是标准部署还是 PVM 部署，运行时最终读取的路径都还是 `/usr/local/services/cubetoolbox/cube-kernel-scf/vmlinux`。差别不在路径名，而在安装阶段是否通过 `CUBE_PVM_ENABLE=1` 用 `vmlinux-pvm` 覆盖了这份运行时内核。

## 5. CubeShim 代码里的内建默认路径

很多真正影响运行时行为的路径，并不在 `config-cube.toml` 里，而是在 `CubeShim` 源码中写死或从 annotation 推导。

### 5.1 内核与镜像

源码位置：

- `CubeShim/shim/src/sandbox/config.rs`
- `CubeShim/shim/src/hypervisor/config.rs`

对应默认值：

| 项目 | 默认路径 |
|---|---|
| kernel | `/usr/local/services/cubetoolbox/cube-kernel-scf/vmlinux` |
| guest image | `/usr/local/services/cubetoolbox/cube-image/cube-guest-image-cpu.img` |

如果请求 annotation 中带了 `cube.vm.kernel.path`，则可以覆盖默认 kernel。

因此排查 PVM 是否生效时，重点不是看路径有没有变，而是确认：

- 宿主机是否已进入 PVM 宿主机内核
- `.one-click.env` 中是否有 `CUBE_PVM_ENABLE=1`
- 安装日志里是否出现 `installed PVM guest kernel as .../cube-kernel-scf/vmlinux`

### 5.2 sandbox socket 与 VM 目录

源码位置：`CubeShim/shim/src/common/utils.rs`

| 项目 | 默认路径 |
|---|---|
| VM 根目录 | `/run/vc/vm/` |
| sandbox vsock socket | `/run/vc/vm/<sandbox-id>/cube.sock` |
| chapi 路径 | `/run/vc/vm/<sandbox-id>/chapi` |

这也是 `cube-runtime login <sandbox-id>` 能工作的基础。

### 5.3 暂停态快照目录

源码位置：

- `CubeShim/shim/src/common/mod.rs`
- `CubeShim/shim/src/common/utils.rs`

默认值：

| 项目 | 默认路径 |
|---|---|
| pause VM snapshot base | `/data/cubelet/root/pausevm` |

### 5.4 debug console 默认端口

源码位置：`CubeShim/shim/src/hypervisor/config.rs`

默认会向 guest 注入：

- `agent.debug_console`
- `agent.debug_console_vport=1026`

这就是 `cube-runtime login` 默认使用 `--port 1026` 的根源。

## 6. `cube-runtime` 自身没有独立配置文件

`cube-runtime` 的特点是：

- 没有独立 yaml/toml
- 通过子命令参数工作
- 依赖 CubeShim 的默认路径和当前 sandbox 运行状态

### 6.1 `login` 依赖项

| 条件 | 说明 |
|---|---|
| `sandbox-id` 存在 | 对应目录必须在 `/run/vc/vm/` 下 |
| `cube.sock` 存在 | 说明 sandbox shim/vsock 可连通 |
| debug console 端口打开 | 默认 `1026` |

### 6.2 `snapshot` 依赖项

| 条件 | 说明 |
|---|---|
| `--disk` / `--resource` / `--pmem` | 都要传 JSON 字符串 |
| `--kernel` | 传 guest kernel 路径 |
| 目录可写 | `--path` 必须可写 |

如果你想从更业务化的角度做模板快照，优先使用：

```bash
cubecli cubebox snapshot ...
```

## 7. 节点侧配置排查顺序

出现节点问题时，建议按下面顺序看：

1. `/usr/local/services/cubetoolbox/Cubelet/config/config.toml`
2. `/usr/local/services/cubetoolbox/Cubelet/dynamicconf/conf.yaml`
3. `/usr/local/services/cubetoolbox/network-agent/state`
4. `/usr/local/services/cubetoolbox/cube-shim/conf/config-cube.toml`
5. `/run/vc/vm/<sandbox-id>/cube.sock`
6. `/data/cubelet/root`、`/data/cubelet/state`、`/data/cubelet/storage`

如果问题是“能创建但进不去 guest”，优先检查：

- `cube-runtime login <sandbox-id>`
- `/run/vc/vm/<sandbox-id>/cube.sock`
- `agent.debug_console_vport=1026` 对应的 guest debug console
