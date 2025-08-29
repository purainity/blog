---
date: 2025-02-05 19:15:29
category: 作品
tag: 
  - 微箱
---

# 自制软件微箱 APP 1.4.5 新特性和下载链接

我的自制软件微箱 APP 发布 1.4.5 新版本了。

更新日志：

- 新增智谱 ChatGLM、DeepSeek、GPT4-mini
- 修复 IPTV 电视直播
- 优化每日 60 秒备用接口、通义千问
- 部分细节优化

其实这个版本在 2 月 3 日就做完了，但是当天群里有人提出增加一个切换启动页的设置，于是今天把它写完并推送了一个热更新。

---

下面是新功能的截图演示：

#### IPTV 电视直播

这次支持从 Github 自动更新直播源，每个频道有 IPv6 和 IPv4 几十条线路，如果获取失败可以调用本地直播源。

![Screenshot_2025-02-05-18-35-14-239_com.weibox.weixiang.jpg](/assets/pictures/weixiang-1.4.5/Screenshot_2025-02-05-18-35-14-239_com.weibox.weixiang.jpg)

#### 智谱 ChatGLM

模型是 glm-4-flash，主要训练语料截止到 2024 年，但是支持联网搜索，所以能获取比较新的消息。

![Screenshot_2025-02-05-18-35-43-993_com.weibox.weixiang.jpg](/assets/pictures/weixiang-1.4.5/Screenshot_2025-02-05-18-35-43-993_com.weibox.weixiang.jpg)

#### DeepSeek

模型是 DeepSeek-V3，并不是 R1，知识库更新日期 2023 年 12 月，有概率会回答出更新的内容。最近这个 DeepSeek 比较火，后期如果我找到了更好的 api 也会更新更强大的 R1 或者蒸馏到 Qwen 的版本。

![Screenshot_2025-02-05-18-38-27-248_com.weibox.weixiang.jpg](/assets/pictures/weixiang-1.4.5/Screenshot_2025-02-05-18-38-27-248_com.weibox.weixiang.jpg)

#### GPT4-mini

模型是 gpt-4o-mini-2024-07-18，比 ChatGPT-3.5 会更好一点，知道鲁迅和周树人是同一个人，但是不联网。如果直接问它，它回答不出来 9.9 和 9.11 哪个更大，但是如果让它尝试把位数补齐，然后一位一位比较，它就能给出正确答案。

![Screenshot_2025-02-05-18-41-49-103_com.weibox.weixiang.jpg](/assets/pictures/weixiang-1.4.5/Screenshot_2025-02-05-18-41-49-103_com.weibox.weixiang.jpg)

#### 启动页切换

这个版本更新本来应该是没有这个功能的，在群里发了安装包之后有群友提出最好能把收藏页设置为默认启动页。

其实这个功能在我之前的一个废弃的项目里做过，但是没有合并到微箱。那个项目因为我时间不够来不及维护所以废弃了。

于是今天我把这个功能合并过来，推送了一个热更新。在 1.4.5 版本打开之后应该就会自动推送到，可以打开设置看一下有没有“启动页切换”这个设置项。

![Screenshot_2025-02-05-18-43-06-813_net.androluagopro.toolbox.jpg](/assets/pictures/weixiang-1.4.5/Screenshot_2025-02-05-18-43-06-813_net.androluagopro.toolbox.jpg)

---

其实当前版本的微箱 APP 主体部分是 2022 和 2023 年写的，当初写代码写的很烂，再加上使用了大量第三方 api 动不动就失效跑路，现在更新只能小修小补，没办法修复所有功能，优先修复一些常用的、热门的功能，至今仍然有很多功能没有修复。

另外，新的版本已经在尝试重构了，工程量比较大，所以最近应该看不到成果。

推荐一下我的云湖机器人【轻智小助手云湖版】，一些 APP 中的常用功能都有，并且更新更频繁。

https://yhfx.jwznb.com/share?key=X7ihZbOM9YcK&ts=1712137543

机器人ID: 43272366

---

下载链接：[https://pan.tenire.com/down.php/84f23ca23c4fea26de5234904b050218.apk](https://pan.tenire.com/down.php/84f23ca23c4fea26de5234904b050218.apk)

自建AList：[https://alist.jibukeshi.dpdns.org/公共分享/安卓软件/微箱](https://alist.jibukeshi.dpdns.org/%E5%85%AC%E5%85%B1%E5%88%86%E4%BA%AB/%E5%AE%89%E5%8D%93%E8%BD%AF%E4%BB%B6/%E5%BE%AE%E7%AE%B1)

123云盘：[https://www.123pan.com/s/SDADVv-UTqxH.html](https://www.123pan.com/s/SDADVv-UTqxH.html)

蓝奏云：[https://weibox.lanzouv.com/b01pro3kb](https://weibox.lanzouv.com/b01pro3kb) 密码：1234