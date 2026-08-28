---
date: 2026-08-28
category: 教程
tag: 
  - iStoreOS
  - 网络
  - 代理
---

# 自用 iStoreOS 上 Tailscale、PassWall2、AdGuard Home 完美共存方案

本文记录一套 iStoreOS/OpenWrt 上的实际修复方案，目标是同时满足：

- Tailscale 保持原生 nftables、Exit Node、子网路由和 MagicDNS。
- AdGuard Home 始终是客户端唯一 DNS 入口。
- PassWall2 可独立开关。
- PassWall2 关闭时不影响正常 DNS、dnsmasq、Tailscale。
- PassWall2 开启时，代理域名的 DNS 经 Xray 和 VLESS 远程 DoH。
- IPv4 转发流量可正常代理。
- IPv6 保持 TPROXY，不退回全局 REDIRECT。
- 不关闭或修改 Tailscale 的 netfilter 行为。

本文适用于当前这类组合：

```text
客户端
  -> AdGuard Home :53
      -> 普通域名：原有 DoH
      -> /lan/：dnsmasq :1745
      -> /ts.net/：100.100.100.100
      -> 代理域名：Xray DNS :15353
          -> VLESS
          -> 远程 DoH
```

## 问题背景

最初设备使用 iStoreOS/OpenWrt 官方软件源中的 Tailscale，PassWall2 透明代理没有明显异常，但官方包版本较旧。

为使用较新的 Tailscale，后来切换到 [GuNanOvO/openwrt-tailscale](https://github.com/GuNanOvO/openwrt-tailscale) 的 x86_64 第三方源：

```text
https://gunanovo.github.io/openwrt-tailscale/x86_64
```

当前安装版本为：

```text
tailscale 1.102.3-r1
```

该源主要提供 UPX 精简打包的较新 Tailscale。切换后启用了原生 nftables 后端，同时保留 Exit Node、子网路由、MagicDNS 和 Tailscale 自动防火墙管理：

```text
fw_mode=nftables
advertise_exit_node=1
advertise_routes=192.168.1.0/24
accept_routes=1
dns_mode=openwrt_forward
```

随后出现的问题是：PassWall2 使用 TCP TPROXY 时，LAN 转发流量无法访问国内或国外网站；切换全局 REDIRECT 后 IPv4 恢复，但 IPv6 TPROXY 又无法保留。

公开问题中可以找到高度相似的报告：

- PassWall [#4410](https://github.com/Openwrt-Passwall/openwrt-passwall/issues/4410)：Tailscale 连接后 TCP TPROXY 失效，REDIRECT 可用但 IPv6 TPROXY 不可用。
- PassWall [#4378](https://github.com/Openwrt-Passwall/openwrt-passwall/issues/4378)：nftables 下 TPROXY 与 REDIRECT/IPv6 透明代理的兼容性问题。
- PassWall [#4418](https://github.com/Openwrt-Passwall/openwrt-passwall/issues/4418)：IPv6 TPROXY 开启后 TCP TPROXY 不通，nft 计数器命中但 Xray 未正常处理转发流量。
- Tailscale [#8683](https://github.com/tailscale/tailscale/issues/8683)：安装 Tailscale 后 IPv4 TPROXY 透明代理损坏。

社区最常见的规避方式是：

```sh
tailscale up --netfilter-mode=off
```

但这个方案不适合本设备。关闭 Tailscale netfilter 会放弃 Exit Node、子网路由、NAT、防伪造规则和自动防火墙管理；这些正是路由器上运行 Tailscale 的核心价值。

因此本文的目标不是绕开 Tailscale，而是在不修改 Tailscale 的前提下：

```text
避开 Tailscale 的 FWMARK 冲突
保留 Tailscale 原生 nftables
让 IPv4 TCP 使用 REDIRECT
让 IPv6 TCP/UDP 继续使用 TPROXY
```

没有发现 GuNanOvO 仓库针对 PassWall TPROXY 的专门 issue。该源是较新 Tailscale 的打包来源；实际冲突仍发生在 Tailscale 原生 nftables mark 行为与 PassWall 透明代理路径之间。

## 问题描述

设备上的 Tailscale 使用原生 nftables。它会占用 packet mark 的 bits 16-23，并在新连接和已建立连接上同步 conntrack mark。

Tailscale 的关键规则逻辑类似：

```nft
ct state established,related ct mark & 0x00ff0000 != 0x00000000 meta mark set ct mark & 0x00ff0000
ct state new meta mark & 0x00ff0000 != 0x00000000 ct mark set meta mark & 0x00ff0000
```

PassWall2 原始 FWMARK 为：

```sh
FWMARK="0x50535732"
```

按字节拆开：

```text
0x50 0x53 0x57 0x32
```

其中 bits 16-23 是 `0x53`。这会被 Tailscale 写入 conntrack；后续数据包恢复出的 mark 只剩这部分，PassWall 的完整 FWMARK、TPROXY 命中和 table 999 策略路由都会混乱。

典型表现：

- TCP 三次握手可能完成。
- TLS 数据包反复重传或超时。
- 国内直连和代理节点都不可用。
- DNS 解析看似正常，但网页打不开。

## 修复方案

### 第一层修复：避开 Tailscale 的 mark 位

修改 `/usr/share/passwall2/nftables.sh`：

```sh
FWMARK="0x50005732"
```

不要使用上游默认的：

```sh
FWMARK="0x50535732"
```

新 mark 的字节为：

```text
0x50 0x00 0x57 0x32
```

bits 16-23 已清零，因此 Tailscale 的 conntrack mark 同步规则不会处理它。

这一步非常重要，但在本机仍发现第二层问题。

### 第二层问题：IPv4 PREROUTING TPROXY 仍失败

应用 FWMARK 修复后，路由器本机的 OUTPUT 流量可正常代理：

```text
iStoreOS 本机 -> PassWall OUTPUT -> Xray -> 正常
```

但 LAN/Docker 等转发流量仍失败：

```text
LAN/Docker -> PREROUTING -> PassWall TPROXY -> 超时
```

抓包和 nft 计数显示：

- 转发 TCP 已命中 `PSW2_MANGLE`。
- 已正确设置 `0x50005732`。
- `ip rule` 已命中 table 999。
- 包被送到 `local ... dev lo`。
- 但 WAN 上看不到对应的出站 SYN。

这说明问题不再是 DNS、VLESS、Tailscale mark 或 table 999 缺失，而是本机内核/PassWall/Xray 组合中的 IPv4 PREROUTING TPROXY 路径不可靠。

以下 sysctl 已检查，不是问题：

```text
net.ipv4.conf.all.src_valid_mark = 1
net.ipv4.conf.all.rp_filter = 0
net.ipv4.conf.default.rp_filter = 0
```

临时设置 `route_localnet=1` 也没有解决问题，因此不建议把它当作通用修复。

### 最终方案：IPv4 TCP REDIRECT，IPv6 保持 TPROXY

不要把 PassWall 全局改成 `redirect`，因为这会放弃 IPv6 TPROXY。

正确做法是拆分协议路径：

```text
IPv4 TCP 转发流量
  -> nft dstnat REDIRECT
  -> Xray tcp_redir_v4
  -> Xray sockopt.tproxy = redirect

IPv6 TCP 转发流量
  -> 原 PassWall PSW2_MANGLE_V6
  -> TPROXY :1041
  -> Xray tcp_redir
  -> Xray sockopt.tproxy = tproxy

UDP
  -> 保持原 TPROXY :1041
```

这样：

- IPv4 转发不再依赖透明 socket 和 table 999。
- IPv6 仍保留 TPROXY。
- 路由器本机 OUTPUT 继续使用原 TPROXY。
- 不需要禁用 Tailscale netfilter。

### 配置开关

在 `/etc/config/passwall2` 的 `global` 段增加：

```sh
option ipv4_tcp_redirect '1'
```

该选项不是 LuCI 原生界面项，但 UCI 会保留它。

当前还需要保留纯 Xray DNS 相关配置：

```sh
option pure_xray_dns '1'
option write_ipset_direct '0'
```

主分流节点也需要：

```sh
config nodes 'myshunt'
        option write_ipset_direct '0'
```

### 修改 `/usr/share/passwall2/app.sh`

在 `get_config()` 中增加：

```sh
IPV4_TCP_REDIRECT=$(config_t_get global ipv4_tcp_redirect 0)
REDIR_PORT=$(echo $(get_new_port 1041 tcp,udp))
[ "$IPV4_TCP_REDIRECT" = "1" ] && REDIR_PORT_V4=$(get_new_port $(expr $REDIR_PORT + 1) tcp)
```

在 `run_global()` 的 Xray 参数中增加：

```sh
[ "$IPV4_TCP_REDIRECT" = "1" ] && V2RAY_ARGS="${V2RAY_ARGS} redir_port_v4=${REDIR_PORT_V4}"
```

在 `run_xray()` 中增加 `redir_port_v4` 参数：

```sh
local flag node redir_port redir_port_v4 tcp_proxy_way ...
```

并在生成 JSON 参数时加入：

```sh
[ -n "${redir_port_v4}" ] && json_add_string "redir_port_v4" "${redir_port_v4}"
```

同一文件中还应保留纯 Xray DNS 的已有自定义逻辑：

- `pure_xray_dns=1` 时禁止 ChinaDNS-NG/IPSet DNS 分支。
- 跳过 `run_global_dnsmasq()`。
- 禁止启动阶段接管 `dhcp.@dnsmasq[0].dns_redirect`。
- 禁止停止阶段修改 `addnmount`、重载 dnsmasq。
- `run_copy_dnsmasq()` 在纯模式直接返回。
- PassWall 启停时调用 AdGuard Home 条件上游同步逻辑。

### 修改 `/usr/lib/lua/luci/passwall2/util_xray.lua`

读取新参数：

```lua
local redir_port_v4 = var["redir_port_v4"]
```

在原有 `tcp_redir` 入站之后增加 IPv4 REDIRECT 入站：

```lua
if redir_port_v4 then
    local tcp_inbound_v4 = api.clone(tcp_inbound)
    tcp_inbound_v4.tag = "tcp_redir_v4"
    tcp_inbound_v4.port = tonumber(redir_port_v4)
    tcp_inbound_v4.streamSettings.sockopt.tproxy = "redirect"
    table.insert(inbounds, tcp_inbound_v4)
end
```

原有入站必须保持：

```lua
tcp_inbound.tag = "tcp_redir"
tcp_inbound.settings.network = "tcp"
tcp_inbound.streamSettings.sockopt.tproxy = tcp_proxy_way
```

当前全局分流规则没有限制 `inboundTag`，因此默认 Direct、Proxy、GFW 分流都会同时适用于 `tcp_redir` 和 `tcp_redir_v4`。

如果未来启用 ACL 且 ACL 规则显式限制了 `inboundTag`，需要把 `tcp_redir_v4` 加入对应 ACL 的入站标签。

### 修改 `/usr/share/passwall2/nftables.sh`

在 `add_firewall_rule()` 的末尾、最终日志输出之前加入：

```sh
if [ "$IPV4_TCP_REDIRECT" = "1" ] && [ -n "$REDIR_PORT_V4" ]; then
    nft "add chain $NFTABLE_NAME PSW2_IPV4_REDIRECT"
    nft "add rule $NFTABLE_NAME PSW2_IPV4_REDIRECT ip daddr @$NFTSET_DIRECT counter return"
    nft "add rule $NFTABLE_NAME PSW2_IPV4_REDIRECT ip daddr @$NFTSET_VPS counter return"
    nft "add rule $NFTABLE_NAME PSW2_IPV4_REDIRECT ip daddr @$NFTSET_LOCAL counter return"
    nft "add rule $NFTABLE_NAME PSW2_IPV4_REDIRECT ip daddr @$NFTSET_WAN counter return"
    nft "add rule $NFTABLE_NAME PSW2_IPV4_REDIRECT ct direction reply counter return"
    nft "add rule $NFTABLE_NAME PSW2_IPV4_REDIRECT tcp dport 53 counter return"
    nft "add rule $NFTABLE_NAME PSW2_IPV4_REDIRECT ip protocol tcp counter redirect to :$REDIR_PORT_V4"

    nft "insert rule $NFTABLE_NAME mangle_prerouting iifname != \"lo\" ip protocol tcp counter return comment \"PSW2_IPV4_REDIRECT_BYPASS\""
    nft "insert rule $NFTABLE_NAME dstnat iifname != \"lo\" ip protocol tcp counter jump PSW2_IPV4_REDIRECT comment \"PSW2_IPV4_REDIRECT\""
fi
```

这里最容易写错的是两条 `iifname != "lo"`。

如果写成所有 IPv4 TCP 都 bypass：

```sh
ip protocol tcp counter return
```

则会同时跳过路由器本机 OUTPUT 包回注入 PREROUTING 的 `iif lo` 路径，导致路由器本机代理失效。

`iifname != "lo"` 的作用是：

```text
LAN/Docker IPv4 TCP -> REDIRECT :1042
路由器 OUTPUT TCP  -> 保持 TPROXY :1041
IPv6 TCP           -> 保持 TPROXY :1041
```

### AdGuard Home DNS 联动

PassWall 开启时，AdGuard Home 需要把实际代理规则中的域名转交给 `127.0.0.1:15353`。

不要使用 luci-app-adguardhome 自带 GFWList 作为唯一数据源，因为 PassWall 还有独立的 Proxy、Direct、GFW 分流规则。

域名应从 PassWall 当前 `shunt_rules` 读取：

```text
myshunt.Direct
myshunt.Proxy
myshunt.GFW
```

其中：

- `geosite:gfw` 用本机 `geoview` 从 `/usr/share/v2ray/geosite.dat` 展开。
- Direct 域名写为 `[/domain/]#`，保持原 AdGuard Home DoH。
- Proxy/GFW 域名写为 `[/domain/]127.0.0.1:15353`。
- 规则插入到 `/ts.net/`、`/lan/` 条目之后，即 `upstream_dns_file:` 之前。

必须使用持久化 DNS 哨兵，而不是 YAML 注释：

```yaml
- '[/passwall2-pure-xray-dns-start/]#'
- '[/example-proxy-domain.com/]127.0.0.1:15353'
- '[/passwall2-pure-xray-dns-end/]#'
```

原因是 AdGuard Home 重写 YAML 时会删除注释，但会保留 DNS 上游条目。

AdGuard Home 更新流程必须是：

```text
停止 AdGuard Home
等待约 5 秒让 AdGuard Home 写回内存配置
删除或插入受管 DNS 区块
启动 AdGuard Home
```

不要依赖：

```sh
/etc/init.d/AdGuardHome force_reload
```

它不会可靠地重新加载 DNS YAML。也不要先改 YAML 再 restart，因为 AdGuard Home 退出时可能用旧内存配置覆盖新文件。

## 升级后检查清单

PassWall 更新后会覆盖以下包内文件：

```text
/usr/share/passwall2/nftables.sh
/usr/share/passwall2/app.sh
/usr/lib/lua/luci/passwall2/util_xray.lua
```

升级后至少检查：

```sh
grep -n FWMARK= /usr/share/passwall2/nftables.sh
```

必须看到：

```sh
FWMARK="0x50005732"
```

检查 shell 语法：

```sh
sh -n /usr/share/passwall2/app.sh
sh -n /usr/share/passwall2/nftables.sh
```

检查 Lua 语法：

```sh
lua -e 'assert(loadfile("/usr/lib/lua/luci/passwall2/util_xray.lua"))'
```

检查 UCI 自定义选项仍在：

```sh
uci -q get passwall2.@global[0].pure_xray_dns
uci -q get passwall2.@global[0].ipv4_tcp_redirect
uci -q get passwall2.myshunt.write_ipset_direct
```

预期：

```text
1
1
0
```

## 验证命令

PassWall 开启后：

```sh
curl -4 -sS -o /dev/null -w '%{http_code}\n' https://www.baidu.com
curl -4 -sS -o /dev/null -w '%{http_code}\n' https://twitter.com
```

容器/LAN 路径与路由器本机路径都应测试。

检查 IPv4 REDIRECT：

```sh
nft list chain inet passwall2 PSW2_IPV4_REDIRECT
nft list chain inet passwall2 mangle_prerouting | grep PSW2_IPV4
nft list chain inet passwall2 dstnat | grep PSW2_IPV4
```

检查 IPv6 TPROXY 未被替换：

```sh
nft list chain inet passwall2 PSW2_MANGLE_V6
```

检查 Xray DNS：

```sh
nslookup twitter.com 192.168.1.1
nslookup -port=15353 twitter.com 127.0.0.1
```

PassWall 关闭后：

```sh
uci -q get passwall2.@global[0].enabled
grep -c '\[/passwall2-pure-xray-dns-start/\]#' /etc/AdGuardHome.yaml
uci -q get dhcp.@dnsmasq[0].port
```

预期：

```text
0
0
1745
```

## 适用范围

当前方案适用于：

```text
PassWall ACL 未启用
passwall2.@global[0].acl_enable='0'
```

如果启用 ACL，需要让 ACL 中显式的 Xray `inboundTag` 同时匹配：

```text
tcp_redir
tcp_redir_v4
udp_redir
```

## 后记：用 AI Agent 排查网络故障

现在的 AI Agent 真的非常强大了，这次故障的排查、抓包、验证和修复由 GPT-5.6 驱动的 OpenCode 完成。

运行结构如下：

```text
iStoreOS 宿主机
  └─ Docker 容器
      └─ OpenCode / AI Agent
```

其中容器工作目录 `/root/data` 映射到宿主机 `/mnt/sata4-5/data`，可以用于共享文件。

容器位于 Docker 网段 `172.17.0.2`。容器 `curl` 用于复现 PREROUTING 转发路径，iStoreOS 宿主机 `curl` 用于验证路由器自身 OUTPUT 路径；真实 LAN 客户端随后确认了与容器转发路径相同的故障表现。

由于容器内的 AI Agent 无法直接操作宿主机 Shell，需要修改或检查 iStoreOS 时，AI Agent 必须通过 SSH 连接宿主机。容器内没有 `sshpass` 和 `expect`，因此使用 Python PTY 工作流：

```text
启动 ssh
读取终端输出
检测到 password: 后才发送密码
继续读取命令输出
```

这避免了通过标准输入提前传递密码时的回显、认证失败或密码被错误消费。

排查流程遵循以下顺序：

- 先用只读命令检查 UCI、nftables、策略路由、Xray 配置、AdGuard Home 查询日志和服务状态。
- 用容器 `curl` 测试转发路径，用 iStoreOS 宿主机 `curl` 测试 OUTPUT 路径。
- 通过 nft 计数器确认流量是否命中 TPROXY、REDIRECT、FWMARK 和 table 999。
- 必要时使用 `tcpdump` 检查 WAN 是否出现实际出站 SYN。
- 只在确认问题路径后修改 PassWall 文件。
- 始终不修改 Tailscale。

让 AI 处理网络最危险的情况是：

```text
AI 启用错误的代理规则
网络中断
AI 无法连接到服务器，排查无法继续，网络无法恢复
```

因此每次启用 PassWall 的高风险测试前，都应先部署独立于 SSH 会话的看门狗。

本次采用的策略是：

```text
延迟 2 秒启用 PassWall
允许 PassWall 运行 100 秒
超时后自动关闭 PassWall
自动重启 PassWall 进入关闭状态
等待 30 秒确认网络、dnsmasq 和 AGH 恢复
最后再读取结果并继续排查
```

看门狗必须运行在 iStoreOS 宿主机上，并通过 `nohup` 或等价机制脱离 SSH 会话。这样即使透明代理导致容器、LAN 或 SSH 全部断网，自动回滚仍会继续执行。

这类保护机制让 AI Agent 可以安全地测试 nftables、TPROXY、REDIRECT、策略路由和 DNS 联动，而不会因为一次失败的网络修改把自己永久锁在路由器之外，也不会因为断网导致 AI 无法连接到服务器，从而使排查无法继续，网络无法恢复。
