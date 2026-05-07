# 核心概念总览

这一组文档不是“怎么用 CubeSandbox”，而是“CubeSandbox 到底是什么”。

如果把快速开始、运维手册和教程看成操作层文档，这一组“核心概念”更像是 **认知地图**：

- 解释系统里到底有哪些一等概念
- 解释这些概念分别解决什么问题
- 解释这些概念彼此之间如何协作
- 解释为什么 CubeSandbox 会长成现在这样的架构，而不是 Docker、传统 VM 或单纯容器平台的样子

你可以把这组文档理解成类似 Kubernetes 文档里的 Concepts：它不直接教你敲命令，但会决定你是否真正看懂整个系统。

## 推荐阅读顺序

1. [什么是 Sandbox](./sandbox.md)
2. [什么是 Template](./template.md)
3. [什么是 MicroVM、Runtime 与 Guest](./microvm-runtime-guest.md)
4. [什么是 Snapshot、冷启动与热启动](./snapshot-hotstart.md)
5. [什么是 Node、集群与调度](./node-cluster-scheduling.md)
6. [什么是网络、暴露端口与访问路径](./network-exposure.md)
7. [什么是文件系统、镜像与可写层](./filesystem-image-writable-layer.md)
8. [什么是安全边界与隔离模型](./security-boundary.md)

## CubeSandbox 最重要的八个概念

### 1. Sandbox

Sandbox 是 CubeSandbox 面向用户交付的最小运行单元。

它不是一个普通 Linux 进程，也不是一个共享宿主机内核的容器，而是一个带有独立 Guest 内核、独立文件系统视角、独立网络视角、独立生命周期的执行环境。

用户真正“拿到手”的就是 Sandbox。

### 2. Template

Template 是创建 Sandbox 的“标准化母版”。

它定义了：

- 基础文件系统内容从哪里来
- 冷启动后要达到什么运行状态
- 哪些端口被视为服务入口
- 后续批量创建时可以复用哪些初始化成果

CubeSandbox 的极速启动能力，本质上并不是“现场快速装系统”，而是“基于 Template 复用已经准备好的状态”。

### 3. MicroVM / Runtime / Guest

这三者共同定义了 Sandbox 的运行形态：

- **MicroVM** 是硬件隔离载体
- **Runtime / Shim** 是把沙箱纳入容器运行时生态的桥梁
- **Guest** 是沙箱内部看到的操作系统环境

如果不把这三层区分开，就很容易把 CubeSandbox 误解成“快一点的容器”。

### 4. Snapshot / 冷启动 / 热启动

CubeSandbox 的性能优势来自状态复用，而状态复用的核心就是 Snapshot。

因此，“沙箱为什么能快”“模板为什么要制作”“冷启动和热启动差在哪”，本质上是同一个概念族。

### 5. Node / Cluster / Scheduling

CubeSandbox 不是单机脚本工具，而是可以扩展成多节点系统。

因此需要理解：

- 一个节点到底负责什么
- 控制面和节点面的边界在哪里
- 一个创建请求是如何被调度到某个节点上的

### 6. Network / Exposure

Sandbox 并不是天然对外可访问的。

“能不能联网”“外界如何访问沙箱里的服务”“为什么能做到沙箱间隔离”，都属于同一个网络概念族。

### 7. Filesystem / Image / Writable Layer

很多用户会把镜像、模板、根文件系统、可写层混成一个概念。

实际上它们是不同抽象层：

- 镜像是输入
- 模板是产物
- 根文件系统是运行时只读基底
- 可写层是实例级差异状态

### 8. Security Boundary

CubeSandbox 的产品价值不是“把代码跑起来”，而是“把不可信代码安全地跑起来”。

所以必须讲清楚：

- 它到底隔离了什么
- 没隔离什么
- 哪些安全能力来自硬件虚拟化
- 哪些能力来自网络与控制面策略

## 读完之后你应该获得什么

读完这一组概念文档，你应该能够回答下面这些问题：

- CubeSandbox 和 Docker、Firecracker、传统 VM、E2B 分别是什么关系？
- 为什么 CubeSandbox 必须先有 Template，才能稳定地做毫秒级交付？
- 一个 Sandbox 到底包含哪些状态，哪些状态来自模板，哪些状态来自实例本身？
- 为什么说 CubeSandbox 的运行时模型是“容器接口 + 微虚拟机隔离 + 模板快照复用”？
- 一个请求从 API 进入，到真正拿到沙箱，中间经历了哪些抽象层？
- CubeSandbox 的安全边界到底在哪里，运维和使用方分别承担什么责任？

## 和其它文档的关系

- 想直接部署：看 [快速开始](../quickstart.md)
- 想理解模板制作操作：看 [从 OCI 镜像制作模板](../tutorials/template-from-image.md)
- 想理解模板的操作视角：看 [模板概览](../templates.md)
- 想理解组件架构：看 [架构概览](../../architecture/overview.md)
- 想理解网络实现细节：看 [CubeVS 网络模型](../../architecture/network.md)
- 想做运维与排障：看 [运维手册总览](../ops-manual/)

## 写作原则

本组文档遵循四条原则：

1. **先讲定义，再讲实现。**
2. **先讲边界，再讲能力。**
3. **先讲为什么存在，再讲如何工作。**
4. **尽量用 CubeSandbox 自己的概念解释 CubeSandbox，而不是套用外部平台术语。**

接下来从最重要的概念开始： [什么是 Sandbox](./sandbox.md)。
