---
date: 2025-04-06 18:27:41
category: 教程
tag: 
  - 逆向
  - Flutter
  - 安卓
---

# 使用 blutter 逆向 flutter 制作的安卓软件记录/教程

## 背景

ShadowShare 是一个共享节点的 APP，使用 flutter 开发。

我想把它的数据接口提取出来。经过抓包发现它的节点数据都存储在 gitee，下载下来后发现数据都加密了，看样子像是 AES 系列的。

使用算法助手 Pro 对它进行 Hook，但是未得到任何有用信息。猜测 flutter 将加解密部分在 so 的 native 层实现了，于是考虑逆向。

我经过一番搜索，又在多个群聊和论坛看到了许多“Flutter 搞不了”后，总算找到了一个叫 blutter 的可以逆向 Flutter 的项目 https://github.com/worawit/blutter 。这篇文章既是对我这次逆向经历的记录，也作为 blutter 这个工具的使用教程。

视频教程：[https://alist.jibukeshi.dpdns.org/公共分享/视频/使用 blutter 逆向 flutter 制作的安卓软件视频教程.mp4](https://alist.jibukeshi.dpdns.org/%E5%85%AC%E5%85%B1%E5%88%86%E4%BA%AB/%E8%A7%86%E9%A2%91/%E4%BD%BF%E7%94%A8%20blutter%20%E9%80%86%E5%90%91%20flutter%20%E5%88%B6%E4%BD%9C%E7%9A%84%E5%AE%89%E5%8D%93%E8%BD%AF%E4%BB%B6%E8%A7%86%E9%A2%91%E6%95%99%E7%A8%8B.mp4)，可以搭配文字教程一起看。

## 逆向

需要准备的材料有：

- 从需要逆向的软件 apk 中提取的 lib 文件夹
- Termux
- 至少 2GB 的剩余储存空间
- 一个良好的网络环境

### 安装容器

这里使用 tmoe 脚本在 Termux 中安装 Debian 的 proot 容器搭建环境，如果你有其它环境可以跳过。

打开 Termux，给予必要的权限。

下载 tmoe 脚本并执行。

```bash
curl -o install.sh https://gitee.com/mo2/linux/raw/2/2
bash install.sh
```

![IMG_20250406_170744.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_170744.png)

接下来一路按 y，回车，等待 tmoe 安装完成。

![IMG_20250406_170818.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_170818.png)

语言选择简体中文，选择 proot 容器。

![IMG_20250406_173913.jpg](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_173913.jpg)

中途它会让你修改终端配色和字体，都不用管，跳过即可。

![IMG_20250406_173311.jpg](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_173311.jpg)

DNS 随便选，因为后面需要手动设置。一言没用，建议关闭。

![IMG_20250406_173531.jpg](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_173531.jpg)

挂载共享目录我建议选择 /sdcard，这样整个安卓的内部储存都能被容器内看到。其它的设置根据自己需求选择即可。

![IMG_20250406_171045.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_171045.png)

接下来选择 parm64发行版列表 - Debian - 13-trixie。

![IMG_20250406_173559.jpg](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_173559.jpg)

![IMG_20250406_171237.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_171237.png)

注意 blutter 需要 gcc13 才能正常工作，而我一开始装的 Debia Bookworm 只有 gcc12，所以根本跑不起来。后面我打算自己编译安装 gcc13，结果编译了将近一个小时都没好，果断放弃，重装 Debian trixie。

选择启动 proot，等待系统安装完成。（提示：系统安装完成后，可以在 Termux 里直接输入  `tmoe` 打开 tmoe 管理器，输入 `tmoe p` 进入容器里的 Debian 系统）

![IMG_20250406_174232.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_174232.png)

### 设置环境

在容器内安装依赖。

```bash
apt update
apt install -y python3-pyelftools python3-requests git cmake ninja-build build-essential pkg-config libicu-dev libcapstone-dev
```

注意这里有一个 bug，执行上面命令的时候会提示 `Temporary failure resolving  'deb.debian.org'`。

![IMG_20250406_171736.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_171736.png)

这是因为容器内的 DNS 设置是没用的，需要手动设置 DNS。解决方法是手动修改容器内部的 `/etc/resolv.conf` 文件（它应该在安卓的 `/data/data/com.termux/files/home/.local/share/tmoe-linux/containers/proot/debian-trixie_arm64/etc/` 目录下），添加下面几行，当然你也可以换成其它的 DNS 服务器。

```
nameserver 223.5.5.5
nameserver 1.1.1.1
```

![IMG_20250406_175333.jpg](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_175333.jpg)

修改 DNS 后再次执行上面的命令，就可以正常安装了。

![IMG_20250406_172912.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_172912.png)

下载 blutter。

```bash
git clone https://github.com/worawit/blutter.git
```

![IMG_20250406_172938.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_172938.png)

### 开始逆向

进入 blutter 所在的目录

```bash
cd blutter
```

把从需要逆向的软件 apk 中提取的 lib 文件夹放到这个目录下，你可以使用 cp 命令从容器中挂载的安卓共享目录中复制，我这里直接使用 MT 管理器复制进去。

![IMG_20250406_173012.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_173012.png)

接下来运行

```bash
python3 blutter.py arm64-v8a out_dir
```

其中 `arm64-v8a` 是应用的 lib 文件夹中 arm64-v8a 库所在的路径，`out_dir` 是输出的目录。

blutter 会自动识别 dart 版本并进行逆向。

![IMG_20250406_173025.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_173025.png)

这个过程有点漫长，需要耐心等待。

![IMG_20250406_173050.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_173050.png)

看到下面这样的提示，就代表逆向成功了，可以去输出目录下看结果。

![IMG_20250406_173103.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_173103.png)

输出目录中应该有以下内容：

- `asm/*`：libapp 中的源码
- `blutter_frida.js`：适用于这个软件的 frida hook 脚本
- `objs.txt`：Object Pool 中 Object 的完整（嵌套）转储
- `pp.txt`：Object Pool 中的所有 Dart 对象

![IMG_20250406_173118.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_173118.png)

一旦环境设置好，以后每次逆向只需要把 lib 文件夹复制进去，指定输出目录就行了。

## 分析

dart 源码已经逆向出来了，但是与 AES 加解密相关的代码在哪里呢？

进入 `asm/shadowshare` 目录，通过对 `home_screen.dart` 的分析可以发现有一个叫做 `aesDecrypt` 的函数在 `shadowshare/common/utils/encrypt_util.dart` 文件中。

![IMG_20250406_173201.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_173201.png)

打开这个文件，一个字符串 ` 8YfiQ8wrkziZ5YFW` 引起了我的注意，它很有可能与密钥有关。

![IMG_20250406_173217.png](/assets/pictures/decompile-flutter-android-app-using-blutter/IMG_20250406_173217.png)

将这个文件丢给 AI 分析，得出结果：key 和 IV 都是这个字符串经过 UTF-8 编码得到的字节数组，填充方式为默认的 PKCS7。通过 AI 给出的代码，我成功解密了 gitee 仓库中加密的配置，后续会编写脚本实现自动解密。

AI 还指出在代码中硬编码 Key 和 IV 并使用相同的值是一个严重的安全漏洞，尤其是在 CBC 等模式下，会大大降低加密的安全性，但是在不使用非对称加密的情况下，好像确实只能这么干了。~~我自己也有一些软件是这么干的~~。!

[Screenshot_2025-04-06-18-24-49-283_com.yjllq.chrome.beta.jpg](/assets/pictures/decompile-flutter-android-app-using-blutter/Screenshot_2025-04-06-18-24-49-283_com.yjllq.chrome.beta.jpg)

另外，我还发现这个软件除了在 gitee 中有仓库外，在 github 也有相同的仓库，并且内置了多个 github 反代加速地址，防失联措施做的挺不错。

![Screenshot_2025-04-06-18-23-50-589_bin.mt.plus.jpg](/assets/pictures/decompile-flutter-android-app-using-blutter/Screenshot_2025-04-06-18-23-50-589_bin.mt.plus.jpg)