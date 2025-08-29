---
date: 2025-03-17 21:18:28
category: 分享
tag: 
  - 微信
  - 模块
  - 安卓
---

# 微X模块配置文件_wx2.43和2.44_7系微信实测可用

备份文件来自我的平板的一次备份，由于平板上一直是 2.43 版本我忘记更新 2.44 版本所以没有 2.44 的配置文件，手机上的 2.44 版本配置文件夹文件数只有 23，实测不起作用

平板上的微信版本是 7.0.22（1820）国内版，实测在手机上的 7.0.21（1783）play 版也能用

首先安装对应版本的微 X 模块，只有 2.22 和 2.43 能用，2.44 是用不了的

然后安装 wx repair tool 并激活

使用 root 权限，把 wx6_版本号 文件夹复制到 /data/data/com.tencent.mm/files/ 目录下，注意所有者和用户组设置成微信，勾选同时应用到所有子文件和子文件夹，权限改成 drwx------(700)

然后进入 wx6_版本号 这个文件夹，全选里面的 25 个文件，把权限全部改成 rw-------(600)

强制停止微信进程再打开，wx repair tool 会自动复制文件并激活 VIP，重启微信应该就能用了

---

蓝奏云：[https://weibox.lanzouo.com/i4VT72yniw8d](https://weibox.lanzouo.com/i4VT72yniw8d)

123 云盘：[https://www.123684.com/s/SDADVv-TwApH](https://www.123684.com/s/SDADVv-TwApH)

自建 AList 下载含微信旧版本：[https://alist.jibukeshi.dpdns.org/公共分享/安卓软件/微信/微X模块配置文件_wx2.43和2.44_7系微信实测可用.zip](https://alist.jibukeshi.dpdns.org/%E5%85%AC%E5%85%B1%E5%88%86%E4%BA%AB/%E5%AE%89%E5%8D%93%E8%BD%AF%E4%BB%B6/%E5%BE%AE%E4%BF%A1/%E5%BE%AEX%E6%A8%A1%E5%9D%97%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6_wx2.43%E5%92%8C2.44_7%E7%B3%BB%E5%BE%AE%E4%BF%A1%E5%AE%9E%E6%B5%8B%E5%8F%AF%E7%94%A8.zip)