---
date: 2026-10-18
category: 作品
tag: 
  - MIUI
  - 模块
  - 逆向
  - 主题
---

# MIUI 主题破解和增强的集大成者：MIUI 主题扩展

最近偶然看到群里有人在讨论 MIUI 主题破解，我想起自己手机里有一个叫“MIUI 扩展”（`com.miui.android.t`）的模块，功能是“桌面小窗模式+主题破解+小部件破解”。不过我发现大家讨论的模块跟我装的这个又不一样。好奇之下搜了搜，结果挺有意思的，实现类似功能的模块其实有好多个。

本着追求完美的强迫症，我决定用 AI 逆向分析一下它们的逻辑，并做出了一个覆盖我所需要的 MIUI 主题破解和增强功能的 Xposed 模块，取名“MIUI 主题扩展”，功能有：解锁付费内容（主题、字体、大图标、小组件等），允许应用本地导入的第三方主题，隐藏付费标识与商店广告。模块自带 Material Design 3 风格的配置界面。

GitHub 项目链接如下：
https://github.com/purainity/miui-theme-extension

首先我让 AI 逆向分析了收集来的几份已有模块 APK，以及两份开源源码（具体的分析记录我写在了 [已有的主题破解和MIUI扩展模块对比分析报告](https://github.com/purainity/miui-theme-extension/blob/main/docs/已有的主题破解和MIUI扩展模块对比分析报告.md) 里，期间也参考了 [PersonalizeHyperTheme](https://github.com/tangjin2580/PersonalizeHyperTheme) 和 [FuckMiuiThemeManager](https://github.com/tangjin2580/FuckMiuiThemeManager)）。

结合主题壁纸的宿主 APK 落实了 Hook 逻辑后，我采用了每个功能独立开关的设计，并整理出了一份完整的 [MIUI主题扩展项目规划](https://github.com/purainity/miui-theme-extension/blob/main/docs/MIUI主题扩展项目规划.md) 。接着把规划丢给 AI 同步开发，花了几天时间不断修改需求、测试和迭代，最终开发出了成品。

这个项目中也有不少有意思的设计：

比如为了同时兼容 1.x 和 2.x 系列的 LSPosed，本模块没有选择现代的 `libxposed` API，而是继续采用传统的 `legacy rovo89 API`。但由于 LSPosed 2.2.0 会对使用 `New XSharedPreferences` 的模块报“此模块使用了已废弃且即将移除的功能，请联系作者或考虑替代方案”的警告，所以我选择将 `xposedminversion` 锁定在 `82` 并移除了 `xposedsharedprefs`，改用自己实现的 ContentProvider 来跨进程通信，彻底消灭了废弃警告。

此外，由于新版 MIUI 主题壁纸的宿主有混淆，而我又不想引入 `DexKit` 这类 native 库的依赖，为此用纯 Kotlin 写了一个轻量级的 DEX 只读解析器，在免去 native 依赖的同时实现了动态类查找。

期间，我还让 AI 详细研究了一下目前 MIUI 主题壁纸的资源类别与收费现状，也让后续的 Hook 逻辑变得更加清晰明朗。

其实做这个项目也是为了未来复活“MIUI 完美图标计划”做的一个铺垫，敬请期待吧。
