---
date: 2024-12-01 21:00:14
category: 教程
tag: 
  - 虚拟机
  - Termux
  - QEMU
  - 安卓
---

# 安卓系统通过 QEMU 运行 Windows 最简单教程

## 前言

在安卓系统上想要运行 Windows 软件，常用的方法有两种。

第一种是 Wine，它通过将 Windows 系统调用转换为 Unix 指令，从而运行 exe 程序。从某种程度上来说它是一个兼容层而不是虚拟机、模拟器。Wine 的效率较高但是很多 exe 程序还是无法运行。Mobox、Exagear、Winlator 等软件都是基于 Wine 的。

第二种是 QEMU，通过模拟处理器运行虚拟机中的操作系统。它非常强大，只要有对应系统的镜像即可运行它的虚拟机。它也使在安卓设备中运行完整的 Windows 系统成为了可能。Limbo 是基于 QEMU 的。

但是由于 Limbo 中的 QEMU 版本低且效率相比直接运行 QEMU 偏低故更推荐直接使用 Termux 运行 QEMU。不同于其他常见的教程，本方法无需 Proot 容器。

## 准备工作

- Termux（推荐 [ZeroTermux](https://github.com/hanxinhao000/ZeroTermux)）
- VNC 客户端（推荐 [AVNC](https://github.com/gujjwal00/avnc)）
- 系统镜像

本文以推荐的这两款软件做演示。

它们都放在我的 AList 资源站里：[https://alist.jibukeshi.dpdns.org/公共分享/QEMU 虚拟机相关文件](https://alist.jibukeshi.dpdns.org/%E5%85%AC%E5%85%B1%E5%88%86%E4%BA%AB/QEMU%20%E8%99%9A%E6%8B%9F%E6%9C%BA%E7%9B%B8%E5%85%B3%E6%96%87%E4%BB%B6)

## 使用方法

### 配置 Termux

安装并打开 ZeroTermux，同意用户协议并给予存储权限。

输入以下命令，安装 x11-repo。

```shell
pkg install -y x11-repo
```

![IMG_20241201_204505.jpg](/assets/pictures/run-windows-using-qemu-on-android/IMG_20241201_204505.jpg)

输入以下命令，安装 QEMU。

```shell
pkg install -y qemu-system-x86_64
```

![IMG_20241201_204538.jpg](/assets/pictures/run-windows-using-qemu-on-android/IMG_20241201_204538.jpg)

等待安装完成后，输入以下启动命令尝试启动镜像。

```shell
qemu-system-x86_64 -M q35 -cpu core2duo -accel tcg,thread=multi -smp CPU核心,cores=CPU核心,threads=1,sockets=1 -m 内存单位MB -net user -net nic,model=virtio -audio sdl,model=hda -vga virtio -usb -device usb-tablet -vnc 0.0.0.0:端口 -hda \"镜像文件绝对路径\" -rtc base=localtime
```

其中 CPU 核心为设备的真实核心，大多数安卓设备为 8。内存的单位为 MB，一般为虚拟机分配 3072-4096MB 即可，不建议超过设备的真实内存的一半。端口为 VNC 端口，注意这里不是设备上真实打开的端口，比如填 3 实际上是 5903 端口，这里后面会讲到。镜像路径为绝对路径。

关于启动命令的详解可以看文末的进阶教程。

![IMG_20241201_204631.jpg](/assets/pictures/run-windows-using-qemu-on-android/IMG_20241201_204631.jpg)

如果输出报错信息请检查端口是否被占用、镜像路径是否正确等。

### 配置 VNC

安装并打开 AVNC，进入设置修改成自己想要的配置，如果不知道可以不改（这里推荐把 `输入-单指轻扫` 修改为 `拖动远程内容`）。

![IMG_20241201_204720.jpg](/assets/pictures/run-windows-using-qemu-on-android/IMG_20241201_204720.jpg)

回到首页，点击右下角加号添加服务器，名称任意，主机填写 `0.0.0.0`，端口填写 `590`+启动命令中设置的端口。

例如：你的启动命令为 `-vnc 0.0.0.0:3`，则填写 `5903`。

![IMG_20241201_204730.jpg](/assets/pictures/run-windows-using-qemu-on-android/IMG_20241201_204730.jpg)

点击保存，在首页点击刚刚添加的服务器，即可进入虚拟机的显示页面。

![IMG_20241201_204750.jpg](/assets/pictures/run-windows-using-qemu-on-android/IMG_20241201_204750.jpg)

![IMG_20241201_204803.jpg](/assets/pictures/run-windows-using-qemu-on-android/IMG_20241201_204803.jpg)

![IMG_20241201_204811.jpg](/assets/pictures/run-windows-using-qemu-on-android/IMG_20241201_204811.jpg)

正常开机！

### 后续启动

如果你能正常进入系统，那么说明你配置正确了。为了后续启动方便，可以保存启动命令。

回到 ZeroTermux，打开右侧滑栏中的文件管理，进入 `home` 目录下，创建一个文件，后缀名为 `.sh`。为方便可以使用系统命名。

![IMG_20241201_204918.jpg](/assets/pictures/run-windows-using-qemu-on-android/IMG_20241201_204918.jpg)

复制启动脚本，点击刚刚创建的文件，选择编辑，粘贴到这里，点击保存。

之后再次启动虚拟机时只要在 ZeroTermux 中找到这个文件，点击选择 `在终端运行` （或者在终端运行 `bash 启动脚本的名称.sh`），再打开 AVNC 连接这个服务器即可。

![IMG_20241201_205002.jpg](/assets/pictures/run-windows-using-qemu-on-android/IMG_20241201_205002.jpg)

### 注意事项

1. 关机直接在虚拟机中点关机即可。当 AVNC 显示 `Disconnected` 或者 ZeroTermux 的命令行能执行其他命令的时候就代表虚拟机关机完成，可以划掉它们的后台了。在 ZeroTermux 中按下 Ctrl+C 可以强制停止虚拟机。
![IMG_20241201_204823.jpg](/assets/pictures/run-windows-using-qemu-on-android/IMG_20241201_204823.jpg)
2. 我给的启动脚本里默认包含了声卡、网卡等，且我的镜像中已安装好 virtio 网卡驱动，如果使用自己的镜像可以使用 virtio.iso 自己安装驱动。
3. 由于大多数安卓设备的处理器并不支持 KVM 虚拟化，运行 QEMU 的效率比较低，所以如果你的设备性能很好但是虚拟机仍然很卡，不要感到奇怪。

## 更多

如果你成功运行起虚拟机了，可以看下方的进阶教程学习更多 QEMU 的使用方法。

[手机QEMU实用教程](https://www.bilibili.com/opus/748674746213728293)（[存档](https://web.archive.org/web/20241201112707/https://www.bilibili.com/opus/748674746213728293)）

[手机Qemu进阶教程](https://www.bilibili.com/opus/756803384134074401)（[存档](https://web.archive.org/web/20241201113356/https://www.bilibili.com/opus/756803384134074401)）