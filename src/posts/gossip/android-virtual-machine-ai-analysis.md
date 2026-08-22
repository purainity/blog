---
date: 2026-07-06
category: 杂谈
tag: 
  - 虚拟机
  - 安卓
  - 逆向
---

# 让 AI 分析了下几款安卓上的虚拟机软件

最近发现安卓上运行另一个安卓系统的虚拟机软件选择并不多，并且它们的环境似乎都不完整，虚拟机内很多软件跑不起来，就想去了解它们的原理、能不能运行完整的系统镜像。于是挑了几款比较知名的扔给 AI 去反编译分析，结果挺有意思的，这几款采用的技术方案各不相同。后面我又拉了一款非虚拟机的多开容器做对比。可惜的是目前没有一款软件能真正实现在未解锁 Bootloader、未获取 root 权限的安卓宿主机上运行一个类似于 Android Studio 的 AVD 一样的完整安卓虚拟机，也无法直接启动 GSI 等 img 系统镜像。唯一有点希望的方案是用户态 QEMU 纯靠 CPU 模拟内核，但是效率堪忧几乎不现实。下面是 AI 的分析报告，如有出入还是以实际为准。

## 一、总体技术路线

本次分析对象包括：

- `VMOS Pro_3.0.7.apk`
- `光速虚拟机_3.8.2破解版.apk`
- `光速虚拟机官方最新版com.vphonegaga.titan_arm64_5.0.6.apk`
- `虚拟大师_3.2.66.apk`
- `多元空间_3.5.apk`

这几款产品都不是普通意义上的“再打包双开器”，都具备明显的虚拟化、容器化或应用级宿主代理能力。但它们隔离的层级并不相同，导致运行原理、隔离强度、宿主暴露面和检测难度都有非常大的差异。

如果按技术路线粗分，它们可以分成三类：

| 产品 | 核心技术 | 隔离层级 | 是否形成独立 Android 系统世界 |
|------|----------|----------|-------------------------------|
| VMOS Pro | 自定义 linker + namespace + 属性层 + ROM 扩展 | 进程级到系统运行时级 | 部分形成，但不如用户态内核 VM 完整 |
| 光速虚拟机 3.8.2 | User-mode Kernel | 系统级 | 是 |
| 光速虚拟机 5.0.6 | User-mode Kernel + CPU 翻译 + 图形兼容层 | 系统级 + 指令级 | 是 |
| 虚拟大师 | VM 管理器 + 系统安装器 + native loader + HAL 代理 | 系统容器级 | 部分形成，但证据不如光速完整 |
| 多元空间 | 宿主内应用虚拟化容器（fvbox） | 应用级 | 否 |

更直白地说：

- `VMOS Pro` 更像“高级容器化 Android 平台”，靠 linker、属性层和扩展服务构造 VM 环境。
- `光速虚拟机` 两个版本则是真正意义上最接近“另一套 Android 系统在用户空间里跑起来”的产品。
- `虚拟大师` 拥有很强的 VM 管理和系统安装能力，但其硬件层明显是宿主代理，其内核化启动证据也不如两版光速那样直接。
- `多元空间` 则不是虚拟机，而是典型应用级多开容器，重点在 Binder Hook、路径重写和 Stub 组件代理。

在讨论“环境是否像一台独立设备”时，本报告只关注真正有意义的维度：

1. 是否形成独立的进程世界
2. 是否形成独立的文件系统视图
3. Build / `ro.*` /系统属性是否被伪装或隔离
4. 电池、存储、定位、WiFi、电话、传感器等是否明显透传宿主
5. 宿主 root 下到底看到的是目录树、镜像文件、还是混合形态
6. guest app 是否容易识别自己运行在虚拟环境中

这几个维度，才决定了一款产品到底更像“虚拟机”“系统容器”，还是“高级多开”。

## 二、VMOS Pro 3.0.7

### 2.1 基本信息

- 包名：`com.vmos.pro`
- `versionName=3.0.7`
- `versionCode=30007001`
- `compileSdkVersion=34`
- `targetSdkVersion=30`
- 支持架构：`arm64-v8a`, `armeabi-v7a`
- APK 体积：约 `43M`

### 2.2 整体定位

VMOS Pro 的实现路线和光速虚拟机明显不同。它不是最典型的用户态内核 Android VM，也不是普通意义上的应用级多开，而是一个“高级容器化 Android 平台”。

它的核心能力主要来自以下几个层面：

- 自定义动态链接器
- 运行时 namespace / mount 参与
- zygote / app_process 管理能力
- 系统属性控制面
- 硬件代理层
- ROM 扩展与 framework 插件体系

因此，VMOS Pro 的重点并不是把一整套用户态 Linux/Android 启动链完全暴露出来，而是在宿主侧 bootstrap 的基础上，用 linker 和扩展框架构造出一个足够像 Android 的隔离运行环境。这个判断和它当前 APK 中的 native 组成是吻合的：启动与进程组织主要集中在 `libnative-lib.so`、`libvmos.so`、`libcore.so`、`libkrnloader.so` 和 `vmos_start_sh.so` 上；运行时替换层则由 `libinitlinker32/64.so` 和 `libylinker32/64.so` 构成；文件系统与运行辅助功能落在 `libvmkrnfs.so`、`libvmkrntools.so`、`libvmtools.so` 上；而 `libhalbox.so`、`libmci.so` 又分别把硬件代理与媒体传输补齐。这种库分工本身就说明，VMOS 的核心不是单一 user-mode kernel，而是“启动器 + linker + 运行时工具层 + 硬件代理层”的组合。

### 2.3 三种运行模式

VMOS Pro 的多方案后端定义在：

- `smali_classes3/com/vmos/model/RomInfo$VMOSSolutionTag.smali`

可以直接看到三个枚举值：

- `ORIGIN`
- `KERNEL`
- `YLINKER`

同时可以看到：

- `ORIGIN -> libinitlinker`
- `YLINKER -> libylinker`

这说明 VMOS 并不是单一路线，而是一个混合框架。

三种模式可以概括为：

#### ORIGIN

使用 `libinitlinker` 作为自定义动态链接器，核心目的是接管 Android 的 ELF 加载过程，让 VM 可以按自己的规则重新解释文件系统与库路径。

#### YLINKER

使用 `libylinker`，本质上是 `initlinker` 路线的另一套实现或升级版本。

#### KERNEL

并不是只换一个 linker，而是会通过：

- `ro.kernel=1`
- 本地 TCP socket
- `prctl(0x504f5254)` 获取端口

去连接一个内核守护进程。

也就是说，VMOS 不是单纯“linker 替换器”，还保留了一条更偏“守护进程 + 内核扩展服务”的运行链。

此外，Manifest 本身也能说明它不是轻量容器，而是重度宿主编排平台。当前清单里直接存在：

- 64 组渲染 Activity
- 64 组 VM 引擎服务
- 100 组硬件服务

这意味着 VMOS 在宿主进程、组件和调度层上已经为多实例运行预留了相当大的编排空间。

### 2.4 启动流程

VMOS 的第一阶段不是一个 ELF 引导器，而是 shell 脚本 `vmos_start_sh.so`。

这个脚本会：

1. 把启动器复制到 `/data/local/tmp/vmos_starter`
2. 调整权限
3. 再执行它

这一步说明 VMOS 的第一阶段是明确的宿主 bootstrap。

第二阶段，`com/vmos/core/ˊᐝ.smali` 负责 initlinker 部署和环境检查，逻辑包括：

- 从 assets 复制 `libprelinker32.so` / `libprelinker64.so`
- 替换 initlinker
- 校验运行前关键文件是否存在

第三阶段，`com/vmos/core/ˏ.smali` 负责 framework 插件注入：

- 将 `vmfwplugin` 部署到 `/system/framework/vmfwplugin.jar`

第四阶段，`com/vmos/core/ॱ.smali` 开始批量写入系统属性：

- `ro.kernel=`
- `persist.adb.tcp.port=`
- `ro.kernel.qemu.gles=0`

并且它还维护一批 `persist.*` 与 `hw-control.*` 风格属性，用于控制：

- Root
- 剪贴板穿透
- 通知穿透
- 权限穿透
- 振动器
- 传感器
- GSM
- WiFi
- GPS

第五阶段，在内核模式下会通过本地 TCP socket 与内核守护进程通信。

第六阶段，`ExRomService` 这样的扩展服务再根据 `ro.kernel` 和当前模式决定后续 ROM 扩展逻辑。

整体看，VMOS 的启动链不是传统的 “init -> zygote -> system_server” 明牌 VM 链，而是：

`宿主 bootstrap -> 自定义 linker / 扩展服务 -> 组织 guest 进程世界`

### 2.5 文件系统隔离

VMOS 的文件系统隔离证据主要集中在：

- `libvmkrnfs.so`
- `libnative-lib.so`
- `libvmos.so`

`libvmkrnfs.so` 中可以看到：

- `openat`
- `readlink`
- `/system`
- `/storage`
- `u:object_r:rootfs:s0`
- `u:object_r:cgroup:s0`
- `u:object_r:cache_file:s0`
- `u:object_r:system_data_file:s0`
- `u:object_r:device:s0`
- `u:object_r:init_exec:s0`
- `u:object_r:tmpfs:s0`
- `u:object_r:storage_file:s0`
- `u:object_r:system_file:s0`

这些字符串说明：

- 它确实维护自己的虚拟文件系统对象语义
- 它不是单纯把宿主目录原样暴露给 guest

`libnative-lib.so` 中还能看到：

- `mount`
- `umount`
- `android_create_namespace`
- `/proc/self/maps`

这说明它至少部分参与了 mount 和 namespace，而不是只在 Java 层替换字符串路径。

但是，VMOS 的文件系统隔离更偏“运行时构造与重定向”，不像两版光速那样，在 native 字符串中直接呈现完整的用户态内核文件系统链条。因此它的文件系统隔离应评为：

- 中等偏强

而不是最高一档。

### 2.6 进程隔离

VMOS 的进程模型明显强于普通多开，但隔离纯度不如用户态内核 VM。

`libnative-lib.so` 中可以看到：

- `ANDROID_SOCKET_zygote=%d`
- `--socket-name=zygote`
- `--socket-name=zygote_secondary`
- `%s/system/bin/app_process32`
- `%s/system/bin/app_process64`
- `zygote_d`
- `zygote32_d`
- `zygote64_d`

这说明它确实会在宿主上组织出一套与 zygote / app_process 对应的 VM 进程体系。

`libvmos.so` 中又存在：

- `/proc/%d/cmdline`
- `/proc/%d/comm`
- `/proc/%d/ns/mnt`

Java 层也会：

- `getRunningAppProcesses()`
- 读取 `/proc/<pid>/cmdline`

综合起来可以下结论：

- 宿主一定能看到 VMOS 的引擎、zygote 或相关 app_process 进程
- guest app 并不完全等价于宿主上的普通独立应用进程
- 但 guest 世界与宿主世界之间仍然有比较明显的 `/proc` 与 loader 痕迹耦合

### 2.7 属性与设备信息隔离

VMOS 明确存在系统属性控制面。

它不仅设置：

- `ro.kernel`
- `persist.adb.tcp.port`
- `ro.kernel.qemu.gles`

Java 和 native 侧还大量读取：

- `ro.miui.ui.version.name`
- `ro.build.version.emui`
- `ro.build.display.id`
- `ro.build.version.sdk`
- `ro.build.version.release`

`libhalbox.so` 中还存在明显的 QEMU 风格设备代理通道：

- `pipe:qemud:gsm`
- `pipe:qemud:gps`
- `pipe:qemud:wifi`
- `fingerprint`

这意味着 VMOS 并不是被动继承宿主属性，而是在构造一层自己的属性与设备语义。但当前样本中，没有像光速那样非常直接的“实例级新机模板”证据，所以它更像“属性控制层完善”，而不是“最强设备伪装产品”。

不过，这里有一个应该明确写出的加强点：VMOS 不只是“控制属性层”，还直接碰了关键设备标识字段。`com/vmos/core/ॱ.smali` 中可以直接看到对以下字段的拼接与写入：

- `ro.product.brand`
- `ro.product.model`
- `ro.product.manufacturer`
- `ro.build.fingerprint`
- `ro.serialno`

因此在 Build 标识和设备外观这一层，VMOS 的确具备比当前正文更强的直接伪装能力。

### 2.8 硬件与状态透传

VMOS 的硬件层隔离并不强。当前直接证据表明，它会读取或代理以下宿主信息：

- `TelephonyManager.getSimOperator()`
- `TelephonyManager.getNetworkType()`
- `Environment.getExternalStorageDirectory()`
- `Environment.getExternalStorageState()`
- `StatFs.getAvailableBytes()`

`libhalbox.so` 中还有：

- `SensorChanged`
- `WIFIChanged`
- `GpsChanged`
- `EnableSensors`

这说明它的硬件层更像：

`宿主采集 -> VM 代理分发`

而不是独立硬件模拟。

对关键泄露面的判断：

#### 电池

虽然本轮没有抓到像虚拟大师那样直接的 Java `BatteryManager` 调用，但结合 HAL 代理风格和 QEMU 通道，电池更可能是宿主透传或轻包装，而不是独立电池模型。

#### 存储空间

它会直接使用宿主 `Environment` 和 `StatFs`，所以 guest 里看到的外部存储状态和空间，大概率明显映射宿主真实值。

#### 定位、WiFi、电话

都有代理或变更接口，不是独立硬件模拟。

### 2.9 宿主 root 下的文件存放形态

VMOS 在宿主侧的落盘证据不像光速和虚拟大师那样集中在实例目录构造函数里，但备份与恢复体系已经足够说明它不是只有一个抽象块文件。

Manifest 中直接暴露：

- `BackupsRomActivity`
- `BackupsService`
- `RecoveryService`

相关数据对象和服务逻辑中可以看到：

- `DirName`
- `dirPath`
- `dateDir`
- 导入目录创建
- 导出目录创建
- `*.info`
- `*.zip`
- `appInfoData/`
- `video`
- `music`
- `image`
- `exprot_succeed.txt`

因此，在宿主 root 权限下，更高可信的判断是：

- 能看到 VMOS 的目录树与备份目录
- 能看到打包文件、元数据文件和资源子目录
- 不是“只能看到一个巨大的块文件而看不到内部结构”
- 也不是“主要依赖索引数据库存储 VM 文件”

VMOS 的宿主落盘形态更准确地说是：

`目录树 + 打包文件 + 标志文件 + 元数据文件的混合形态`

### 2.10 被检测可能性

VMOS 的可检测风险偏高。

直接证据包括：

- 内置 `EmulatorDetector`
- 内置 `CheckRoot`
- 内置 `CheckHook`
- 存在 `closeXposed`
- 资源中存在 `not_container_this_vm`
- native 中频繁接触 `/proc/self/maps`
- 整体是 linker / namespace 混合路线

这些都说明它自己也在长期对抗 VM / hook / root 检测，而这类对抗本身也意味着它并不难被有针对性的程序识别出来。

### 2.11 小结

VMOS Pro 是“高级容器化 Android 平台”。

它比普通双开强得多，具备自己的 zygote、namespace、属性层和硬件代理体系；但它不是当前几款产品里系统隔离最纯的一档。它的硬件状态对宿主依赖明显，宿主 root 下看到的是目录树与打包文件的混合形态，被 guest app 检测出的风险也偏高。

## 三、光速虚拟机 3.8.2

### 3.1 基本信息

- 包名：`com.vphonegaga.titan`
- `versionName=3.8.2`
- `versionCode=20240212`
- `compileSdkVersion=31`
- `targetSdkVersion=31`
- 支持架构：`arm64-v8a`
- APK 体积：约 `944M`

### 3.2 整体定位

光速 3.8.2 是当前几款产品里最典型的用户态 Android 虚拟机实现之一。它的关键特征是：

- 明确的 User-mode Kernel
- 独立 `rootfs/proc/devpts/selinuxfs/socketfs`
- `pivot_root/chroot/init/app_process64/zygote/system_server`
- VPN 网络层
- shell 控制通道
- 宿主与 guest 之间存在 `virtpipe/shm/dma` 风格通信设施

从技术形态看，它已经明显属于“另一套 Android 系统在用户空间里跑起来”的路线，而不是高级容器。这一点和它的 native 组成也完全一致：`libVPhoneGaGaLib.so`、`libVPhoneGaGaLim.so` 负责 VM 引擎与管理逻辑，`libuserkernel.so`、`libuserkernel32.so`、`libuserkernel64.so` 直接承担用户态内核核心，`libloader.so` / `libloader32.so` / `libloader64.so` 负责 guest 运行时装载，`libOpenglRender.so` 与 `libtranslator.so` 则补足图形管线与桥接能力；再配上 `libp7zip.so`、`libgdbserver.so`、`libmmkv.so`、`libmarsxlog.so`、`libspake2.so` 这类辅助库，就形成了一套非常典型的“用户态内核 Android VM”产品结构。

### 3.3 启动流程

Java 层启动入口清晰：

- `smali_classes3/com/vphonegaga/titan/VPhoneGaGaLibHelper.smali:405`

其中存在：

- `InitEnvironment()`
- `InitializeInstance(...)`
- `StartGaGaOs(II)`

native 中直接可见：

- `pivot_root`
- `sys_chroot`
- `/init`
- `/system/bin/app_process64`
- `devpts`
- `selinuxfs`
- `socketfs`
- `setenforce`
- `titan-shell-service-socket`

这一组证据足以还原它的基本启动链：

1. 初始化 VM 环境
2. 创建实例
3. 挂载 `rootfs/proc/devpts/selinuxfs/socketfs`
4. `pivot_root/chroot`
5. 执行 guest `/init`
6. 再由 guest 内部启动 `app_process64 / zygote / system_server`

而 VM 本体之外，它还有两个外围结构：

#### VPN/TUN 网络层

`MyVpnService.smali` 中直接定义：

- `IPV4_ADDRESS_PREFIX = 10.1.10.`
- `IPV6_ADDRESS_PREFIX = fd00:1:fd00:1:fd00:1:fd00:`

说明它通过 VPN/TUN 把 guest 网络从宿主网络里再包一层。

#### shell 控制通道

`ShellServiceManager` 使用：

- `titan-shell-service-socket`

这说明它在宿主和 guest 之间还维护了一条本地控制面。

### 3.4 文件系统隔离

3.8.2 的文件系统链条是当前样本中最直接、最连续的一档。

相关系统归档中能看到：

- `root/readonly.bin`
- `system/readonly.bin`
- `vendor/readonly.bin`
- `androidfs.bin`
- `superblock.bin`
- `fscache.bin`

这说明 guest 的 `/system`、`/vendor`、`/root` 运行在独立的文件系统分区结构中，而不是简单的宿主目录映射。

native 中又直接给出：

- `mount`
- `sys_mount`
- `sys_umount2`
- `pivot_root`
- `chroot`
- `unshare`
- `setns`
- `self/mounts`
- `mountinfo`

因此，3.8.2 的文件系统隔离可以明确评为：

- 高

### 3.5 进程隔离

3.8.2 的进程世界非常独立。

`libuserkernel.so` 中直接出现：

- `/proc/%d/fd`
- `/proc/%d/stat`
- `/proc/%d/status`
- `/proc/%d/maps`
- `/proc/%d/mem`
- `/proc/%d/stack`
- `/proc/%d/syscall`
- `-Xzygote`
- `/system/bin/app_process64`
- `u:r:zygote:s0`
- `u:r:system_server:s0`

这说明 guest 内部存在完整进程语义世界，而不是依赖宿主 ActivityManager 把应用平铺出来。

对宿主可见性可以这样理解：

- 宿主一定能看到 `VPhoneGaGa` 引擎进程以及相关服务/渲染器
- 但 guest app 的真实进程树主要存在于 VM 内部，而不是直接暴露成宿主普通 Android 进程

这就是它和应用级多开容器最本质的区别之一。

### 3.6 属性与设备信息隔离

3.8.2 明确提供设备伪装体系。

最直接的证据来自 `SettingOneClickNewMachineActivity`，相关逻辑围绕以下字段构造模板：

- `Build.MODEL`
- `Build.BRAND`
- `Build.PRODUCT`
- `Build.FINGERPRINT`
- `Build.MANUFACTURER`

native 中还存在：

- `ro.product.real_model`

这很像“真实设备信息”和“伪装设备信息”分离管理的实现。

所以在设备信息隔离和伪装方面，3.8.2 明显强于 VMOS 的“属性控制层”式路线。

### 3.7 硬件与状态透传

3.8.2 的系统世界隔离很强，但硬件状态仍明显来自宿主。

#### 电话与基站

`MyNativeActivity` 中直接调用：

- `getSystemService("phone")`
- `getDataNetworkType()`
- `getVoiceNetworkType()`
- `getMcc()`
- `getMnc()`
- `getLac()`
- `getCid()`
- `getLevel()`

#### WiFi

直接调用：

- `WifiManager.getConnectionInfo()`
- 读取 `SSID`、`BSSID`、`Frequency`

#### GPS

直接调用：

- `getLastKnownLocation()`
- `requestLocationUpdates(...)`

#### 电池

native 中直接存在：

- `power_supply`
- `DEVPATH=/class/power_supply/Battery`
- `SUBSYSTEM=power_supply`

#### 存储

在系统分区层它是独立文件系统；但只要 guest 接触共享导入导出目录、缓存目录或共享存储路径，就仍可能观察到宿主真实容量或状态。

因此更准确的说法是：

- 基础系统分区视图独立
- 共享存储与外部存储语义仍可能暴露宿主

### 3.8 宿主 root 下的文件存放形态

3.8.2 的宿主侧落盘形态已经比较清楚。

实例根目录来自：

- `smali_classes3/com/vphonegaga/titan/VPhoneInstance.smali:156`

逻辑是：

- `getFilesDir()`
- 追加 `instance<id>`
- 保存为 `mStoragePath`

`VPhoneConfig.smali` 还能看到配置目录和迁移逻辑：

- 历史路径 `getFilesDir()/config/1`
- 迁移文件包括：
  - `androidfs_version.xml`
  - `vphone_setting.xml`
  - `asset_config_version.xml`
  - `user_phone_model.xml`
  - `user_phone_gpu_model.xml`

因此在宿主 root 下更可能看到：

- `instance<id>/`
- `config/`
- XML 配置文件
- 与系统分区相关的只读二进制或派生文件

其宿主可见形态可概括为：

`实例目录树 + 配置树 + 分区/二进制文件的混合形态`

### 3.9 被检测可能性

3.8.2 的系统隔离很强，因此比 VMOS 更难被普通 app 直接识别。

但它依然存在明显检测面：

- `Magisk` 开关与设置页
- `OneClickNewMachine` 机型模板系统
- 宿主硬件状态大面积透传
- 深度检查内核、驱动、图形环境时仍可能发现异常

### 3.10 小结

3.8.2 是当前几款里最标准的用户态 Android VM 之一。

它的优势在于：

- 完整文件系统启动链
- 强进程隔离
- 强文件系统隔离
- 明确设备伪装能力

它的短板不在系统层，而在硬件层。宿主 root 下看到的是实例目录树、配置树和分区二进制文件的混合形态；guest 内部看到的硬件状态则仍明显依赖宿主。

## 四、光速虚拟机 5.0.6

### 4.1 基本信息

- 包名：`com.vphonegaga.titan`
- `versionName=5.0.6`
- `versionCode=6026`
- `compileSdkVersion=35`
- `targetSdkVersion=35`
- 支持架构：`arm64-v8a`, `armeabi-v7a`
- APK 体积：约 `497M`

### 4.2 整体定位

5.0.6 仍然是强系统隔离的用户态 Android VM，但它已经不只是 VM，而是朝“兼容平台”方向演化。

它的核心特征是：

- 延续用户态内核 VM 路线
- 具备完整系统分区材料
- 引入 FEX 风格翻译层
- 增加 x86/x64 兼容与图形兼容层
- 延续 VPN/TUN 与本地 shell 控制通道

而它和 3.8.2 的代际差异，也能从 native 组成里直接看出来。保留 Android VM 本体的仍然是 `libVPhoneGaGaLib.so` 与 `libuserkernel*` 这一层；guest 装载仍然由 `libloader*` 与 `libsdk29helper.so` 一类库辅助；真正拉开差距的是 `libuserkernel32emu_x86.so`、`libuserkernel64emu_x64.so`、`libuserkernelemu.so`、`libtranslator_x32.so`、`libtranslator_x64.so`、`libtranslator_x32_fex.so`、`libtranslator_x64_fex.so` 这一大组 CPU 翻译与模拟层，再配合 `libvkcompat.so`、`libvulkan_freedreno.so`、`libOpenglRender.so`、`libXlorie.so` 形成的图形兼容层。这种组合已经明显不是单一 Android VM，而是一套面向异构软件兼容的运行平台。

### 4.3 启动流程

Java 层接口与 3.8.2 同源：

- `smali_classes3/com/vphonegaga/titan/VPhoneGaGaLibHelper.smali:498`

其中存在：

- `InitEnvironment()`
- `InitializeInstance(...)`
- `StartGaGaOs(II)`

native 中同样可以直接看到：

- `pivot_root`
- `sys_chroot`
- `/init`
- `/system/bin/app_process64`
- `setenforce`
- `selinuxfs`
- `devpts`
- `titan-shell-service-socket`

说明它的 Android VM 本体没有退化。

外围结构也延续了 3.8.2：

- VPN/TUN 网络层仍在
- `virtpipe` 与 `vphone_pipe` 风格通信仍在
- 宿主侧增加更多图形与兼容层服务，但不改变 VM 本体的启动方式

### 4.4 文件系统隔离

5.0.6 仍然具有完整系统分区材料，相关归档中可见：

- `root/readonly.bin`
- `system/readonly.bin`
- `androidfs.bin`
- `fscache.bin`
- `superblock.bin`

native 中又有：

- `mount`
- `remount`
- `unshare`
- `setns`
- `pivot_root`
- `mountinfo`
- `self/mounts`

因此在文件系统隔离上，它和 3.8.2 一样属于强隔离路线。

### 4.5 进程隔离

5.0.6 的进程隔离证据同样充分。`libuserkernel.so` 中可以看到：

- `/proc/self/status`
- `/proc/self/maps`
- `/proc/%d/fd`
- `/proc/%d/syscall`
- `/proc/%d/maps`
- `/proc/%d/mem`
- `/proc/%d/status`
- `/proc/%d/stat`
- `/dev/socket/zygote_secondary`
- `/dev/socket/zygote`
- `/system/bin/app_process64`
- `u:r:system_server:s0`

说明它维持完整 guest 进程世界的能力与 3.8.2 在同一水平。

### 4.6 属性与设备信息隔离

5.0.6 明显继续增强了设备伪装能力。

可以直接看到：

- `SettingOneClickNewMachineActivity`
- `ModelHelper`

涉及的字段包括：

- `Build.MODEL`
- `Build.BRAND`
- `Build.FINGERPRINT`
- `Build.MANUFACTURER`

native 侧还会读取：

- `ro.board.platform`
- `ro.hardware.vulkan`
- `ro.hardware.egl`
- `ro.build.version.sdk`

这说明它在做的不只是手机型号伪装，还包括图形栈与渲染环境兼容。

### 4.7 兼容层与跨架构能力

这是 5.0.6 和 3.8.2 最本质的区别。

它新增的关键库包括：

- `libuserkernel32emu_x86.so`
- `libuserkernel64emu_x64.so`
- `libuserkernelemu.so`
- `libtranslator_x32.so`
- `libtranslator_x64.so`
- `libtranslator_x32_fex.so`
- `libtranslator_x64_fex.so`
- `libvkcompat.so`
- `libXlorie.so`
- `libvulkan_freedreno.so`

其中 `libtranslator_x64_fex.so` 直接包含大量 `FEX_*` 字符串，例如：

- `FEX_ROOTFS`
- `FEX_APP_CONFIG`
- `FEX_GDBSERVER`
- `FEX_HOSTFEATURES`
- `fex-emu`

这说明它具备明确的 x86/x64 指令翻译层，而不是只跑 ARM guest。

因此 5.0.6 更准确的定位是：

`独立 Android 系统世界 + CPU 翻译层 + 图形兼容层`

并且它的翻译层不是“存在相关 so 文件”这么简单，而是有明确的策略面。配置层中可以直接看到：

- `BINARY_TRANSLATOR_BOX_64 = 0`
- `BINARY_TRANSLATOR_FEX_EMU = 1`

以及面向不同目标的多档预设，实质上把“兼容性 / 稳定性 / 性能”做成了产品级开关。图形和 Windows 兼容侧也同样有明确配置面，例如 Turnip、Mali、DXVK、VKD3D、Wine 版本等。换句话说，5.0.6 的兼容层不是附属功能，而是核心运行平台的一部分。

### 4.8 硬件与状态透传

5.0.6 在硬件层仍然明显依赖宿主。

#### 电话

`MyNativeActivity` 中直接调用：

- `getSystemService("phone")`
- `getDataNetworkType()`
- `getVoiceNetworkType()`
- `getSimOperatorName()`
- `getNetworkOperatorName()`

#### WiFi

直接调用宿主 `WifiManager.getConnectionInfo()`，读取：

- `SSID`
- `BSSID`
- `Frequency`

#### GPS

直接使用：

- `getLastKnownLocation(...)`
- `requestLocationUpdates(...)`

#### 传感器

与 3.8.2 相比，它把传感器透传做成了更细的实例级开关控制，例如：

- 加速度计
- 陀螺仪
- 光线
- 距离
- 心率

这说明它不是简单全量透传，而是把透传纳入更细粒度控制。

#### 电池

native 中同样存在：

- `power_supply`
- `DEVPATH=/class/power_supply/Battery`

#### 存储

与 3.8.2 一样：

- 基础系统分区视图独立
- 共享存储语义仍可能暴露宿主真实存储环境

### 4.9 宿主 root 下的文件存放形态

5.0.6 是几款产品里宿主落盘证据最直接的一组。

实例根目录来自：

- `smali_classes3/com/vphonegaga/titan/VPhoneInstance.smali:186`

逻辑为：

- `getFilesDir()`
- 追加 `instance<id>`
- 写入 `VPhoneConfig.mStoragePath`

`VPhoneConfig` 进一步显示实例目录下的配置树：

- `mConfigDirPath = getFilesDir()/instance<id>`
- `mUserConfigDirPath = <instance>/config`
- `vpgg_phone_model_data.xml`
- `user_phone_model.xml`
- `user_customize_phone_model.xml`
- `vphone_setting.xml`
- `vpgg_phone_gpu_data.xml`
- `user_phone_gpu_model.xml`
- `user_customize_gpu_model.xml`

native 字符串还直接给出更完整的宿主侧形态：

- `%s/instance%d/config`
- `%s/config/androidfs_version.xml`
- `%s/instance%d/logs/titan.log`
- `%s/instance%d/%s/%s/readonly.bin`
- `%s/boot.img`
- `%s/new_boot.img`
- `instance.xml`
- `%s/assets/%s`

因此它的宿主可见形态最准确的描述是：

`实例目录树 + 配置 XML + boot 镜像文件 + 只读分区二进制文件 + 日志的混合形态`

### 4.10 被检测可能性

5.0.6 对普通 app 的隐藏能力理论上是最强一档，因为：

- 系统隔离强
- 属性伪装强
- 图形兼容更强
- 兼容 Magisk

但它也引入了新的痕迹：

- `fex-emu`
- FEX 相关路径和环境变量
- 兼容层动态库
- 图形兼容库

因此：

- 对通用风控 app，它可能更难被检测
- 对专门检测翻译层、兼容层、x86 guest 的高级对手，反而多了新的侧信道

### 4.11 小结

5.0.6 仍然是强系统隔离的用户态 Android VM，但它已经向“兼容平台”演化。

宿主 root 下看到的不是单一黑盒镜像，而是明确的实例目录树、配置文件、boot 文件、分区二进制文件和日志文件的混合结构。它的核心优势在于系统世界与兼容层，而不是硬件世界的独立性。

## 五、虚拟大师 3.2.66

### 5.1 基本信息

- 包名：`com.clone.android.dual.space`
- `versionName=3.2.66`
- `versionCode=3266`
- `compileSdkVersion=35`
- `targetSdkVersion=35`
- 支持架构：`arm64-v8a`, `armeabi-v7a`
- APK 体积：约 `144M`

### 5.2 整体定位

虚拟大师是几款产品里最容易被误判的一款，因为它既不是普通双开，也没有像光速那样在样本中直接暴露出同等级的用户态内核链路字符串。它真正的特点是：

- 自有 `VMManager / VMInstance / VMConfig / RomConfig`
- 完整 `InstallFsTask + ImageInstallerV1` 安装体系
- `libvm / libkr32 / libkr64 / libkrloader32 / libkrloader64 / libun7z`
- 非常完整的 HAL 代理层
- 明显支持多来源系统包、叠加包与插件包

从整体形态看，它更像一个：

`VM 宿主平台 + 系统安装器 + native loader + HAL 代理层`

这一点与它的 native 组成完全吻合。`libvm.so` 是 VM 核心引擎，`libkr32.so` / `libkr64.so` 及其 `.11/.12` 变体承担不同 API level 的运行时核心，`libkrloader32.so` / `libkrloader64.so` 则负责执行路径、动态装载和系统属性接口等底层工作；`libun7z.so` 与 `libadb.so` 分别补足 7z 解包与 ADB 相关能力；而 `libcrashlytics.so`、`libcrashlytics-handler.so`、`libcrashlytics-common.so`、`libdatastore_shared_counter.so` 又说明它在稳定性与持久化上做了较完整的工程化处理。因此，虚拟大师的 native 结构更像一个完整的平台底座，而不是单纯的某一个 VM 内核库。

### 5.3 系统内容的组织方式

虚拟大师的系统内容不是固化死的单一路径，而是通过 `RomConfig` 组织成一组可安装材料。

`RomConfig` 中可以直接看到两个关键数组字段：

- `WWWW֭WWWWྥ֭:[Ljava/lang/String;`
- `WWWoԻWWWoͷԻ:[Ljava/lang/String;`

`RomConfig.WWWW̏WWWWβ̏(String)` 会从 JSON 构造 `RomConfig` 对象。当前能够解码出来的字段包括：

- `id`
- `display_name`
- `rom_version`
- `os_version`
- `rom_uri`
- `overlay_uri`
- `magisk_uri`
- `su_uri`
- `xposed_uri`
- `play_uri`

这说明虚拟大师的系统内容是由多种来源组成的：

- 基础系统包
- overlay 包
- root / su 包
- xposed 包
- play / gms 包

这也正是它能支持多来源、多版本系统内容的原因。

### 5.4 启动与安装流程

虚拟大师的核心结构非常完整，可以明确看到：

- `VMManager`
- `VMInstance`
- `VMConfig`
- `RomConfig`
- `InstallFsTask`
- `ImageInstallerV1`

这说明它绝对不是简单的应用多开器。

`InstallFsTask` 会把：

- `VMConfig`
- URI 列表
- `InstallOptions`

交给 `ImageInstallerV1`。

而 `ImageInstallerV1` 会根据来源路径，分别调用：

- `AndUn7z`
- `ZipHelper`
- `AssetsUtils`
- `FileCopyUtils`

这说明虚拟大师不是在 Java 层伪造一个系统，而是确实存在：

`系统材料导入 -> 解包 -> 安装 -> 写入 VM 目录`

这条完整流程。

如果把启动前准备链展开，虚拟大师的阶段性结构其实比前文写法更完整。当前样本里能直接对应到的任务链包括：

- `PrepareFsTask`
- `InstallFsTask`
- `BuildTmpfsTask`
- `BuildVMPropTask`
- `BuildExecPathTask`

其中 `BuildExecPathTask` 还会调用 `Os.symlink()`，说明它不仅复制和安装系统材料，还会主动构造执行路径、软链接和运行前目录结构。

在真正启动 OS 时，`VMInstance.startOS(...)` 是 native 启动入口；启动后又会通过 `BinderService.setupBinder(...)` 建立 Binder 通信，同时 Java 侧再通过 `Proxy.newProxyInstance(...)` 把接口包装成可调用代理。这条链条说明它不是纯文件安装器，而是：

`系统安装器 + native VM 启动器 + Binder 代理层`

### 5.5 VMConfig 与实例路径组织

`VMConfig` 中与宿主落盘最相关的字段包括：

- `WWWWͶWWWWᆑͶ:Ljava/lang/String;`
- `WWWWϙWWWWეებიϙ:Ljava/lang/String;`
- `WWoϫWWoӉϫ:Ljava/lang/String;`
- `WWWȏWWWoನ̑:Lcom/android/vmcore/RomConfig;`

`VMInstance` 构造实例路径的证据更直接：

- 它会取 `ApplicationInfo.dataDir`
- 在 `dataDir` 下派生实例根目录
- `new File(base, something + instanceId)`
- 写回 `VMConfig.WWWWͶWWWWᆑͶ`

随后它又继续派生：

- 实例根目录下的子目录路径
- 写回 `VMConfig.WWWWϙWWWWეებიϙ`

再从 `dataDir` 派生另一路路径，写入：

- `VMConfig.WWoϫWWoӉϫ`

所以可以直接确认：

- 虚拟大师每个实例在宿主 app 私有目录下都有独立路径
- `VMConfig` 里明确保存这些路径
- 它不是只靠数据库索引一个抽象系统，而是真正有实例根目录和子目录

### 5.6 文件系统隔离

虚拟大师的文件系统隔离不像光速那样直接暴露完整 `pivot_root/chroot/init` 证据，但它的系统环境组织能力很明确。

`InstallFsTask` 中：

- 从 `VMInstance` 取 `VMConfig`
- 从 `VMConfig.RomConfig` 取 URI 列表
- 每个 URI `Uri.parse(...)`
- 目标目录来自 `VMConfig.WWWWͶWWWWᆑͶ`
- 最终调 `ImageInstallerV1.WWWȏWWWoನ̑(...)`

这说明它的系统内容最终是被安装进某个宿主目录，而不是停留在逻辑引用层。

native 层又可以看到：

- `libkrloader32.so` / `libkrloader64.so` 有 `mount`
- `libkr32.so` / `libkr64.so` 有 `/system/build.prop`
- `app_process32/64`
- `/proc/self/maps`

进一步复核的 native 字符串还能补全它的 native 能力：

- `libkr64.so` 直接包含 `shadowhook version 1.0.8`
- `libkr64.so` 同时包含 `app_process64` 与 `/system/bin/app_process64`
- `libkrloader64.so` 具备完整 `socket/bind/listen/connect`、`__system_property_get`、`/dev/__properties__` 这类自定义 loader 能力
- 虚拟网络层存在 `VpnManager` 与 slirp 线索，说明其网络并不只是普通宿主 socket 共用，而带有用户态 TCP/IP 代理成分

这说明它确实有自己的 VM 系统语义，但从当前样本看，文件系统隔离强度仍应低于两版光速。

### 5.7 外部 ROM 压缩包与 `rom.img/rom1.img` 的实际格式

这一节是本轮对虚拟大师最重要的新增结论。

本次用于复核的三个外部 ROM 样本分别是：

- `rom_7_1_2_1055_3267_M27.zip`
- `rom_11_0_0_1033_3262_M27.zip`
- `rom_12_1_0_1034_3267.zip`

三者的顶层 ZIP 结构都高度一致，典型内容为：

- `manifest.json`
- `rom.img`
- `rom1.img`
- 可选的 `magisk.zip`
- 可选的 `superuser.zip`

`manifest.json` 中关键字段包括：

- `rom_uri`
- `magisk_uri`
- `su_uri`
- `xposed_uri`
- `play_uri`

其中最关键的是：

- `rom.img?e=x&c=v2`
- `rom1.img?e=x&c=v2`

这说明两个 `img` 文件本身就是带封装参数的系统载荷。

直接对三个样本做 `file` 和头部 `xxd` 检查可以确认：

- `rom.img` 与 `rom1.img` 都不会被识别为 ext4、Android sparse image 或标准 raw disk image
- 文件头不是 ext4 superblock，也不是 sparse image 常见魔数
- 三个样本的两个 `img` 都具有一致的非标准头部特征

因此可以明确排除“它们是标准可直接挂载分区镜像”的可能性。

继续结合 `ImageInstallerV1` 的输出流创建逻辑，本次已经把该方法中的 `StringFog` 常量解出来了。结果显示：

- query 参数名：`e`
- 分支值之一：`n`
- 分支值之二：`x`
- XOR / AES 共用 key：`%z89aviCM0KkbEs9`
- Cipher 算法名：`AES`

对应的输出流分支是：

#### `e=n`

直接返回普通 `BufferedOutputStream`，即原样写出。

#### `e=x`

返回 `XOROutputStream`，使用 key：

- `%z89aviCM0KkbEs9`

其实现是循环 key 逐字节 XOR。

#### 其他值

落入 `CipherOutputStream` 分支，算法为：

- `AES`

key 仍然是：

- `%z89aviCM0KkbEs9`

这说明虚拟大师的系统包写出链支持至少三种策略：

1. 原样写出
2. XOR 写出
3. AES 写出

而当前你给的三个 ROM 样本中，`rom.img` 与 `rom1.img` 实际采用的是：

- `e=x`
- `c=v2`

也就是“版本 2 的 XOR 封装载荷”。

进一步对三个样本做同样的 XOR 离线解封后，可以确认：

- 解封后的 `rom.img` / `rom1.img` 都会被识别为 `7-zip archive`
- 再继续解压，里面不是块设备镜像，而是直接展开的 `fs/` 文件树
- 典型目录包括：
  - `fs/system/`
  - `fs/data/`
  - `fs/dev/`
  - `fs/proc/`
  - `fs/root/`
  - `fs/cache/`
  - `fs/storage/`
  - `fs/system/app/`
  - `fs/system/priv-app/`
  - `fs/system/lib64/`

因此现在可以把它的真实格式写得非常明确：

**虚拟大师的外部 ROM 不是“ZIP 里放标准 img 分区镜像”，而是：**

**ZIP -> XOR 封装的 7z -> 7z 内直接承载 Android 文件树 `fs/`**

换句话说，这类 `img` 文件在虚拟大师体系里并不承担“可直接挂载分区镜像”的角色，而承担“经过自定义编码后的系统内容载荷”角色：

- `rom.img` / `rom1.img` 是经过 XOR 封装的多段系统载荷
- XOR 解开后得到的是 7z 包，而不是裸镜像
- 7z 解包后得到的是文件树，而不是 ext4 / sparse block device
- 安装时必须经过虚拟大师自己的 `ImageInstallerV1` 写入链

从结构上看，这两个 `img` 更像两段主系统内容，而不是单一统一镜像。当前静态证据仍不足以把它们一一精确命名成传统 `system/vendor/data` 某个分区名，但已经足够确认：

- 它们是安装器理解的两段主载荷
- 每段载荷内部都包含可直接展开的 Android 文件树
- 虚拟大师走的是“文件树式系统安装”路线，而不是“直接挂载裸分区镜像”路线

### 5.8 宿主 root 下的文件存放形态

综合 `VMConfig`、`VMInstance`、`InstallFsTask`、`ImageInstallerV1` 的证据，可以给出相对明确的判断。

宿主 root 权限下，更可能看到：

1. app 私有目录下的实例根目录
2. 实例根目录中的若干子目录
3. 以字符串路径形式保存在 `VMConfig` 中的系统路径和辅助路径
4. 安装后的系统文件、overlay 文件、插件文件
5. cache 临时文件
6. 少量元数据文件、SharedPreferences 与 AtomicFile 文件

不太像：

- 只看到一个超大单文件、完全看不到内部结构
- 只看到数据库记录，内容全在引擎内部不可见

更准确的描述应为：

`实例目录树 + 安装后的系统/插件文件 + cache 临时文件 + 元数据文件的混合形态`

如果宿主 root 直接查看该目录，看到的会更接近“可以辨认的文件和目录”，而不是只有一个不透明大镜像块。

### 5.9 进程隔离

虚拟大师至少具备一套独立 VM 进程管理体系。

直接证据包括：

- `VMInstance`
- `VMManager`
- `app_process32/64`
- `/proc/self/maps`
- `mount`
- `property_service`

Java 层也存在：

- `getRunningAppProcesses()`

这说明它的进程模型不是普通多开那种“直接把 guest app 映射成宿主 app 进程”。

但当前仍未抓到与光速同等级的：

- `pivot_root`
- `unshare`
- `setns`
- `/init`

等 boot-chain 证据，所以在隔离纯度上仍然只能评为中等。

这里需要把边界说清楚：

- `shadowhook`、自定义 loader、`mount`、`app_process`、属性空间、系统安装链条，这些证据都成立
- 但 `pivot_root/unshare/setns/init` 这一组最关键的内核化启动证据，在当前样本中并没有像两版光速那样被直接抓到

因此虚拟大师应被描述为“非常强的 native VM 平台 + 安装器 + HAL 代理层”，而不应在现有证据下和两版光速无保留地画等号。

### 5.10 属性与设备信息隔离

虚拟大师明确有属性访问层。

相关 smali 中直接反射：

- `android.os.SystemProperties`

并读取：

- `ro.product.brand`
- `ro.vivo.os.name`
- `ro.build.version.emui`
- `ro.build.version.incremental`
- `ro.build.rom.id`

native 中则有：

- `/system/build.prop`
- `ro.build.version.sdk`

这说明它至少支持在系统层维护和读取一套自己的属性空间。

此外，当前样本中还存在独立的 `FakeUtils` 工具层，并且被 `VMManager` 和若干属性相关代码多处调用。就静态分析可见性而言，这至少足以说明：

- 虚拟大师确实有专门的伪装工具层
- 但由于它的 StringFog 全局字符串加密与混淆程度很高，当前样本并不适合把伪装覆盖范围夸大为“已完全坐实的整套机型伪装能力”

因此在这一点上，最稳妥的表述是“具备独立伪装工具层，但覆盖范围上限受当前静态可见性限制”。

但与光速相比，目前没有抓到特别清晰的实例级机型模板伪造器证据。因此它更像“具备属性空间”，而不是“明显强化了机型伪装产品能力”。

### 5.11 硬件与状态透传

这是虚拟大师最清楚、也最直接暴露宿主的一部分。

它几乎把宿主硬件访问完整封装成 HAL 代理服务：

- `BatteryService`
- `LocationService`
- `SensorService`
- `PhoneService`
- `WiFiService`

而系统服务映射表直接把：

- `location`
- `sensor`
- `storage`
- `phone`
- `wifi`

映射到对应代理。

#### 电池

`BatteryService` 直接持有宿主 `BatteryManager`，并调用：

- `getIntProperty(I)`
- `isCharging()`

因此 guest 电池电量、温度、充电状态，高概率就是宿主真实值。

#### WiFi

`WiFiService` 直接持有宿主 `WifiManager`，并调用：

- `startScan()`
- `getScanResults()`

这意味着 guest 看到的 WiFi 列表和连接状态，本质上就是宿主当前环境。

#### 定位

`LocationService` 直接持有宿主 `LocationManager`，并调用：

- `getLastKnownLocation()`
- `requestLocationUpdates(...)`

因此 guest 的地理位置明显继承宿主。

#### 传感器

`SensorService` 直接使用宿主 `SensorManager`，调用：

- `getDefaultSensor(I)`
- `registerListener(...)`

这说明 guest 传感器世界也不是独立模拟，而是宿主代理。

#### 存储

可以看到：

- `StorageManager` 映射
- `Environment.getExternalStorageDirectory()`
- `StatFs`

再结合它的系统安装机制可判断：

- VM 自己会有一套文件系统空间
- 但外部存储、共享目录与容量判断仍可能明显暴露宿主真实值

### 5.12 被检测可能性

虚拟大师被检测的风险不低。

主要原因：

1. 硬件层透传非常直接。
2. 环境一致性依赖其安装到 VM 中的系统内容。
3. 当前没有抓到像光速那样明确、成熟的机型伪装与 Magisk 管理证据。
4. guest app 如果对硬件行为、存储布局、系统属性一致性做交叉校验，较容易发现异常。

### 5.13 小结

虚拟大师是一个“有完整 VM 管理器、系统安装器和插件体系的虚拟机平台”。

它不是普通多开，也不是纯 Java 容器。它真正的强项不在“样本里直接展示出最强的内核隔离痕迹”，而在于：

- 有完整的实例配置体系
- 有完整的系统包、overlay、插件安装体系
- 能支持多来源系统内容
- 有一套非常完整的 HAL 代理层

宿主 root 下，它更可能以“实例目录树 + 已安装系统文件 + 插件文件 + cache 临时文件 + 元数据文件”的混合形态出现，而不是只表现为一个不透明大镜像。

但在隔离纯度上，它仍弱于两版光速，因为其硬件状态代理过于直接，进程和文件系统链路的原生内核化证据也不如光速完整。

## 六、综合比较

| 对象 | 本质类型 | 系统隔离 | 进程隔离 | 文件系统隔离 | 硬件状态隔离 | 宿主 root 可见形态 | 被检测风险 |
|------|----------|----------|----------|--------------|--------------|--------------------|------------|
| VMOS Pro | 高级容器化 Android 平台 | 中 | 中 | 中 | 低到中 | 目录树 + 打包文件 + 元数据 | 中高 |
| 光速 3.8.2 | 用户态 Android VM | 高 | 高 | 高 | 低到中 | 实例目录树 + 配置树 + 分区二进制文件 | 中 |
| 光速 5.0.6 | 用户态 Android VM + 兼容平台 | 高 | 高 | 高 | 低到中 | 实例目录树 + 配置 XML + boot 文件 + 分区二进制文件 + 日志 | 中 |
| 虚拟大师 | VM 平台 + 系统安装器 + HAL 代理层 | 中高 | 中 | 中 | 低 | 实例目录树 + 已安装系统文件 + 插件文件 + cache + 元数据 | 中高 |
| 多元空间 | 应用级容器 / 多开框架 | 低 | 低到中 | 中 | 低 | `fv/` 目录树 + 用户数据镜像 + 配置文件 | 高 |

几款产品的关键差异，不在于“有没有 native 库”，而在于它们到底隔离的是哪一层。

- `VMOS Pro` 主要隔离的是运行环境、加载路径、属性层和部分进程世界。
- `光速 3.8.2 / 5.0.6` 隔离的是整个 Android 系统世界，包括 rootfs、zygote、system_server 和 guest `/proc` 语义。
- `虚拟大师` 隔离的是 VM 管理、系统安装与运行容器，但硬件世界仍然明显属于宿主。
- `多元空间` 隔离的是宿主内部的应用实例、路径视图和 Binder 参数，不是独立系统世界。

从宿主 root 视角看，这几类产品都更接近“混合形态”而不是单一形态：

- 能看到目录树
- 能看到配置文件和元数据
- 某些产品还能看到 boot 文件、分区二进制文件或系统包安装产物
- 不支持“只能看到一个完全不透明的大块系统文件”的统一结论

从 guest app 视角看，它们都不是独立硬件世界：

- 电池、定位、WiFi、电话、传感器都不同程度依赖宿主
- 两版光速系统隔离最强，但硬件透传仍然明显
- 虚拟大师硬件透传最直接
- VMOS 的检测痕迹和运行时重定向特征最明显
- 多元空间虽然可伪装部分标识，但应用级容器痕迹最多

## 七、多元空间 3.5

### 7.1 基本信息

- 包名：`space.dualmeta64`
- `versionName=3.5`
- `versionCode=35`
- 应用名：`DualMeta / 多元空间`
- `compileSdkVersion=31`
- `targetSdkVersion=28`
- 支持架构：`arm64-v8a`

### 7.2 整体定位

多元空间不是 Android 虚拟机，也不是用户态内核 VM。它属于典型的宿主内应用虚拟化 / 多开容器路线，核心框架明确指向 `fvbox`。

它更接近：

- `VirtualApp`
- `BlackBox`
- `FBox`
- `FVBox`

这一类“宿主代理 + Binder Hook + IO 重定向 + Stub 组件”的方案，而不是 `pivot_root/chroot/init/zygote/system_server` 驱动的独立系统世界。它的 native 组成也非常符合这个定位：`libfcore.so`、`libfs.so` 对应容器核心与文件系统代理，`libshadowhook.so`、`libpine.so` 对应 Hook 与注入能力，`libmmkv.so`、`libcrashsdk.so`、`libxcrash.so`、`libxcrash_dumper.so`、`libumeng-spy.so` 则承担配置、崩溃与存储辅助。这种库结构一眼看上去就是应用级 Hook 容器，而不是虚拟机运行时。

### 7.3 核心技术路线

最直接的证据来自：

- Manifest 中的 `com.fvbox.BoxApplication`
- 核心单例 `com.fvbox.lib.FCore`
- 进程类型枚举 `CLIENT/SERVER/HOST/OTHER`

Manifest 中还能看到大量宿主代理组件：

- `DaemonService`
- `FSystemProvider`
- `ProxyPendingService`
- `ProxyBroadcastReceiver`
- 大量 `ProxyActivity$...`

代理 Activity 运行在 `:sc0`、`:sc1` 这类子进程中，而 `FManifest.getProcessName()` 会直接把进程名构造为：

- `宿主包名 + ":sc" + index`

这说明它运行克隆 app 的方式不是启动 guest Android，而是：

1. 在宿主中批量注册 Stub Activity / Service / Receiver / Provider
2. 为克隆 app 分配虚拟用户、虚拟进程号与虚拟 UID
3. 用宿主代理组件承接真实启动请求
4. 用 Binder Hook 和参数改写把包名、uid、pid、processName 变成虚拟视角
5. 用 IO 重定向把 `/data/data/...`、`/storage/emulated/...` 映射到自己的私有目录树

### 7.4 为什么它不是虚拟机

当前样本中没有发现以下 VM 级关键证据：

- `pivot_root`
- `chroot`
- `/init`
- `zygote` 启动链
- `system_server` 启动链
- `userkernel`
- 独立 rootfs
- mount namespace

相反，native 层主要体现的是：

- `shadowhook`
- `xhook`

这说明它更像 Hook 框架与应用级容器，而不是独立 Android 系统环境。

### 7.5 宿主上的文件与数据如何存放

多元空间直接在宿主私有目录旁边构造了一棵自己的虚拟文件树，根目录为：

- `fv/`

典型结构包括：

- `fv/data/app/<package>/base.apk`
- `fv/data/app/<package>/lib`
- `fv/data/user/<userId>/<package>`
- `fv/data/user_de/<userId>/<package>`
- `fv/system/accounts.conf`
- `fv/system/fake-location.conf`
- `fv/system/shared-user.conf`
- `fv/system/user.conf`
- `fv/proc/<id>`

外部存储镜像位于：

- `getExternalFilesDir("fv")/storage/emulated/<userId>/Android/data/<package>`

因此在宿主 root 下看到的是非常具体的目录树，而不是镜像文件。

### 7.6 隔离程度

多元空间的隔离强度必须分开看，不能笼统说“强”或“弱”。

#### 文件系统隔离

- 评级：中

原因：

- 不会让 guest app 直接访问宿主原始 `/data/data/真实包名`
- 会把 `/data/user/...`、`/data/data/...`、`/storage/emulated/...`、`/sdcard` 映射到 `fv/` 树中
- 对普通 app 有明显隔离效果

但它不是独立 rootfs，也不是独立 mount namespace，因此这是一种“路径重写式隔离”，不是系统级文件系统隔离。

#### 应用数据隔离

- 评级：中到中高

原因：

- 每个应用有独立 `data/app/<pkg>`
- 每个虚拟用户有独立 `data/user/<uid>/<pkg>`
- 还区分 `user_de`
- 外部存储镜像也是按用户和包划分

因此在“同一宿主内多开多个应用实例”的数据切分上，它做得比较扎实。

#### 进程隔离

- 评级：低到中

原因：

- 框架内部维护虚拟 `fpid`、`fuid`、`userId`
- Binder 层会改写包名、uid、pid
- 但从宿主真实世界看，这些进程仍是宿主 app 的子进程或同 UID 域进程
- Manifest 里的代理进程名就是 `:sc0`、`:sc1`
- 没有独立 PID namespace、没有独立 zygote、没有独立 system_server

因此它和真正 VM 的进程世界有本质差距。

#### 属性与设备信息隔离

- 评级：中

它有 `FDevice` 对象，包含：

- `BOARD`
- `BRAND`
- `DEVICE`
- `HARDWARE`
- `ID`
- `MANUFACTURER`
- `MODEL`
- `PRODUCT`
- `SERIAL`
- `androidId`
- `bootId`
- `deviceId`
- `wifiMac`

并且明确 hook：

- `getDeviceId`
- `android_id`
- WiFi `BSSID/MacAddress`

因此它能覆盖一部分常见静态标识。

但因为没有独立系统属性空间，也没有系统级机型模板世界，所以能力仍低于两版光速。

#### 硬件与动态状态隔离

- 评级：低

原因是它没有自己的：

- 虚拟电池
- 虚拟 GPS 芯片
- 虚拟 WiFi 栈
- 虚拟基带
- 虚拟摄像头
- 虚拟 GPU

它做的是宿主硬件透传、常见接口返回值伪装，以及少量 root / sim / vpn / path 隐藏规则。因此电池、WiFi、蓝牙、定位、传感器、电话网络状态等动态信息，仍然会明显跟着宿主走。

### 7.7 被检测可能性

多元空间的抗检测能力只能评为：

- 低到中

原因很直接：

- 代理进程名形如 `:sc0`
- 宿主里存在固定 `fv/data/user/...`、`fv/system/...`、`fv/proc/...`
- Binder 参数改写本身就是检测面
- 大量 Stub Activity / Service / Provider 是典型应用级容器特征
- native 层使用 `shadowhook/xhook`

它虽然有：

- `hidePath`
- `hideRoot`
- `hideSim`
- `hideVpn`
- `stablePattern`
- `visibleExternalApp`
- `allowSystemInteraction`
- `useHook`

但这些更像提升兼容性和规避常见检查，而不是把自己提升为系统级 VM。

### 7.8 小结

多元空间是“强应用级容器 / 强多开框架”，不是系统级虚拟机。

如果按层级粗略排序：

- 传统简单双开壳：低
- 多元空间：中
- VMOS / 虚拟大师：中高
- 光速 3.8.2 / 5.0.6：高

它的优势是：

- 实现成本低
- 应用数据隔离还可以
- 对常见设备标识有伪装能力

它的短板是：

- 没有独立系统世界
- 没有内核级隔离
- 进程世界不独立
- 动态硬件状态高度依赖宿主
- 检测面较多
