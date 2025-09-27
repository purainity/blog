---
date: 2025-09-27 21:03:09
category: 作品
tag: 
  - Docker
  - iStoreOS
  - 建站
---
# 在 iStoreOS 宿主机的 Docker 容器中运行 1Panel V2

GitHub 地址放在这里，此项目对宿主机环境没有特殊要求，并不一定是 OpenWRT 及其衍生版本，只要有 Docker 都能安装。

https://github.com/purainity/docker-1panel-v2

如果我的项目对你有帮助，请点个 ⭐Star 支持一下吧。

下面就来分享一下我的开发历程。

---

我的软路由使用的是基于 OpenWRT 的 iStoreOS 系统，在它自带的 iStore 应用商店里有有一款名为 `istorepanel` 的应用，可以在软路由上通过 Docker 的方式运行 1Panel 建站。虽然最初因为容器映射路径的问题导致它安装的 OpenResty 无法启动，不过在热心网友的帮助下解决了问题，并成功运行。这套方案我也用了一年左右。

直到今年 1Panel 发布了全新的 V2 版本，支持不同网站复用同一个 PHP 容器，就很想升级尝试一下。然而新旧版本并不兼容，所以 istorepanel 容器内的 1Panel 自然无法直接升级。又去 GitHub、Docker Hub 等网站看了下，并没有完美的在 OpenWRT 上运行 1Panel V2 的解决方案。

既然现成的方法没有，那就自己动手做。其实在 Docker 容器内部运行 1Panel 的原理就是 Docker out of Docker，即通过将宿主机的 `/var/run/docker.sock` 挂载到容器内部，使容器内的 1Panel 能够直接访问和管理宿主机上的 Docker 守护进程。

由于 istorepanel 并不开源，我不了解其中细节，于是从另一个项目 [Xeath/1panel-in-docker](https://github.com/Xeath/1panel-in-docker) 开始魔改，并自己整合了官方 1Panel 安装脚本中的内容，使它仅下载 1Panel 的安装包，而不依赖安装包里面的脚本，实现了无人值守静默安装。

同时由于在容器内并不需要 Docker Engine，只需要 cli 操作宿主机上的守护进程，所以 1Panel 安装脚本中安装 Docker 的部分也需要修改。原版 1Panel 使用的是 Docker 官方的一键安装脚本，但是它会同时安装 Docker Engine 和 cli，只安装 cli 则需要添加 Docker 的 GPG 密钥和 APT 软件源，非常麻烦。最初我采用 Debian 12 作为基础镜像，后来突然想到 Debian 13 stable 发布了，惊奇地发现 Debian 13 的官方 APT 软件源已直接提供 docker-cli 等软件包，便立即改用 APT 安装，大大简化了流程。

但是在所有安装工作完成，1Panel 启动之后进入网页面板发现它一直提示 `当前未启动 Docker 服务，请在【配置】中开启`。翻了翻 1Panel 检查 Docker 容器相关的源码，检查不出什么问题，容器内实际上能够访问宿主机上的 Docker 进程，systemctl 也伪造了，就是不行。项目也因此搁置了一段时间。

直到我看到 [dph5199278/docker-1panel](https://github.com/dph5199278/docker-1panel) 这个项目，它并不是简单的伪造了 systemctl，而是采用了 [gdraheim/docker-systemctl-replacement](https://github.com/gdraheim/docker-systemctl-replacement) 这一更为完善的脚本来完整模拟 systemctl 的行为，就尝试在我的容器中移植这个方案，发现工作良好。

其实我可以直接用这个项目，但是考虑到我自己的项目做了一半，而且我并不喜欢它在容器内部安装 SSH，以及在构建镜像时就下载安装包的设计，就决定按照它的思路继续开发我的项目。考虑到 1Panel 版本更新频繁，我的项目选择在容器运行时按需安装，这样只需提供一个通用的容器化环境，而非在镜像中固化特定版本，从而避免了频繁地重新构建镜像。

当然我的项目在 AI 的帮助下大幅简化代码，补全了注释，这就算是次要的了。

这个项目我自己还要长期用下去，所以应该会有一些维护。但是从短期来看现在的实现方式足以应对现有的 1Panel V2 了，所以项目代码暂时应该不会再有比较大的变动了。