---
date: 2026-04-16 19:21:17
category: 作品
tag: 
  - Docker
  - iStoreOS
  - 1Panel
  - 建站
---
# 追求极致：docker-1panel-v2 容器化方案的重构

去年，1Panel 发布了 [V2 大版本更新](https://github.com/1Panel-dev/1Panel/releases/tag/v2.0.0)，带来了许多新功能。但是由于我一直使用的是 iStoreOS 上的 [istorepanel](https://hub.docker.com/r/linkease/istorepanel) 镜像在 Docker 容器中运行 1Panel V1，无法直接升级到 V2，于是自己制作了 [docker-1panel-v2](https://github.com/purainity/docker-1panel-v2)。当时参考了一些已有项目，采用“伪造 systemctl”的方式来绕过系统环境限制运行 1Panel。

但是随着时间流逝，我越发觉得当初的实现方式并不够优雅，整个项目也有许多不完美的地方。再加上 1Panel 自身在这段时间也又有许多变更，于是我决定重构这个项目。

在重构过程中，我对 Docker 和 Linux 的了解也增进了不少。这篇文章就记录下这次重构的内容、背后的故事和从之前的版本升级的提示。

## 重构内容

### 选用 slim 版基础镜像

去年我曾想当然地认为，“slim 版一定比普通版精简了更多软件包，而 1Panel 作为一款适合在普通的服务器环境运行的软件，有可能会用到它们”，基于这种想法，我毫不犹豫地选择了 `debian:13` 作为基础镜像。

但实际上，Debian 13 的 Docker 镜像构建工具已经升级为 `debuerreotype`（即官方现在统一使用这个工具生成 rootfs），`debian:13`（标准版）和 `debian:13-slim` 现在安装的包集合其实是完全一致的。

区别在于 slim 版在构建完成后，运行了一个名为 `debuerreotype-slimify` 的脚本，删除了 man（帮助文档与手册页）、doc（软件包文档与示例，为了符合开源协议合规性仅保留版权）、locale（本地化多语言文件)、info（信息页与开发元数据）。

这些文件对于运行 1Panel 完全无用，而在未压缩的状态下， `debian:13` 镜像大小为 119.86 MB，`debian:13-slim` 镜像大小为 78.61 MB。所以这次我采用 slim 版作为基础镜像，减小了基础镜像的体积。而在所有依赖安装完成后的成品镜像体积为 276.83 MB。

这两个镜像的 rootfs 中的文件差异如下：

::: details
```
--- full_names.txt	2026-03-30 19:09:45.992500131 +0800
+++ slim_names.txt	2026-03-30 19:09:46.016500131 +0800
@@ -63,6 +63,7 @@
 etc/dpkg/
 etc/dpkg/dpkg.cfg
 etc/dpkg/dpkg.cfg.d/
+etc/dpkg/dpkg.cfg.d/docker
 etc/dpkg/dpkg.cfg.d/docker-apt-speedup
 etc/dpkg/origins/
 etc/dpkg/origins/debian
@@ -1882,491 +1883,158 @@
 usr/share/doc-base/findutils.findutils
 usr/share/doc/
 usr/share/doc/apt/
-usr/share/doc/apt/NEWS.Debian.gz
-usr/share/doc/apt/README.md.gz
-usr/share/doc/apt/changelog.gz
 usr/share/doc/apt/copyright
-usr/share/doc/apt/examples/
-usr/share/doc/apt/examples/apt.conf
-usr/share/doc/apt/examples/configure-index
-usr/share/doc/apt/examples/debian.sources
-usr/share/doc/apt/examples/preferences
 usr/share/doc/base-files/
-usr/share/doc/base-files/FAQ
-usr/share/doc/base-files/NEWS.Debian.gz
-usr/share/doc/base-files/README
-usr/share/doc/base-files/README.FHS
-usr/share/doc/base-files/changelog.gz
 usr/share/doc/base-files/copyright
 usr/share/doc/base-passwd/
-usr/share/doc/base-passwd/README
-usr/share/doc/base-passwd/changelog.gz
 usr/share/doc/base-passwd/copyright
-usr/share/doc/base-passwd/users-and-groups.html
-usr/share/doc/base-passwd/users-and-groups.txt.gz
 usr/share/doc/bash/
-usr/share/doc/bash/CHANGES.gz
-usr/share/doc/bash/COMPAT.gz
-usr/share/doc/bash/INTRO.gz
-usr/share/doc/bash/NEWS.gz
-usr/share/doc/bash/POSIX.gz
-usr/share/doc/bash/RBASH
-usr/share/doc/bash/README.Debian.gz
-usr/share/doc/bash/README.abs-guide
-usr/share/doc/bash/README.commands.gz
-usr/share/doc/bash/README.gz
-usr/share/doc/bash/changelog.Debian.amd64.gz
-usr/share/doc/bash/changelog.Debian.gz
-usr/share/doc/bash/changelog.gz
 usr/share/doc/bash/copyright
-usr/share/doc/bash/inputrc.arrows
 usr/share/doc/bsdutils/
-usr/share/doc/bsdutils/NEWS.Debian.gz
-usr/share/doc/bsdutils/changelog.Debian.gz
-usr/share/doc/bsdutils/changelog.gz
 usr/share/doc/bsdutils/copyright
 usr/share/doc/coreutils/
-usr/share/doc/coreutils/AUTHORS
-usr/share/doc/coreutils/NEWS.gz
-usr/share/doc/coreutils/README.Debian
-usr/share/doc/coreutils/README.gz
-usr/share/doc/coreutils/THANKS.gz
-usr/share/doc/coreutils/TODO.gz
-usr/share/doc/coreutils/changelog.Debian.gz
-usr/share/doc/coreutils/changelog.gz
 usr/share/doc/coreutils/copyright
 usr/share/doc/dash/
-usr/share/doc/dash/README.Debian.diet
-usr/share/doc/dash/README.source
-usr/share/doc/dash/changelog.Debian.gz
-usr/share/doc/dash/changelog.gz
 usr/share/doc/dash/copyright
 usr/share/doc/debconf/
-usr/share/doc/debconf/README.Debian
-usr/share/doc/debconf/changelog.gz
 usr/share/doc/debconf/copyright
 usr/share/doc/debian-archive-keyring/
-usr/share/doc/debian-archive-keyring/NEWS.Debian.gz
-usr/share/doc/debian-archive-keyring/README
-usr/share/doc/debian-archive-keyring/changelog.gz
 usr/share/doc/debian-archive-keyring/copyright
 usr/share/doc/debianutils/
-usr/share/doc/debianutils/README.shells
-usr/share/doc/debianutils/changelog.gz
 usr/share/doc/debianutils/copyright
 usr/share/doc/diffutils/
-usr/share/doc/diffutils/NEWS.gz
-usr/share/doc/diffutils/changelog.Debian.gz
-usr/share/doc/diffutils/changelog.gz
 usr/share/doc/diffutils/copyright
 usr/share/doc/dpkg/
-usr/share/doc/dpkg/AUTHORS
-usr/share/doc/dpkg/README.api
-usr/share/doc/dpkg/README.bug-usertags.gz
-usr/share/doc/dpkg/README.feature-removal-schedule.gz
-usr/share/doc/dpkg/THANKS.gz
-usr/share/doc/dpkg/changelog.gz
 usr/share/doc/dpkg/copyright
 usr/share/doc/findutils/
-usr/share/doc/findutils/NEWS.gz
-usr/share/doc/findutils/README.gz
-usr/share/doc/findutils/TODO
-usr/share/doc/findutils/changelog.Debian.gz
-usr/share/doc/findutils/changelog.gz
 usr/share/doc/findutils/copyright
 usr/share/doc/gcc-14-base/
-usr/share/doc/gcc-14-base/README.Debian.amd64.gz
-usr/share/doc/gcc-14-base/TODO.Debian
-usr/share/doc/gcc-14-base/changelog.Debian.gz
 usr/share/doc/gcc-14-base/copyright
 usr/share/doc/grep/
-usr/share/doc/grep/AUTHORS
-usr/share/doc/grep/NEWS.Debian.gz
-usr/share/doc/grep/NEWS.gz
-usr/share/doc/grep/README
-usr/share/doc/grep/THANKS.gz
-usr/share/doc/grep/TODO.gz
-usr/share/doc/grep/changelog.Debian.gz
-usr/share/doc/grep/changelog.gz
 usr/share/doc/grep/copyright
 usr/share/doc/gzip/
-usr/share/doc/gzip/NEWS.gz
-usr/share/doc/gzip/README.gz
-usr/share/doc/gzip/TODO
-usr/share/doc/gzip/changelog.Debian.gz
-usr/share/doc/gzip/changelog.gz
 usr/share/doc/gzip/copyright
 usr/share/doc/hostname/
-usr/share/doc/hostname/changelog.gz
 usr/share/doc/hostname/copyright
 usr/share/doc/init-system-helpers/
-usr/share/doc/init-system-helpers/README.invoke-rc.d.gz
-usr/share/doc/init-system-helpers/README.policy-rc.d.gz
-usr/share/doc/init-system-helpers/changelog.gz
 usr/share/doc/init-system-helpers/copyright
 usr/share/doc/libacl1/
-usr/share/doc/libacl1/changelog.Debian.amd64.gz
-usr/share/doc/libacl1/changelog.Debian.gz
-usr/share/doc/libacl1/changelog.gz
 usr/share/doc/libacl1/copyright
 usr/share/doc/libapt-pkg7.0/
-usr/share/doc/libapt-pkg7.0/NEWS.Debian.gz
-usr/share/doc/libapt-pkg7.0/changelog.gz
 usr/share/doc/libapt-pkg7.0/copyright
 usr/share/doc/libattr1/
-usr/share/doc/libattr1/changelog.Debian.gz
-usr/share/doc/libattr1/changelog.gz
 usr/share/doc/libattr1/copyright
 usr/share/doc/libaudit-common/
-usr/share/doc/libaudit-common/changelog.Debian.gz
-usr/share/doc/libaudit-common/changelog.gz
 usr/share/doc/libaudit-common/copyright
 usr/share/doc/libaudit1/
-usr/share/doc/libaudit1/changelog.Debian.amd64.gz
-usr/share/doc/libaudit1/changelog.Debian.gz
-usr/share/doc/libaudit1/changelog.gz
 usr/share/doc/libaudit1/copyright
 usr/share/doc/libblkid1/
-usr/share/doc/libblkid1/NEWS.Debian.gz
-usr/share/doc/libblkid1/changelog.Debian.gz
-usr/share/doc/libblkid1/changelog.gz
 usr/share/doc/libblkid1/copyright
 usr/share/doc/libbsd0/
-usr/share/doc/libbsd0/changelog.Debian.gz
-usr/share/doc/libbsd0/changelog.gz
 usr/share/doc/libbsd0/copyright
 usr/share/doc/libbz2-1.0/
-usr/share/doc/libbz2-1.0/changelog.Debian.gz
-usr/share/doc/libbz2-1.0/changelog.gz
 usr/share/doc/libbz2-1.0/copyright
 usr/share/doc/libc-bin/
-usr/share/doc/libc-bin/changelog.Debian.gz
-usr/share/doc/libc-bin/changelog.gz
 usr/share/doc/libc-bin/copyright
 usr/share/doc/libc6/
-usr/share/doc/libc6/NEWS.Debian.gz
-usr/share/doc/libc6/NEWS.gz
-usr/share/doc/libc6/README.Debian.gz
-usr/share/doc/libc6/README.hesiod.gz
-usr/share/doc/libc6/changelog.Debian.gz
-usr/share/doc/libc6/changelog.gz
 usr/share/doc/libc6/copyright
 usr/share/doc/libcap-ng0/
-usr/share/doc/libcap-ng0/changelog.Debian.amd64.gz
-usr/share/doc/libcap-ng0/changelog.Debian.gz
-usr/share/doc/libcap-ng0/changelog.gz
 usr/share/doc/libcap-ng0/copyright
 usr/share/doc/libcap2/
-usr/share/doc/libcap2/changelog.Debian.amd64.gz
-usr/share/doc/libcap2/changelog.Debian.gz
-usr/share/doc/libcap2/changelog.gz
 usr/share/doc/libcap2/copyright
 usr/share/doc/libcrypt1/
-usr/share/doc/libcrypt1/changelog.Debian.gz
-usr/share/doc/libcrypt1/changelog.gz
 usr/share/doc/libcrypt1/copyright
 usr/share/doc/libdb5.3t64/
-usr/share/doc/libdb5.3t64/build_signature_amd64.txt
-usr/share/doc/libdb5.3t64/changelog.Debian.gz
 usr/share/doc/libdb5.3t64/copyright
 usr/share/doc/libdebconfclient0/
-usr/share/doc/libdebconfclient0/changelog.gz
 usr/share/doc/libdebconfclient0/copyright
 usr/share/doc/libgcc-s1
 usr/share/doc/libgmp10/
-usr/share/doc/libgmp10/README.Debian
-usr/share/doc/libgmp10/changelog.Debian.gz
-usr/share/doc/libgmp10/changelog.gz
 usr/share/doc/libgmp10/copyright
 usr/share/doc/libhogweed6t64/
-usr/share/doc/libhogweed6t64/changelog.Debian.gz
-usr/share/doc/libhogweed6t64/changelog.gz
 usr/share/doc/libhogweed6t64/copyright
 usr/share/doc/liblastlog2-2/
-usr/share/doc/liblastlog2-2/NEWS.Debian.gz
-usr/share/doc/liblastlog2-2/changelog.Debian.gz
-usr/share/doc/liblastlog2-2/changelog.gz
 usr/share/doc/liblastlog2-2/copyright
 usr/share/doc/liblz4-1/
-usr/share/doc/liblz4-1/changelog.Debian.gz
 usr/share/doc/liblz4-1/copyright
 usr/share/doc/liblzma5/
-usr/share/doc/liblzma5/AUTHORS
-usr/share/doc/liblzma5/NEWS.gz
-usr/share/doc/liblzma5/THANKS.gz
-usr/share/doc/liblzma5/changelog.Debian.gz
-usr/share/doc/liblzma5/changelog.gz
 usr/share/doc/liblzma5/copyright
 usr/share/doc/libmd0/
-usr/share/doc/libmd0/changelog.Debian.amd64.gz
-usr/share/doc/libmd0/changelog.Debian.gz
-usr/share/doc/libmd0/changelog.gz
 usr/share/doc/libmd0/copyright
 usr/share/doc/libmount1/
-usr/share/doc/libmount1/NEWS.Debian.gz
-usr/share/doc/libmount1/changelog.Debian.gz
-usr/share/doc/libmount1/changelog.gz
 usr/share/doc/libmount1/copyright
 usr/share/doc/libnettle8t64/
-usr/share/doc/libnettle8t64/NEWS.gz
-usr/share/doc/libnettle8t64/README
-usr/share/doc/libnettle8t64/changelog.Debian.gz
-usr/share/doc/libnettle8t64/changelog.gz
 usr/share/doc/libnettle8t64/copyright
 usr/share/doc/libpam-modules-bin/
-usr/share/doc/libpam-modules-bin/changelog.Debian.gz
-usr/share/doc/libpam-modules-bin/changelog.gz
 usr/share/doc/libpam-modules-bin/copyright
 usr/share/doc/libpam-modules/
-usr/share/doc/libpam-modules/NEWS.Debian.gz
-usr/share/doc/libpam-modules/changelog.Debian.gz
-usr/share/doc/libpam-modules/changelog.gz
 usr/share/doc/libpam-modules/copyright
-usr/share/doc/libpam-modules/examples/
-usr/share/doc/libpam-modules/examples/upperLOWER.c
 usr/share/doc/libpam-runtime/
-usr/share/doc/libpam-runtime/changelog.Debian.gz
-usr/share/doc/libpam-runtime/changelog.gz
 usr/share/doc/libpam-runtime/copyright
 usr/share/doc/libpam0g/
-usr/share/doc/libpam0g/Debian-PAM-MiniPolicy.gz
-usr/share/doc/libpam0g/README
-usr/share/doc/libpam0g/README.Debian
-usr/share/doc/libpam0g/TODO.Debian
-usr/share/doc/libpam0g/changelog.Debian.gz
-usr/share/doc/libpam0g/changelog.gz
 usr/share/doc/libpam0g/copyright
 usr/share/doc/libpcre2-8-0/
-usr/share/doc/libpcre2-8-0/README.Debian
-usr/share/doc/libpcre2-8-0/changelog.Debian.gz
-usr/share/doc/libpcre2-8-0/changelog.gz
 usr/share/doc/libpcre2-8-0/copyright
 usr/share/doc/libseccomp2/
-usr/share/doc/libseccomp2/changelog.Debian.gz
-usr/share/doc/libseccomp2/changelog.gz
 usr/share/doc/libseccomp2/copyright
 usr/share/doc/libselinux1/
-usr/share/doc/libselinux1/changelog.Debian.gz
 usr/share/doc/libselinux1/copyright
 usr/share/doc/libsemanage-common/
-usr/share/doc/libsemanage-common/changelog.Debian.gz
 usr/share/doc/libsemanage-common/copyright
 usr/share/doc/libsemanage2/
-usr/share/doc/libsemanage2/changelog.Debian.gz
 usr/share/doc/libsemanage2/copyright
 usr/share/doc/libsepol2/
-usr/share/doc/libsepol2/changelog.Debian.gz
 usr/share/doc/libsepol2/copyright
 usr/share/doc/libsmartcols1/
-usr/share/doc/libsmartcols1/NEWS.Debian.gz
-usr/share/doc/libsmartcols1/changelog.Debian.gz
-usr/share/doc/libsmartcols1/changelog.gz
 usr/share/doc/libsmartcols1/copyright
 usr/share/doc/libsqlite3-0/
-usr/share/doc/libsqlite3-0/README.Debian
-usr/share/doc/libsqlite3-0/changelog.Debian.gz
-usr/share/doc/libsqlite3-0/changelog.gz
-usr/share/doc/libsqlite3-0/changelog.html.gz
 usr/share/doc/libsqlite3-0/copyright
 usr/share/doc/libssl3t64/
-usr/share/doc/libssl3t64/NEWS.Debian.gz
-usr/share/doc/libssl3t64/changelog.Debian.gz
-usr/share/doc/libssl3t64/changelog.gz
 usr/share/doc/libssl3t64/copyright
 usr/share/doc/libstdc++6
 usr/share/doc/libsystemd0/
-usr/share/doc/libsystemd0/NEWS.Debian.gz
-usr/share/doc/libsystemd0/changelog.Debian.gz
 usr/share/doc/libsystemd0/copyright
 usr/share/doc/libtinfo6/
-usr/share/doc/libtinfo6/changelog.Debian.gz
-usr/share/doc/libtinfo6/changelog.gz
 usr/share/doc/libtinfo6/copyright
 usr/share/doc/libudev1/
-usr/share/doc/libudev1/NEWS.Debian.gz
-usr/share/doc/libudev1/changelog.Debian.gz
 usr/share/doc/libudev1/copyright
 usr/share/doc/libuuid1/
-usr/share/doc/libuuid1/NEWS.Debian.gz
-usr/share/doc/libuuid1/changelog.Debian.gz
-usr/share/doc/libuuid1/changelog.gz
 usr/share/doc/libuuid1/copyright
 usr/share/doc/libxxhash0/
-usr/share/doc/libxxhash0/changelog.Debian.gz
-usr/share/doc/libxxhash0/changelog.gz
 usr/share/doc/libxxhash0/copyright
 usr/share/doc/libzstd1/
-usr/share/doc/libzstd1/changelog.Debian.gz
-usr/share/doc/libzstd1/changelog.gz
 usr/share/doc/libzstd1/copyright
 usr/share/doc/login.defs/
-usr/share/doc/login.defs/NEWS.Debian.gz
-usr/share/doc/login.defs/changelog.Debian.gz
-usr/share/doc/login.defs/changelog.gz
 usr/share/doc/login.defs/copyright
 usr/share/doc/login/
-usr/share/doc/login/NEWS.Debian.gz
-usr/share/doc/login/changelog.Debian.gz
-usr/share/doc/login/changelog.gz
 usr/share/doc/login/copyright
 usr/share/doc/mawk/
-usr/share/doc/mawk/ACKNOWLEDGMENT
-usr/share/doc/mawk/README
-usr/share/doc/mawk/changelog.Debian.gz
-usr/share/doc/mawk/changelog.gz
 usr/share/doc/mawk/copyright
-usr/share/doc/mawk/examples/
-usr/share/doc/mawk/examples/ct_length.awk
-usr/share/doc/mawk/examples/decl.awk
-usr/share/doc/mawk/examples/deps.awk
-usr/share/doc/mawk/examples/eatc.awk
-usr/share/doc/mawk/examples/gdecl.awk
-usr/share/doc/mawk/examples/hcal
-usr/share/doc/mawk/examples/hical
-usr/share/doc/mawk/examples/nocomment.awk
-usr/share/doc/mawk/examples/primes.awk
-usr/share/doc/mawk/examples/qsort.awk
 usr/share/doc/mount/
-usr/share/doc/mount/NEWS.Debian.gz
-usr/share/doc/mount/changelog.Debian.gz
-usr/share/doc/mount/changelog.gz
 usr/share/doc/mount/copyright
-usr/share/doc/mount/examples/
-usr/share/doc/mount/examples/filesystems
-usr/share/doc/mount/examples/fstab
-usr/share/doc/mount/examples/mount.fstab
-usr/share/doc/mount/mount.txt
 usr/share/doc/ncurses-base/
-usr/share/doc/ncurses-base/FAQ
-usr/share/doc/ncurses-base/TODO.Debian
-usr/share/doc/ncurses-base/changelog.Debian.gz
-usr/share/doc/ncurses-base/changelog.gz
 usr/share/doc/ncurses-base/copyright
 usr/share/doc/ncurses-bin/
-usr/share/doc/ncurses-bin/changelog.Debian.gz
-usr/share/doc/ncurses-bin/changelog.gz
 usr/share/doc/ncurses-bin/copyright
 usr/share/doc/openssl-provider-legacy/
-usr/share/doc/openssl-provider-legacy/changelog.Debian.gz
-usr/share/doc/openssl-provider-legacy/changelog.gz
 usr/share/doc/openssl-provider-legacy/copyright
 usr/share/doc/passwd/
-usr/share/doc/passwd/NEWS.Debian.gz
-usr/share/doc/passwd/README.Debian
-usr/share/doc/passwd/TODO.Debian
-usr/share/doc/passwd/changelog.Debian.gz
-usr/share/doc/passwd/changelog.gz
 usr/share/doc/passwd/copyright
-usr/share/doc/passwd/examples/
-usr/share/doc/passwd/examples/passwd.expire.cron
 usr/share/doc/perl-base/
-usr/share/doc/perl-base/changelog.Debian.gz
-usr/share/doc/perl-base/changelog.gz
 usr/share/doc/perl-base/copyright
-usr/share/doc/perl/
-usr/share/doc/perl/AUTHORS.gz
-usr/share/doc/perl/Documentation
 usr/share/doc/sed/
-usr/share/doc/sed/AUTHORS
-usr/share/doc/sed/BUGS.gz
-usr/share/doc/sed/NEWS.gz
-usr/share/doc/sed/README
-usr/share/doc/sed/THANKS.gz
-usr/share/doc/sed/changelog.Debian.gz
-usr/share/doc/sed/changelog.gz
 usr/share/doc/sed/copyright
-usr/share/doc/sed/examples/
-usr/share/doc/sed/examples/dc.sed
-usr/share/doc/sed/sedfaq.txt.gz
 usr/share/doc/sqv/
-usr/share/doc/sqv/NEWS.gz
-usr/share/doc/sqv/changelog.Debian.amd64.gz
-usr/share/doc/sqv/changelog.Debian.gz
 usr/share/doc/sqv/copyright
 usr/share/doc/sysvinit-utils/
-usr/share/doc/sysvinit-utils/changelog.Debian.gz
 usr/share/doc/sysvinit-utils/copyright
 usr/share/doc/tar/
-usr/share/doc/tar/AUTHORS
-usr/share/doc/tar/NEWS.gz
-usr/share/doc/tar/README.Debian
-usr/share/doc/tar/THANKS.gz
-usr/share/doc/tar/changelog.1.gz
-usr/share/doc/tar/changelog.Debian.gz
-usr/share/doc/tar/changelog.gz
 usr/share/doc/tar/copyright
 usr/share/doc/tzdata/
-usr/share/doc/tzdata/NEWS.Debian.gz
-usr/share/doc/tzdata/README.Debian
-usr/share/doc/tzdata/changelog.Debian.gz
-usr/share/doc/tzdata/changelog.gz
 usr/share/doc/tzdata/copyright
 usr/share/doc/util-linux/
-usr/share/doc/util-linux/00-about-docs.txt
-usr/share/doc/util-linux/AUTHORS.gz
-usr/share/doc/util-linux/NEWS.Debian.gz
-usr/share/doc/util-linux/PAM-configuration.txt
-usr/share/doc/util-linux/README.Debian
-usr/share/doc/util-linux/blkid.txt
-usr/share/doc/util-linux/cal.txt
-usr/share/doc/util-linux/changelog.Debian.gz
-usr/share/doc/util-linux/changelog.gz
-usr/share/doc/util-linux/col.txt
 usr/share/doc/util-linux/copyright
-usr/share/doc/util-linux/deprecated.txt
-usr/share/doc/util-linux/examples/
-usr/share/doc/util-linux/examples/getopt-example.bash
-usr/share/doc/util-linux/getopt.txt
-usr/share/doc/util-linux/getopt_changelog.txt
-usr/share/doc/util-linux/howto-build-sys.txt
-usr/share/doc/util-linux/howto-compilation.txt
-usr/share/doc/util-linux/howto-contribute.txt.gz
-usr/share/doc/util-linux/howto-debug.txt
-usr/share/doc/util-linux/howto-man-page.txt
-usr/share/doc/util-linux/howto-pull-request.txt.gz
-usr/share/doc/util-linux/howto-tests.txt
-usr/share/doc/util-linux/howto-usage-function.txt.gz
-usr/share/doc/util-linux/hwclock.txt
-usr/share/doc/util-linux/modems-with-agetty.txt
-usr/share/doc/util-linux/mount.txt
-usr/share/doc/util-linux/parse-date.txt.gz
-usr/share/doc/util-linux/pg.txt
-usr/share/doc/util-linux/poeigl.txt.gz
-usr/share/doc/util-linux/release-schedule.txt
-usr/share/doc/util-linux/releases/
-usr/share/doc/util-linux/releases/v2.13-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.14-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.15-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.16-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.17-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.18-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.19-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.20-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.21-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.22-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.23-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.24-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.25-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.26-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.27-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.28-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.29-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.30-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.31-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.32-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.33-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.34-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.35-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.36-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.37-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.38-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.39-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.40-ReleaseNotes.gz
-usr/share/doc/util-linux/releases/v2.41-ReleaseNotes.gz
 usr/share/doc/zlib1g/
-usr/share/doc/zlib1g/changelog.Debian.amd64.gz
-usr/share/doc/zlib1g/changelog.Debian.gz
-usr/share/doc/zlib1g/changelog.gz
 usr/share/doc/zlib1g/copyright
 usr/share/dpkg/
 usr/share/dpkg/abitable
@@ -2393,14 +2061,6 @@
 usr/share/gdb/auto-load/usr/lib/x86_64-linux-gnu/
 usr/share/gdb/auto-load/usr/lib/x86_64-linux-gnu/libstdc++.so.6.0.33-gdb.py
 usr/share/info/
-usr/share/info/coreutils.info.gz
-usr/share/info/diffutils.info.gz
-usr/share/info/dir
-usr/share/info/find-maint.info.gz
-usr/share/info/find.info.gz
-usr/share/info/grep.info.gz
-usr/share/info/gzip.info.gz
-usr/share/info/sed.info.gz
 usr/share/keyrings/
 usr/share/keyrings/debian-archive-bookworm-automatic.gpg
 usr/share/keyrings/debian-archive-bookworm-automatic.pgp
@@ -2428,1847 +2088,15 @@
 usr/share/libc-bin/nsswitch.conf
 usr/share/lintian/
 usr/share/lintian/overrides/
-usr/share/lintian/overrides/apt
-usr/share/lintian/overrides/base-files
-usr/share/lintian/overrides/base-passwd
-usr/share/lintian/overrides/bash
-usr/share/lintian/overrides/bsdutils
-usr/share/lintian/overrides/coreutils
-usr/share/lintian/overrides/dash
-usr/share/lintian/overrides/debconf
-usr/share/lintian/overrides/dpkg
-usr/share/lintian/overrides/init-system-helpers
-usr/share/lintian/overrides/libacl1
-usr/share/lintian/overrides/libattr1
-usr/share/lintian/overrides/libblkid1
-usr/share/lintian/overrides/libbsd0
-usr/share/lintian/overrides/libc-bin
-usr/share/lintian/overrides/libc6
-usr/share/lintian/overrides/libdb5.3t64
-usr/share/lintian/overrides/libgcc-s1
-usr/share/lintian/overrides/libhogweed6t64
-usr/share/lintian/overrides/libmount1
-usr/share/lintian/overrides/libnettle8t64
-usr/share/lintian/overrides/libpam-modules
-usr/share/lintian/overrides/libpam-modules-bin
-usr/share/lintian/overrides/libpam-runtime
-usr/share/lintian/overrides/libpam0g
-usr/share/lintian/overrides/libsmartcols1
-usr/share/lintian/overrides/libssl3t64
-usr/share/lintian/overrides/login
-usr/share/lintian/overrides/mount
-usr/share/lintian/overrides/ncurses-base
-usr/share/lintian/overrides/passwd
-usr/share/lintian/overrides/perl-base
-usr/share/lintian/overrides/tzdata
-usr/share/lintian/overrides/util-linux
 usr/share/lintian/profiles/
 usr/share/lintian/profiles/dpkg/
 usr/share/lintian/profiles/dpkg/main.profile
 usr/share/locale/
-usr/share/locale/af/
-usr/share/locale/af/LC_MESSAGES/
-usr/share/locale/af/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/af/LC_MESSAGES/bash.mo
-usr/share/locale/af/LC_MESSAGES/coreutils.mo
-usr/share/locale/af/LC_MESSAGES/grep.mo
-usr/share/locale/af/LC_MESSAGES/sed.mo
-usr/share/locale/af/LC_TIME/
-usr/share/locale/af/LC_TIME/coreutils.mo
-usr/share/locale/am/
-usr/share/locale/am/LC_MESSAGES/
-usr/share/locale/am/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ar/
-usr/share/locale/ar/LC_MESSAGES/
-usr/share/locale/ar/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ar/LC_MESSAGES/apt.mo
-usr/share/locale/ar/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/as/
-usr/share/locale/as/LC_MESSAGES/
-usr/share/locale/as/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ast/
-usr/share/locale/ast/LC_MESSAGES/
-usr/share/locale/ast/LC_MESSAGES/apt.mo
-usr/share/locale/ast/LC_MESSAGES/dpkg.mo
-usr/share/locale/ast/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/ast/LC_MESSAGES/sed.mo
-usr/share/locale/az/
-usr/share/locale/az/LC_MESSAGES/
-usr/share/locale/az/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/be/
-usr/share/locale/be/LC_MESSAGES/
-usr/share/locale/be/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/be/LC_MESSAGES/coreutils.mo
-usr/share/locale/be/LC_MESSAGES/findutils.mo
-usr/share/locale/be/LC_MESSAGES/grep.mo
-usr/share/locale/be/LC_TIME/
-usr/share/locale/be/LC_TIME/coreutils.mo
-usr/share/locale/bg/
-usr/share/locale/bg/LC_MESSAGES/
-usr/share/locale/bg/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/bg/LC_MESSAGES/apt.mo
-usr/share/locale/bg/LC_MESSAGES/bash.mo
-usr/share/locale/bg/LC_MESSAGES/coreutils.mo
-usr/share/locale/bg/LC_MESSAGES/diffutils.mo
-usr/share/locale/bg/LC_MESSAGES/findutils.mo
-usr/share/locale/bg/LC_MESSAGES/grep.mo
-usr/share/locale/bg/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/bg/LC_MESSAGES/sed.mo
-usr/share/locale/bg/LC_MESSAGES/tar.mo
-usr/share/locale/bg/LC_TIME/
-usr/share/locale/bg/LC_TIME/coreutils.mo
-usr/share/locale/bn/
-usr/share/locale/bn/LC_MESSAGES/
-usr/share/locale/bn/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/bn_IN/
-usr/share/locale/bn_IN/LC_MESSAGES/
-usr/share/locale/bn_IN/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/bs/
-usr/share/locale/bs/LC_MESSAGES/
-usr/share/locale/bs/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/bs/LC_MESSAGES/apt.mo
-usr/share/locale/bs/LC_MESSAGES/dpkg.mo
-usr/share/locale/bs/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/bs/LC_MESSAGES/shadow.mo
-usr/share/locale/ca/
-usr/share/locale/ca/LC_MESSAGES/
-usr/share/locale/ca/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ca/LC_MESSAGES/apt.mo
-usr/share/locale/ca/LC_MESSAGES/bash.mo
-usr/share/locale/ca/LC_MESSAGES/coreutils.mo
-usr/share/locale/ca/LC_MESSAGES/diffutils.mo
-usr/share/locale/ca/LC_MESSAGES/dpkg.mo
-usr/share/locale/ca/LC_MESSAGES/findutils.mo
-usr/share/locale/ca/LC_MESSAGES/grep.mo
-usr/share/locale/ca/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/ca/LC_MESSAGES/sed.mo
-usr/share/locale/ca/LC_MESSAGES/shadow.mo
-usr/share/locale/ca/LC_MESSAGES/tar.mo
-usr/share/locale/ca/LC_TIME/
-usr/share/locale/ca/LC_TIME/coreutils.mo
-usr/share/locale/cs/
-usr/share/locale/cs/LC_MESSAGES/
-usr/share/locale/cs/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/cs/LC_MESSAGES/apt.mo
-usr/share/locale/cs/LC_MESSAGES/bash.mo
-usr/share/locale/cs/LC_MESSAGES/coreutils.mo
-usr/share/locale/cs/LC_MESSAGES/diffutils.mo
-usr/share/locale/cs/LC_MESSAGES/dpkg.mo
-usr/share/locale/cs/LC_MESSAGES/findutils.mo
-usr/share/locale/cs/LC_MESSAGES/grep.mo
-usr/share/locale/cs/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/cs/LC_MESSAGES/sed.mo
-usr/share/locale/cs/LC_MESSAGES/shadow.mo
-usr/share/locale/cs/LC_MESSAGES/tar.mo
-usr/share/locale/cs/LC_TIME/
-usr/share/locale/cs/LC_TIME/coreutils.mo
-usr/share/locale/cy/
-usr/share/locale/cy/LC_MESSAGES/
-usr/share/locale/cy/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/cy/LC_MESSAGES/apt.mo
-usr/share/locale/cy/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/da/
-usr/share/locale/da/LC_MESSAGES/
-usr/share/locale/da/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/da/LC_MESSAGES/apt.mo
-usr/share/locale/da/LC_MESSAGES/bash.mo
-usr/share/locale/da/LC_MESSAGES/coreutils.mo
-usr/share/locale/da/LC_MESSAGES/diffutils.mo
-usr/share/locale/da/LC_MESSAGES/dpkg.mo
-usr/share/locale/da/LC_MESSAGES/findutils.mo
-usr/share/locale/da/LC_MESSAGES/grep.mo
-usr/share/locale/da/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/da/LC_MESSAGES/sed.mo
-usr/share/locale/da/LC_MESSAGES/shadow.mo
-usr/share/locale/da/LC_MESSAGES/tar.mo
-usr/share/locale/da/LC_TIME/
-usr/share/locale/da/LC_TIME/coreutils.mo
-usr/share/locale/de/
-usr/share/locale/de/LC_MESSAGES/
-usr/share/locale/de/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/de/LC_MESSAGES/apt.mo
-usr/share/locale/de/LC_MESSAGES/bash.mo
-usr/share/locale/de/LC_MESSAGES/coreutils.mo
-usr/share/locale/de/LC_MESSAGES/diffutils.mo
-usr/share/locale/de/LC_MESSAGES/dpkg.mo
-usr/share/locale/de/LC_MESSAGES/findutils.mo
-usr/share/locale/de/LC_MESSAGES/grep.mo
-usr/share/locale/de/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/de/LC_MESSAGES/sed.mo
-usr/share/locale/de/LC_MESSAGES/shadow.mo
-usr/share/locale/de/LC_MESSAGES/tar.mo
-usr/share/locale/de/LC_TIME/
-usr/share/locale/de/LC_TIME/coreutils.mo
-usr/share/locale/de_CH/
-usr/share/locale/de_CH/LC_MESSAGES/
-usr/share/locale/de_CH/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/dz/
-usr/share/locale/dz/LC_MESSAGES/
-usr/share/locale/dz/LC_MESSAGES/apt.mo
-usr/share/locale/dz/LC_MESSAGES/dpkg.mo
-usr/share/locale/dz/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/dz/LC_MESSAGES/shadow.mo
-usr/share/locale/el/
-usr/share/locale/el/LC_MESSAGES/
-usr/share/locale/el/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/el/LC_MESSAGES/apt.mo
-usr/share/locale/el/LC_MESSAGES/bash.mo
-usr/share/locale/el/LC_MESSAGES/coreutils.mo
-usr/share/locale/el/LC_MESSAGES/diffutils.mo
-usr/share/locale/el/LC_MESSAGES/dpkg.mo
-usr/share/locale/el/LC_MESSAGES/findutils.mo
-usr/share/locale/el/LC_MESSAGES/grep.mo
-usr/share/locale/el/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/el/LC_MESSAGES/sed.mo
-usr/share/locale/el/LC_MESSAGES/shadow.mo
-usr/share/locale/el/LC_MESSAGES/tar.mo
-usr/share/locale/el/LC_TIME/
-usr/share/locale/el/LC_TIME/coreutils.mo
-usr/share/locale/en@boldquot/
-usr/share/locale/en@boldquot/LC_MESSAGES/
-usr/share/locale/en@boldquot/LC_MESSAGES/bash.mo
-usr/share/locale/en@quot/
-usr/share/locale/en@quot/LC_MESSAGES/
-usr/share/locale/en@quot/LC_MESSAGES/bash.mo
-usr/share/locale/eo/
-usr/share/locale/eo/LC_MESSAGES/
-usr/share/locale/eo/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/eo/LC_MESSAGES/bash.mo
-usr/share/locale/eo/LC_MESSAGES/coreutils.mo
-usr/share/locale/eo/LC_MESSAGES/diffutils.mo
-usr/share/locale/eo/LC_MESSAGES/dpkg.mo
-usr/share/locale/eo/LC_MESSAGES/findutils.mo
-usr/share/locale/eo/LC_MESSAGES/grep.mo
-usr/share/locale/eo/LC_MESSAGES/sed.mo
-usr/share/locale/eo/LC_MESSAGES/tar.mo
-usr/share/locale/eo/LC_TIME/
-usr/share/locale/eo/LC_TIME/coreutils.mo
-usr/share/locale/es/
-usr/share/locale/es/LC_MESSAGES/
-usr/share/locale/es/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/es/LC_MESSAGES/apt.mo
-usr/share/locale/es/LC_MESSAGES/bash.mo
-usr/share/locale/es/LC_MESSAGES/coreutils.mo
-usr/share/locale/es/LC_MESSAGES/diffutils.mo
-usr/share/locale/es/LC_MESSAGES/dpkg.mo
-usr/share/locale/es/LC_MESSAGES/findutils.mo
-usr/share/locale/es/LC_MESSAGES/grep.mo
-usr/share/locale/es/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/es/LC_MESSAGES/sed.mo
-usr/share/locale/es/LC_MESSAGES/shadow.mo
-usr/share/locale/es/LC_MESSAGES/tar.mo
-usr/share/locale/es/LC_TIME/
-usr/share/locale/es/LC_TIME/coreutils.mo
-usr/share/locale/et/
-usr/share/locale/et/LC_MESSAGES/
-usr/share/locale/et/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/et/LC_MESSAGES/bash.mo
-usr/share/locale/et/LC_MESSAGES/coreutils.mo
-usr/share/locale/et/LC_MESSAGES/dpkg.mo
-usr/share/locale/et/LC_MESSAGES/findutils.mo
-usr/share/locale/et/LC_MESSAGES/grep.mo
-usr/share/locale/et/LC_MESSAGES/sed.mo
-usr/share/locale/et/LC_MESSAGES/tar.mo
-usr/share/locale/et/LC_TIME/
-usr/share/locale/et/LC_TIME/coreutils.mo
-usr/share/locale/eu/
-usr/share/locale/eu/LC_MESSAGES/
-usr/share/locale/eu/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/eu/LC_MESSAGES/apt.mo
-usr/share/locale/eu/LC_MESSAGES/coreutils.mo
-usr/share/locale/eu/LC_MESSAGES/dpkg.mo
-usr/share/locale/eu/LC_MESSAGES/grep.mo
-usr/share/locale/eu/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/eu/LC_MESSAGES/sed.mo
-usr/share/locale/eu/LC_MESSAGES/shadow.mo
-usr/share/locale/eu/LC_MESSAGES/tar.mo
-usr/share/locale/eu/LC_TIME/
-usr/share/locale/eu/LC_TIME/coreutils.mo
-usr/share/locale/fa/
-usr/share/locale/fa/LC_MESSAGES/
-usr/share/locale/fa/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/fi/
-usr/share/locale/fi/LC_MESSAGES/
-usr/share/locale/fi/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/fi/LC_MESSAGES/apt.mo
-usr/share/locale/fi/LC_MESSAGES/bash.mo
-usr/share/locale/fi/LC_MESSAGES/coreutils.mo
-usr/share/locale/fi/LC_MESSAGES/diffutils.mo
-usr/share/locale/fi/LC_MESSAGES/findutils.mo
-usr/share/locale/fi/LC_MESSAGES/grep.mo
-usr/share/locale/fi/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/fi/LC_MESSAGES/sed.mo
-usr/share/locale/fi/LC_MESSAGES/shadow.mo
-usr/share/locale/fi/LC_MESSAGES/tar.mo
-usr/share/locale/fi/LC_TIME/
-usr/share/locale/fi/LC_TIME/coreutils.mo
-usr/share/locale/fr/
-usr/share/locale/fr/LC_MESSAGES/
-usr/share/locale/fr/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/fr/LC_MESSAGES/apt.mo
-usr/share/locale/fr/LC_MESSAGES/bash.mo
-usr/share/locale/fr/LC_MESSAGES/coreutils.mo
-usr/share/locale/fr/LC_MESSAGES/diffutils.mo
-usr/share/locale/fr/LC_MESSAGES/dpkg.mo
-usr/share/locale/fr/LC_MESSAGES/findutils.mo
-usr/share/locale/fr/LC_MESSAGES/grep.mo
-usr/share/locale/fr/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/fr/LC_MESSAGES/sed.mo
-usr/share/locale/fr/LC_MESSAGES/shadow.mo
-usr/share/locale/fr/LC_MESSAGES/tar.mo
-usr/share/locale/fr/LC_TIME/
-usr/share/locale/fr/LC_TIME/coreutils.mo
-usr/share/locale/ga/
-usr/share/locale/ga/LC_MESSAGES/
-usr/share/locale/ga/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ga/LC_MESSAGES/bash.mo
-usr/share/locale/ga/LC_MESSAGES/coreutils.mo
-usr/share/locale/ga/LC_MESSAGES/diffutils.mo
-usr/share/locale/ga/LC_MESSAGES/findutils.mo
-usr/share/locale/ga/LC_MESSAGES/grep.mo
-usr/share/locale/ga/LC_MESSAGES/sed.mo
-usr/share/locale/ga/LC_MESSAGES/tar.mo
-usr/share/locale/ga/LC_TIME/
-usr/share/locale/ga/LC_TIME/coreutils.mo
-usr/share/locale/gl/
-usr/share/locale/gl/LC_MESSAGES/
-usr/share/locale/gl/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/gl/LC_MESSAGES/apt.mo
-usr/share/locale/gl/LC_MESSAGES/bash.mo
-usr/share/locale/gl/LC_MESSAGES/coreutils.mo
-usr/share/locale/gl/LC_MESSAGES/diffutils.mo
-usr/share/locale/gl/LC_MESSAGES/dpkg.mo
-usr/share/locale/gl/LC_MESSAGES/findutils.mo
-usr/share/locale/gl/LC_MESSAGES/grep.mo
-usr/share/locale/gl/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/gl/LC_MESSAGES/sed.mo
-usr/share/locale/gl/LC_MESSAGES/shadow.mo
-usr/share/locale/gl/LC_MESSAGES/tar.mo
-usr/share/locale/gl/LC_TIME/
-usr/share/locale/gl/LC_TIME/coreutils.mo
-usr/share/locale/gu/
-usr/share/locale/gu/LC_MESSAGES/
-usr/share/locale/gu/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/he/
-usr/share/locale/he/LC_MESSAGES/
-usr/share/locale/he/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/he/LC_MESSAGES/diffutils.mo
-usr/share/locale/he/LC_MESSAGES/grep.mo
-usr/share/locale/he/LC_MESSAGES/sed.mo
-usr/share/locale/he/LC_MESSAGES/shadow.mo
-usr/share/locale/hi/
-usr/share/locale/hi/LC_MESSAGES/
-usr/share/locale/hi/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/hr/
-usr/share/locale/hr/LC_MESSAGES/
-usr/share/locale/hr/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/hr/LC_MESSAGES/bash.mo
-usr/share/locale/hr/LC_MESSAGES/coreutils.mo
-usr/share/locale/hr/LC_MESSAGES/diffutils.mo
-usr/share/locale/hr/LC_MESSAGES/findutils.mo
-usr/share/locale/hr/LC_MESSAGES/grep.mo
-usr/share/locale/hr/LC_MESSAGES/sed.mo
-usr/share/locale/hr/LC_MESSAGES/tar.mo
-usr/share/locale/hr/LC_TIME/
-usr/share/locale/hr/LC_TIME/coreutils.mo
-usr/share/locale/hu/
-usr/share/locale/hu/LC_MESSAGES/
-usr/share/locale/hu/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/hu/LC_MESSAGES/apt.mo
-usr/share/locale/hu/LC_MESSAGES/bash.mo
-usr/share/locale/hu/LC_MESSAGES/coreutils.mo
-usr/share/locale/hu/LC_MESSAGES/diffutils.mo
-usr/share/locale/hu/LC_MESSAGES/dpkg.mo
-usr/share/locale/hu/LC_MESSAGES/findutils.mo
-usr/share/locale/hu/LC_MESSAGES/grep.mo
-usr/share/locale/hu/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/hu/LC_MESSAGES/sed.mo
-usr/share/locale/hu/LC_MESSAGES/shadow.mo
-usr/share/locale/hu/LC_MESSAGES/tar.mo
-usr/share/locale/hu/LC_TIME/
-usr/share/locale/hu/LC_TIME/coreutils.mo
-usr/share/locale/ia/
-usr/share/locale/ia/LC_MESSAGES/
-usr/share/locale/ia/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ia/LC_MESSAGES/coreutils.mo
-usr/share/locale/ia/LC_TIME/
-usr/share/locale/ia/LC_TIME/coreutils.mo
-usr/share/locale/id/
-usr/share/locale/id/LC_MESSAGES/
-usr/share/locale/id/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/id/LC_MESSAGES/bash.mo
-usr/share/locale/id/LC_MESSAGES/coreutils.mo
-usr/share/locale/id/LC_MESSAGES/diffutils.mo
-usr/share/locale/id/LC_MESSAGES/dpkg.mo
-usr/share/locale/id/LC_MESSAGES/findutils.mo
-usr/share/locale/id/LC_MESSAGES/grep.mo
-usr/share/locale/id/LC_MESSAGES/sed.mo
-usr/share/locale/id/LC_MESSAGES/shadow.mo
-usr/share/locale/id/LC_MESSAGES/tar.mo
-usr/share/locale/id/LC_TIME/
-usr/share/locale/id/LC_TIME/coreutils.mo
-usr/share/locale/is/
-usr/share/locale/is/LC_MESSAGES/
-usr/share/locale/is/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/it/
-usr/share/locale/it/LC_MESSAGES/
-usr/share/locale/it/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/it/LC_MESSAGES/apt.mo
-usr/share/locale/it/LC_MESSAGES/bash.mo
-usr/share/locale/it/LC_MESSAGES/coreutils.mo
-usr/share/locale/it/LC_MESSAGES/diffutils.mo
-usr/share/locale/it/LC_MESSAGES/dpkg.mo
-usr/share/locale/it/LC_MESSAGES/findutils.mo
-usr/share/locale/it/LC_MESSAGES/grep.mo
-usr/share/locale/it/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/it/LC_MESSAGES/sed.mo
-usr/share/locale/it/LC_MESSAGES/shadow.mo
-usr/share/locale/it/LC_MESSAGES/tar.mo
-usr/share/locale/it/LC_TIME/
-usr/share/locale/it/LC_TIME/coreutils.mo
-usr/share/locale/ja/
-usr/share/locale/ja/LC_MESSAGES/
-usr/share/locale/ja/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ja/LC_MESSAGES/apt.mo
-usr/share/locale/ja/LC_MESSAGES/bash.mo
-usr/share/locale/ja/LC_MESSAGES/coreutils.mo
-usr/share/locale/ja/LC_MESSAGES/diffutils.mo
-usr/share/locale/ja/LC_MESSAGES/dpkg.mo
-usr/share/locale/ja/LC_MESSAGES/findutils.mo
-usr/share/locale/ja/LC_MESSAGES/grep.mo
-usr/share/locale/ja/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/ja/LC_MESSAGES/sed.mo
-usr/share/locale/ja/LC_MESSAGES/shadow.mo
-usr/share/locale/ja/LC_MESSAGES/tar.mo
-usr/share/locale/ja/LC_TIME/
-usr/share/locale/ja/LC_TIME/coreutils.mo
-usr/share/locale/ka/
-usr/share/locale/ka/LC_MESSAGES/
-usr/share/locale/ka/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ka/LC_MESSAGES/coreutils.mo
-usr/share/locale/ka/LC_MESSAGES/diffutils.mo
-usr/share/locale/ka/LC_MESSAGES/findutils.mo
-usr/share/locale/ka/LC_MESSAGES/grep.mo
-usr/share/locale/ka/LC_MESSAGES/sed.mo
-usr/share/locale/ka/LC_MESSAGES/shadow.mo
-usr/share/locale/ka/LC_MESSAGES/tar.mo
-usr/share/locale/ka/LC_TIME/
-usr/share/locale/ka/LC_TIME/coreutils.mo
-usr/share/locale/kk/
-usr/share/locale/kk/LC_MESSAGES/
-usr/share/locale/kk/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/kk/LC_MESSAGES/coreutils.mo
-usr/share/locale/kk/LC_MESSAGES/shadow.mo
-usr/share/locale/kk/LC_TIME/
-usr/share/locale/kk/LC_TIME/coreutils.mo
-usr/share/locale/km/
-usr/share/locale/km/LC_MESSAGES/
-usr/share/locale/km/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/km/LC_MESSAGES/apt.mo
-usr/share/locale/km/LC_MESSAGES/dpkg.mo
-usr/share/locale/km/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/km/LC_MESSAGES/shadow.mo
-usr/share/locale/kn/
-usr/share/locale/kn/LC_MESSAGES/
-usr/share/locale/kn/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ko/
-usr/share/locale/ko/LC_MESSAGES/
-usr/share/locale/ko/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ko/LC_MESSAGES/apt.mo
-usr/share/locale/ko/LC_MESSAGES/bash.mo
-usr/share/locale/ko/LC_MESSAGES/coreutils.mo
-usr/share/locale/ko/LC_MESSAGES/diffutils.mo
-usr/share/locale/ko/LC_MESSAGES/dpkg.mo
-usr/share/locale/ko/LC_MESSAGES/findutils.mo
-usr/share/locale/ko/LC_MESSAGES/grep.mo
-usr/share/locale/ko/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/ko/LC_MESSAGES/sed.mo
-usr/share/locale/ko/LC_MESSAGES/shadow.mo
-usr/share/locale/ko/LC_MESSAGES/tar.mo
-usr/share/locale/ko/LC_TIME/
-usr/share/locale/ko/LC_TIME/coreutils.mo
-usr/share/locale/ku/
-usr/share/locale/ku/LC_MESSAGES/
-usr/share/locale/ku/LC_MESSAGES/apt.mo
-usr/share/locale/ku/LC_MESSAGES/dpkg.mo
-usr/share/locale/ku/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/kw_GB/
-usr/share/locale/kw_GB/LC_MESSAGES/
-usr/share/locale/kw_GB/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ky/
-usr/share/locale/ky/LC_MESSAGES/
-usr/share/locale/ky/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ky/LC_MESSAGES/grep.mo
-usr/share/locale/ky/LC_MESSAGES/tar.mo
-usr/share/locale/lg/
-usr/share/locale/lg/LC_MESSAGES/
-usr/share/locale/lg/LC_MESSAGES/coreutils.mo
-usr/share/locale/lg/LC_MESSAGES/findutils.mo
-usr/share/locale/lg/LC_TIME/
-usr/share/locale/lg/LC_TIME/coreutils.mo
-usr/share/locale/lt/
-usr/share/locale/lt/LC_MESSAGES/
-usr/share/locale/lt/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/lt/LC_MESSAGES/apt.mo
-usr/share/locale/lt/LC_MESSAGES/bash.mo
-usr/share/locale/lt/LC_MESSAGES/coreutils.mo
-usr/share/locale/lt/LC_MESSAGES/dpkg.mo
-usr/share/locale/lt/LC_MESSAGES/findutils.mo
-usr/share/locale/lt/LC_MESSAGES/grep.mo
-usr/share/locale/lt/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/lt/LC_TIME/
-usr/share/locale/lt/LC_TIME/coreutils.mo
-usr/share/locale/lv/
-usr/share/locale/lv/LC_MESSAGES/
-usr/share/locale/lv/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/lv/LC_MESSAGES/diffutils.mo
-usr/share/locale/mk/
-usr/share/locale/mk/LC_MESSAGES/
-usr/share/locale/mk/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ml/
-usr/share/locale/ml/LC_MESSAGES/
-usr/share/locale/ml/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/mn/
-usr/share/locale/mn/LC_MESSAGES/
-usr/share/locale/mn/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/mr/
-usr/share/locale/mr/LC_MESSAGES/
-usr/share/locale/mr/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/mr/LC_MESSAGES/apt.mo
-usr/share/locale/mr/LC_MESSAGES/dpkg.mo
-usr/share/locale/mr/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/ms/
-usr/share/locale/ms/LC_MESSAGES/
-usr/share/locale/ms/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ms/LC_MESSAGES/coreutils.mo
-usr/share/locale/ms/LC_MESSAGES/diffutils.mo
-usr/share/locale/ms/LC_MESSAGES/findutils.mo
-usr/share/locale/ms/LC_MESSAGES/tar.mo
-usr/share/locale/ms/LC_TIME/
-usr/share/locale/ms/LC_TIME/coreutils.mo
-usr/share/locale/my/
-usr/share/locale/my/LC_MESSAGES/
-usr/share/locale/my/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/nb/
-usr/share/locale/nb/LC_MESSAGES/
-usr/share/locale/nb/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/nb/LC_MESSAGES/apt.mo
-usr/share/locale/nb/LC_MESSAGES/bash.mo
-usr/share/locale/nb/LC_MESSAGES/coreutils.mo
-usr/share/locale/nb/LC_MESSAGES/diffutils.mo
-usr/share/locale/nb/LC_MESSAGES/dpkg.mo
-usr/share/locale/nb/LC_MESSAGES/findutils.mo
-usr/share/locale/nb/LC_MESSAGES/grep.mo
-usr/share/locale/nb/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/nb/LC_MESSAGES/sed.mo
-usr/share/locale/nb/LC_MESSAGES/shadow.mo
-usr/share/locale/nb/LC_MESSAGES/tar.mo
-usr/share/locale/nb/LC_TIME/
-usr/share/locale/nb/LC_TIME/coreutils.mo
-usr/share/locale/ne/
-usr/share/locale/ne/LC_MESSAGES/
-usr/share/locale/ne/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ne/LC_MESSAGES/apt.mo
-usr/share/locale/ne/LC_MESSAGES/dpkg.mo
-usr/share/locale/ne/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/ne/LC_MESSAGES/shadow.mo
-usr/share/locale/nl/
-usr/share/locale/nl/LC_MESSAGES/
-usr/share/locale/nl/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/nl/LC_MESSAGES/apt.mo
-usr/share/locale/nl/LC_MESSAGES/bash.mo
-usr/share/locale/nl/LC_MESSAGES/coreutils.mo
-usr/share/locale/nl/LC_MESSAGES/diffutils.mo
-usr/share/locale/nl/LC_MESSAGES/dpkg.mo
-usr/share/locale/nl/LC_MESSAGES/findutils.mo
-usr/share/locale/nl/LC_MESSAGES/grep.mo
-usr/share/locale/nl/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/nl/LC_MESSAGES/sed.mo
-usr/share/locale/nl/LC_MESSAGES/shadow.mo
-usr/share/locale/nl/LC_MESSAGES/tar.mo
-usr/share/locale/nl/LC_TIME/
-usr/share/locale/nl/LC_TIME/coreutils.mo
-usr/share/locale/nn/
-usr/share/locale/nn/LC_MESSAGES/
-usr/share/locale/nn/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/nn/LC_MESSAGES/apt.mo
-usr/share/locale/nn/LC_MESSAGES/dpkg.mo
-usr/share/locale/nn/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/nn/LC_MESSAGES/shadow.mo
-usr/share/locale/oc/
-usr/share/locale/oc/LC_MESSAGES/
-usr/share/locale/oc/LC_MESSAGES/dpkg.mo
-usr/share/locale/or/
-usr/share/locale/or/LC_MESSAGES/
-usr/share/locale/or/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/pa/
-usr/share/locale/pa/LC_MESSAGES/
-usr/share/locale/pa/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/pa/LC_MESSAGES/dpkg.mo
-usr/share/locale/pa/LC_MESSAGES/grep.mo
-usr/share/locale/pl/
-usr/share/locale/pl/LC_MESSAGES/
-usr/share/locale/pl/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/pl/LC_MESSAGES/apt.mo
-usr/share/locale/pl/LC_MESSAGES/bash.mo
-usr/share/locale/pl/LC_MESSAGES/coreutils.mo
-usr/share/locale/pl/LC_MESSAGES/diffutils.mo
-usr/share/locale/pl/LC_MESSAGES/dpkg.mo
-usr/share/locale/pl/LC_MESSAGES/findutils.mo
-usr/share/locale/pl/LC_MESSAGES/grep.mo
-usr/share/locale/pl/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/pl/LC_MESSAGES/sed.mo
-usr/share/locale/pl/LC_MESSAGES/shadow.mo
-usr/share/locale/pl/LC_MESSAGES/tar.mo
-usr/share/locale/pl/LC_TIME/
-usr/share/locale/pl/LC_TIME/coreutils.mo
-usr/share/locale/pt/
-usr/share/locale/pt/LC_MESSAGES/
-usr/share/locale/pt/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/pt/LC_MESSAGES/apt.mo
-usr/share/locale/pt/LC_MESSAGES/bash.mo
-usr/share/locale/pt/LC_MESSAGES/coreutils.mo
-usr/share/locale/pt/LC_MESSAGES/diffutils.mo
-usr/share/locale/pt/LC_MESSAGES/dpkg.mo
-usr/share/locale/pt/LC_MESSAGES/findutils.mo
-usr/share/locale/pt/LC_MESSAGES/grep.mo
-usr/share/locale/pt/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/pt/LC_MESSAGES/sed.mo
-usr/share/locale/pt/LC_MESSAGES/shadow.mo
-usr/share/locale/pt/LC_MESSAGES/tar.mo
-usr/share/locale/pt/LC_TIME/
-usr/share/locale/pt/LC_TIME/coreutils.mo
-usr/share/locale/pt_BR/
-usr/share/locale/pt_BR/LC_MESSAGES/
-usr/share/locale/pt_BR/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/pt_BR/LC_MESSAGES/apt.mo
-usr/share/locale/pt_BR/LC_MESSAGES/bash.mo
-usr/share/locale/pt_BR/LC_MESSAGES/coreutils.mo
-usr/share/locale/pt_BR/LC_MESSAGES/diffutils.mo
-usr/share/locale/pt_BR/LC_MESSAGES/dpkg.mo
-usr/share/locale/pt_BR/LC_MESSAGES/findutils.mo
-usr/share/locale/pt_BR/LC_MESSAGES/grep.mo
-usr/share/locale/pt_BR/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/pt_BR/LC_MESSAGES/sed.mo
-usr/share/locale/pt_BR/LC_MESSAGES/shadow.mo
-usr/share/locale/pt_BR/LC_MESSAGES/tar.mo
-usr/share/locale/pt_BR/LC_TIME/
-usr/share/locale/pt_BR/LC_TIME/coreutils.mo
-usr/share/locale/ro/
-usr/share/locale/ro/LC_MESSAGES/
-usr/share/locale/ro/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ro/LC_MESSAGES/apt.mo
-usr/share/locale/ro/LC_MESSAGES/bash.mo
-usr/share/locale/ro/LC_MESSAGES/coreutils.mo
-usr/share/locale/ro/LC_MESSAGES/diffutils.mo
-usr/share/locale/ro/LC_MESSAGES/dpkg.mo
-usr/share/locale/ro/LC_MESSAGES/findutils.mo
-usr/share/locale/ro/LC_MESSAGES/grep.mo
-usr/share/locale/ro/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/ro/LC_MESSAGES/sed.mo
-usr/share/locale/ro/LC_MESSAGES/shadow.mo
-usr/share/locale/ro/LC_MESSAGES/tar.mo
-usr/share/locale/ro/LC_TIME/
-usr/share/locale/ro/LC_TIME/coreutils.mo
-usr/share/locale/ru/
-usr/share/locale/ru/LC_MESSAGES/
-usr/share/locale/ru/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ru/LC_MESSAGES/apt.mo
-usr/share/locale/ru/LC_MESSAGES/bash.mo
-usr/share/locale/ru/LC_MESSAGES/coreutils.mo
-usr/share/locale/ru/LC_MESSAGES/diffutils.mo
-usr/share/locale/ru/LC_MESSAGES/dpkg.mo
-usr/share/locale/ru/LC_MESSAGES/findutils.mo
-usr/share/locale/ru/LC_MESSAGES/grep.mo
-usr/share/locale/ru/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/ru/LC_MESSAGES/sed.mo
-usr/share/locale/ru/LC_MESSAGES/shadow.mo
-usr/share/locale/ru/LC_MESSAGES/tar.mo
-usr/share/locale/ru/LC_TIME/
-usr/share/locale/ru/LC_TIME/coreutils.mo
-usr/share/locale/si/
-usr/share/locale/si/LC_MESSAGES/
-usr/share/locale/si/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/sk/
-usr/share/locale/sk/LC_MESSAGES/
-usr/share/locale/sk/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/sk/LC_MESSAGES/apt.mo
-usr/share/locale/sk/LC_MESSAGES/bash.mo
-usr/share/locale/sk/LC_MESSAGES/coreutils.mo
-usr/share/locale/sk/LC_MESSAGES/dpkg.mo
-usr/share/locale/sk/LC_MESSAGES/findutils.mo
-usr/share/locale/sk/LC_MESSAGES/grep.mo
-usr/share/locale/sk/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/sk/LC_MESSAGES/sed.mo
-usr/share/locale/sk/LC_MESSAGES/shadow.mo
-usr/share/locale/sk/LC_MESSAGES/tar.mo
-usr/share/locale/sk/LC_TIME/
-usr/share/locale/sk/LC_TIME/coreutils.mo
-usr/share/locale/sl/
-usr/share/locale/sl/LC_MESSAGES/
-usr/share/locale/sl/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/sl/LC_MESSAGES/apt.mo
-usr/share/locale/sl/LC_MESSAGES/bash.mo
-usr/share/locale/sl/LC_MESSAGES/coreutils.mo
-usr/share/locale/sl/LC_MESSAGES/findutils.mo
-usr/share/locale/sl/LC_MESSAGES/grep.mo
-usr/share/locale/sl/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/sl/LC_MESSAGES/sed.mo
-usr/share/locale/sl/LC_MESSAGES/tar.mo
-usr/share/locale/sl/LC_TIME/
-usr/share/locale/sl/LC_TIME/coreutils.mo
-usr/share/locale/sq/
-usr/share/locale/sq/LC_MESSAGES/
-usr/share/locale/sq/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/sq/LC_MESSAGES/shadow.mo
-usr/share/locale/sr/
-usr/share/locale/sr/LC_MESSAGES/
-usr/share/locale/sr/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/sr/LC_MESSAGES/bash.mo
-usr/share/locale/sr/LC_MESSAGES/coreutils.mo
-usr/share/locale/sr/LC_MESSAGES/diffutils.mo
-usr/share/locale/sr/LC_MESSAGES/findutils.mo
-usr/share/locale/sr/LC_MESSAGES/grep.mo
-usr/share/locale/sr/LC_MESSAGES/sed.mo
-usr/share/locale/sr/LC_MESSAGES/tar.mo
-usr/share/locale/sr/LC_TIME/
-usr/share/locale/sr/LC_TIME/coreutils.mo
-usr/share/locale/sr@latin/
-usr/share/locale/sr@latin/LC_MESSAGES/
-usr/share/locale/sr@latin/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/sv/
-usr/share/locale/sv/LC_MESSAGES/
-usr/share/locale/sv/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/sv/LC_MESSAGES/apt.mo
-usr/share/locale/sv/LC_MESSAGES/bash.mo
-usr/share/locale/sv/LC_MESSAGES/coreutils.mo
-usr/share/locale/sv/LC_MESSAGES/diffutils.mo
-usr/share/locale/sv/LC_MESSAGES/dpkg.mo
-usr/share/locale/sv/LC_MESSAGES/findutils.mo
-usr/share/locale/sv/LC_MESSAGES/grep.mo
-usr/share/locale/sv/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/sv/LC_MESSAGES/sed.mo
-usr/share/locale/sv/LC_MESSAGES/shadow.mo
-usr/share/locale/sv/LC_MESSAGES/tar.mo
-usr/share/locale/sv/LC_TIME/
-usr/share/locale/sv/LC_TIME/coreutils.mo
-usr/share/locale/ta/
-usr/share/locale/ta/LC_MESSAGES/
-usr/share/locale/ta/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/ta/LC_MESSAGES/coreutils.mo
-usr/share/locale/ta/LC_MESSAGES/grep.mo
-usr/share/locale/ta/LC_TIME/
-usr/share/locale/ta/LC_TIME/coreutils.mo
-usr/share/locale/te/
-usr/share/locale/te/LC_MESSAGES/
-usr/share/locale/te/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/tg/
-usr/share/locale/tg/LC_MESSAGES/
-usr/share/locale/tg/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/th/
-usr/share/locale/th/LC_MESSAGES/
-usr/share/locale/th/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/th/LC_MESSAGES/apt.mo
-usr/share/locale/th/LC_MESSAGES/dpkg.mo
-usr/share/locale/th/LC_MESSAGES/grep.mo
-usr/share/locale/th/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/tl/
-usr/share/locale/tl/LC_MESSAGES/
-usr/share/locale/tl/LC_MESSAGES/apt.mo
-usr/share/locale/tl/LC_MESSAGES/dpkg.mo
-usr/share/locale/tl/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/tl/LC_MESSAGES/shadow.mo
-usr/share/locale/tr/
-usr/share/locale/tr/LC_MESSAGES/
-usr/share/locale/tr/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/tr/LC_MESSAGES/apt.mo
-usr/share/locale/tr/LC_MESSAGES/bash.mo
-usr/share/locale/tr/LC_MESSAGES/coreutils.mo
-usr/share/locale/tr/LC_MESSAGES/diffutils.mo
-usr/share/locale/tr/LC_MESSAGES/dpkg.mo
-usr/share/locale/tr/LC_MESSAGES/findutils.mo
-usr/share/locale/tr/LC_MESSAGES/grep.mo
-usr/share/locale/tr/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/tr/LC_MESSAGES/sed.mo
-usr/share/locale/tr/LC_MESSAGES/shadow.mo
-usr/share/locale/tr/LC_MESSAGES/tar.mo
-usr/share/locale/tr/LC_TIME/
-usr/share/locale/tr/LC_TIME/coreutils.mo
-usr/share/locale/uk/
-usr/share/locale/uk/LC_MESSAGES/
-usr/share/locale/uk/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/uk/LC_MESSAGES/apt.mo
-usr/share/locale/uk/LC_MESSAGES/bash.mo
-usr/share/locale/uk/LC_MESSAGES/coreutils.mo
-usr/share/locale/uk/LC_MESSAGES/diffutils.mo
-usr/share/locale/uk/LC_MESSAGES/findutils.mo
-usr/share/locale/uk/LC_MESSAGES/grep.mo
-usr/share/locale/uk/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/uk/LC_MESSAGES/sed.mo
-usr/share/locale/uk/LC_MESSAGES/shadow.mo
-usr/share/locale/uk/LC_MESSAGES/tar.mo
-usr/share/locale/uk/LC_TIME/
-usr/share/locale/uk/LC_TIME/coreutils.mo
-usr/share/locale/ur/
-usr/share/locale/ur/LC_MESSAGES/
-usr/share/locale/ur/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/vi/
-usr/share/locale/vi/LC_MESSAGES/
-usr/share/locale/vi/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/vi/LC_MESSAGES/apt.mo
-usr/share/locale/vi/LC_MESSAGES/bash.mo
-usr/share/locale/vi/LC_MESSAGES/coreutils.mo
-usr/share/locale/vi/LC_MESSAGES/diffutils.mo
-usr/share/locale/vi/LC_MESSAGES/dpkg.mo
-usr/share/locale/vi/LC_MESSAGES/findutils.mo
-usr/share/locale/vi/LC_MESSAGES/grep.mo
-usr/share/locale/vi/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/vi/LC_MESSAGES/sed.mo
-usr/share/locale/vi/LC_MESSAGES/shadow.mo
-usr/share/locale/vi/LC_MESSAGES/tar.mo
-usr/share/locale/vi/LC_TIME/
-usr/share/locale/vi/LC_TIME/coreutils.mo
-usr/share/locale/yo/
-usr/share/locale/yo/LC_MESSAGES/
-usr/share/locale/yo/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/zh_CN/
-usr/share/locale/zh_CN/LC_MESSAGES/
-usr/share/locale/zh_CN/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/zh_CN/LC_MESSAGES/apt.mo
-usr/share/locale/zh_CN/LC_MESSAGES/bash.mo
-usr/share/locale/zh_CN/LC_MESSAGES/coreutils.mo
-usr/share/locale/zh_CN/LC_MESSAGES/diffutils.mo
-usr/share/locale/zh_CN/LC_MESSAGES/dpkg.mo
-usr/share/locale/zh_CN/LC_MESSAGES/findutils.mo
-usr/share/locale/zh_CN/LC_MESSAGES/grep.mo
-usr/share/locale/zh_CN/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/zh_CN/LC_MESSAGES/sed.mo
-usr/share/locale/zh_CN/LC_MESSAGES/shadow.mo
-usr/share/locale/zh_CN/LC_MESSAGES/tar.mo
-usr/share/locale/zh_CN/LC_TIME/
-usr/share/locale/zh_CN/LC_TIME/coreutils.mo
-usr/share/locale/zh_HK/
-usr/share/locale/zh_HK/LC_MESSAGES/
-usr/share/locale/zh_HK/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/zh_TW/
-usr/share/locale/zh_TW/LC_MESSAGES/
-usr/share/locale/zh_TW/LC_MESSAGES/Linux-PAM.mo
-usr/share/locale/zh_TW/LC_MESSAGES/apt.mo
-usr/share/locale/zh_TW/LC_MESSAGES/bash.mo
-usr/share/locale/zh_TW/LC_MESSAGES/coreutils.mo
-usr/share/locale/zh_TW/LC_MESSAGES/diffutils.mo
-usr/share/locale/zh_TW/LC_MESSAGES/dpkg.mo
-usr/share/locale/zh_TW/LC_MESSAGES/findutils.mo
-usr/share/locale/zh_TW/LC_MESSAGES/grep.mo
-usr/share/locale/zh_TW/LC_MESSAGES/libapt-pkg7.0.mo
-usr/share/locale/zh_TW/LC_MESSAGES/sed.mo
-usr/share/locale/zh_TW/LC_MESSAGES/shadow.mo
-usr/share/locale/zh_TW/LC_MESSAGES/tar.mo
-usr/share/locale/zh_TW/LC_TIME/
-usr/share/locale/zh_TW/LC_TIME/coreutils.mo
-usr/share/locale/zu/
-usr/share/locale/zu/LC_MESSAGES/
-usr/share/locale/zu/LC_MESSAGES/Linux-PAM.mo
 usr/share/man/
-usr/share/man/cs/
-usr/share/man/cs/man1/
-usr/share/man/cs/man1/expiry.1.gz
-usr/share/man/cs/man1/gpasswd.1.gz
-usr/share/man/cs/man5/
-usr/share/man/cs/man5/gshadow.5.gz
-usr/share/man/cs/man5/passwd.5.gz
-usr/share/man/cs/man5/shadow.5.gz
-usr/share/man/cs/man8/
-usr/share/man/cs/man8/groupadd.8.gz
-usr/share/man/cs/man8/groupdel.8.gz
-usr/share/man/cs/man8/groupmod.8.gz
-usr/share/man/cs/man8/grpck.8.gz
-usr/share/man/cs/man8/vipw.8.gz
-usr/share/man/da/
-usr/share/man/da/man1/
-usr/share/man/da/man1/chfn.1.gz
-usr/share/man/da/man5/
-usr/share/man/da/man5/gshadow.5.gz
-usr/share/man/da/man8/
-usr/share/man/da/man8/groupdel.8.gz
-usr/share/man/da/man8/vigr.8.gz
-usr/share/man/da/man8/vipw.8.gz
-usr/share/man/de/
-usr/share/man/de/man1/
-usr/share/man/de/man1/apt-transport-http.1.gz
-usr/share/man/de/man1/apt-transport-https.1.gz
-usr/share/man/de/man1/apt-transport-mirror.1.gz
-usr/share/man/de/man1/chage.1.gz
-usr/share/man/de/man1/chfn.1.gz
-usr/share/man/de/man1/chsh.1.gz
-usr/share/man/de/man1/dpkg-deb.1.gz
-usr/share/man/de/man1/dpkg-divert.1.gz
-usr/share/man/de/man1/dpkg-maintscript-helper.1.gz
-usr/share/man/de/man1/dpkg-query.1.gz
-usr/share/man/de/man1/dpkg-realpath.1.gz
-usr/share/man/de/man1/dpkg-split.1.gz
-usr/share/man/de/man1/dpkg-statoverride.1.gz
-usr/share/man/de/man1/dpkg-trigger.1.gz
-usr/share/man/de/man1/dpkg.1.gz
-usr/share/man/de/man1/expiry.1.gz
-usr/share/man/de/man1/gpasswd.1.gz
-usr/share/man/de/man1/login.1.gz
-usr/share/man/de/man1/passwd.1.gz
-usr/share/man/de/man1/update-alternatives.1.gz
-usr/share/man/de/man1/which.1.gz
-usr/share/man/de/man1/which.debianutils.1.gz
-usr/share/man/de/man5/
-usr/share/man/de/man5/apt.conf.5.gz
-usr/share/man/de/man5/apt_auth.conf.5.gz
-usr/share/man/de/man5/apt_preferences.5.gz
-usr/share/man/de/man5/dpkg.cfg.5.gz
-usr/share/man/de/man5/gshadow.5.gz
-usr/share/man/de/man5/login.defs.5.gz
-usr/share/man/de/man5/passwd.5.gz
-usr/share/man/de/man5/shadow.5.gz
-usr/share/man/de/man5/sources.list.5.gz
-usr/share/man/de/man7/
-usr/share/man/de/man7/apt-patterns.7.gz
-usr/share/man/de/man8/
-usr/share/man/de/man8/add-shell.8.gz
-usr/share/man/de/man8/apt-cache.8.gz
-usr/share/man/de/man8/apt-cdrom.8.gz
-usr/share/man/de/man8/apt-config.8.gz
-usr/share/man/de/man8/apt-get.8.gz
-usr/share/man/de/man8/apt-mark.8.gz
-usr/share/man/de/man8/apt-secure.8.gz
-usr/share/man/de/man8/apt.8.gz
-usr/share/man/de/man8/chgpasswd.8.gz
-usr/share/man/de/man8/chpasswd.8.gz
-usr/share/man/de/man8/groupadd.8.gz
-usr/share/man/de/man8/groupdel.8.gz
-usr/share/man/de/man8/groupmod.8.gz
-usr/share/man/de/man8/grpck.8.gz
-usr/share/man/de/man8/grpconv.8.gz
-usr/share/man/de/man8/grpunconv.8.gz
-usr/share/man/de/man8/installkernel.8.gz
-usr/share/man/de/man8/newusers.8.gz
-usr/share/man/de/man8/nologin.8.gz
-usr/share/man/de/man8/pwck.8.gz
-usr/share/man/de/man8/pwconv.8.gz
-usr/share/man/de/man8/pwunconv.8.gz
-usr/share/man/de/man8/remove-shell.8.gz
-usr/share/man/de/man8/run-parts.8.gz
-usr/share/man/de/man8/savelog.8.gz
-usr/share/man/de/man8/start-stop-daemon.8.gz
-usr/share/man/de/man8/update-passwd.8.gz
-usr/share/man/de/man8/useradd.8.gz
-usr/share/man/de/man8/userdel.8.gz
-usr/share/man/de/man8/usermod.8.gz
-usr/share/man/de/man8/vigr.8.gz
-usr/share/man/de/man8/vipw.8.gz
-usr/share/man/es/
-usr/share/man/es/man1/
-usr/share/man/es/man1/which.1.gz
-usr/share/man/es/man1/which.debianutils.1.gz
-usr/share/man/es/man5/
-usr/share/man/es/man5/apt_preferences.5.gz
-usr/share/man/es/man5/dpkg.cfg.5.gz
-usr/share/man/es/man8/
-usr/share/man/es/man8/add-shell.8.gz
-usr/share/man/es/man8/apt-cache.8.gz
-usr/share/man/es/man8/apt-cdrom.8.gz
-usr/share/man/es/man8/apt-config.8.gz
-usr/share/man/es/man8/installkernel.8.gz
-usr/share/man/es/man8/remove-shell.8.gz
-usr/share/man/es/man8/run-parts.8.gz
-usr/share/man/es/man8/savelog.8.gz
-usr/share/man/es/man8/update-passwd.8.gz
-usr/share/man/fi/
-usr/share/man/fi/man1/
-usr/share/man/fi/man1/chfn.1.gz
-usr/share/man/fi/man1/chsh.1.gz
-usr/share/man/fr/
-usr/share/man/fr/man1/
-usr/share/man/fr/man1/apt-transport-http.1.gz
-usr/share/man/fr/man1/apt-transport-https.1.gz
-usr/share/man/fr/man1/apt-transport-mirror.1.gz
-usr/share/man/fr/man1/chage.1.gz
-usr/share/man/fr/man1/chfn.1.gz
-usr/share/man/fr/man1/chsh.1.gz
-usr/share/man/fr/man1/dpkg-divert.1.gz
-usr/share/man/fr/man1/dpkg-maintscript-helper.1.gz
-usr/share/man/fr/man1/dpkg-query.1.gz
-usr/share/man/fr/man1/dpkg-realpath.1.gz
-usr/share/man/fr/man1/dpkg-split.1.gz
-usr/share/man/fr/man1/dpkg-trigger.1.gz
-usr/share/man/fr/man1/expiry.1.gz
-usr/share/man/fr/man1/gpasswd.1.gz
-usr/share/man/fr/man1/login.1.gz
-usr/share/man/fr/man1/passwd.1.gz
-usr/share/man/fr/man1/update-alternatives.1.gz
-usr/share/man/fr/man1/which.1.gz
-usr/share/man/fr/man1/which.debianutils.1.gz
-usr/share/man/fr/man5/
-usr/share/man/fr/man5/apt.conf.5.gz
-usr/share/man/fr/man5/apt_auth.conf.5.gz
-usr/share/man/fr/man5/apt_preferences.5.gz
-usr/share/man/fr/man5/dpkg.cfg.5.gz
-usr/share/man/fr/man5/gshadow.5.gz
-usr/share/man/fr/man5/login.defs.5.gz
-usr/share/man/fr/man5/passwd.5.gz
-usr/share/man/fr/man5/shadow.5.gz
-usr/share/man/fr/man5/sources.list.5.gz
-usr/share/man/fr/man5/subgid.5.gz
-usr/share/man/fr/man5/subuid.5.gz
-usr/share/man/fr/man7/
-usr/share/man/fr/man7/apt-patterns.7.gz
-usr/share/man/fr/man8/
-usr/share/man/fr/man8/add-shell.8.gz
-usr/share/man/fr/man8/apt-cache.8.gz
-usr/share/man/fr/man8/apt-cdrom.8.gz
-usr/share/man/fr/man8/apt-config.8.gz
-usr/share/man/fr/man8/apt-get.8.gz
-usr/share/man/fr/man8/apt-mark.8.gz
-usr/share/man/fr/man8/apt-secure.8.gz
-usr/share/man/fr/man8/apt.8.gz
-usr/share/man/fr/man8/chgpasswd.8.gz
-usr/share/man/fr/man8/chpasswd.8.gz
-usr/share/man/fr/man8/groupadd.8.gz
-usr/share/man/fr/man8/groupdel.8.gz
-usr/share/man/fr/man8/groupmod.8.gz
-usr/share/man/fr/man8/grpck.8.gz
-usr/share/man/fr/man8/grpconv.8.gz
-usr/share/man/fr/man8/grpunconv.8.gz
-usr/share/man/fr/man8/installkernel.8.gz
-usr/share/man/fr/man8/newusers.8.gz
-usr/share/man/fr/man8/pwck.8.gz
-usr/share/man/fr/man8/pwconv.8.gz
-usr/share/man/fr/man8/pwunconv.8.gz
-usr/share/man/fr/man8/remove-shell.8.gz
-usr/share/man/fr/man8/run-parts.8.gz
-usr/share/man/fr/man8/savelog.8.gz
-usr/share/man/fr/man8/start-stop-daemon.8.gz
-usr/share/man/fr/man8/update-passwd.8.gz
-usr/share/man/fr/man8/useradd.8.gz
-usr/share/man/fr/man8/userdel.8.gz
-usr/share/man/fr/man8/usermod.8.gz
-usr/share/man/fr/man8/vigr.8.gz
-usr/share/man/fr/man8/vipw.8.gz
-usr/share/man/hu/
-usr/share/man/hu/man1/
-usr/share/man/hu/man1/chsh.1.gz
-usr/share/man/hu/man1/gpasswd.1.gz
-usr/share/man/hu/man1/passwd.1.gz
-usr/share/man/hu/man5/
-usr/share/man/hu/man5/passwd.5.gz
-usr/share/man/id/
-usr/share/man/id/man1/
-usr/share/man/id/man1/chsh.1.gz
-usr/share/man/id/man8/
-usr/share/man/id/man8/useradd.8.gz
-usr/share/man/it/
-usr/share/man/it/man1/
-usr/share/man/it/man1/chage.1.gz
-usr/share/man/it/man1/chfn.1.gz
-usr/share/man/it/man1/chsh.1.gz
-usr/share/man/it/man1/expiry.1.gz
-usr/share/man/it/man1/gpasswd.1.gz
-usr/share/man/it/man1/passwd.1.gz
-usr/share/man/it/man1/which.1.gz
-usr/share/man/it/man1/which.debianutils.1.gz
-usr/share/man/it/man5/
-usr/share/man/it/man5/apt.conf.5.gz
-usr/share/man/it/man5/apt_preferences.5.gz
-usr/share/man/it/man5/dpkg.cfg.5.gz
-usr/share/man/it/man5/gshadow.5.gz
-usr/share/man/it/man5/login.defs.5.gz
-usr/share/man/it/man5/passwd.5.gz
-usr/share/man/it/man5/shadow.5.gz
-usr/share/man/it/man8/
-usr/share/man/it/man8/add-shell.8.gz
-usr/share/man/it/man8/apt-cache.8.gz
-usr/share/man/it/man8/apt-cdrom.8.gz
-usr/share/man/it/man8/apt-config.8.gz
-usr/share/man/it/man8/apt-mark.8.gz
-usr/share/man/it/man8/apt.8.gz
-usr/share/man/it/man8/chgpasswd.8.gz
-usr/share/man/it/man8/chpasswd.8.gz
-usr/share/man/it/man8/groupadd.8.gz
-usr/share/man/it/man8/groupdel.8.gz
-usr/share/man/it/man8/groupmod.8.gz
-usr/share/man/it/man8/grpck.8.gz
-usr/share/man/it/man8/grpconv.8.gz
-usr/share/man/it/man8/grpunconv.8.gz
-usr/share/man/it/man8/installkernel.8.gz
-usr/share/man/it/man8/newusers.8.gz
-usr/share/man/it/man8/pwck.8.gz
-usr/share/man/it/man8/pwconv.8.gz
-usr/share/man/it/man8/pwunconv.8.gz
-usr/share/man/it/man8/remove-shell.8.gz
-usr/share/man/it/man8/run-parts.8.gz
-usr/share/man/it/man8/savelog.8.gz
-usr/share/man/it/man8/useradd.8.gz
-usr/share/man/it/man8/userdel.8.gz
-usr/share/man/it/man8/usermod.8.gz
-usr/share/man/it/man8/vigr.8.gz
-usr/share/man/it/man8/vipw.8.gz
-usr/share/man/ja/
-usr/share/man/ja/man1/
-usr/share/man/ja/man1/chage.1.gz
-usr/share/man/ja/man1/chfn.1.gz
-usr/share/man/ja/man1/chsh.1.gz
-usr/share/man/ja/man1/expiry.1.gz
-usr/share/man/ja/man1/gpasswd.1.gz
-usr/share/man/ja/man1/passwd.1.gz
-usr/share/man/ja/man1/which.1.gz
-usr/share/man/ja/man1/which.debianutils.1.gz
-usr/share/man/ja/man5/
-usr/share/man/ja/man5/apt.conf.5.gz
-usr/share/man/ja/man5/apt_preferences.5.gz
-usr/share/man/ja/man5/dpkg.cfg.5.gz
-usr/share/man/ja/man5/login.defs.5.gz
-usr/share/man/ja/man5/passwd.5.gz
-usr/share/man/ja/man5/shadow.5.gz
-usr/share/man/ja/man8/
-usr/share/man/ja/man8/add-shell.8.gz
-usr/share/man/ja/man8/apt-cache.8.gz
-usr/share/man/ja/man8/apt-cdrom.8.gz
-usr/share/man/ja/man8/apt-config.8.gz
-usr/share/man/ja/man8/apt-mark.8.gz
-usr/share/man/ja/man8/apt.8.gz
-usr/share/man/ja/man8/chpasswd.8.gz
-usr/share/man/ja/man8/groupadd.8.gz
-usr/share/man/ja/man8/groupdel.8.gz
-usr/share/man/ja/man8/groupmod.8.gz
-usr/share/man/ja/man8/grpck.8.gz
-usr/share/man/ja/man8/grpconv.8.gz
-usr/share/man/ja/man8/grpunconv.8.gz
-usr/share/man/ja/man8/installkernel.8.gz
-usr/share/man/ja/man8/newusers.8.gz
-usr/share/man/ja/man8/pwck.8.gz
-usr/share/man/ja/man8/pwconv.8.gz
-usr/share/man/ja/man8/pwunconv.8.gz
-usr/share/man/ja/man8/remove-shell.8.gz
-usr/share/man/ja/man8/run-parts.8.gz
-usr/share/man/ja/man8/savelog.8.gz
-usr/share/man/ja/man8/update-passwd.8.gz
-usr/share/man/ja/man8/useradd.8.gz
-usr/share/man/ja/man8/userdel.8.gz
-usr/share/man/ja/man8/usermod.8.gz
-usr/share/man/ja/man8/vigr.8.gz
-usr/share/man/ja/man8/vipw.8.gz
-usr/share/man/ko/
-usr/share/man/ko/man1/
-usr/share/man/ko/man1/chfn.1.gz
-usr/share/man/ko/man1/chsh.1.gz
-usr/share/man/ko/man5/
-usr/share/man/ko/man5/passwd.5.gz
-usr/share/man/ko/man8/
-usr/share/man/ko/man8/vigr.8.gz
-usr/share/man/ko/man8/vipw.8.gz
 usr/share/man/man1/
-usr/share/man/man1/[.1.gz
-usr/share/man/man1/apt-transport-http.1.gz
-usr/share/man/man1/apt-transport-https.1.gz
-usr/share/man/man1/apt-transport-mirror.1.gz
-usr/share/man/man1/arch.1.gz
-usr/share/man/man1/awk.1.gz
-usr/share/man/man1/b2sum.1.gz
-usr/share/man/man1/base32.1.gz
-usr/share/man/man1/base64.1.gz
-usr/share/man/man1/basename.1.gz
-usr/share/man/man1/basenc.1.gz
-usr/share/man/man1/bash.1.gz
-usr/share/man/man1/bashbug.1.gz
-usr/share/man/man1/captoinfo.1.gz
-usr/share/man/man1/cat.1.gz
-usr/share/man/man1/chage.1.gz
-usr/share/man/man1/chcon.1.gz
-usr/share/man/man1/chfn.1.gz
-usr/share/man/man1/chgrp.1.gz
-usr/share/man/man1/chmod.1.gz
-usr/share/man/man1/choom.1.gz
-usr/share/man/man1/chown.1.gz
-usr/share/man/man1/chrt.1.gz
-usr/share/man/man1/chsh.1.gz
-usr/share/man/man1/cksum.1.gz
-usr/share/man/man1/clear.1.gz
-usr/share/man/man1/clear_console.1.gz
-usr/share/man/man1/cmp.1.gz
-usr/share/man/man1/comm.1.gz
-usr/share/man/man1/cp.1.gz
-usr/share/man/man1/csplit.1.gz
-usr/share/man/man1/cut.1.gz
-usr/share/man/man1/dash.1.gz
-usr/share/man/man1/date.1.gz
-usr/share/man/man1/dd.1.gz
-usr/share/man/man1/deb-systemd-helper.1p.gz
-usr/share/man/man1/deb-systemd-invoke.1p.gz
-usr/share/man/man1/debconf-apt-progress.1.gz
-usr/share/man/man1/debconf-communicate.1.gz
-usr/share/man/man1/debconf-copydb.1.gz
-usr/share/man/man1/debconf-escape.1.gz
-usr/share/man/man1/debconf-set-selections.1.gz
-usr/share/man/man1/debconf-show.1.gz
-usr/share/man/man1/debconf.1.gz
-usr/share/man/man1/df.1.gz
-usr/share/man/man1/diff.1.gz
-usr/share/man/man1/diff3.1.gz
-usr/share/man/man1/dir.1.gz
-usr/share/man/man1/dircolors.1.gz
-usr/share/man/man1/dirname.1.gz
-usr/share/man/man1/dmesg.1.gz
-usr/share/man/man1/dnsdomainname.1.gz
-usr/share/man/man1/domainname.1.gz
-usr/share/man/man1/dpkg-deb.1.gz
-usr/share/man/man1/dpkg-divert.1.gz
-usr/share/man/man1/dpkg-maintscript-helper.1.gz
-usr/share/man/man1/dpkg-query.1.gz
-usr/share/man/man1/dpkg-realpath.1.gz
-usr/share/man/man1/dpkg-split.1.gz
-usr/share/man/man1/dpkg-statoverride.1.gz
-usr/share/man/man1/dpkg-trigger.1.gz
-usr/share/man/man1/dpkg.1.gz
-usr/share/man/man1/du.1.gz
-usr/share/man/man1/echo.1.gz
-usr/share/man/man1/egrep.1.gz
-usr/share/man/man1/env.1.gz
-usr/share/man/man1/expand.1.gz
-usr/share/man/man1/expiry.1.gz
-usr/share/man/man1/expr.1.gz
-usr/share/man/man1/factor.1.gz
-usr/share/man/man1/fallocate.1.gz
-usr/share/man/man1/false.1.gz
-usr/share/man/man1/fgrep.1.gz
-usr/share/man/man1/find.1.gz
-usr/share/man/man1/flock.1.gz
-usr/share/man/man1/fmt.1.gz
-usr/share/man/man1/fold.1.gz
-usr/share/man/man1/getconf.1.gz
-usr/share/man/man1/getopt.1.gz
-usr/share/man/man1/gpasswd.1.gz
-usr/share/man/man1/grep.1.gz
-usr/share/man/man1/groups.1.gz
-usr/share/man/man1/gunzip.1.gz
-usr/share/man/man1/gzexe.1.gz
-usr/share/man/man1/gzip.1.gz
-usr/share/man/man1/hardlink.1.gz
-usr/share/man/man1/head.1.gz
-usr/share/man/man1/hostid.1.gz
-usr/share/man/man1/hostname.1.gz
-usr/share/man/man1/id.1.gz
-usr/share/man/man1/infocmp.1.gz
-usr/share/man/man1/infotocap.1.gz
-usr/share/man/man1/install.1.gz
-usr/share/man/man1/ionice.1.gz
-usr/share/man/man1/ipcmk.1.gz
-usr/share/man/man1/ipcrm.1.gz
-usr/share/man/man1/ipcs.1.gz
-usr/share/man/man1/ischroot.1.gz
-usr/share/man/man1/join.1.gz
-usr/share/man/man1/link.1.gz
-usr/share/man/man1/ln.1.gz
-usr/share/man/man1/logger.1.gz
-usr/share/man/man1/login.1.gz
-usr/share/man/man1/logname.1.gz
-usr/share/man/man1/ls.1.gz
-usr/share/man/man1/lscpu.1.gz
-usr/share/man/man1/lsipc.1.gz
-usr/share/man/man1/lslogins.1.gz
-usr/share/man/man1/lsmem.1.gz
-usr/share/man/man1/mawk.1.gz
-usr/share/man/man1/mcookie.1.gz
-usr/share/man/man1/md5sum.1.gz
-usr/share/man/man1/mkdir.1.gz
-usr/share/man/man1/mkfifo.1.gz
-usr/share/man/man1/mknod.1.gz
-usr/share/man/man1/mktemp.1.gz
-usr/share/man/man1/more.1.gz
-usr/share/man/man1/mountpoint.1.gz
-usr/share/man/man1/mv.1.gz
-usr/share/man/man1/namei.1.gz
-usr/share/man/man1/nawk.1.gz
-usr/share/man/man1/newgrp.1.gz
-usr/share/man/man1/nice.1.gz
-usr/share/man/man1/nisdomainname.1.gz
-usr/share/man/man1/nl.1.gz
-usr/share/man/man1/nohup.1.gz
-usr/share/man/man1/nproc.1.gz
-usr/share/man/man1/nsenter.1.gz
-usr/share/man/man1/numfmt.1.gz
-usr/share/man/man1/od.1.gz
-usr/share/man/man1/pager.1.gz
-usr/share/man/man1/passwd.1.gz
-usr/share/man/man1/paste.1.gz
-usr/share/man/man1/pathchk.1.gz
-usr/share/man/man1/perl.1.gz
-usr/share/man/man1/perl5.40.1.1.gz
-usr/share/man/man1/pinky.1.gz
-usr/share/man/man1/pr.1.gz
-usr/share/man/man1/printenv.1.gz
-usr/share/man/man1/printf.1.gz
-usr/share/man/man1/prlimit.1.gz
-usr/share/man/man1/ptx.1.gz
-usr/share/man/man1/pwd.1.gz
-usr/share/man/man1/rbash.1.gz
-usr/share/man/man1/readlink.1.gz
-usr/share/man/man1/realpath.1.gz
-usr/share/man/man1/rename.ul.1.gz
-usr/share/man/man1/renice.1.gz
-usr/share/man/man1/reset.1.gz
-usr/share/man/man1/rev.1.gz
-usr/share/man/man1/rgrep.1.gz
-usr/share/man/man1/rm.1.gz
-usr/share/man/man1/rmdir.1.gz
-usr/share/man/man1/runcon.1.gz
-usr/share/man/man1/runuser.1.gz
-usr/share/man/man1/script.1.gz
-usr/share/man/man1/scriptlive.1.gz
-usr/share/man/man1/scriptreplay.1.gz
-usr/share/man/man1/sdiff.1.gz
-usr/share/man/man1/sed.1.gz
-usr/share/man/man1/seq.1.gz
-usr/share/man/man1/setpriv.1.gz
-usr/share/man/man1/setsid.1.gz
-usr/share/man/man1/setterm.1.gz
-usr/share/man/man1/sg.1.gz
-usr/share/man/man1/sh.1.gz
-usr/share/man/man1/sha1sum.1.gz
-usr/share/man/man1/sha224sum.1.gz
-usr/share/man/man1/sha256sum.1.gz
-usr/share/man/man1/sha384sum.1.gz
-usr/share/man/man1/sha512sum.1.gz
-usr/share/man/man1/shred.1.gz
-usr/share/man/man1/shuf.1.gz
-usr/share/man/man1/sleep.1.gz
-usr/share/man/man1/sort.1.gz
-usr/share/man/man1/split.1.gz
-usr/share/man/man1/sqv.1.gz
-usr/share/man/man1/stat.1.gz
-usr/share/man/man1/stdbuf.1.gz
-usr/share/man/man1/stty.1.gz
-usr/share/man/man1/su.1.gz
-usr/share/man/man1/sum.1.gz
-usr/share/man/man1/sync.1.gz
-usr/share/man/man1/tabs.1.gz
-usr/share/man/man1/tac.1.gz
-usr/share/man/man1/tail.1.gz
-usr/share/man/man1/tar.1.gz
-usr/share/man/man1/tarcat.1.gz
-usr/share/man/man1/taskset.1.gz
-usr/share/man/man1/tee.1.gz
-usr/share/man/man1/tempfile.1.gz
-usr/share/man/man1/test.1.gz
-usr/share/man/man1/tic.1.gz
-usr/share/man/man1/timeout.1.gz
-usr/share/man/man1/toe.1.gz
-usr/share/man/man1/touch.1.gz
-usr/share/man/man1/tput.1.gz
-usr/share/man/man1/tr.1.gz
-usr/share/man/man1/true.1.gz
-usr/share/man/man1/truncate.1.gz
-usr/share/man/man1/tset.1.gz
-usr/share/man/man1/tsort.1.gz
-usr/share/man/man1/tty.1.gz
-usr/share/man/man1/tzselect.1.gz
-usr/share/man/man1/uclampset.1.gz
-usr/share/man/man1/uname.1.gz
-usr/share/man/man1/uncompress.1.gz
-usr/share/man/man1/unexpand.1.gz
-usr/share/man/man1/uniq.1.gz
-usr/share/man/man1/unlink.1.gz
-usr/share/man/man1/unshare.1.gz
-usr/share/man/man1/update-alternatives.1.gz
-usr/share/man/man1/users.1.gz
-usr/share/man/man1/vdir.1.gz
-usr/share/man/man1/wall.1.gz
-usr/share/man/man1/wc.1.gz
-usr/share/man/man1/whereis.1.gz
-usr/share/man/man1/which.1.gz
-usr/share/man/man1/which.debianutils.1.gz
-usr/share/man/man1/who.1.gz
-usr/share/man/man1/whoami.1.gz
-usr/share/man/man1/xargs.1.gz
-usr/share/man/man1/yes.1.gz
-usr/share/man/man1/ypdomainname.1.gz
-usr/share/man/man1/zcat.1.gz
-usr/share/man/man1/zcmp.1.gz
-usr/share/man/man1/zdiff.1.gz
-usr/share/man/man1/zegrep.1.gz
-usr/share/man/man1/zfgrep.1.gz
-usr/share/man/man1/zforce.1.gz
-usr/share/man/man1/zgrep.1.gz
-usr/share/man/man1/zless.1.gz
-usr/share/man/man1/zmore.1.gz
-usr/share/man/man1/znew.1.gz
 usr/share/man/man5/
-usr/share/man/man5/access.conf.5.gz
-usr/share/man/man5/adjtime_config.5.gz
-usr/share/man/man5/apt.conf.5.gz
-usr/share/man/man5/apt_auth.conf.5.gz
-usr/share/man/man5/apt_preferences.5.gz
-usr/share/man/man5/dpkg.cfg.5.gz
-usr/share/man/man5/environment.5.gz
-usr/share/man/man5/faillock.conf.5.gz
-usr/share/man/man5/fstab.5.gz
-usr/share/man/man5/group.conf.5.gz
-usr/share/man/man5/gshadow.5.gz
-usr/share/man/man5/init-d-script.5.gz
-usr/share/man/man5/libaudit.conf.5.gz
-usr/share/man/man5/limits.conf.5.gz
-usr/share/man/man5/login.defs.5.gz
-usr/share/man/man5/namespace.conf.5.gz
-usr/share/man/man5/pam.conf.5.gz
-usr/share/man/man5/pam.d.5.gz
-usr/share/man/man5/pam_env.conf.5.gz
-usr/share/man/man5/passwd.5.gz
-usr/share/man/man5/pwhistory.conf.5.gz
-usr/share/man/man5/scols-filter.5.gz
-usr/share/man/man5/scr_dump.5.gz
-usr/share/man/man5/semanage.conf.5.gz
-usr/share/man/man5/sepermit.conf.5.gz
-usr/share/man/man5/shadow.5.gz
-usr/share/man/man5/sources.list.5.gz
-usr/share/man/man5/subgid.5.gz
-usr/share/man/man5/subuid.5.gz
-usr/share/man/man5/term.5.gz
-usr/share/man/man5/terminal-colors.d.5.gz
-usr/share/man/man5/terminfo.5.gz
-usr/share/man/man5/time.conf.5.gz
-usr/share/man/man5/user_caps.5.gz
 usr/share/man/man7/
-usr/share/man/man7/PAM.7.gz
-usr/share/man/man7/apt-patterns.7.gz
-usr/share/man/man7/bash-builtins.7.gz
-usr/share/man/man7/builtins.7.gz
-usr/share/man/man7/mawk-arrays.7.gz
-usr/share/man/man7/mawk-code.7.gz
-usr/share/man/man7/pam.7.gz
-usr/share/man/man7/term.7.gz
 usr/share/man/man8/
-usr/share/man/man8/add-shell.8.gz
-usr/share/man/man8/agetty.8.gz
-usr/share/man/man8/apt-cache.8.gz
-usr/share/man/man8/apt-cdrom.8.gz
-usr/share/man/man8/apt-config.8.gz
-usr/share/man/man8/apt-get.8.gz
-usr/share/man/man8/apt-mark.8.gz
-usr/share/man/man8/apt-secure.8.gz
-usr/share/man/man8/apt.8.gz
-usr/share/man/man8/blkdiscard.8.gz
-usr/share/man/man8/blkid.8.gz
-usr/share/man/man8/blkzone.8.gz
-usr/share/man/man8/blockdev.8.gz
-usr/share/man/man8/chcpu.8.gz
-usr/share/man/man8/chgpasswd.8.gz
-usr/share/man/man8/chmem.8.gz
-usr/share/man/man8/chpasswd.8.gz
-usr/share/man/man8/chroot.8.gz
-usr/share/man/man8/dpkg-preconfigure.8.gz
-usr/share/man/man8/dpkg-reconfigure.8.gz
-usr/share/man/man8/faillock.8.gz
-usr/share/man/man8/findfs.8.gz
-usr/share/man/man8/findmnt.8.gz
-usr/share/man/man8/fsck.8.gz
-usr/share/man/man8/fsfreeze.8.gz
-usr/share/man/man8/fstab-decode.8.gz
-usr/share/man/man8/fstrim.8.gz
-usr/share/man/man8/getty.8.gz
-usr/share/man/man8/groupadd.8.gz
-usr/share/man/man8/groupdel.8.gz
-usr/share/man/man8/groupmod.8.gz
-usr/share/man/man8/grpck.8.gz
-usr/share/man/man8/grpconv.8.gz
-usr/share/man/man8/grpunconv.8.gz
-usr/share/man/man8/i386.8.gz
-usr/share/man/man8/installkernel.8.gz
-usr/share/man/man8/invoke-rc.d.8.gz
-usr/share/man/man8/isosize.8.gz
-usr/share/man/man8/killall5.8.gz
-usr/share/man/man8/ldattach.8.gz
-usr/share/man/man8/linux32.8.gz
-usr/share/man/man8/linux64.8.gz
-usr/share/man/man8/losetup.8.gz
-usr/share/man/man8/lsblk.8.gz
-usr/share/man/man8/lslocks.8.gz
-usr/share/man/man8/lsns.8.gz
-usr/share/man/man8/mkfs.8.gz
-usr/share/man/man8/mkhomedir_helper.8.gz
-usr/share/man/man8/mkswap.8.gz
-usr/share/man/man8/mount.8.gz
-usr/share/man/man8/newusers.8.gz
-usr/share/man/man8/nologin.8.gz
-usr/share/man/man8/pam-auth-update.8.gz
-usr/share/man/man8/pam_access.8.gz
-usr/share/man/man8/pam_canonicalize_user.8.gz
-usr/share/man/man8/pam_debug.8.gz
-usr/share/man/man8/pam_deny.8.gz
-usr/share/man/man8/pam_echo.8.gz
-usr/share/man/man8/pam_env.8.gz
-usr/share/man/man8/pam_exec.8.gz
-usr/share/man/man8/pam_faildelay.8.gz
-usr/share/man/man8/pam_faillock.8.gz
-usr/share/man/man8/pam_filter.8.gz
-usr/share/man/man8/pam_ftp.8.gz
-usr/share/man/man8/pam_getenv.8.gz
-usr/share/man/man8/pam_group.8.gz
-usr/share/man/man8/pam_issue.8.gz
-usr/share/man/man8/pam_keyinit.8.gz
-usr/share/man/man8/pam_limits.8.gz
-usr/share/man/man8/pam_listfile.8.gz
-usr/share/man/man8/pam_localuser.8.gz
-usr/share/man/man8/pam_loginuid.8.gz
-usr/share/man/man8/pam_mail.8.gz
-usr/share/man/man8/pam_mkhomedir.8.gz
-usr/share/man/man8/pam_motd.8.gz
-usr/share/man/man8/pam_namespace.8.gz
-usr/share/man/man8/pam_namespace_helper.8.gz
-usr/share/man/man8/pam_nologin.8.gz
-usr/share/man/man8/pam_permit.8.gz
-usr/share/man/man8/pam_pwhistory.8.gz
-usr/share/man/man8/pam_rhosts.8.gz
-usr/share/man/man8/pam_rootok.8.gz
-usr/share/man/man8/pam_securetty.8.gz
-usr/share/man/man8/pam_selinux.8.gz
-usr/share/man/man8/pam_sepermit.8.gz
-usr/share/man/man8/pam_setquota.8.gz
-usr/share/man/man8/pam_shells.8.gz
-usr/share/man/man8/pam_stress.8.gz
-usr/share/man/man8/pam_succeed_if.8.gz
-usr/share/man/man8/pam_time.8.gz
-usr/share/man/man8/pam_timestamp.8.gz
-usr/share/man/man8/pam_timestamp_check.8.gz
-usr/share/man/man8/pam_tty_audit.8.gz
-usr/share/man/man8/pam_umask.8.gz
-usr/share/man/man8/pam_unix.8.gz
-usr/share/man/man8/pam_userdb.8.gz
-usr/share/man/man8/pam_usertype.8.gz
-usr/share/man/man8/pam_warn.8.gz
-usr/share/man/man8/pam_wheel.8.gz
-usr/share/man/man8/pam_xauth.8.gz
-usr/share/man/man8/partx.8.gz
-usr/share/man/man8/pidof.8.gz
-usr/share/man/man8/pivot_root.8.gz
-usr/share/man/man8/pwck.8.gz
-usr/share/man/man8/pwconv.8.gz
-usr/share/man/man8/pwhistory_helper.8.gz
-usr/share/man/man8/pwunconv.8.gz
-usr/share/man/man8/readprofile.8.gz
-usr/share/man/man8/remove-shell.8.gz
-usr/share/man/man8/rmt-tar.8.gz
-usr/share/man/man8/rmt.8.gz
-usr/share/man/man8/rtcwake.8.gz
-usr/share/man/man8/run-parts.8.gz
-usr/share/man/man8/savelog.8.gz
-usr/share/man/man8/service.8.gz
-usr/share/man/man8/setarch.8.gz
-usr/share/man/man8/shadowconfig.8.gz
-usr/share/man/man8/start-stop-daemon.8.gz
-usr/share/man/man8/sulogin.8.gz
-usr/share/man/man8/swaplabel.8.gz
-usr/share/man/man8/swapoff.8.gz
-usr/share/man/man8/swapon.8.gz
-usr/share/man/man8/switch_root.8.gz
-usr/share/man/man8/umount.8.gz
-usr/share/man/man8/unix_chkpwd.8.gz
-usr/share/man/man8/unix_update.8.gz
-usr/share/man/man8/update-passwd.8.gz
-usr/share/man/man8/update-rc.d.8.gz
-usr/share/man/man8/update-shells.8.gz
-usr/share/man/man8/useradd.8.gz
-usr/share/man/man8/userdel.8.gz
-usr/share/man/man8/usermod.8.gz
-usr/share/man/man8/vigr.8.gz
-usr/share/man/man8/vipw.8.gz
-usr/share/man/man8/wdctl.8.gz
-usr/share/man/man8/wipefs.8.gz
-usr/share/man/man8/x86_64.8.gz
-usr/share/man/man8/zramctl.8.gz
-usr/share/man/nl/
-usr/share/man/nl/man1/
-usr/share/man/nl/man1/apt-transport-http.1.gz
-usr/share/man/nl/man1/apt-transport-https.1.gz
-usr/share/man/nl/man1/apt-transport-mirror.1.gz
-usr/share/man/nl/man1/dpkg-deb.1.gz
-usr/share/man/nl/man1/dpkg-divert.1.gz
-usr/share/man/nl/man1/dpkg-maintscript-helper.1.gz
-usr/share/man/nl/man1/dpkg-query.1.gz
-usr/share/man/nl/man1/dpkg-realpath.1.gz
-usr/share/man/nl/man1/dpkg-split.1.gz
-usr/share/man/nl/man1/dpkg-statoverride.1.gz
-usr/share/man/nl/man1/dpkg-trigger.1.gz
-usr/share/man/nl/man1/dpkg.1.gz
-usr/share/man/nl/man1/update-alternatives.1.gz
-usr/share/man/nl/man5/
-usr/share/man/nl/man5/apt.conf.5.gz
-usr/share/man/nl/man5/apt_auth.conf.5.gz
-usr/share/man/nl/man5/apt_preferences.5.gz
-usr/share/man/nl/man5/dpkg.cfg.5.gz
-usr/share/man/nl/man5/sources.list.5.gz
-usr/share/man/nl/man7/
-usr/share/man/nl/man7/apt-patterns.7.gz
-usr/share/man/nl/man8/
-usr/share/man/nl/man8/apt-cache.8.gz
-usr/share/man/nl/man8/apt-cdrom.8.gz
-usr/share/man/nl/man8/apt-config.8.gz
-usr/share/man/nl/man8/apt-get.8.gz
-usr/share/man/nl/man8/apt-mark.8.gz
-usr/share/man/nl/man8/apt-secure.8.gz
-usr/share/man/nl/man8/apt.8.gz
-usr/share/man/nl/man8/start-stop-daemon.8.gz
-usr/share/man/pl/
-usr/share/man/pl/man1/
-usr/share/man/pl/man1/chage.1.gz
-usr/share/man/pl/man1/chsh.1.gz
-usr/share/man/pl/man1/expiry.1.gz
-usr/share/man/pl/man1/login.1.gz
-usr/share/man/pl/man1/newgrp.1.gz
-usr/share/man/pl/man1/which.1.gz
-usr/share/man/pl/man1/which.debianutils.1.gz
-usr/share/man/pl/man5/
-usr/share/man/pl/man5/apt_preferences.5.gz
-usr/share/man/pl/man5/dpkg.cfg.5.gz
-usr/share/man/pl/man8/
-usr/share/man/pl/man8/add-shell.8.gz
-usr/share/man/pl/man8/apt-cache.8.gz
-usr/share/man/pl/man8/apt-cdrom.8.gz
-usr/share/man/pl/man8/apt-config.8.gz
-usr/share/man/pl/man8/groupadd.8.gz
-usr/share/man/pl/man8/groupdel.8.gz
-usr/share/man/pl/man8/groupmod.8.gz
-usr/share/man/pl/man8/grpck.8.gz
-usr/share/man/pl/man8/installkernel.8.gz
-usr/share/man/pl/man8/nologin.8.gz
-usr/share/man/pl/man8/remove-shell.8.gz
-usr/share/man/pl/man8/run-parts.8.gz
-usr/share/man/pl/man8/savelog.8.gz
-usr/share/man/pl/man8/update-passwd.8.gz
-usr/share/man/pl/man8/userdel.8.gz
-usr/share/man/pl/man8/usermod.8.gz
-usr/share/man/pl/man8/vigr.8.gz
-usr/share/man/pl/man8/vipw.8.gz
-usr/share/man/pt/
-usr/share/man/pt/man1/
-usr/share/man/pt/man1/apt-transport-http.1.gz
-usr/share/man/pt/man1/apt-transport-https.1.gz
-usr/share/man/pt/man1/apt-transport-mirror.1.gz
-usr/share/man/pt/man1/dpkg-deb.1.gz
-usr/share/man/pt/man1/dpkg-divert.1.gz
-usr/share/man/pt/man1/dpkg-maintscript-helper.1.gz
-usr/share/man/pt/man1/dpkg-query.1.gz
-usr/share/man/pt/man1/dpkg-realpath.1.gz
-usr/share/man/pt/man1/dpkg-split.1.gz
-usr/share/man/pt/man1/dpkg-statoverride.1.gz
-usr/share/man/pt/man1/dpkg-trigger.1.gz
-usr/share/man/pt/man1/dpkg.1.gz
-usr/share/man/pt/man1/update-alternatives.1.gz
-usr/share/man/pt/man1/which.debianutils.1.gz
-usr/share/man/pt/man5/
-usr/share/man/pt/man5/apt.conf.5.gz
-usr/share/man/pt/man5/apt_auth.conf.5.gz
-usr/share/man/pt/man5/apt_preferences.5.gz
-usr/share/man/pt/man5/dpkg.cfg.5.gz
-usr/share/man/pt/man5/sources.list.5.gz
-usr/share/man/pt/man7/
-usr/share/man/pt/man7/apt-patterns.7.gz
-usr/share/man/pt/man8/
-usr/share/man/pt/man8/add-shell.8.gz
-usr/share/man/pt/man8/apt-cache.8.gz
-usr/share/man/pt/man8/apt-cdrom.8.gz
-usr/share/man/pt/man8/apt-config.8.gz
-usr/share/man/pt/man8/apt-get.8.gz
-usr/share/man/pt/man8/apt-mark.8.gz
-usr/share/man/pt/man8/apt-secure.8.gz
-usr/share/man/pt/man8/apt.8.gz
-usr/share/man/pt/man8/installkernel.8.gz
-usr/share/man/pt/man8/remove-shell.8.gz
-usr/share/man/pt/man8/run-parts.8.gz
-usr/share/man/pt/man8/savelog.8.gz
-usr/share/man/pt/man8/start-stop-daemon.8.gz
-usr/share/man/pt_BR/
-usr/share/man/pt_BR/man1/
-usr/share/man/pt_BR/man1/gpasswd.1.gz
-usr/share/man/pt_BR/man5/
-usr/share/man/pt_BR/man5/passwd.5.gz
-usr/share/man/pt_BR/man5/shadow.5.gz
-usr/share/man/pt_BR/man8/
-usr/share/man/pt_BR/man8/groupadd.8.gz
-usr/share/man/pt_BR/man8/groupdel.8.gz
-usr/share/man/pt_BR/man8/groupmod.8.gz
-usr/share/man/ro/
-usr/share/man/ro/man1/
-usr/share/man/ro/man1/login.1.gz
-usr/share/man/ro/man1/newgrp.1.gz
-usr/share/man/ro/man8/
-usr/share/man/ro/man8/nologin.8.gz
-usr/share/man/ro/man8/update-passwd.8.gz
-usr/share/man/ru/
-usr/share/man/ru/man1/
-usr/share/man/ru/man1/chage.1.gz
-usr/share/man/ru/man1/chfn.1.gz
-usr/share/man/ru/man1/chsh.1.gz
-usr/share/man/ru/man1/expiry.1.gz
-usr/share/man/ru/man1/gpasswd.1.gz
-usr/share/man/ru/man1/passwd.1.gz
-usr/share/man/ru/man5/
-usr/share/man/ru/man5/gshadow.5.gz
-usr/share/man/ru/man5/login.defs.5.gz
-usr/share/man/ru/man5/passwd.5.gz
-usr/share/man/ru/man5/shadow.5.gz
-usr/share/man/ru/man8/
-usr/share/man/ru/man8/chgpasswd.8.gz
-usr/share/man/ru/man8/chpasswd.8.gz
-usr/share/man/ru/man8/groupadd.8.gz
-usr/share/man/ru/man8/groupdel.8.gz
-usr/share/man/ru/man8/groupmod.8.gz
-usr/share/man/ru/man8/grpck.8.gz
-usr/share/man/ru/man8/grpconv.8.gz
-usr/share/man/ru/man8/grpunconv.8.gz
-usr/share/man/ru/man8/newusers.8.gz
-usr/share/man/ru/man8/pwck.8.gz
-usr/share/man/ru/man8/pwconv.8.gz
-usr/share/man/ru/man8/pwunconv.8.gz
-usr/share/man/ru/man8/update-passwd.8.gz
-usr/share/man/ru/man8/useradd.8.gz
-usr/share/man/ru/man8/userdel.8.gz
-usr/share/man/ru/man8/usermod.8.gz
-usr/share/man/ru/man8/vigr.8.gz
-usr/share/man/ru/man8/vipw.8.gz
-usr/share/man/sl/
-usr/share/man/sl/man1/
-usr/share/man/sl/man1/which.1.gz
-usr/share/man/sl/man1/which.debianutils.1.gz
-usr/share/man/sl/man8/
-usr/share/man/sl/man8/add-shell.8.gz
-usr/share/man/sl/man8/installkernel.8.gz
-usr/share/man/sl/man8/remove-shell.8.gz
-usr/share/man/sl/man8/run-parts.8.gz
-usr/share/man/sl/man8/savelog.8.gz
-usr/share/man/sr/
-usr/share/man/sr/man1/
-usr/share/man/sr/man1/login.1.gz
-usr/share/man/sr/man8/
-usr/share/man/sr/man8/nologin.8.gz
-usr/share/man/sv/
-usr/share/man/sv/man1/
-usr/share/man/sv/man1/chage.1.gz
-usr/share/man/sv/man1/chsh.1.gz
-usr/share/man/sv/man1/dpkg-deb.1.gz
-usr/share/man/sv/man1/dpkg-divert.1.gz
-usr/share/man/sv/man1/dpkg-maintscript-helper.1.gz
-usr/share/man/sv/man1/dpkg-query.1.gz
-usr/share/man/sv/man1/dpkg-realpath.1.gz
-usr/share/man/sv/man1/dpkg-split.1.gz
-usr/share/man/sv/man1/dpkg-statoverride.1.gz
-usr/share/man/sv/man1/dpkg-trigger.1.gz
-usr/share/man/sv/man1/dpkg.1.gz
-usr/share/man/sv/man1/expiry.1.gz
-usr/share/man/sv/man1/passwd.1.gz
-usr/share/man/sv/man1/update-alternatives.1.gz
-usr/share/man/sv/man5/
-usr/share/man/sv/man5/dpkg.cfg.5.gz
-usr/share/man/sv/man5/gshadow.5.gz
-usr/share/man/sv/man5/passwd.5.gz
-usr/share/man/sv/man8/
-usr/share/man/sv/man8/groupadd.8.gz
-usr/share/man/sv/man8/groupdel.8.gz
-usr/share/man/sv/man8/groupmod.8.gz
-usr/share/man/sv/man8/grpck.8.gz
-usr/share/man/sv/man8/pwck.8.gz
-usr/share/man/sv/man8/start-stop-daemon.8.gz
-usr/share/man/sv/man8/userdel.8.gz
-usr/share/man/sv/man8/vigr.8.gz
-usr/share/man/sv/man8/vipw.8.gz
-usr/share/man/tr/
-usr/share/man/tr/man1/
-usr/share/man/tr/man1/chage.1.gz
-usr/share/man/tr/man1/chfn.1.gz
-usr/share/man/tr/man1/passwd.1.gz
-usr/share/man/tr/man5/
-usr/share/man/tr/man5/passwd.5.gz
-usr/share/man/tr/man5/shadow.5.gz
-usr/share/man/tr/man8/
-usr/share/man/tr/man8/groupadd.8.gz
-usr/share/man/tr/man8/groupdel.8.gz
-usr/share/man/tr/man8/groupmod.8.gz
-usr/share/man/tr/man8/useradd.8.gz
-usr/share/man/tr/man8/userdel.8.gz
-usr/share/man/tr/man8/usermod.8.gz
-usr/share/man/uk/
-usr/share/man/uk/man1/
-usr/share/man/uk/man1/chage.1.gz
-usr/share/man/uk/man1/chfn.1.gz
-usr/share/man/uk/man1/chsh.1.gz
-usr/share/man/uk/man1/expiry.1.gz
-usr/share/man/uk/man1/gpasswd.1.gz
-usr/share/man/uk/man1/login.1.gz
-usr/share/man/uk/man1/newgrp.1.gz
-usr/share/man/uk/man1/passwd.1.gz
-usr/share/man/uk/man5/
-usr/share/man/uk/man5/gshadow.5.gz
-usr/share/man/uk/man5/login.defs.5.gz
-usr/share/man/uk/man5/passwd.5.gz
-usr/share/man/uk/man5/shadow.5.gz
-usr/share/man/uk/man8/
-usr/share/man/uk/man8/chgpasswd.8.gz
-usr/share/man/uk/man8/chpasswd.8.gz
-usr/share/man/uk/man8/groupadd.8.gz
-usr/share/man/uk/man8/groupdel.8.gz
-usr/share/man/uk/man8/groupmod.8.gz
-usr/share/man/uk/man8/grpck.8.gz
-usr/share/man/uk/man8/grpconv.8.gz
-usr/share/man/uk/man8/grpunconv.8.gz
-usr/share/man/uk/man8/newusers.8.gz
-usr/share/man/uk/man8/nologin.8.gz
-usr/share/man/uk/man8/pwck.8.gz
-usr/share/man/uk/man8/pwconv.8.gz
-usr/share/man/uk/man8/pwunconv.8.gz
-usr/share/man/uk/man8/useradd.8.gz
-usr/share/man/uk/man8/userdel.8.gz
-usr/share/man/uk/man8/usermod.8.gz
-usr/share/man/uk/man8/vigr.8.gz
-usr/share/man/uk/man8/vipw.8.gz
-usr/share/man/zh_CN/
-usr/share/man/zh_CN/man1/
-usr/share/man/zh_CN/man1/chage.1.gz
-usr/share/man/zh_CN/man1/chfn.1.gz
-usr/share/man/zh_CN/man1/chsh.1.gz
-usr/share/man/zh_CN/man1/expiry.1.gz
-usr/share/man/zh_CN/man1/gpasswd.1.gz
-usr/share/man/zh_CN/man1/passwd.1.gz
-usr/share/man/zh_CN/man5/
-usr/share/man/zh_CN/man5/gshadow.5.gz
-usr/share/man/zh_CN/man5/login.defs.5.gz
-usr/share/man/zh_CN/man5/passwd.5.gz
-usr/share/man/zh_CN/man5/shadow.5.gz
-usr/share/man/zh_CN/man8/
-usr/share/man/zh_CN/man8/chgpasswd.8.gz
-usr/share/man/zh_CN/man8/chpasswd.8.gz
-usr/share/man/zh_CN/man8/groupadd.8.gz
-usr/share/man/zh_CN/man8/groupdel.8.gz
-usr/share/man/zh_CN/man8/groupmod.8.gz
-usr/share/man/zh_CN/man8/grpck.8.gz
-usr/share/man/zh_CN/man8/grpconv.8.gz
-usr/share/man/zh_CN/man8/grpunconv.8.gz
-usr/share/man/zh_CN/man8/newusers.8.gz
-usr/share/man/zh_CN/man8/pwck.8.gz
-usr/share/man/zh_CN/man8/pwconv.8.gz
-usr/share/man/zh_CN/man8/pwunconv.8.gz
-usr/share/man/zh_CN/man8/useradd.8.gz
-usr/share/man/zh_CN/man8/userdel.8.gz
-usr/share/man/zh_CN/man8/usermod.8.gz
-usr/share/man/zh_CN/man8/vigr.8.gz
-usr/share/man/zh_CN/man8/vipw.8.gz
-usr/share/man/zh_TW/
-usr/share/man/zh_TW/man1/
-usr/share/man/zh_TW/man1/chfn.1.gz
-usr/share/man/zh_TW/man1/chsh.1.gz
-usr/share/man/zh_TW/man5/
-usr/share/man/zh_TW/man5/passwd.5.gz
-usr/share/man/zh_TW/man8/
-usr/share/man/zh_TW/man8/chpasswd.8.gz
-usr/share/man/zh_TW/man8/groupadd.8.gz
-usr/share/man/zh_TW/man8/groupdel.8.gz
-usr/share/man/zh_TW/man8/groupmod.8.gz
-usr/share/man/zh_TW/man8/useradd.8.gz
-usr/share/man/zh_TW/man8/userdel.8.gz
-usr/share/man/zh_TW/man8/usermod.8.gz
 usr/share/menu/
 usr/share/menu/bash
 usr/share/menu/dash
```

:::

### 在构建镜像时预装依赖软件包

在之前的版本中，1Panel 运行时所需的各种依赖软件包，是在容器首次运行后由 `install.sh` 检测并通过 `apt` 安装的。但这导致每次新建容器都需要重新安装依赖，而且 Debian 官方源在中国大陆的下载速度并不快，有时候可能要花费大量的时间。

考虑到 Debian Stable 的软件包以稳定著称，一般不会有大的功能性更新，再加上 Debian 的基础镜像本身也会有一些小更新，所以这次我在构建镜像时就安装依赖软件包，把它们当成运行环境的一部分打包进镜像。现在首次运行时只需下载 1Panel 安装包并安装，大大提升了安装的速度。

### 重新分析依赖软件包清单

之前依赖软件包直接参考了别人的现有项目，这次我直接把 1Panel 的源码拉下来，让 AI 扫描了一遍它可能会调用的命令，去掉在 Docker 容器内明显无用或者用不了的软件包，最终确定了目前需要安装的依赖软件包列表。当然 AI 扫的结果可能会有遗漏，但是我觉得作为参考列表是绝对没有问题的。

根据 2026 年 4 月 10 日最新版 [v2.1.8 的 1Panel 源码](https://github.com/1Panel-dev/1Panel/tree/release-2.1.8)，AI 扫描的结果如下：

::: details

**1. Docker 相关命令**

**1.1 docker exec - 在容器中执行命令**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| MySQL数据库执行SQL | `docker exec <containerName> mysql -uroot -p<password> -e <command>` | agent/app/service/database_mysql.go:606 |
| MySQL数据库执行SQL(行格式) | `docker exec <containerName> mysql -uroot -p<password> -e <command>` | agent/app/service/database_mysql.go:628 |
| PostgreSQL备份 | `docker exec -i <containerName> sh -c "PGPASSWORD=<password> pg_dump -F c -U <username> -d <name>"` | agent/utils/postgresql/client/local.go:145 |
| PostgreSQL恢复 | `docker exec -i <containerName> sh -c "PGPASSWORD=<password> pg_restore -F c -c --if-exists --no-owner -U <username> -d <name>"` | agent/utils/postgresql/client/local.go:168 |
| 运行时环境安装包管理器 | `docker exec -i <containerName> bash -c "<pkgManager> <operation> <module>"` | agent/app/service/runtime.go:637 |
| PostgreSQL执行SQL | `docker exec -i <containerName> <command>` | agent/utils/postgresql/client/local.go:243 |
| PostgreSQL执行SQL(行格式) | `docker exec -i <containerName> <command>` | agent/utils/postgresql/client/local.go:259 |
| MySQL执行SQL | `docker exec -i <containerName> <command>` | agent/utils/mysql/client/local.go:376 |
| MySQL执行SQL(行格式) | `docker exec -i <containerName> <command>` | agent/utils/mysql/client/local.go:393 |
| MySQL恢复数据库 | `docker exec -i <containerName> mysql -uroot -p<password> --default-character-set=<format> <name>` | agent/utils/mysql/client/local.go:277 |
| Redis状态查询 | `docker exec <containerName> redis-cli -a <password> info` | agent/app/service/database_redis.go:138 |
| Redis配置获取 | `docker exec <containerName> redis-cli -a <password> config get <param>` | agent/app/service/database_redis.go:197 |
| MySQL备份(本地) | `docker exec -i <containerName> mysqldump -uroot -p<password> --default-character-set=<format> <name>` | agent/utils/mysql/client/local.go:253 |
| Supervisor进程管理(容器内) | `docker exec <containerName> supervisorctl <processNames>` | agent/app/service/host_tool.go:554 |
| Supervisor进程重启(容器内) | `docker exec <containerName> supervisorctl <processNames>` | agent/app/service/host_tool.go:597,600 |
| Ollama模型信息查询 | `docker exec <containerName> ollama show <name>` | agent/app/service/ai.go:80 |
| Ollama模型停止 | `docker exec <containerName> ollama stop <name>` | agent/app/service/ai.go:140 |
| Ollama模型删除 | `docker exec <containerName> ollama rm <name>` | agent/app/service/ai.go:197 |
| Ollama模型列表 | `docker exec <containerName> ollama list` | agent/app/service/ai.go:213 |
| Ollama模型存在检查 | `docker exec <containerName> ollama list \| grep <name>` | agent/app/service/ai.go:385 |
| Ollama模型拉取 | `docker exec <containerName> ollama pull <name>` | agent/app/service/ai.go:404 |
| OpenClaw微信渠道登录 | `docker exec <containerName> openclaw channels login --channel openclaw-weixin` | agent/app/service/agents_channels.go:312 |
| OpenClaw渠道配对批准 | `docker exec <containerName> openclaw pairing approve <type> <code>` | agent/app/service/agents_channels.go:362,370 |
| OpenClaw插件目录检查 | `docker exec <containerName> test -d <pluginPath>` | agent/app/service/agents_channels.go:200 |
| OpenClaw技能列表查询 | `docker exec <containerName> openclaw skills list --json 2>&1` | agent/app/service/agents_overview.go:104 |
| OpenClaw技能列表查询 | `docker exec <containerName> openclaw skills list --json 2>&1` | agent/app/service/agents_skills.go:51 |
| NPM注册表查询 | `docker exec <containerName> npm get registry` | agent/app/service/agents.go:885 |
| NPM注册表设置 | `docker exec <containerName> npm set registry <registry>` | agent/app/service/agents.go:897 |
| Nginx重新加载 | `docker exec -i <containerName> nginx -s reload` | agent/app/service/backup_website.go:181 |
| Redis持久化保存 | `docker exec <containerName> redis-cli -a <password> --no-auth-warning save` | agent/app/service/backup_redis.go:100 |
| Redis AOF文件复制 | `docker cp <containerName>:/data/appendonly.aof <backupDir>/<fileName>` | agent/app/service/backup_redis.go:112 |
| Redis RDB文件复制 | `docker cp <containerName>:/data/dump.rdb <backupDir>/<fileName>` | agent/app/service/backup_redis.go:118 |
| OpenClaw技能执行 | `docker exec <containerName> openclaw skills exec <skillName> <args>` | agent/app/service/agents_skills.go:157,164 |
| OpenClaw技能详情 | `docker exec <containerName> openclaw skills show <skillName> --json` | agent/app/service/agents_skills.go:241 |
| OpenClaw技能搜索(SkillHub) | `docker exec <containerName> skillhub search <keyword> --json` | agent/app/service/agents_skills.go:156 |
| OpenClaw技能搜索(ClawHub) | `docker exec <containerName> clawhub search <keyword>` | agent/app/service/agents_skills.go:158 |
| PHP模块检查 | `docker exec -i <containerName> php -m` | agent/app/service/runtime.go:680 |
| 读取容器passwd文件 | `docker exec <containerName> cat /etc/passwd` | agent/app/service/container.go:1166 |
| OpenClaw插件安装/卸载 | `docker exec <containerName> sh -c <script>` | agent/app/service/agents_channels.go:201, 207, 243, 247, 283 |

**1.2 docker compose / docker-compose - 容器编排管理**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 启动容器(后台) | `docker-compose -f <composePath> up -d` 或 `docker compose -f <composePath> up -d` | agent/app/service/runtime_utils.go:158,164 |
| 停止/重启容器 | `docker-compose -f <composePath> <operate>` 或 `docker compose -f <composePath> <operate>` | agent/app/service/runtime_utils.go:160,166 |
| 构建镜像 | `docker-compose -f <composePath> build` 或 `docker compose -f <composePath> build` | agent/app/service/runtime_utils.go:327,329 |
| 容器日志查看 | `docker-compose <yamlFiles> <cmdArgs>` 或 `docker compose <yamlFiles> <cmdArgs>` | agent/app/service/container.go:965,968 |
| 容器操作 | `docker-compose <commandArg>` 或 `docker <commandArg>` | agent/app/service/container.go:1073,1075 |
| 构建Nginx镜像 | `docker compose -f <composePath> build` | agent/app/service/nginx.go:244 |
| 构建应用镜像 | `docker compose -f <composePath> build` | agent/app/service/app_utils.go:666 |

**1.3 docker run - 运行容器**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| MySQL远程备份 | `docker run --rm --net=host -i <image> /bin/bash -c 'mysqldump ...'` | agent/utils/mysql/client/remote.go:275 |
| MySQL远程恢复 | `docker run --rm --net=host -i <image> /bin/bash -c 'mysql ...'` | agent/utils/mysql/client/remote.go:307 |
| PostgreSQL远程备份 | `docker run --rm --net=host -i <image> /bin/bash -c 'PGPASSWORD=<password> pg_dump ...'` | agent/utils/postgresql/client/remote.go:163 |
| PostgreSQL远程恢复 | `docker run --rm --net=host -i <image> /bin/bash -c 'PGPASSWORD=<password> pg_restore ...'` | agent/utils/postgresql/client/remote.go:210 |

**1.4 docker 其他命令**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 容器日志查看 | `docker <cmdArgs>` | agent/app/service/container.go:971 |
| 检测docker compose命令 | `docker compose version` | agent/utils/common/common.go:415 |
| 检测docker-compose命令 | `docker-compose version` | agent/utils/common/common.go:418 |
| 恢复Docker镜像 | `docker load < <src>/images.tar.gz` | agent/app/service/snapshot_recover.go:379 |
| 保存Docker镜像 | `docker save <imageList> \| gzip -c > <targetDir>/images.tar.gz` | agent/app/service/snapshot_create.go:408 |
| Docker信息查看 | `docker info \| grep Swarm` | agent/app/service/docker.go:92 |
| Docker守护进程验证 | `dockerd --validate` | agent/app/service/docker.go:426 |
| Docker路径查找 | `which docker` | agent/init/hook/hook.go:143 |
| Docker登出 | `docker logout -i <url>` | agent/app/service/image_repo.go:123, 181 |
| Docker登录 | `docker login -u <user> -p <password> <host>` | agent/app/service/image_repo.go:202 |

**2. 文件操作命令**

**2.1 cp - 文件复制**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 应用安装时复制文件 | `/bin/bash -c "cp -rn <detailDir>/* <installPath> \| true"` | agent/app/service/app_utils.go:769 |
| 复制脚本目录 | `cp -rf <sourceScripts>/. <dstScripts>/` | agent/app/service/app_utils.go:800 |
| 复制文件(保留属性) | `cp -rfp '<src>' '<dst>'` | agent/utils/files/file_op.go:608 |
| 复制文件 | `cp -fp '<src>' '<dst>'` | agent/utils/files/file_op.go:614 |
| 复制目录内容 | `cp -rfp '<src>'/. '<dst>'` | agent/utils/files/file_op.go:620 |
| 复制文件(core) | `cp -f <src> <dst>.tmp` | core/utils/files/files.go:85 |
| 复制语言文件 | `cp -r <src>/lang /usr/local/bin/` | agent/init/lang/lang.go:65 |
| 复制语言文件(core) | `cp -r <src>/lang /usr/local/bin/` | core/init/geo/lang.go:64 |
| 复制GeoIP数据库 | `mkdir <path> && cp <src>/GeoIP.mmdb <path>/` | agent/init/lang/lang.go:76 |
| 复制GeoIP数据库(core) | `mkdir <path> && cp <src>/GeoIP.mmdb <path>/` | core/init/geo/lang.go:75 |
| 恢复时复制语言文件 | `cp -r <src> /usr/local/bin` | core/cmd/server/cmd/restore.go:70 |
| 恢复时复制GeoIP | `mkdir <path> && cp <src>/GeoIP.mmdb <path>/` | core/cmd/server/cmd/restore.go:72 |

**2.2 mv - 文件移动/重命名**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 移动文件 | `mv '<command>'` | agent/utils/files/file_op.go:545 |
| 重命名文件 | `mv '<oldPath>' '<dstPath>'` | agent/utils/files/file_op.go:552 |
| 移动临时文件 | `mv <dst>.tmp <dst>` | core/utils/files/files.go:88 |

**2.3 rm - 文件删除**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 清空目录内容 | `rm -rf <dst>/*` | agent/utils/files/file_op.go:170 |
| 删除目录 | `rm -rf <dst>` | agent/utils/files/file_op.go:177 |

**2.4 chmod - 修改权限**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 修改文件权限(core) | `<sudo> chmod 755 /usr/local/bin/1panel-agent /usr/local/bin/1panel-core` | core/cmd/server/cmd/restore.go:63 |
| 修改文件权限(core) | `<sudo> chmod 755 /usr/local/bin/1pctl` | core/cmd/server/cmd/restore.go:69 |
| 设置交换文件权限 | `chmod 0600 <path>` | agent/app/service/device.go:264 |

**2.5 chown - 修改文件所有者**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 修改网站目录所有者 | `chown -R 1000:1000 "<path>"` | agent/app/service/website_utils.go:1224 |
| 修改FTP用户目录所有者 | `chown -R <user>:<group> <path>` | agent/utils/toolbox/pure-ftpd.go:121 |
| 修改FTP用户目录所有者 | `chown -R <user>:<group> <path>` | agent/utils/toolbox/pure-ftpd.go:195 |

**2.6 tar - 归档压缩**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 备份网站日志 | `tar -czf <dstFilePath> -C <websiteLogDir> access.log error.log` | agent/app/service/cronjob_helper.go:394 |
| 备份网站日志(重试) | `tar -czf <dstFilePath> -C <dstDir> access.log error.log` | agent/app/service/cronjob_helper.go:402 |
| 解压tar.gz文件 | `tar zxvfC <src> <dst>` | agent/init/lang/lang.go:117 |
| 解压tar.gz文件(core) | `tar zxvfC <src> <dst>` | core/init/geo/lang.go:116 |
| 解压归档文件 | `<tarCmd> <options> "<filePath>" -C "<dstDir>"` | agent/utils/files/tar.go:20 |
| 解压.tar.gz文件 | `tar -zxvf <file> -C <dir>` | agent/utils/files/tar_gz.go:34 |
| 压缩为.tar.gz文件 | `tar -zcf <file> -C <dir> <paths>` | agent/utils/files/tar_gz.go:59 |

**2.7 gzip/gunzip - 压缩/解压**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| MySQL备份压缩 | `gzip -cf` | agent/utils/mysql/client/local.go:257 |
| PostgreSQL备份压缩 | `gzip -cf` | agent/utils/postgresql/client/local.go:152 |
| PostgreSQL远程备份压缩 | `gzip <fileNameItem>` | agent/utils/postgresql/client/remote.go:180 |
| PostgreSQL远程备份解压 | `gunzip <sourceFile>` | agent/utils/postgresql/client/remote.go:200 |
| PostgreSQL远程备份重新压缩 | `gzip <fileName>` | agent/utils/postgresql/client/remote.go:206 |
| MySQL远程备份压缩 | `gzip -cf` | agent/utils/mysql/client/remote.go:279 |
| 解压gz文件 | `gunzip <path>` | agent/app/service/ssh.go:807 |
| 解压gz文件 | `gunzip <path>` | agent/utils/toolbox/pure-ftpd.go:301 |
| 解压SSH日志 | `gunzip <path>` | agent/app/service/ssh.go:582 |
| Docker镜像保存 | `docker save <imageList> \| gzip -c > <targetDir>/images.tar.gz` | agent/app/service/snapshot_create.go:408 |

**2.8 7z/unrar/unzip - 解压缩**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 7z解压 | `7z x -y -o<dstDir> <filePath>` | agent/utils/files/x7z.go:25 |
| 7z压缩 | `7z a -r <tmpFile> <relativePaths...>` | agent/utils/files/x7z.go:49 |
| RAR解压 | `unrar x -y -o+ <filePath> <dstDir>` | agent/utils/files/rar.go:25 |
| RAR压缩 | `rar a -r <tmpFile> <relativePaths...>` | agent/utils/files/rar.go:49 |
| ZIP解压 | `unzip -qo <filePath> -d <dstDir>` | agent/utils/files/zip.go:26 |
| ZIP压缩 | `zip -qr <tmpFile> <relativePaths...>` | agent/utils/files/zip.go:45 |

**2.9 cat + grep - 文件内容搜索**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 获取compose文件中的镜像 | `cat <path>/docker-compose.yml \| grep image:` | agent/app/service/snapshot.go:306 |
| 获取节点代理ID | `cat /etc/1panel/.nodeProxyID` | agent/middleware/certificate.go:32 |
| 检查PureFTP日志配置 | `cat /etc/pure-ftpd/pure-ftpd.conf \| grep AltLog \| grep clf:` | agent/utils/toolbox/pure-ftpd.go:253 |
| 获取PureFTP日志配置 | `cat /etc/pure-ftpd/conf/AltLog` | agent/utils/toolbox/pure-ftpd.go:262 |
| 检查IP转发 | `cat /proc/sys/net/ipv4/ip_forward` | agent/utils/firewall/client/iptables/filter.go:173 |
| 检查sysctl配置 | `grep -q '^net.ipv4.ip_forward' /etc/sysctl.conf` | agent/utils/firewall/client/iptables.go:238 |
| 读取SSH日志 | `<bash_command>` | agent/app/service/ssh.go:1137 |

**2.10 tail - 查看文件末尾**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 查看ClamAV日志 | `tail -n <tail> <filePath>` | agent/app/service/clam.go:408 |
| 获取磁盘信息 | `df -h <device> \| tail -1` | agent/app/service/disk_utils.go:389 |

**2.11 find - 文件查找**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 文件搜索 | `find <path> -name "*<search>*"` | agent/utils/files/fileinfo.go:149 |

**2.12 du - 磁盘使用统计**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 获取目录大小 | `du -s <path>` | agent/utils/files/file_op.go:685 |
| 获取子目录大小 | `du -k --max-depth=1 --exclude=proc <path>` | agent/utils/files/file_op.go:722 |

**3. 系统信息命令**

**3.1 uname - 系统信息**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 获取系统信息 | `uname -a` | agent/app/service/upgrade.go:527 |
| 获取系统信息(core) | `uname -a` | core/utils/common/common.go:149 |

**3.2 hostname/whoami - 系统信息**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 获取主机名 | `hostname` | agent/app/service/device.go:396 |
| 获取当前用户 | `whoami` | agent/app/service/device.go:404 |
| 设置系统主机名 | `<sudo> hostnamectl set-hostname <value>` | agent/app/service/device.go:135 |

**3.3 df - 磁盘使用查看**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 查看磁盘使用(JSON格式) | `df -hT -P \| grep '/' \| grep -v tmpfs \| grep -v 'snap/core' \| grep -v udev` | agent/app/service/alert.go:311 |
| 超时磁盘使用查看 | `timeout 2 df -hT -P \| <format>` | agent/app/service/dashboard.go:433 |
| 超时磁盘使用查看 | `timeout 1 df -lhT -P \| <format>` | agent/app/service/dashboard.go:436 |

**3.4 timedatectl - 时间管理**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 获取时区信息 | `timedatectl \| grep 'Time zone'` | agent/utils/common/common.go:292 |
| 获取时区信息(core) | `timedatectl \| grep 'Time zone'` | core/utils/common/common.go:62 |
| 列出系统时区 | `timedatectl list-timezones` | agent/app/service/device.go:85 |
| 设置系统时间 | `<sudo> date -s "<dateTime>"` | agent/utils/ntp/ntp.go:65 |
| 设置时区 | `<sudo> timedatectl set-timezone "<timezone>"` | agent/utils/ntp/ntp.go:76 |

**4. 用户和权限管理**

**4.1 useradd/groupadd - 用户/组管理**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 添加系统用户 | `useradd -u 1000 -g <group> 1panel` | agent/utils/toolbox/pure-ftpd.go:66 |
| 添加系统组 | `groupadd -g 1000 1panel` | agent/utils/toolbox/pure-ftpd.go:74 |
| 添加系统用户 | `useradd -u 1000 -g 1panel 1panel` | agent/utils/toolbox/pure-ftpd.go:77 |

**4.2 chpasswd - 修改密码**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 修改用户密码 | `<sudo> echo '<user>:<password>' \| <sudo> chpasswd` | agent/app/service/device.go:226 |

**4.3 sudo - 权限提升**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 检查sudo权限 | `sudo -n ls` | agent/utils/cmd/cmd.go:24 |
| 检查sudo权限(core) | `sudo -n ls` | core/utils/cmd/cmd.go:12 |
| 验证sudo权限 | `sudo -n true` | core/utils/ssh/ssh.go:127 |
| 执行sudo命令 | `sudo <name> <args...>` | agent/app/service/ssh.go:297 |

**5. 磁盘管理**

**5.1 mkfs - 磁盘格式化**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 格式化为ext4 | `mkfs.ext4 -F <device>` | agent/app/service/disk_utils.go:411 |
| 格式化为xfs | `mkfs.xfs -f <device>` | agent/app/service/disk_utils.go:416 |

**5.2 mkswap - 交换文件格式化**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 格式化交换文件 | `mkswap -f <path>` | agent/app/service/device.go:268 |

**5.3 parted/partprobe - 磁盘分区管理**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 刷新分区表 | `partprobe <device>` | agent/app/service/disk.go:69 |
| 创建GPT标签 | `parted -s <device> mklabel gpt` | agent/app/service/disk.go:73 |
| 创建分区 | `parted -s <device> mkpart primary 1MiB 100%` | agent/app/service/disk.go:77 |
| 刷新分区表 | `partprobe <device>` | agent/app/service/disk.go:81 |

**5.4 mount/umount - 磁盘挂载**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 挂载磁盘 | `mount -t <filesystem> <device> <mountPoint>` | agent/app/service/disk.go:137 |
| 卸载磁盘 | `umount -f <mountPoint>` | agent/app/service/disk.go:160 |

**5.5 swapon/swapoff - 交换空间管理**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 获取交换空间摘要 | `<sudo> swapon --summary` | agent/app/service/device.go:413 |
| 禁用交换文件 | `<sudo> swapoff <path>` | agent/app/service/device.go:248 |
| 创建交换文件 | `dd if=/dev/zero of=<path> bs=1024 count=<size>` | agent/app/service/device.go:259 |
| 启用交换文件 | `swapon <path>` | agent/app/service/device.go:273 |

**5.6 lsblk - 块设备信息**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 列出块设备(JSON格式) | `lsblk -J -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE,MODEL,SERIAL,TRAN,ROTA` | agent/app/service/disk.go:33 |
| 列出块设备(对格式) | `lsblk -P -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE,MODEL,SERIAL,TRAN,ROTA` | agent/app/service/disk.go:41 |

**5.7 blkid - 块设备ID查询**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 获取文件系统类型 | `blkid -o value -s TYPE <device>` | agent/app/service/disk_utils.go:518 |
| 获取设备UUID | `blkid -s UUID -o value <device>` | agent/app/service/disk_utils.go:578 |

**6. 服务管理**

**6.1 systemctl - 系统服务管理**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 获取服务配置文件路径 | `systemctl show -p FragmentPath <service>` | agent/utils/controller/controller.go:235 |
| 获取服务配置文件路径(core) | `systemctl show -p FragmentPath <service>` | core/utils/controller/controller.go:260 |

**6.2 service - 服务管理(OpenRC/SysVinit)**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 检查服务状态 | `if service <name> status >/dev/null 2>&1; then echo 'active'; else echo 'inactive'; fi` | agent/utils/controller/manager/openrc.go:25 |
| 检查服务状态 | `if service <name> status >/dev/null 2>&1; then echo 'active'; else echo 'inactive'; fi` | agent/utils/controller/manager/sysvinit.go:25 |
| 检查服务状态(core) | `if service <name> status >/dev/null 2>&1; then echo 'active'; else echo 'inactive'; fi` | core/utils/controller/manager/openrc.go:25 |
| 检查服务状态(core) | `if service <name> status >/dev/null 2>&1; then echo 'active'; else echo 'inactive'; fi` | core/utils/controller/manager/sysvinit.go:25 |

**6.3 服务状态检查**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 检查服务是否启用 | `if ls /etc/rc*.d/S*<service> >/dev/null 2>&1; then echo 'enabled'; else echo 'disabled'; fi` | agent/utils/controller/manager/openrc.go:32 |
| 检查服务是否启用 | `if ls /etc/rc*.d/S*<service> >/dev/null 2>&1; then echo 'enabled'; else echo 'disabled'; fi` | agent/utils/controller/manager/sysvinit.go:32 |
| 检查服务是否启用(core) | `if ls /etc/rc*.d/S*<service> >/dev/null 2>&1; then echo 'enabled'; else echo 'disabled'; fi` | core/utils/controller/manager/openrc.go:32 |
| 检查服务是否启用(core) | `if ls /etc/rc*.d/S*<service> >/dev/null 2>&1; then echo 'enabled'; else echo 'disabled'; fi` | core/utils/controller/manager/sysvinit.go:32 |

**6.4 supervisorctl - 进程管理**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| Supervisor进程状态管理 | `supervisorctl <processNames...>` | agent/app/service/host_tool.go:557 |
| Supervisor进程重启 | `supervisorctl <processNames...>` | agent/app/service/host_tool.go:600 |
| Supervisor版本查询 | `supervisord -v` | agent/app/service/host_tool.go:74 |

**6.5 reboot - 系统重启**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 重启系统 | `<sudo> reboot` | agent/app/service/dashboard.go:63 |

**6.6 sysctl - 内核参数管理**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 创建sysctl目录 | `<sudo> mkdir -p /etc/sysctl.d` | agent/utils/firewall/client.go:85 |
| 禁用ICMP回显 | `echo <enable> \| <sudo> tee /proc/sys/net/ipv4/icmp_echo_ignore_all > /dev/null` | agent/utils/firewall/client.go:98 |
| 禁用IPv6 ICMP回显 | `echo <enable> \| <sudo> tee /proc/sys/net/ipv6/icmp/echo_ignore_all > /dev/null` | agent/utils/firewall/client.go:105 |
| 启用IP转发 | `echo 1 > /proc/sys/net/ipv4/ip_forward` | agent/utils/firewall/client/iptables.go:235 |
| 添加sysctl配置 | `grep -q '^net.ipv4.ip_forward' /etc/sysctl.conf \| echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf` | agent/utils/firewall/client/iptables.go:238 |
| 应用sysctl配置 | `sysctl -p` | agent/utils/firewall/client/iptables.go:239 |

**7. 防火墙命令**

**7.1 firewall-cmd - Firewalld管理**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 检查防火墙状态 | `LANGUAGE=en_US:en firewall-cmd --state` | agent/utils/firewall/client/firewalld.go:25 |
| 检查防火墙状态(core) | `LANGUAGE=en_US:en firewall-cmd --state` | core/utils/firewall/firewall.go:12 |
| 获取防火墙版本 | `firewall-cmd --version` | agent/utils/firewall/client/firewalld.go:30 |
| 重新加载防火墙 | `firewall-cmd --reload` | agent/utils/firewall/client/firewalld.go:59 |
| 列出端口 | `firewall-cmd --zone=public --list-ports` | agent/utils/firewall/client/firewalld.go:71 |
| 列出富规则 | `firewall-cmd --zone=public --list-rich-rules` | agent/utils/firewall/client/firewalld.go:92 |
| 列出端口转发 | `firewall-cmd --zone=public --list-forward-ports` | agent/utils/firewall/client/firewalld.go:115 |
| 添加/删除端口 | `firewall-cmd --zone=public --<operation>-port=<port>/<protocol> --permanent` | agent/utils/firewall/client/firewalld.go:163 |
| 添加/删除富规则 | `firewall-cmd --zone=public --<operation>-rich-rule '<rule>' --permanent` | agent/utils/firewall/client/firewalld.go:187 |
| 查询伪装状态 | `firewall-cmd --zone=public --query-masquerade` | agent/utils/firewall/client/firewalld.go:239 |
| 添加伪装 | `firewall-cmd --zone=public --add-masquerade --permanent` | agent/utils/firewall/client/firewalld.go:242 |
| 添加端口(core) | `firewall-cmd --zone=public --add-port=<port>/tcp --permanent` | core/utils/firewall/firewall.go:32 |
| 删除端口(core) | `firewall-cmd --zone=public --remove-port=<port>/tcp --permanent` | core/utils/firewall/firewall.go:37 |
| 重新加载(core) | `firewall-cmd --reload` | core/utils/firewall/firewall.go:38 |

**7.2 ufw - UFW防火墙管理**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 检查防火墙状态 | `ufw status \| grep Status` | agent/utils/firewall/client/ufw.go:27 |
| 检查防火墙状态(core) | `ufw status \| grep Status` | core/utils/firewall/firewall.go:23 |
| 获取UFW版本 | `ufw version \| grep ufw` | agent/utils/firewall/client/ufw.go:39 |
| 启用防火墙 | `echo y \| ufw enable` | agent/utils/firewall/client/ufw.go:48 |
| 禁用防火墙 | `ufw disable` | agent/utils/firewall/client/ufw.go:55 |
| 查看详细状态 | `ufw status verbose` | agent/utils/firewall/client/ufw.go:76 |
| 添加规则 | `ufw <rule>` | agent/utils/firewall/client/ufw.go:151 |
| 查看规则 | `ufw status numbered` | agent/utils/firewall/client/ufw.go:262 |
| 添加端口(core) | `ufw allow <port>` | core/utils/firewall/firewall.go:43 |
| 删除端口(core) | `ufw delete allow <port>` | core/utils/firewall/firewall.go:48 |

**7.3 iptables - iptables防火墙管理**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 检查iptables是否存在 | `iptables -L -n \| head -1` | agent/utils/firewall/client/iptables.go:25 |
| 获取iptables版本 | `iptables --version` | agent/utils/firewall/client/iptables.go:49 |
| 添加iptables规则 | `<sudo> iptables -w -t <table> <rule>` | agent/utils/firewall/client/iptables/common.go:48 |
| 删除iptables规则 | `<sudo> iptables -t <table> <rule>` | agent/utils/firewall/client/iptables/common.go:57 |
| 列出链规则 | `<sudo> iptables -w -t <table> -nL <chain>` | agent/utils/firewall/client/iptables/filter.go:78 |
| 列出链规则(详细) | `<sudo> iptables -w -t <table> -L <chain>` | agent/utils/firewall/client/iptables/filter.go:111 |

**8. SSH/SELinux 管理**

**8.1 SSH 相关命令**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 执行命令 | `<name> <args...>` | agent/app/service/ssh.go:299 |
| 生成SSH密钥 | `ssh-keygen <args...>` | agent/app/service/ssh.go:400 |

**8.2 SELinux 命令**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 检查SELinux状态 | `<sudo> getenforce` | agent/app/service/ssh.go:210 |
| 删除SSH端口策略 | `<sudo> semanage port -d -t ssh_port_t -p tcp <port>` | agent/app/service/ssh.go:213 |
| 添加SSH端口策略 | `<sudo> semanage port -a -t ssh_port_t -p tcp <port>` | agent/app/service/ssh.go:218 |

**9. Fail2ban 命令**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 获取Fail2ban版本 | `fail2ban-client version` | agent/utils/toolbox/fail2ban.go:50 |
| 重新加载Fail2ban | `fail2ban-client reload` | agent/utils/toolbox/fail2ban.go:66 |
| 解除所有封禁 | `fail2ban-client unban --all` | agent/utils/toolbox/fail2ban.go:77 |
| 封禁IP | `fail2ban-client set sshd banip <ips>` | agent/utils/toolbox/fail2ban.go:79, 85 |
| 查看SSH封禁IP | `fail2ban-client status sshd \| grep 'Banned IP list:'` | agent/utils/toolbox/fail2ban.go:94 |
| 获取SSH忽略IP | `fail2ban-client get sshd ignoreip` | agent/utils/toolbox/fail2ban.go:114 |

**10. Pure-FTPd 命令**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 删除FTP用户 | `pure-pw userdel <username>` | agent/utils/toolbox/pure-ftpd.go:131 |
| 修改FTP用户目录 | `pure-pw usermod <username> -d <path>` | agent/utils/toolbox/pure-ftpd.go:192 |
| 修改FTP用户状态 | `pure-pw usermod <username> -r <status>` | agent/utils/toolbox/pure-ftpd.go:209 |
| 列出FTP用户 | `pure-pw list` | agent/utils/toolbox/pure-ftpd.go:216 |
| 查看用户IP限制 | `pure-pw show <username> \| grep 'Allowed client IPs :'` | agent/utils/toolbox/pure-ftpd.go:227 |
| 生成FTP用户数据库 | `pure-pw mkdb` | agent/utils/toolbox/pure-ftpd.go:243 |

**11. ClamAV 命令**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 获取ClamAV版本 | `clamdscan --version` | agent/app/service/clam.go:90 |
| 获取FreshClam版本 | `freshclam --version` | agent/app/service/clam.go:102 |
| ClamAV扫描 | `clamdscan --fdpass <strategy> <path>` | agent/utils/clam/clam.go:37 |

**12. GPU 设备命令**

**12.1 XPU-SMI**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| XPU设备发现 | `xpu-smi discovery -d <deviceID> -j` | agent/utils/ai_tools/xpu/xpu.go:37 |
| XPU设备状态 | `xpu-smi stats -d <deviceID> -j` | agent/utils/ai_tools/xpu/xpu.go:42 |
| XPU全局设备发现 | `xpu-smi discovery -j` | agent/utils/ai_tools/xpu/xpu.go:96, 125 |
| XPU进程列表 | `xpu-smi ps -j` | agent/utils/ai_tools/xpu/xpu.go:147 |
| XPU设备发现 | `xpu-smi discovery -d <deviceID> -j` | agent/utils/ai_tools/xpu/xpu.go:197 |
| XPU设备状态 | `xpu-smi stats -d <deviceID> -j` | agent/utils/ai_tools/xpu/xpu.go:202 |

**12.2 NVIDIA-SMI**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| GPU设备查询 | `nvidia-smi -q -x` | agent/utils/ai_tools/gpu/gpu.go:27 |

**13. OpenSSL 命令**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 文件加密 | `MY_PASS='<secret>' openssl enc -aes-256-cbc -salt -pass env:MY_PASS -in <file> -out <tmp>` | agent/utils/files/file_op.go:1256 |
| 文件解密 | `MY_PASS='<secret>' openssl enc -aes-256-cbc -d -salt -pass env:MY_PASS -in <file> -out <tmp>` | agent/utils/files/file_op.go:1265 |

**14. Shell 和脚本执行**

**14.1 bash - Shell执行**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 执行脚本文件 | `bash <scriptPath>` | agent/utils/cmd/cmdx.go:139 |
| 执行脚本文件(core) | `bash <scriptPath>` | core/utils/cmd/cmdx.go:117 |
| 终端会话 | `bash` | core/utils/terminal/local_cmd.go:29 |
| 执行命令 | `bash -c <command>` | core/utils/cmd/cmd.go:28 |
| 获取系统语言 | `bash -c "grep '^LANGUAGE=' /usr/local/bin/1pctl \| cut -d'=' -f2"` | core/i18n/i18n.go:212 |

**14.2 which - 命令路径查找**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 查找命令路径 | `which <name>` | agent/utils/cmd/cmd.go:32 |
| 查找命令路径(core) | `which <name>` | core/utils/cmd/cmd.go:20 |

**14.3 grep - 文本搜索**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 日志关键词搜索 | `grep -a <keyword> <logFile>` | agent/utils/alert/alert.go:487 |
| 获取1pctl配置参数 | `grep '^<param>=' /usr/local/bin/1pctl \| cut -d'=' -f2` | agent/utils/common/common.go:425,436 |
| 获取1pctl配置参数(core) | `grep '^<param>=' /usr/local/bin/1pctl \| cut -d'=' -f2` | core/utils/common/common.go:248,259 |
| 获取1pctl基础目录(core) | `grep '^BASE_DIR=' /usr/local/bin/1pctl \| cut -d'=' -f2` | core/cmd/server/cmd/root.go:41 |
| 获取1pctl基础目录(core) | `grep '^BASE_DIR=' /usr/local/bin/1pctl \| cut -d'=' -f2` | core/cmd/server/cmd/restore.go:32 |
| 获取用户信息配置(core) | `grep '^CHANGE_USER_INFO=' /usr/local/bin/1pctl \| cut -d'=' -f2` | core/init/viper/viper.go:109 |
| 获取原始版本(core) | `grep '^ORIGINAL_VERSION=' <upgradeDir>/1pctl \| cut -d'=' -f2` | core/cmd/server/cmd/restore.go:140 |

**14.4 sed - 流编辑器**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 修改1pctl基础目录(core) | `sed -i -e 's#BASE_DIR=.*#BASE_DIR=<path>#g' /usr/local/bin/1pctl` | core/app/service/upgrade.go:215 |
| 修改1pctl语言设置(core) | `sed -i -e 's#LANGUAGE=.*#LANGUAGE=<lang>#g' /usr/local/bin/1pctl` | core/app/service/upgrade.go:220 |
| 删除用户信息配置(core) | `<sudo> sed -i '/CHANGE_USER_INFO=<value>/d' /usr/local/bin/1pctl` | core/init/hook/hook.go:80 |
| 修改原始密码配置(core) | `<sudo> sed -i -e 's#ORIGINAL_PASSWORD=.*#ORIGINAL_PASSWORD=**********#g' /usr/local/bin/1pctl` | core/init/hook/hook.go:81 |
| 修改原始密码配置(core) | `<sudo> sed -i -e 's#ORIGINAL_PASSWORD=.*#ORIGINAL_PASSWORD=**********#g' /usr/local/bin/1pctl` | core/init/migration/migrations/init.go:56 |

**15. 多媒体处理**

**15.1 ffmpeg - 音视频处理**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 音视频转换 | `ffmpeg <args...>` | agent/utils/convert/convert.go:72 |

**16. 1Panel 工具集**

| 功能 | 示例命令 | 文件位置 |
|------|----------|----------|
| 重启Core服务(core) | `1pctl restart core` | core/cmd/server/cmd/update.go:240 |
| 升级1Panel(core) | `curl -sfL <url> \| sh -s 1p upgrade <version>` | core/app/service/logs.go:112 |

**17. 软件包依赖状态检查**

| 软件包 | 所属命令 | 安装状态 |
|------|----------|----------|
| coreutils | cp, mv, rm, tail, df, du, chown, cat, whoami, uname, date, chmod, ls, timeout | ✅系统自带 |
| findutils | find | ✅系统自带 |
| gzip | gzip, gunzip | ✅系统自带 |
| tar | tar | ✅系统自带 |
| grep | grep | ✅系统自带 |
| init-system-helpers | service | ✅系统自带 |
| mount | mount, umount, swapon | ✅系统自带 |
| util-linux | lsblk, blkid, mkswap | ✅系统自带 |
| hostname | hostname | ✅系统自带 |
| passwd | chpasswd, useradd, groupadd | ✅系统自带 |
| bash | bash | ✅系统自带 |
| sed | sed | ✅系统自带 |
| debianutils | which | ✅系统自带 |
| 7zip | 7z | ☑️手动安装 |
| curl | curl | ☑️手动安装 |
| docker-cli | docker | ☑️手动安装 |
| docker-compose | docker-compose | ☑️手动安装 |
| openssl | openssl | ☑️手动安装 |
| unzip | unzip | ☑️手动安装 |
| zip | zip | ☑️手动安装 |
| unrar-free | unrar | ☑️手动安装 |
| 1Panel | 1pctl | ☑️手动安装 |
| systemd | systemctl, reboot, timedatectl | ❌不存在 |
| sudo | sudo | ❌不存在 |
| e2fsprogs | mkfs.ext4 | ❌不存在 |
| xfsprogs | mkfs.xfs | ❌不存在 |
| parted | partprobe, parted | ❌不存在 |
| supervisor | supervisorctl, supervisord | ❌不存在 |
| selinux-utils | getenforce | ❌不存在 |
| policycoreutils-python-utils | semanage | ❌不存在 |
| firewalld | firewall-cmd | ❌不存在 |
| ufw | ufw | ❌不存在 |
| iptables | iptables | ❌不存在 |
| procps | sysctl | ❌不存在 |
| fail2ban | fail2ban-client | ❌不存在 |
| pure-ftpd-common | pure-pw | ❌不存在 |
| clamav | clamdscan, freshclam | ❌不存在 |
| Intel/NVIDIA Driver | xpu-smi, nvidia-smi | ❌不存在 |
| ffmpeg | ffmpeg | ❌不存在 |

:::

### 在 Dockerfile 中不再 chmod 而是显式调用 bash 启动

之前我在构建镜像时采用的是 `RUN` 安装依赖 → `COPY` 复制脚本 → `RUN chmod` 授予可执行权限 → `ENTRYPOINT sh` 直接启动，依赖 `entrypoint.sh` 的 shebang 行调用 bash 执行的方式（如下所示），这种方式在 Dockerfile 中很常见，但是 `chmod` 的那一行 `RUN` 又会产生一层镜像。

```
# 复制启动脚本和安装脚本到容器的工作目录中
COPY entrypoint.sh install.sh /app/

# 为工作目录下的脚本授予可执行权限
RUN chmod +x entrypoint.sh install.sh

# 指定容器启动时执行的入口脚本
ENTRYPOINT ["/app/entrypoint.sh"]
```

现在 Docker 官方推荐使用 buildx 和 BuildKit，有一种更好的做法是在 COPY 时加 `--chmod=755` 参数，在复制的时候就授予可执行权限。

但是由于 iStoreOS 上的 Docker 没有 `buildx` 插件，如果想要安装必须手动下载二进制文件，非常麻烦。因此我采用了一种折中的办法，不通过 `chmod` 授予可执行权限，而是像下面这样显式调用 `bash` 执行 Shell 脚本。这种做法不需要 Shell 文件具有可执行权限，只要可读就行了。缺点是不能直接通过 `./entrypoint.sh` 这样的方式运行，但是我自己的习惯就是喜欢先打一个 `bash` 再运行的，也几乎产生不了什么影响。于是镜像又可以少一层。

```
# 复制启动脚本和安装脚本到容器的工作目录中
COPY entrypoint.sh install.sh /app/

# 指定容器启动时执行的入口脚本
ENTRYPOINT ["bash", "/app/entrypoint.sh"]
```

### 抛弃 systemctl 模拟脚本

1Panel V2 刚发布时对 `systemctl` 的依赖很强，很多操作都依赖 `systemctl` 命令完成，甚至在容器内安装 `docker-cli` 并正确配置宿主机的 `docker.sock` 目录映射完成 DooD 配置、手动在容器内执行 `docker ps` 能看到宿主机上的容器以后，1Panel 都会认为 Docker 未安装，原因是它通过 systemctl 的命令来检测 Docker 的运行状态。

当时我的解决方案是利用一个现成的 [docker-systemctl-replacement](https://github.com/gdraheim/docker-systemctl-replacement) 脚本，通过模拟 `systemctl` 的行为来骗过 1Panel 的检测。但是这个脚本是用 Python 写的，并且非常复杂，难以只用 Bash 实现相同效果，所以被迫引入了 Python 依赖。

随着 1Panel V2 自身的版本迭代，目前的版本已不再强依赖 `systemctl`，于是我果断抛弃了那个 `systemctl` 的模拟脚本，也彻底去掉了 Python 环境，节省了大量的镜像空间。

### 支持国际化发行版本切换

1Panel 其实有国内版和国际版两个版本，国内版的官网是 https://1panel.cn/ ，对应安装包下载地址是 `https://resource.fit2cloud.com/1panel/package/`，国际版的官网是 https://1panel.pro/ ，对应安装包下载地址是 `https://resource.1panel.pro/`。此外之前还有一个 https://1panel.hk/ ，但现在已会跳转到 https://1panel.pro/ 。

之前我的脚本直接硬编码了国内源，而在重构后的版本中，我引入了 `PANEL_EDITION` 环境变量，支持在 `cn`（国内源）和 `intl`（国际源）之间切换，给用户更多选择。

### 解决 Core 与 Agent 的启动竞争问题

之前的版本一直有一个问题，即容器在第一次运行安装完 1Panel 随即启动时，`1panel-agent` 进程会跑不起来。现象是进入网页面板之后会提示异常，很多数据显示不出来。但是手动重启一下容器就一切正常，后续的启动也不会出问题。我当初也一直没把这个问题放在心上。

这次本着有问题一定要解决的想法，查看了首次启动时的日志，发现 `1panel-agent` 抛出了一个错误：`panic: stat /etc/1panel/.1panel: no such file or directory` 然后停止运行。究其原因，是 `1panel-agent` 启动时会检查 `/etc/1panel/.1panel` 这个文件，而它是由 `1panel-core` 在启动后才生成的。虽然我的启动脚本是先启动 `1panel-core` 再启动 `1panel-agent`，但这两个进程几乎是在同一个 CPU 时钟周期内被并行触发的，`1panel-agent` 检查时 `1panel-core` 还没来得及生成该文件，导致 `1panel-agent` 直接崩溃。

所以目前的版本采用了串行启动逻辑：先启动 `1panel-core`，然后等待 `/etc/1panel/.1panel` 这个文件被生成。只有确保文件存在后，才会启动 `1panel-agent`。如果 30 秒之后还没生成，就认为 `1panel-core` 启动失败并直接退出容器。这种做法解决了两个进程在启动时的竞争问题，避免了 Agent 因读取不到配置文件而产生的 Panic 崩溃。

### 引入进程状态监控

Docker 容器中必须有进程在前台运行才不会退出，而 1Panel 的两个进程都是在后台运行的，旧版本只是简单地通过监听日志来维持容器运行，而现在我改用了 `wait -n` 指令来实时监控核心进程的状态，一旦 Core 或 Agent 意外崩溃就可以被捕捉到并响应。同时还加入了 `SIGTERM` 信号处理函数，实现当容器停止时优雅地关闭 1Panel 的后台进程而非暴力强杀。

### 安装时不再检查端口是否占用

1Panel 官方的安装脚本会检查设置的面板端口是否被占用，这在普通的服务器环境是很有必要的。之前的版本直接保留了这一段逻辑，但是 `ss` 命令的使用也会引入 `iproute2` 依赖。考虑到 Docker 容器拥有独立的网络空间，即使用 `host` 模式网络也没有再独立检查的必要，所以这个版本删掉了端口占用检查的逻辑，进一步精简了镜像依赖。

## 从旧版本升级的建议

要进行迁移其实很简单，因为 1Panel 本身的数据库就是兼容的。只需要保证之前运行的时候持久化了 1Panel 的数据目录（即 `PANEL_BASE_DIR` 或其父目录已映射到了数据卷或宿主机），然后拉取新的镜像，用相同的配置新建容器即可。1Panel 在安装时会自动检测到之前的配置。

但是为了保险起见，还是建议在操作前手动备份一下 1Panel 的数据目录，以免造成任何数据丢失。

## 开发背后的故事

在去年我刚开始做 docker-1panel-v2 这个项目的时候，现成的项目普遍还是基于 V1 版本的。但是现在再看，已经有不少人都做了在 Docker 容器内部运行 1Panel V2 的项目，DooD 和 DinD 的方案、各种实现方式都有，说明这个需求还是挺普遍的。

其实去年我刚做完不久，1Panel 就发布了一个新版本，添加了对非 systemd 系统（如 OpenWRT 和 iStoreOS）的原生支持。但那个时候我也没注意到，就一直在用自己的项目。现在再仔细研究 1Panel 的安装脚本时，我发现它会对宿主机系统做比较多的修改。

由于我的设备是 All-In-One 小主机，我希望保持最基本的软路由功能稳定，所以我更喜欢容器隔离方案。我的原则是：系统只安装和网络相关的核心软件（如拨号上网、广告拦截、代理等）；其他的建站或扩展程序，尽量放入 Docker 容器中运行，以防其影响整体网络的稳定性。而 1Panel 提供的部分涉及修改系统设置的功能（如磁盘管理等），我完全可以交给 iStoreOS 自带的 LuCI 界面去管理。所以尽管现在我完全可以在系统中原生安装 1Panel，但仍然选择把它装进容器里。

别人的项目普遍采用在镜像构建阶段就安装好 1Panel 的方案，但是我选择在首次运行容器时才安装。这虽然违背了 Docker 的“不可变性”原则，但考虑到 1Panel 更新极其频繁，本项目的容器只提供一个通用的运行环境，而不是固化特定版本。这样每次 1Panel 更新都不需要重新构建镜像并重建容器，只需要在线升级即可。

尽管去年我的方案还能用、现成的项目也有很多，但我仍然选择重构。现在很多人选择把写代码的任务完全交给 AI，尽管本项目开发过程中我也离不开 AI 的协助，但这次重构的每一行代码都是我翻看 1Panel 官方安装脚本，一行一行校对确认过的。脚本中的注释几乎都是手工编写，甚至注释比代码还要多。每一个细节的背后都是我对“为什么要这么做”的深入研究。我不是为了别的，只是想要追求完美，把每一个小细节都做好。

这次重构之后，这个项目估计又会停更很长时间，因为现在的实现方式已经是满足我需求的最优解。也许未来随着 1Panel 的迭代还会有小修改，又或者我的需求变了，但目前就这样吧。