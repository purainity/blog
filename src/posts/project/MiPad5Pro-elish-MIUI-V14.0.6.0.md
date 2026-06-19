---
date: 2026-06-19 15:07:55
category: 作品
tag: 
  - 安卓
  - MIUI
  - ROM
---

# 自用小米平板 5 Pro 安卓 13 MIUI V14.0.6.0 移植养老包

纯自用包分享，以满足自己需求为主，免费无捐赠，网盘收费与我无关，随缘更新。感谢 @ymdzq 大佬。

底包基于小米平板 5 Pro (elish) V14.0.5.0，移植文件来源于小米平板 6 Max (yudi) V14.0.6.0，详细移植记录在 https://github.com/purainity/elish_optimize_MIUI_ROM 。

保保持 data 分区加密，BL 解锁后的官方 MIUI 14 可以不清 data 直接保数据升级。  
（理论上支持从 Android 11 MIUI 12.5 -> Android 11 MIUI 13 -> Android 12 MIUI 13.1 -> Android 13 MIUI 14 升级，但是实际上你会遇到很多奇奇怪怪的 Bug，有条件还是推荐清一下）  
其他官改包刷过来可能需要清除数据。不支持从任何澎湃 OS 版本保数据降级，必须双清清除用户数据才能正常开机。

- 集成第三方橙狐 REC OrangeFox-R11.3_250831_A16
- 精简 cust 分区预装的定制版第三方软件
- 未集成 PC 引擎，未集成 PC 版 WPS（节省 super 分区空间）
- 未集成 Root（官方原版内核，如需 Root 请自行修补 boot）
- 集成支持在线字幕识别的小爱翻译
- 关闭内存扩展，关闭应用预加载
- 精简无用预装应用
- 去除 Joyose 云控
- 采用旧版不会 10 分钟自动关闭的小米互传
- 更新 Android System WebView 版本为 144.0.7559.111(755911133)
- 内置 MIUI 完美图标模块
- 添加指南针（可卸载）、悬浮球、传送门
- 关闭高通 Ramdump
- 内置 @Sc素菜 的 MiPad 5 Pro 音频增强模块

小米官方还在维护 MIUI 14 系统 APP 更新，所以包内没有更新系统软件，也不需要伪装应用商店机型。

已知 Bug：横屏使用鼠标时，有概率会遇到屏幕右侧死区，鼠标只能在屏幕左边移动，这是 6 Max 移植包的通病。

### 下载地址

自建 AList：https://alist.jibukeshi.dpdns.org/%E5%85%AC%E5%85%B1%E5%88%86%E4%BA%AB/%E5%B0%8F%E7%B1%B3%E5%B9%B3%E6%9D%BF%205%20Pro%20(elish)%20%E5%88%B7%E6%9C%BA%E8%B5%84%E6%BA%90/MiPad5Pro_elish_MIUI_V14.0.6.0  
123 云盘：https://1811794921.share.123865.com/123pan/SDADVv-IPZaH  
Internet Archive：https://archive.org/details/MiPad5Pro_elish_MIUI_V14.0.6.0  
GitHub Release（文件太大用了分卷压缩，请自行合并解压）：https://github.com/purainity/elish_optimize_MIUI_ROM/releases

123 云盘下载需要登录，这个我也没办法，现在完全免费无需登录的网盘越来越少了，尽量从我的自建云盘下载吧。下载有困难的可以私信我询问更多文件传输方式，有云盘分流推荐的也可以私信我。

- MiPad5Pro_elish_MIUI_V14.0.6.0_卡线一体包.zip  
  SHA256：0efb225aa82a8c9381c0605733d76c782f907de050c479d4ad4115db212fed23
- MiPad5Pro_elish_MIUI_V14.0.6.0_线刷包.zip  
  SHA256：75972a2d5800ac88c7393a8bd49073824cf07401f6adf69cea16295bcf9c1b34
- boot.img  
  SHA256：6364dd7b930ca2ca63eea2f3929db42168baf1b2cb3f28a67c290e5e61137c96
- cust.img  
  SHA256：801d2a8b614cf16cd8985e1e48c7678a1fa47906dd8e5fe40423a4b0eee4baea
- mi_ext.img  
  SHA256：a374c855cb03fc1ce27057b60006e525b82381739323934a066360b9095f2af4
- odm.img  
  SHA256：626c8e1a0b564a1249a81c7bcc1f7a1599d920d9e0e0a00ac0a5bd75614cce21
- product.img  
  SHA256：bce87aa1e1e82ee4a7615913c5d3856feed3b25d7aa5cc5911bd041e624d142c
- system.img  
  SHA256：3586552978fafeb0256c60773884631b536bdd4cdcc9caece74976c619801443
- system_ext.img  
  SHA256：0d82751e9724441316fc29cc68283f5196e70f3b08eea7adfa74713adf387579
- vendor.img  
  SHA256：b3a3f25aa3d056c278e7c55f01fa973a731f2be79f060f191bce4344fda9c436
- vbmeta.img  
  SHA256：f05c1392d0bcb7eead0513e67c1cc13513c639c5c94dedd72f8078e90731984f
- vbmeta_system.img  
  SHA256：abc60c2b3ed8f9837ff0c552c1989d012f0307d1ef5ef4cb3bbaaad3aee9b7d5
- super.img  
  SHA256：23c385a83d5c6f9ad9cf4524000daff70019ec597b4b680564a92761f4efcd6b
- resources.zip（修改用到的外部文件，方便自己制作修改 ROM，内含临时启动的橙狐 REC、Magisk Alpha 管理器、HyperCeiler 等安装包）  
  SHA256：216daf71eff33bc63194c38d436c3ade5aafcbc20d3b853225fe221715c273d2
- magisk_patched-30700_0aOOK.img（已经用 Magisk Alpha 30700 修补过的 boot 镜像）  
  SHA256：3b10bc5b066ee6a830615e9c8570db09634aaf7d15f76a32add476f7cf949780

### 安装步骤

1. 想办法通过网盘下载 ROM 包 ZIP 文件，并校验 SHA256 值确保文件下载完整。
2. 备份必要数据，并在系统中退出小米账号、谷歌账号，否则开机时你需要清除 frp 分区。

方法 A：使用卡线一体包线刷  
卡刷一体包解压后支持线刷。先重启平板到 Bootloader 模式（屏幕出现橙色 FASTBOOT 字样），用 USB 线将平板插上电脑（如果报错就检查一下 USB 线和驱动）。电脑解压一体包后，运行 FlashScript.bat（Windows）或 FlashScript.sh（Linux）脚本开始线刷。第一次从其他 ROM 刷过来选双清，同版本升级选保留数据，刷完后平板会自动重启进入系统。

方法 B：使用卡线一体包卡刷  
卡刷可以不用解压，直接把 ZIP 压缩包文件放进平板的内置存储（卡刷默认保留数据不双清）。刷入第三方橙狐或 TWRP REC 后，在文件列表找到刚刚放好的 ZIP 刷机包，滑动滑块确认刷入，完成后重启系统即可。  
卡刷如果需要双清，需要优先使用小米官方 Recovery 清除用户数据，完成后直接按住音量减重启平板到 Bootloader 模式（橙色 FASTBOOT 字样），然后通过电脑脚本临时启动橙狐。接着通过 MTP 把刷机包从电脑传到平板里再进行刷机。刷完后别急着重启，先返回文件列表，手动把刚刚传输的 ZIP 刷机包文件删了再重启。否则因为系统重启后 media 挂载路径变了，刷机包占用的这 5GB 空间将无法被系统释放。

方法 C：使用独立线刷包  
这个线刷包里面没有打包 super.img，mi_ext、odm、product、system、system_ext、vendor 这六个动态分区直接就是解包状态的 .img 文件。  
包内附带了柚坛工具箱专用的 flash_fastboot.txt 和 flash_fastbootd.txt 脚本。你可以解压后在柚坛工具箱的线刷页面选择这两个配置文件，平板重启到 FASTBOOT 模式后选择开始刷机。工具箱会自动在 FASTBOOT 模式下刷完基础分区，接着自动重启到 FASTBOOTD 模式刷入上述六个动态分区，全部完成后会自动重启开机。  
如果不使用柚坛工具箱，也可以解压 ZIP 后，在 images/ 目录下找到所有的 .img 文件，自己用 fastboot 命令行手动刷入。包内的 vbmeta.img 和 vbmeta_system.img 已经提前去除了 AVB 校验。

方法 D：增量刷入  
如果是从官方 V14.0.5.0 系统或者我之前的移植包升级，也可以不下载完整 ZIP 压缩包，直接下载单独的某个修改过的 .img 文件，在 FASTBOOTD 模式下用命令行手动刷入即可。

ZIP 刷机包内的 boot.img 已经默认集成了橙狐 REC，但未集成 Root。  
另外，magisk_patched-30700_0aOOK.img是我已经用 Magisk Alpha 30700 修补过的 boot 镜像。可以在其他分区刷入完成后，手动刷入这个修补后的镜像，开机后再安装一下 Magisk Manager 即可直接获得 Root 权限。想要使用其他 Root 方案的请自己修补 boot 刷入。

个人常用模块推荐安装：  
- HyperCeiler（原 Cemiuiler，最后一个支持 MIUI 14 的版本为 v2.5.156_20250118，下载地址： https://github.com/Xposed-Modules-Repo/com.sevtinge.hyperceiler/releases/tag/3866-2.5.156_20250118 ）。
- 完美横屏应用计划（下载地址： https://github.com/sothx/mipad-magic-window/releases ）：  
  可以使用 pad-general-tiramisu-x.xx.xx.zip（小米平板 Android 13 通用版，无左右滑动调节）。
  也可以使用 pad-miui-based-on-tiramisu-x.xx.xx.zip（小米平板 6 系列 MIUI 14 专版）。该版本能够完美解锁小米平行窗口的滑动条，在安装选择机型时选择 yudi 即可。

![Screenshot_2026-06-19-13-42-35-428_com.android.settings.jpg](/assets/pictures/MiPad5Pro-elish-MIUI-V14.0.6.0/Screenshot_2026-06-19-13-42-35-428_com.android.settings.jpg)

![Screenshot_2026-06-19-13-43-52-922_com.android.settings.jpg](/assets/pictures/MiPad5Pro-elish-MIUI-V14.0.6.0/Screenshot_2026-06-19-13-43-52-922_com.android.settings.jpg)