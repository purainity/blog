---
date: 2026-11-08
category: 作品
tag: 
  - MIUI
  - 主题
---

# 我复活了 MIUI 完美图标计划

完美图标补全计划是一个基于官方图标样式去除图标牛皮癣，使用高清图标制作成分层图标的项目。这个项目由两个部分组成，一个是存放图标资源的 [图标仓库](https://github.com/pzcn/Perfect-Icons-Completion-Project)，还有一个是基于 [kr-script](https://github.com/helloklf/kr-scripts) 制作的 [完美图标计划安装器 APP](https://github.com/pzcn/MIUI-Icons-APP)。然而在 2025 年 6 月 12 日，[它的官方频道发了一条公告](https://t.me/Pillboard/1032)，内容是由于依赖的腾讯云 Coding 服务平台自 2025 年 9 月 1 日起取消免费版转为收费模式，再加上小米解锁 BL 政策收紧等原因，完美图标计划 App 将于 2025 年 8 月 31 日停止服务，届时安装器将无法使用。

当时我没有加这个频道，所以并不知道它要停服的消息，本地之前一直用的是它生成的 Magisk 模块。直到今年（2026 年）[为小米平板 5 Pro 制作官改包](/posts/project/MiPad5Pro-elish-MIUI-V14.0.6.0.html)想要内置图标库，打算导出一下最新的图标库的时候，才发现安装器已经无法正常打包图标库了。出于无奈，我当初只能选择从自己设备上已安装的 Magisk 模块里提取旧版图标库内置到官改包里面。

但是之后我一直对这件事耿耿于怀。后来我发现 GitHub 上的图标仓库其实一直在持续更新，而且图标库的资源本来就都是来自那个仓库的。于是我就在想，能不能绕过那个已经无法使用的安装器和停止的服务器，直接从上游仓库生成产物呢？

好在原版安装器也是开源的，它的核心逻辑其实都写在 `assets` 里的 shell 脚本（主要是 `module.sh`）中。在让 AI 逐一排查原版脚本里的网络接口时，还发现了一个挺有意思的事实：其实原版所用的 Coding 制品库和 Git 仓库大多数接口都还在正常响应并由 GitHub Actions 持续推送更新，原版 App 彻底罢工的直接原因在于脚本开头的 `network_check` 网络门禁探测——它会以 1 秒超时去请求 Oracle 对象存储上的探测地址，而那条国际链路极不稳定、经常 TCP 握手超时，门禁一旦失败就直接报“未检测到网络连接”并终止全部流程；再加上 120MB 的主图标库全量包也只放在那个对象存储上，导致原版 App 事实上彻底无法使用。

摸清原因后，我借助 AI 逐行推导了原版 v3.0.2 内置脚本的装配行为，整理出了一份完整的 [MIUI完美图标计划开发文档](https://github.com/purainity/miui-perfect-icons/blob/main/docs/MIUI完美图标计划开发文档.md)，然后用纯 Kotlin 重写了一个更现代的单机版替代客户端。新客户端彻底去掉了 `git`、`busybox`、`curl`、`zip` 等二进制可执行文件和 `.so` 库依赖，界面也按 Material Design 3 重新设计，完整实现了原安装器的所有功能（19 种图标主题选择、自定义图标导入、按应用禁用动态图标、新版遮罩开关、下载图标存档等），生成的产物与原版实物样本逐文件比对完全一致。

GitHub 项目链接如下：
https://github.com/purainity/miui-perfect-icons

这个 APP 直接对接 GitHub 上的上游图标仓库：先通过 `commits` API 检查版本，再利用 `Git Trees API` 拉取全量文件清单，在本地与缓存索引逐文件比对 `blob SHA`，只从 `raw.githubusercontent.com` 并发下载有变化的文件，从而在纯本机环境下实现了图标库的增量更新。

由于不再使用 kr-script，所以这个 APP 不再请求 root 权限，职责到产出文件为止，不安装模块、不重启设备、不修改系统任何内容。

虽然我同时实现了 MTZ 主题包和 Magisk 模块两种生成方式，但是我个人更推荐 MTZ 主题包，生成之后前往 MIUI 主题壁纸 APP 中导入，再用混搭功能应用图标就可以了，比起通过 Magisk 模块安装的方式节省了重启设备的步骤，可以很方便地更换图标包。

由于生成的 MTZ 主题包是本地主题，而 MIUI 系统有动态 DRM 校验，检测到本地主题后可能会自动恢复成默认主题，所以最好配合主题破解模块使用。可以使用 [HyperCeiler](https://github.com/ReChronoRain/HyperCeiler) 的“允许使用第三方主题”功能，不过我更推荐我上次发的 [MIUI 主题扩展](/posts/project/miui-theme-extension.html)（[GitHub](https://github.com/purainity/miui-theme-extension)），打开总开关和“允许使用第三方主题”即可，注意首次安装需要重启系统使 Hook 系统框架生效。

由于我的设备是 Android 13 MIUI 14，所以我只在这个系统版本上测试有用，在其他设备上没测试过。但是根据官方安装器的逻辑，Android 10+ 的 MIUI 12-14 应该都是适配的，HyperOS 1.0 理论上也能用，更高的版本就不知道了。

在我规划和开发这个项目的时候，我偶然发现 Telegram 群里有人发了个 [面向 HyperOS 4 的完美图标补全打包器](https://github.com/YifePlayte/PerfectIconsPacker)，但是作者明确说了只支持 HyperOS 4 的主题结构，我也没在 MIUI 上测试能不能用，就在这里也写一笔，说不定恰好和我的项目形成互补了呢😂
