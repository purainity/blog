---
date: 2025-05-02 21:48:56
category: 教程
tag: 
  - AI
  - 安卓
---

# 安卓手机使用 MNN 本地部署 Qwen3、MiMo、DeepSeek

今年年初开源模型 DeepSeek R1 的爆火掀起了一股本地部署 AI 的热潮。那个时候手机本地运行主要使用 Termux+Ollama 或者 PocketPal 的方法，配置较为复杂，而且一般 DeepSeek 只能跑 1.5b 的模型，7b 跑起来很吃力，并且智商都很低，体验并不好。

而最近 Qwen3 的发布带来了 4B 模型，基本达到了可以用的智商水平，运行也挺流畅。

同时，阿里也推出了叫 MNN Chat 的 APP，支持一键在本地部署开源大模型，大大降低了手机本地运行 AI 的难度。

---

MNN 官方 Github 仓库的 Release 中并不包含 APK 文件，而是隐藏在一个 md 文件中：https://github.com/alibaba/MNN/blob/master/apps/Android/MnnLlmChat/README_CN.md， 所以知道 MNN 安卓端的人并不多。

首页非常简洁，一个列表显示了可用的模型，点击就可以自动下载，这里推荐这么几个：

- Qwen3-4B-MNN
- MiMo-7B-RL-MNN
- DeepSeek-Prover-V2-7B-MNN
- DeepSeek-R1-7B-Qwen-MNN

![Screenshot_2025-05-02-21-33-45-406_com.alibaba.mnnllm.android.jpg](/assets/pictures/run-llm-locally-on-android/Screenshot_2025-05-02-21-33-45-406_com.alibaba.mnnllm.android.jpg)

提示：手机不建议运行 7B 以上的模型，会很卡，建议运行 4B 的模型，比较流畅。

点击下载好的模型即可进入聊天界面，Qwen3 支持切换思考/非思考模式。我问了一些常见问题，已经能答出来 9.9 和 9.11 哪个大了，但是还是答不出来棍子过门问题。

![Screenshot_2025-05-02-21-41-35-310_com.alibaba.mnnllm.android.jpg](/assets/pictures/run-llm-locally-on-android/Screenshot_2025-05-02-21-41-35-310_com.alibaba.mnnllm.android.jpg)

![Screenshot_2025-05-02-21-41-47-242_com.alibaba.mnnllm.android.jpg](/assets/pictures/run-llm-locally-on-android/Screenshot_2025-05-02-21-41-47-242_com.alibaba.mnnllm.android.jpg)

![Screenshot_2025-05-02-21-41-56-550_com.alibaba.mnnllm.android.jpg](/assets/pictures/run-llm-locally-on-android/Screenshot_2025-05-02-21-41-56-550_com.alibaba.mnnllm.android.jpg)

感觉这次的 Qwen3 小模型非常强，就是冲着侧端运行去的，期待后续有更多的应用。

---

MNN Chat 下载

自建 AList：[https://alist.jibukeshi.dpdns.org/公共分享/安卓软件/MNN Chat_0.4.2.apk](https://alist.jibukeshi.dpdns.org/%E5%85%AC%E5%85%B1%E5%88%86%E4%BA%AB/%E5%AE%89%E5%8D%93%E8%BD%AF%E4%BB%B6/MNN%20Chat_0.4.2.apk)

123 云盘：[https://www.123684.com/s/SDADVv-lLHpH](https://www.123684.com/s/SDADVv-lLHpH)

蓝奏云：[https://weibox.lanzouo.com/tp/irJEO2v5di5a](https://weibox.lanzouo.com/tp/irJEO2v5di5a) 密码：1234