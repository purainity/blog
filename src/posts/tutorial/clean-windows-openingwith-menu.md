---
date: 2025-08-17 16:54:01
category: 教程
tag: 
  - Windows
---

# 清理 Windows 右键打开方式菜单中无用程序教程

## 省流

打开注册表编辑器，找到 `HKEY_CLASSES_ROOT\Applications\` 你的程序 exe 路径，删除下面的 `\shell` 路径。

例如你要删除 `7z.exe`，那么就删除 `HKEY_CLASSES_ROOT\Applications\7z.exe\shell`。

## 前言

我在安装完 7-Zip 后发现它并没有自动关联压缩包的打开方式，于是在右键的打开方式菜单中点击“在这台电脑上查找更多应用”，找到了 7-Zip 安装目录下的 `7z.exe`，打开后有一个窗口闪了一下就消失了，后来才知道那是 7zip 的 Console 而不是它的文件查看器，应该选择 `7zFM.exe`。但是这样操作后 7-Zip Console 就一直在我的打开方式菜单中，找不到删除方式。

![PixPin_2025-08-17_15-26-47.png](/assets/pictures/clean-windows-openingwith-menu/PixPin_2025-08-17_15-26-47.png)

在网上查了下删除方式，说是要修改注册表中的

`HKEY_CLASSES_ROOT\*\shellex\ContextMenuHandlers`，但是这里并没有什么有用的东西。

![PixPin_2025-08-17_15-29-47.png](/assets/pictures/clean-windows-openingwith-menu/PixPin_2025-08-17_15-29-47.png)

`HKEY_CLASSES_ROOT\AllFilesystemObjects\shellex\ContextMenuHandlers` 下也没有有用信息。

![PixPin_2025-08-17_15-32-58.png](/assets/pictures/clean-windows-openingwith-menu/PixPin_2025-08-17_15-32-58.png)

## 排查过程

既然在网上搜不到现成的教程，就自己摸索注册表。

考虑到是自己选择的 `7z.exe`，那么注册表中一定有一个字段保存着这个程序的目录。所以我直接使用注册表的查找功能搜索 `7z.exe`，看能否找到什么线索。

![PixPin_2025-08-17_15-37-19.png](/assets/pictures/clean-windows-openingwith-menu/PixPin_2025-08-17_15-37-19.png)

很快就找到了 `HKEY_CLASSES_ROOT\Applications\7z.exe\shell\open\command` 下有 7-Zip Console 的路径。

![PixPin_2025-08-17_15-39-01.png](/assets/pictures/clean-windows-openingwith-menu/PixPin_2025-08-17_15-39-01.png)

又注意到在打开方式菜单中出现的应用都有 `shell\open\command`，而没出现的应用则没有，就推断这和是否出现在打开方式菜单中有关，于是果断导出 `HKEY_CLASSES_ROOT\Applications` 做备份，然后直接删除 `HKEY_CLASSES_ROOT\Applications\7z.exe\shell` 这个路径。

![PixPin_2025-08-17_16-33-25.png](/assets/pictures/clean-windows-openingwith-menu/PixPin_2025-08-17_16-33-25.png)

![PixPin_2025-08-17_16-35-05.png](/assets/pictures/clean-windows-openingwith-menu/PixPin_2025-08-17_16-35-05.png)

这个时候再打开右键的打开方式菜单，发现 7-Zip Console 已经消失了，问题解决。

![PixPin_2025-08-17_16-36-01.png](/assets/pictures/clean-windows-openingwith-menu/PixPin_2025-08-17_16-36-01.png)