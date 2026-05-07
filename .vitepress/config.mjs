import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: "Cube Sandbox",
  description: "Production-grade, multi-component security sandbox system for serverless computing.",
  outDir: 'dist',
  rewrites: (page) => page.startsWith('zh/') ? page.slice(3) : `en/${page}`,
  
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/tencentcloud/CubeSandbox' }
    ]
  },

  locales: {
    root: {
      label: '简体中文',
      lang: 'zh',
      title: 'Cube Sandbox',
      description: '专为 Serverless 计算设计的生产级多组件安全沙箱系统。',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '指南', link: '/guide/introduction' },
          { text: '架构', link: '/architecture/overview' },
          { text: '更新日志', link: '/changelog' },
          { text: 'GitHub', link: 'https://github.com/tencentcloud/CubeSandbox' }
        ],
        sidebar: {
          '/guide/': [
            {
              text: '入门指南',
              items: [
                { text: '简介 (Intro)', link: '/guide/introduction' },
                { text: '快速开始', link: '/guide/quickstart' },
                { text: '本地构建部署', link: '/guide/self-build-deploy' },
                { text: '多机集群部署', link: '/guide/multi-node-deploy' },
                { text: 'PVM部署', link: '/guide/pvm-deploy' },
                { text: '开发环境（QEMU 虚机）', link: '/guide/dev-environment' }
              ]
            },
            {
              text: '核心概念',
              items: [
                { text: '核心概念总览', link: '/guide/concepts/' },
                { text: '什么是 Sandbox', link: '/guide/concepts/sandbox' },
                { text: '什么是 Template', link: '/guide/concepts/template' },
                { text: '什么是 MicroVM、Runtime 与 Guest', link: '/guide/concepts/microvm-runtime-guest' },
                { text: '什么是 Snapshot、冷启动与热启动', link: '/guide/concepts/snapshot-hotstart' },
                { text: '什么是 Node、集群与调度', link: '/guide/concepts/node-cluster-scheduling' },
                { text: '什么是网络、暴露端口与访问路径', link: '/guide/concepts/network-exposure' },
                { text: '什么是文件系统、镜像与可写层', link: '/guide/concepts/filesystem-image-writable-layer' },
                { text: '什么是安全边界与隔离模型', link: '/guide/concepts/security-boundary' },
                { text: '模板概览（操作视角）', link: '/guide/templates' }
              ]
            },
            {
              text: '场景教程',
              items: [
                { text: '从 OCI 镜像制作模板', link: '/guide/tutorials/template-from-image' },
                { text: '示例项目', link: '/guide/tutorials/examples' },
                { text: '自定义镜像', link: '/guide/tutorials/bring-your-own-image' }
              ]
            },
            {
              text: '安全与运维',
              items: [
                { text: '模板检查与请求预览', link: '/guide/template-inspection-and-preview' },
                { text: 'HTTPS 证书与域名解析', link: '/guide/https-and-domain' },
                { text: '鉴权', link: '/guide/authentication' },
                { text: '运维手册总览', link: '/guide/ops-manual/' },
                { text: '命令总览与 CLI 参考', link: '/guide/ops-manual/01-command-reference' },
                { text: '控制面配置文件路径与说明', link: '/guide/ops-manual/02-control-plane-config' },
                { text: '节点与运行时配置文件路径与说明', link: '/guide/ops-manual/03-node-runtime-config' },
                { text: '安装目录、生成文件与落盘路径', link: '/guide/ops-manual/04-install-layout-and-generated-files' },
                { text: '日志、健康检查与排障', link: '/guide/ops-manual/05-logs-health-and-troubleshooting' }
              ]
            },
            {
              text: '开发文档',
              items: [
                { text: '连接到已有 Cube 集群', link: '/guide/connect-existing-cluster' }
              ]
            }
          ],
          '/architecture/': [
            {
              text: '系统设计',
              items: [
                { text: '架构概览 (Overview)', link: '/architecture/overview' },
                { text: 'CubeVS 网络模型', link: '/architecture/network' }
              ]
            }
          ]
        }
      }
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      title: 'Cube Sandbox',
      description: 'Production-grade, multi-component security sandbox system for serverless computing.',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Guide', link: '/en/guide/introduction' },
          { text: 'Architecture', link: '/en/architecture/overview' },
          { text: 'Changelog', link: '/en/changelog' },
          { text: 'GitHub', link: 'https://github.com/tencentcloud/CubeSandbox' }
        ],
        sidebar: {
          '/en/guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Introduction', link: '/en/guide/introduction' },
                { text: 'Quick Start', link: '/en/guide/quickstart' },
                { text: 'Self-Build Deployment', link: '/en/guide/self-build-deploy' },
                { text: 'Multi-Node Cluster', link: '/en/guide/multi-node-deploy' },
                { text: 'PVM Deployment', link: '/en/guide/pvm-deploy' },
                { text: 'Development Environment (QEMU VM)', link: '/en/guide/dev-environment' }
              ]
            },
            {
              text: 'Core Concepts',
              items: [
                { text: 'Templates Overview', link: '/en/guide/templates' }
              ]
            },
            {
              text: 'Tutorials',
              items: [
                { text: 'Create Templates from OCI Image', link: '/en/guide/tutorials/template-from-image' },
                { text: 'Examples', link: '/en/guide/tutorials/examples' },
                { text: 'Custom Image', link: '/en/guide/tutorials/bring-your-own-image' }
              ]
            },
            {
              text: 'Operations',
              items: [
                { text: 'Template Inspection & Request Preview', link: '/en/guide/template-inspection-and-preview' },
                { text: 'HTTPS & Domain Resolution', link: '/en/guide/https-and-domain' },
                { text: 'Authentication', link: '/en/guide/authentication' }
              ]
            },
            {
              text: 'Developer Docs',
              items: [
                { text: 'Connect to an Existing Cube Cluster', link: '/en/guide/connect-existing-cluster' }
              ]
            }
          ],
          '/en/architecture/': [
            {
              text: 'System Design',
              items: [
                { text: 'Architecture Overview', link: '/en/architecture/overview' },
                { text: 'Networking (CubeVS)', link: '/en/architecture/network' }
              ]
            }
          ]
        }
      }
    }
  }
}))
