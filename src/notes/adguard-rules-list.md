---
article: false
---

# 自用 AdGuard 过滤规则汇总

适用于 AdGuard Android 及其他客户端。建议安装系统证书并打开 HTTPS 过滤以实现最佳的过滤效果。

## AdGuard 内置过滤器
这些过滤器在 AdGuard Android 中自带，直接打开开关即可。

### 广告拦截
- **AdGuard 基础过滤器**：`https://filters.adtidy.org/android/filters/2_optimized.txt`
- **AdGuard 移动广告过滤器**：`https://filters.adtidy.org/android/filters/11_optimized.txt`

### 隐私保护
- **AdGuard URL 跟踪过滤器**：`https://filters.adtidy.org/android/filters/17_optimized.txt`
- **AdGuard 防跟踪保护过滤器**：`https://filters.adtidy.org/android/filters/3_optimized.txt`

### 社交媒体
- **AdGuard 社交媒体过滤器**：`https://filters.adtidy.org/android/filters/4_optimized.txt`

### 恼人元素
- **AdGuard 弹窗过滤器**：`https://filters.adtidy.org/android/filters/19_optimized.txt`
- **AdGuard 移动拦截程序横幅广告过滤器**：`https://filters.adtidy.org/android/filters/20_optimized.txt`

### 特定语言
- **AdGuard 中文过滤器**：`https://filters.adtidy.org/android/filters/224_optimized.txt`
- **EasyList 中国**：`https://raw.githubusercontent.com/easylist/easylistchina/master/easylistchina.txt`
- **CJX's Annoyance List**：`https://raw.githubusercontent.com/cjx82630/cjxlist/master/cjx-annoyance.txt`
- **xinggsf**：`https://raw.githubusercontent.com/xinggsf/Adblock-Plus-Rule/master/rule.txt`

### 其他
- **解除搜索广告和自我推销过滤器**：`https://filters.adtidy.org/android/filters/10_optimized.txt`

---

## 第三方自定义过滤器
由开源社区积极维护的优质规则，针对中国大陆网络环境有深度优化，需要手动导入。

### AdRules
List for blocking ads in the Chinese region.
- **主页**：https://adrules.top/
- **GitHub**：https://github.com/Cats-Team/AdRules
- **上游**：https://github.com/Cats-Team/AdRules/blob/script/Source.md
- **订阅链接**：`https://adrules.top/adblock.txt`

### AWAvenue 秋风广告规则
众多优秀广告规则的上游、开源社区中最棒的广告过滤器列表之一，适配多种主流广告拦截工具。
- **主页**：https://awavenue.top/
- **GitHub**：https://github.com/TG-Twilight/AWAvenue-Ads-Rule
- **订阅链接**：`https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/AWAvenue-Ads-Rule.txt`

### DD-AD (afwfv)
推荐仅订阅私有规则，无需订阅规则整合。
- **GitHub**：https://github.com/afwfv/DD-AD/
- **上游**：https://github.com/afwfv/DD-AD/blob/main/config/application.yaml
- **订阅链接**：`https://raw.githubusercontent.com/afwfv/DD-AD/main/rule/DD-AD.txt`

### AbBlock List (xndeye)
强大而克制的广告过滤规则，可拦截 99% 的 Web 广告。定时合并多个优质上游规则，并去除重复和失效项。
- **GitHub**：https://github.com/xndeye/adblock_list
- **上游**：https://github.com/xndeye/adblock_list/blob/main/config/application.yaml
- **订阅链接**：`https://raw.githubusercontent.com/xndeye/adblock_list/release/easylist.txt`

---

## DNS 过滤器
在域名层面拦截广告和跟踪器，在不方便开启 HTTPS 解密的设备上特别有用。

- **AdGuard DNS 过滤器**：`https://filters.adtidy.org/android/filters/15_optimized.txt`

---

## AdGuard Home 专用
专为 AdGuard Home 优化的规则链接，仅包含 DNS 规则，不推荐在 AdGuard Android 上使用。这些过滤器在 AdGuard Home 中自带，直接在列表中选择即可。

- **AdGuard DNS filter**：`https://adguardteam.github.io/HostlistsRegistry/assets/filter_1.txt`
- **AdAway Default Blocklist**：`https://adguardteam.github.io/HostlistsRegistry/assets/filter_2.txt`
- **CHN: AdRules DNS List**：`https://adguardteam.github.io/HostlistsRegistry/assets/filter_29.txt`
- **AWAvenue Ads Rule**：`https://adguardteam.github.io/HostlistsRegistry/assets/filter_53.txt`

---

## 用户脚本
AdGuard Android 能安装用户脚本，这些就是油猴脚本，在浏览器里也能装。

### AdGuard Extra
**说明**：旨在解决常规广告拦截规则无能为力的复杂广告干扰。
- **订阅链接**：`https://userscripts.adtidy.org/release/adguard-extra/1.0/adguard-extra.user.js`

### 知乎增强
**说明**：移除登录弹窗；屏蔽视频、盐选、文章、想法等指定类别；屏蔽低赞回答；默认收起回答/评论；显示问题描述及作者；默认高清无水印原图；站外直链等。
- **主页**：https://greasyfork.org/zh-CN/scripts/419081-zhihu-enhancement
- **订阅链接**：`https://update.greasyfork.org/scripts/419081/%E7%9F%A5%E4%B9%8E%E5%A2%9E%E5%BC%BA.user.js`

### AC-baidu 重定向优化
**说明**：绕过百度/搜狗/谷歌搜索的跳转链接直接访问原网页；添加 Favicon 显示；自动翻页；页面 CSS 优化及计数功能。
- **主页**：https://greasyfork.org/zh-CN/scripts/14178-ac-baidu
- **订阅链接**：`https://update.greasyfork.org/scripts/14178/AC-baidu-%E9%87%8D%E5%AE%9A%E5%90%91%E4%BC%98%E5%8C%96%E7%99%BE%E5%BA%A6%E6%90%9C%E7%8B%97%E8%B0%B7%E6%AD%8C%E5%BF%85%E5%BA%94%E6%90%9C%E7%B4%A2_favicon_%E5%8F%8C%E5%88%97.user.js`

### 骚扰拦截
**说明**：全平台通用。自动拦截下载弹窗、悬浮按钮。长期维护 CSDN、知乎、百度、各大视频站及新闻资讯站点的净化。
- **主页**：https://greasyfork.org/zh-CN/scripts/440871
- **订阅链接**：`https://update.greasyfork.org/scripts/440871/%E9%AA%9A%E6%89%B0%E6%8B%A6%E6%88%AA.user.js`

### Redirect 外链跳转
**说明**：自动重定向到目标链接，免去点击“继续访问”的步骤。适配知乎、简书、微博、QQ/微信、GitHub、Steam、力扣等数百个常用平台。
- **主页**：https://greasyfork.org/zh-CN/scripts/416338
- **订阅链接**：`https://update.greasyfork.org/scripts/416338/redirect%20%E5%A4%96%E9%93%BE%E8%B7%B3%E8%BD%AC.user.js`