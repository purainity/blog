import { sidebar } from "vuepress-theme-hope";

export default sidebar([
  "/",
  {
    text: "博客",
    icon: "ri:article-line",
    prefix: "/posts/",
    children: "structure",
  },
  "/friendlinks",
  "/about",
]);
