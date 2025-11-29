// 导入 Node.js 的 fs 和 path 模块，以及 VuePress 的 getDirname 工具
import { fs } from "vuepress/utils";
import { getDirname, path } from "vuepress/utils";
import { hopeTheme } from "vuepress-theme-hope";

import navbar from "./navbar.js";
import sidebar from "./sidebar.js";

// 获取当前配置文件的目录路径，用于解析本地 SVG 文件的绝对路径
const __dirname = getDirname(import.meta.url);

export default hopeTheme({
  hostname: "https://jibukeshi.dpdns.org",

  author: {
    name: "轻雨Purainity",
    url: "https://jibukeshi.dpdns.org",
  },

  logo: "/assets/avatar-radius.png",

  docsDir: "src",

  // 关闭页面最后更新时间
  lastUpdated: false,
  // 关闭页面贡献者
  contributors: false,
  // 关闭“在 GitHub 上编辑此页”
  editLink: false,

  // 关闭页面底部的上/下一页
  prevLink: false,
  nextLink: false,

  // 导航栏
  navbar,

  // 侧边栏
  sidebar,

  // 页脚
  footer: 'Powered by <a href="https://github.com/vuepress/core">VuePress</a> & <a href="https://github.com/vuepress-theme-hope/vuepress-theme-hope">vuepress-theme-hope</a>',
  displayFooter: true,

  // 博客相关
  blog: {
    description: "一位热爱钻研技术、分享经验的互联网爱好者",
    intro: "/about.html",
    timeline: "归档",
    articlePerPage: 20,

    medias: {
      GitHub: "https://github.com/purainity",
      Zhihu: "https://www.zhihu.com/people/ji-bu-ke-shi-72",
      CoolApk: "https://www.coolapk.com/u/21381544",
      Email: "mailto:jibukeshipro@outlook.com",
      Yhchat: {
        link: "https://www.yhchat.com/user/homepage/5114302",
        icon: fs.readFileSync(path.resolve(__dirname, "public/assets/icon/yhchat.svg"), "utf-8")
      },
      Telegram: "https://t.me/purainity",
      Discord: "https://discord.gg/AyHzVmVy",
      Matrix: {
        link: "https://matrix.to/#/@jibukeshi%3Amatrix.org",
        icon: fs.readFileSync(path.resolve(__dirname, "public/assets/icon/Matrix.svg"), "utf-8")
      },
      LINUXDO: {
        link: "https://linux.do/u/jibukeshi",
        icon: fs.readFileSync(path.resolve(__dirname, "public/assets/icon/LINUXDO.svg"), "utf-8")
      },
      NodeLoc: {
        link: "https://www.nodeloc.com/u/jibukeshi",
        icon: fs.readFileSync(path.resolve(__dirname, "public/assets/icon/NodeLoc.svg"), "utf-8")
      },
      Twitter: "https://twitter.com/purainity",
      Youtube: "https://youtube.com/@机不可失",
      Mastodon: {
        link: "https://mastodon.social/@jibukeshi",
        icon: fs.readFileSync(path.resolve(__dirname, "public/assets/icon/Mastodon.svg"), "utf-8")
      },
      Rss: "/rss.xml",
    },

  },

  // 如果想要实时查看任何改变，启用它。注: 这对更新性能有很大负面影响
  // hotReload: true,

  // 此处开启了很多功能用于演示，你应仅保留用到的功能。
  markdown: {
    align: true,
    attrs: true,
    codeTabs: true,
    component: true,
    demo: true,
    figure: true,
    gfm: true,
    imgLazyload: true,
    imgSize: true,
    include: true,
    mark: true,
    plantuml: true,
    spoiler: true,
    stylize: [
      {
        matcher: "Recommended",
        replacer: ({ tag }) => {
          if (tag === "em")
            return {
              tag: "Badge",
              attrs: { type: "tip" },
              content: "Recommended",
            };
        },
      },
    ],
    sub: true,
    sup: true,
    tabs: true,
    tasklist: true,
    vPre: true,

    // 取消注释它们如果你需要 TeX 支持
    // math: {
    //   // 启用前安装 katex
    //   type: "katex",
    //   // 或者安装 mathjax-full
    //   type: "mathjax",
    // },

    // 如果你需要幻灯片，安装 @vuepress/plugin-revealjs 并取消下方注释
    // revealjs: {
    //   plugins: ["highlight", "math", "search", "notes", "zoom"],
    // },

    // 在启用之前安装 chart.js
    // chartjs: true,

    // insert component easily

    // 在启用之前安装 echarts
    // echarts: true,

    // 在启用之前安装 flowchart.ts
    // flowchart: true,

    // 在启用之前安装 mermaid
    // mermaid: true,

    // playground: {
    //   presets: ["ts", "vue"],
    // },

    // 在启用之前安装 @vue/repl
    // vuePlayground: true,

    // 在启用之前安装 sandpack-vue3
    // sandpack: true,
  },

  // 在这里配置主题提供的插件
  plugins: {
    blog: {
      excerptLength: 50,
    },

    // 启用之前需安装 @waline/client
    // 警告: 这是一个仅供演示的测试服务，在生产环境中请自行部署并使用自己的服务！
    // comment: {
    //   provider: "Waline",
    //   serverURL: "https://waline-comment.vuejs.press",
    // },

    components: {
      components: ["Badge", "VPCard"],
    },

    icon: {
      prefix: "ri:",
    },

    // RSS 订阅
    feed: true,

    // 本地搜索
    slimsearch: {
      // 索引全部内容
      indexContent: true,
    },

  },
});
