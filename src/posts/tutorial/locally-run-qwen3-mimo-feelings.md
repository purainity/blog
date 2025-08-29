---
date: 2025-05-03 21:09:27
category: 教程
tag: 
  - AI
  - 安卓
---

# 手机本地运行 Qwen3-4B-MNN 和MiMo-7B-RL 的实际体验

先说下我测试的机型为 Redmi K50 Ultra，处理器为骁龙 8+ Gen1，12+512G

Qwen3-4B-MNN 出乎意料的强，只用了 4B 的参数感觉就达到了至少 8B 的效果，输出速度也很快，能达到 20 多 token 每秒。

录屏实测，感受输出速度：[https://alist.jibukeshi.dpdns.org/公共分享/视频/手机本地运行Qwen3-4B-MNN.mp4](https://alist.jibukeshi.dpdns.org/%E5%85%AC%E5%85%B1%E5%88%86%E4%BA%AB/%E8%A7%86%E9%A2%91/%E6%89%8B%E6%9C%BA%E6%9C%AC%E5%9C%B0%E8%BF%90%E8%A1%8CQwen3-4B-MNN.mp4)

![IMG_20250503_214540.png](/assets/pictures/locally-run-qwen3-mimo-feelings/IMG_20250503_214540.png)

![IMG_20250503_214555.png](/assets/pictures/locally-run-qwen3-mimo-feelings/IMG_20250503_214555.png)

能回答出 9.9和9.11两个数字哪个大，但是无法回答出5.5米长的棍子能通过3×4米的门吗

![IMG_20250503_214611.png](/assets/pictures/locally-run-qwen3-mimo-feelings/IMG_20250503_214611.png)

![IMG_20250503_214620.png](/assets/pictures/locally-run-qwen3-mimo-feelings/IMG_20250503_214620.png)

MiMo-7B-RL-MNN 显得就不怎么好了，在 MNN 里面默认是思考模式而且不能关闭，并且思考过程特别长，连问你是谁都要思考半天才能输出结果。我这手机跑 7B 确实有点勉强，输出速度只有大约 5 token 每秒。

录屏实测，感受输出速度：[https://alist.jibukeshi.dpdns.org/公共分享/视频/手机本地运行MiMo-7B-RL-MNN.mp4](https://alist.jibukeshi.dpdns.org/%E5%85%AC%E5%85%B1%E5%88%86%E4%BA%AB/%E8%A7%86%E9%A2%91/%E6%89%8B%E6%9C%BA%E6%9C%AC%E5%9C%B0%E8%BF%90%E8%A1%8CMiMo-7B-RL-MNN.mp4)

![IMG_20250503_214641.png](/assets/pictures/locally-run-qwen3-mimo-feelings/IMG_20250503_214641.png)

![IMG_20250503_214651.png](/assets/pictures/locally-run-qwen3-mimo-feelings/IMG_20250503_214651.png)

它这个模型比较奇怪，认为树上有一千只鸟，打死一只，还剩 999 只。知道 9.9 大于 9.11。当我问它5.5米长的棍子能通过3×4米的门时，它足足思考了十分钟，最后超过 2048 的最大 token 导致没有输出最终答案，但是我居然发现它的思维过程中居然考虑到了旋转门和棍子倾斜时的投影，说不定有回答出这个问题的可能。

![IMG_20250503_214704.png](/assets/pictures/locally-run-qwen3-mimo-feelings/IMG_20250503_214704.png)

![IMG_20250503_214721.png](/assets/pictures/locally-run-qwen3-mimo-feelings/IMG_20250503_214721.png)

![IMG_20250503_214725.png](/assets/pictures/locally-run-qwen3-mimo-feelings/IMG_20250503_214725.png)

最后，如果要手机本地运行大语言模型，首选 4B 及以下，7B 及以上会很卡，导致基本没有什么实用价值。另外上下文长度不建议太长，非必要建议经常新建对话清除上下文，不然也会导致 AI 的回复速度直线下降。