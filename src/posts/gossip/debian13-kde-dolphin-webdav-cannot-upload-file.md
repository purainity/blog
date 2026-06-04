---
date: 2026-06-03 20:56:18
category: 杂谈
---

# 记一次 Debian 13 KDE 桌面 Dolphin 文件管理器挂载明文 WebDAV 服务器无法上传文件的玄学问题

我在局域网内用 OpenList 在 5244 端口搭建了一个明文 HTTP 的 WebDav 服务器。当使用 Debian 13 的 KDE 桌面自带的 Dolphin 文件管理器挂载时，读取正常，但是不能上传文件。弹窗提示“尝试上传时发生意外错误(0)”。同样的设置用其他软件和安卓手机上的软件都正常。

问了 AI，抓了一下日志发现是 KIO Worker 进程崩溃
```
~$ QT_LOGGING_RULES="kf.kio.workers.http.debug=true;kf.kio.workers.dav.debug=true" dolphin
kf.kio.core: Connection::send() called with connection not inited
kf.kio.core: An error occurred during write. The worker terminates now.
kf.kio.core: Connection::send() called with connection not inited
kf.kio.core: An error occurred during write. The worker terminates now.
kf.kio.core: Connection::send() called with connection not inited
kf.kio.core: An error occurred during write. The worker terminates now.
```

尝试了清理 KIO 缓存、重装 KIO 相关组件、尝试在地址栏改用 `webdav://` 和 `http://` 都没用。又问了一下 Grok，它说这个问题很早之前就有人提出过，但是至今未解决，推荐换用 davfs2 或者 rclone 代替自带的 KIO，也可以尝试换用 HTTPS 以及检查服务器是否支持 Expect: 100-continue，尝试关闭服务器的 keep-alive 等。

然后我又想起来之前我安卓上要用 FolderSync Pro，它只支持 HTTPS 而不支持明文 HTTP，我就用OpenResty 反代了一下 5244 端口的 OpenList。加上了自签名证书，运行在 8443 端口。我抱着司马权当活马医的心态用 Dolphin 进入 8443 的 webdavs，结果发现文件上传正常了。再回过头去连接 5244 的明文 HTTP 问题依旧。

于是这个玄学问题就如此用“曲线救国”的方式解决了。