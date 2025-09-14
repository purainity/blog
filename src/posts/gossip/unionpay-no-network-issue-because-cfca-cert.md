---
date: 2025-09-14 11:28:05
category: 杂谈
---

# 云闪付 APP 打不开竟然是因为 CFCA 证书的问题

很长一段时间没打开云闪付 APP 了，最近打开它发现啥页面都加载不了，提示没有网络连接。

![Screenshot_2025-09-14-11-13-46-442_com.unionpay.jpg](/assets/pictures/unionpay-no-network-issue-because-cfca-cert/Screenshot_2025-09-14-11-13-46-442_com.unionpay.jpg)

想着之前全部正常的、root 也隐藏了，又把可能影响网络的 AdGuard、代理全部关掉，又切换成移动数据，都不行。

考虑到很久没用了可能是新的 API 不兼容旧版的软件导致获取不到数据，就更新了最新版 APP，结果还是一样。这就奇怪了，所有因素都试过了就是不行。
考虑到它显示网络问题，就打开 Reqable 抓包看看。

![Screenshot_2025-09-14-11-14-04-484_com.reqable.android.jpg](/assets/pictures/unionpay-no-network-issue-because-cfca-cert/Screenshot_2025-09-14-11-14-04-484_com.reqable.android.jpg)

Reqable 所有请求都显示连接已断开，SSL 证书错误。由于云闪付有检测，无法通过 JustTrustMe 等 Xposed 模块注入去除它的证书检验（一旦将模块作用域勾选它就闪退），只好另想办法。

直到我发现 Reqable 自己请求这个域名也提示 SSL 证书错误，我才注意到异常，难道它用了自签名证书？

![Screenshot_2025-09-14-11-14-16-708_com.reqable.android.jpg](/assets/pictures/unionpay-no-network-issue-because-cfca-cert/Screenshot_2025-09-14-11-14-16-708_com.reqable.android.jpg)

于是我用浏览器打开这个网址：证书不受信任

![Screenshot_2025-09-14-11-14-32-632_mark.via.jpg](/assets/pictures/unionpay-no-network-issue-because-cfca-cert/Screenshot_2025-09-14-11-14-32-632_mark.via.jpg)

![Screenshot_2025-09-14-11-14-37-282_mark.via.jpg](/assets/pictures/unionpay-no-network-issue-because-cfca-cert/Screenshot_2025-09-14-11-14-37-282_mark.via.jpg)

结果发现它居然用了 China Financial Certification Authority 签发的证书。这个证书本身就是在安卓系统证书库里面的，但是被我手动禁用了（之前我怕再出现签发假证书事件，就把国内的 CA 都禁用了）。
再启用 CFCA EV ROOT 证书，云闪付就正常了。

又去 crt.sh 看了下，这个 `cup.com.cn` 域名也有 DigiCert 的证书，但不知道为什么云闪付服务器只用了 CFCA 的，而且以前能用就说明它以前用的不是 CFCA。

![Screenshot_2025-09-14-11-16-38-291_mark.via.jpg](/assets/pictures/unionpay-no-network-issue-because-cfca-cert/Screenshot_2025-09-14-11-16-38-291_mark.via.jpg)
