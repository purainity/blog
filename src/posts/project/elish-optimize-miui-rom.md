---
date: 2025-08-16 10:14:25
category: 作品
tag: 
  - 安卓
  - MIUI
  - ROM
---

# 自用小米平板 5 Pro (elish) 的精简 MIUI ROM

![](https://opengraph.githubassets.com/79d113ccdd8dfaa22586cfdef713d6ac57880fbb73fbff3c03666c71ab101fef/jibukeshi/elish_optimize_MIUI_ROM)

# elish_V14.0.6_port_optimize

自用小米平板 5 Pro (elish) 的精简 MIUI ROM，资源来源于网络，仅供交流学习，不得用做任何商业用途，不提供任何技术支持

## 底包来源

基于 @ymdzq 大佬的 miui_YUDI_V14.0.6 6 MAX 移植包修改，有工作台模式。集成 PC 引擎，因为这玩意太占用 vendor 分区而且 chroot 进程一直运行没有必要，不如直接用 Termux 运行 proot 容器或者直接用 [Cateners/tiny_computer](https://github.com/Cateners/tiny_computer) 已经配置好的，开箱即用。

移植包基于 miui_ELISH_V14.0.5.0.TKYCNXM，移植文件来源于 miui_YUDI_V14.0.6.0.TMHCNXM，安卓为 13。

移植包详情：[https://github.com/ymdzq/Port_MIUI_ROM/blob/V14.0.6.0_Pad/XIAOMIPAD5PRO.md](https://github.com/ymdzq/Port_MIUI_ROM/blob/V14.0.6.0_Pad/XIAOMIPAD5PRO.md)

## 下载

自建 AList 资源站：[https://alist.jibukeshi.dpdns.org/公共分享/小米平板 5 Pro (elish) 刷机资源/自用移植优化版 V14.0.6](https://alist.jibukeshi.dpdns.org/%E5%85%AC%E5%85%B1%E5%88%86%E4%BA%AB/%E5%B0%8F%E7%B1%B3%E5%B9%B3%E6%9D%BF%205%20Pro%20(elish)%20%E5%88%B7%E6%9C%BA%E8%B5%84%E6%BA%90/%E8%87%AA%E7%94%A8%E7%A7%BB%E6%A4%8D%E4%BC%98%E5%8C%96%E7%89%88%20V14.0.6)

123 云盘：[https://www.123684.com/s/SDADVv-JA9pH](https://www.123684.com/s/SDADVv-JA9pH)

## 说明和刷机方法

### elish_V14.0.6_port_optimize_线刷包

- 大小：3.97 GB
- MD5：98256cb624df68bc487b7cc3fa41e5f6

线刷包中不含 super.img 和 payload.bin，各个分区单独刷入，注意 `mi_ext`、`odm`、`product`、`system_ext`、`system`、`vendor` 等动态分区不可在 fastboot 模式下直接刷入，必须在 fastbootd 模式下才能刷。偷懒可以解压后用 [Uotan-Dev/UotanToolBox](https://github.com/Uotan-Dev/UotanToolBox) 或 [Uotan-Dev/UotanToolboxNT](https://github.com/Uotan-Dev/UotanToolboxNT) 的线刷功能选择 `flash_fastboot.txt` 和 `flash_fastbootd.txt` 之后一键刷入，也可以自己编写脚本使用 fastboot 工具刷写。

### elish_V14.0.6_port_optimize_卡线一体

- 大小：3.78 GB
- MD5：4b8d29cb2430c8d0fab0b1313c8bcc13

卡线刷一体包，为 super.img，Recovery 下可直接刷入，Fastboot 模式下可使用使用自带的脚本刷入，也可以在 fastboot 模式下直接刷入 super 分区。

### diff.zip

- 大小：229 MB
- MD5：38d7f96133a47a6da3c1a38c4b5edd99

这个是从 @ymdzq 的原移植包做的修改记录及其文件，可用于自己修改，有名为 `delete` 的空文件就是代表这个目录可以删除。 **注意这不是刷机包，不能刷入！注意这不是刷机包，不能刷入！注意这不是刷机包，不能刷入！** 这是修改用的。

### 其他说明

理论上来说支持从官方 V14.0.5 或者 6 Max 移植包 V14.0.6 及更低版本不格式化 `userdata` 分区直接刷入，但是为了让精简起作用以及避免各种奇奇怪怪的 bug，还是建议刷入后清除数据。

刷机包中已内置了橙狐的 recovery，如果需要刷入 Magisk 直接拿 boot.img 修补即可。

## 修改记录

### product 分区

#### 精简系统应用列表

删除以下目录

- Analytics `/product/app/AnalyticsCore`
- 自动连招 `/product/app/com.xiaomi.macro`
- 游戏高能时刻 `/product/app/MiGameService_8450`
- 家人守护 `/product/app/MIUIgreenguard`
- MIUI安全组件 `/product/app/MIUIGuardProvider`
- 米币支付 `/product/app/PaymentService`
- 游戏服务 `/product/priv-app/MiGameCenterSDKService`

#### 精简可卸载 data 应用列表

这些应用本来就在系统中可卸载，卸载后可从应用商店-“我的”-“系统应用”下自行安装。

除了删除 apk，还需要在 `/product/etc/removable_apk_info.xml` 中删除对应配置。

删除以下目录

- 钱包 `/product/data-app/MIpayPad`
- 小米换机 `/product/data-app/MIUIHuanji`
- 小米社区 `/product/data-app/MIUIVipAccountPad`

#### 去除 Joyose 云控

Joyose 在开机之后会挂载到 `/system/app/Joyose`，但它实际上是在 product 分区的，删除

- `/product/pangu`

#### 采用旧版小米互传

小米互传自从 2.15.0 版本开始强制“开启 10 分钟后自动关闭”，所以降级到 2.13.0 版本，替换

- `/product/priv-app/MIShare`

#### 更新 WebView 版本

更新 Android System WebView 版本为 139.0.7258.94(725809433)，替换

- `/product/app/TrichromeLibrary64`
- `/product/app/WebviewGoogle64`

#### 内置 MIUI 完美图标

内置 MIUI 探·界主题模块，替换以下目录

- `/product/media/theme/miui_mod_icons`
- `/product/media/theme/default/icons`

#### 关闭内存扩展

修改 `/product/etc/build.prop`

```
persist.miui.extm.enable=0
```

#### 加回默认壁纸

加回小米平板 5 系列自带的两张默认壁纸，但不删除 6 Max 移植过来的壁纸

- `/product/media/wallpaper/wallpaper1.jpg`
- `/product/media/wallpaper/wallpaper2.jpg`

#### 加回部分手机特性

添加指南针（可卸载）、悬浮球，不添加传送门（手动安装后设置里仍不会显示入口需要通过模块开启，这样还不如让 apk 也通过模块安装）

- 指南针 `/product/data-app/MIUICompass`
- 悬浮球 `/product/app/MIUITouchAssistant

### system 分区

**注意这个分区必须使用 TIK 工具解包打包，不能使用 MIO-KITCHEN！否则会导致无限重启自动进入 fastboot！**

#### 精简系统应用列表

删除以下目录

- 小米数字钥匙框架 `/system/app/digitalkey`

### vendor 分区

**注意这个分区必须使用 TIK 工具解包打包，不能使用 MIO-KITCHEN！否则会导致识别成插卡版本而且不能连接 WLAN！**

#### 内置音效增强模块

替换以下目录

- `/vendor/etc/dolby/dax-default.xml`
- `/vendor/lib/rfsa/adsp/libSuperSensor_skel.so`

修改 `/vendor/build.prop`

```
# Pad5pro-bose
ro.vendor.audio.sfx.harmankardon=0
ro.def.volume.music=255
ro.def.volume.ring=150
ro.def.volume.voice.call=150
ro.def.volume.system=150
ro.def.volume.alarm=150
ro.def.volume.notification=150
ro.def.volume.fm=150
ro.def.volume.matv=150
ro.def.volume.dtmf=150
ro.def.volume.system.enforced=150
ro.def.volume.bluetooth.sco=150
ro.def.volume.volume.tts=150
ro.vendor.audio.dump.mixer=true
ro.vendor.audio.sfx.harmankardon=true
ro.vendor.audio.karaok.support=true
ro.vendor.camera.karaok.support=true
ro.vendor.audio.miui.karaoke.show=true
ro.vendor.audio.miui.karaoke.tencent.show=true
persist.vendor.audio.misound.disable=false
ro.vendor.audio.misound.bluetooth.enable=true
ro.vendor.audio.support.sound.id=true
ro.vendor.audio.soundtrigger=sva
ro.vendor.audio.soundtrigger.lowpower=false
ro.vendor.audio.soundtrigger.training.level=50
ro.vendor.audio.soundtrigger.xanzn.gmm.level=45
ro.vendor.audio.soundtrigger.xanzn.gmm.user.level=30
ro.vendor.audio.soundtrigger.xanzn.cnn.level=80
ro.vendor.audio.soundtrigger.xanzn.vop.level=10
ro.vendor.audio.soundtrigger.xatx.gmm.level=25
ro.vendor.audio.soundtrigger.xatx.gmm.user.level=40
ro.vendor.audio.soundtrigger.xatx.cnn.level=45
ro.vendor.audio.soundtrigger.xatx.vop.level=-10
ro.vendor.audio.soundtrigger.appdefine.gmm.level=55
ro.vendor.audio.soundtrigger.appdefine.gmm.user.level=65
ro.vendor.audio.soundtrigger.appdefine.cnn.level=35
ro.vendor.audio.soundtrigger.appdefine.vop.level=10
ro.vendor.audio.soundtrigger.snr=16
ro.vendor.audio.sfx.spk.stereo=true
ro.vendor.audio.feature.spatial=20
ro.vendor.video_box.version=2
debug.config.media.video.frc.support=true
debug.config.media.video.aie.support=true
debug.config.media.video.ais.support=true
ro.vendor.audio.aiasst.support=true
ro.vendor.audio.sfx.earadj=true
ro.vendor.audio.sfx.scenario=true
ro.vendor.audio.scenario.support=true
ro.vendor.audio.voice.change.support=true
ro.vendor.audio.surround.support=true
ro.vendor.audio.spk.stereo=true
ro.vendor.audio.vocal.support=true
ro.vendor.audio.voice.change.youme.support=true
ro.vendor.audio.voice.volume.boost=true
ro.vendor.audio.speaker.surround.boost=100
ro.vendor.audio.bass.enhancer.enable=true
ro.vendor.audio.virtualizer.enable=true
```

### cust 分区

该分区用于存放定制版软件，一般的刷机包不刷写这个分区，这里直接刷入一个空镜像也是可以的。删除

- `/cust/app/customized`
- `/cust/cust/cn`
- `/cust/etc/cust_apps_config`

### 其他修改

集成橙狐OFRP OrangeFox-R11.3_250719，因为该机型没有单独的 recovery 分区，recovery 是内置在 boot 分区里面的，这里提供的 boot.img 已内置了橙狐的 recovery，如果需要刷入 Magisk 直接拿这个镜像修补即可。

## 感谢列表

- [ymdzq/Port_MIUI_ROM](https://github.com/ymdzq/Port_MIUI_ROM)
- [ymdzq/OFRP-device_xiaomi_elish](https://github.com/ymdzq/OFRP-device_xiaomi_elish)
- [ColdWindScholar/MIO-KITCHEN-SOURCE](https://github.com/ColdWindScholar/MIO-KITCHEN-SOURCE)
- [ColdWindScholar/TIK](https://github.com/ColdWindScholar/TIK)
- [pzcn/Perfect-Icons-Completion-Project](https://github.com/pzcn/Perfect-Icons-Completion-Project)
- [Xiaomi pad5pro音效增强 @酷安-红烧牛肉盖浇饭77](https://www.coolapk.com/feed/54389845?shareKey=YWE1ZTkwYWI5MDc3NjYyZTc3NDQ~)