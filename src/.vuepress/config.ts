import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "轻雨Purainity的小站",
  description: "轻雨Purainity的个人网站",

  theme,

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
