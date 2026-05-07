# CubeSandbox 运维手册（章节版，源码校对）

这套手册面向已经在维护或即将上线 `CubeSandbox` 的同学，重点覆盖**实际部署链路中的运维组件**，而不是只罗列仓库目录。

## 适用范围

本文按源码、安装脚本和 one-click 运行时行为整理，覆盖以下内容：

- 控制面：`CubeMaster`、`CubeAPI`、`support(MySQL/Redis)`、`CubeProxy`、`CoreDNS`、`WebUI`
- 节点面：`Cubelet`、`network-agent`、`CubeShim`、`cube-runtime`
- 运维入口：`install.sh`、`install-compute.sh`、`up*.sh`、`down*.sh`、`smoke.sh`、`quickcheck.sh`
- 命令行入口：`cubemastercli`、`cubecli`、`cube-runtime`
- 关键配置：仓库模板、安装后配置、运行时生成文件、健康检查与日志路径

## 阅读顺序

1. [01-command-reference.md](./01-command-reference.md)：所有主要命令与 CLI 入口
2. [02-control-plane-config.md](./02-control-plane-config.md)：控制面组件配置文件路径与说明
3. [03-node-runtime-config.md](./03-node-runtime-config.md)：节点侧与运行时配置文件路径与说明
4. [04-install-layout-and-generated-files.md](./04-install-layout-and-generated-files.md)：安装目录、生成文件、落盘路径
5. [05-logs-health-and-troubleshooting.md](./05-logs-health-and-troubleshooting.md)：日志、巡检、排障

## 本手册的“全量”边界

这里的“全量”指**已部署系统需要维护的组件和命令入口**，不包含：

- 仅用于测试的 mock、benchmark、示例程序
- `hypervisor/` 内大量上游 Cloud Hypervisor 开发文档
- 与生产运行无直接关系的实验目录

如果后续要整理成 CubeSandbox 文档网站，建议以本目录作为运维专区初稿，再补：

- 中英双语版本
- 站点导航（sidebar / routes）
- FAQ / Runbook / 变更记录（release-based）

## 组件主配置入口速查

| 组件 | 仓库内主配置 | 安装后主路径 | 说明 |
|---|---|---|---|
| one-click 全局环境 | `deploy/one-click/env.example` | `/usr/local/services/cubetoolbox/.one-click.env` | 控制部署角色、端口、依赖容器、代理/DNS/WebUI 等 |
| CubeMaster | `configs/single-node/cubemaster.yaml` | `/usr/local/services/cubetoolbox/CubeMaster/conf.yaml` | 控制面调度、日志、MySQL/Redis、模板默认请求 |
| Cubelet | `Cubelet/config/config.toml` | `/usr/local/services/cubetoolbox/Cubelet/config/config.toml` | 节点核心静态配置 |
| Cubelet 动态配置 | `Cubelet/dynamicconf/conf.yaml` | `/usr/local/services/cubetoolbox/Cubelet/dynamicconf/conf.yaml` | 节点配额、GC、meta server 接入 |
| network-agent | `configs/single-node/network-agent.yaml` | `/usr/local/services/cubetoolbox/network-agent/network-agent.yaml` | 仅保存基础监听信息；运行时以 flag + Cubelet 配置为准 |
| CubeShim 运行时 | `deploy/one-click/config-cube.toml` | `/usr/local/services/cubetoolbox/cube-shim/conf/config-cube.toml` | 运行时资产路径契约 |
| CubeAPI | 无独立 yaml/toml | 读取 `/usr/local/services/cubetoolbox/.one-click.env` | 通过 env + CLI flag 叠加配置 |
| support | `deploy/one-click/support/docker-compose.yaml.template` | `/usr/local/services/cubetoolbox/support/docker-compose.yaml` | MySQL / Redis |
| CubeProxy | `deploy/one-click/cubeproxy/global.conf.template` | `/usr/local/services/cubetoolbox/cubeproxy/global.conf` | Redis、节点 IP、证书挂载 |
| CoreDNS | `deploy/one-click/coredns/Corefile.template` | `/usr/local/services/cubetoolbox/coredns/Corefile` | `cube.app` 域名应答与上游转发 |
| WebUI | `deploy/one-click/webui/nginx.conf` | `/usr/local/services/cubetoolbox/webui/nginx.generated.conf` | 静态资源服务与 `/cubeapi` 反代 |

## 源码依据

本手册基于以下入口逐项校对：

- `deploy/one-click/README_zh.md`
- `deploy/one-click/install.sh`
- `deploy/one-click/scripts/one-click/*.sh`
- `CubeMaster/cmd/cubemastercli/**`
- `Cubelet/cmd/cubecli/**`
- `CubeShim/cube-runtime/**`
- `CubeAPI/src/**`
- `network-agent/cmd/network-agent/main.go`
- `Cubelet/config/config.toml`
- `Cubelet/dynamicconf/conf.yaml`
- `configs/single-node/cubemaster.yaml`
- `configs/single-node/network-agent.yaml`
