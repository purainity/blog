import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  "/posts/",
  "/friendlinks",
  "/about",
  {
    text: "资源站",
    icon: "/assets/icon/elist.svg",
    link: "https://alist.jibukeshi.dpdns.org/",
  },
]);
