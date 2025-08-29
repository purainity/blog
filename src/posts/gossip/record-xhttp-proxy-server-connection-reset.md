---
date: 2025-07-31 16:11:48
category: 杂谈
tag: 
  - 代理
  - 网络
---

# 记一次非常诡异的 xhttp 代理服务器连接被重置问题

**省流，先说结论：将 uTLS 指纹 `Chrome_Auto` 就行。**

## 问题背景

我搭建了一个 Xray 服务器，使用了 xhttp 协议。之前一直用的好好的，3 天前手机上的 Exclave 客户端却总是连不上，软路由上的 Xray 客户端连接正常。起初我以为是 Exclave 出了什么 bug，后来突然发现手机使用移动数据却能连接。当时倍感好奇，怎么还有这种情况？经过我的一番排查，发现了非常诡异的现象。

先说下我的情况：xhttp 服务器采用域名 `jibukeshi.zabc.net`（该二级域名自带 Cloudflare），宽带为华数（只有 IPv4 无 IPv6），移动数据为移动。

## 问题现象

- 宽带网络下，手机上的 Exclave 客户端无法连接代理服务器，提示 `connection reset by peer`
![Screenshot_20250731153602.jpg](/assets/pictures/record-xhttp-proxy-server-connection-reset/Screenshot_20250731153602.jpg)
- 宽带网络下，手机执行 curl 命令和使用 Reqable 也会被连接重置，但是浏览器却可以正常打开伪装网页
![Screenshot_20250731153354.jpg](/assets/pictures/record-xhttp-proxy-server-connection-reset/Screenshot_20250731153354.jpg)
![Screenshot_2025-07-31-15-35-03-029_mark.via.jpg](/assets/pictures/record-xhttp-proxy-server-connection-reset/Screenshot_2025-07-31-15-35-03-029_mark.via.jpg)
- 移动网络下，手机能正常连接代理，curl 命令和 Reqable 也正常![Screenshot_20250731153436.jpg](/assets/pictures/record-xhttp-proxy-server-connection-reset/Screenshot_20250731153436.jpg)
- 宽带使用软路由拨号，软路由上的 Xray 客户端却可以正常连接到代理服务器
- 软路由上执行 curl 命令也会被连接重置
![Screenshot_20250731153102.jpg](/assets/pictures/record-xhttp-proxy-server-connection-reset/Screenshot_20250731153102.jpg)
- 其它的 xhttp 配置都工作正常

## 问题分析

看着上面这一堆排查结果，我脑子差点烧了，压根不知道哪里出了问题。你说是 Exclave 问题吧，它在移动网络又能连接。你说是宽带问题吧，软路由上的 Xray 客户端又能连接，浏览器也能打开伪装网页。而且 curl 无论在手机上还是软路由上都会被连接重置。

我去搜了下这种情况，没有什么有用的结果，遂求助 AI。

![chat-export-2025年7月31日 16_00_50.png](/assets/pictures/record-xhttp-proxy-server-connection-reset/chat-export-2025%E5%B9%B47%E6%9C%8831%E6%97%A5%2016_00_50.png)

Gemini 提到了 SNI 和 TLS 版本、fingerprint 等问题，我尝试调整设置。

## 问题解决

当我将 Exclave 的 uTLS 指纹设置成 `Chrome_Auto` 时，居然能连接上了！我马上改回禁用，查看日志发现又被连接重置，只要改成 `Chrome_Auto` 就能用了。

我又试了几个 `Firefox_Auto`、`Safari_Auto`、`Randomized`、`RandomizedALPN` 等，都不行，只有 `Chrome_Auto` 能用，下面的也没去试。

## 原理分析

既然是 Gemini 提供的解决方法，自然要让它来解释了。

![chat-export-2025年7月31日 16_01_20.png](/assets/pictures/record-xhttp-proxy-server-connection-reset/chat-export-2025%E5%B9%B47%E6%9C%8831%E6%97%A5%2016_01_20.png)

## 遗留问题

尽管问题解决，但是它仍然疑点重重：

- 这个配置我已经使用了将近一个月，为什么之前一直可以正常使用，直到 3 天前才出现问题？
- 我又去查看了软路由上的 Xray 设置，发现它并没有开启 uTLS，难道它默认设置自带指纹伪装？

~~我感觉这种情况走近科学来了都得拍至少 3 集~~