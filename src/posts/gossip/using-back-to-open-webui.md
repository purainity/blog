---
date: 2025-03-29 08:25:01
category: 杂谈
tag: 
  - AI
---

# 关于我又用回 Open WebUI 这件事

白嫖了一点别人分享的各种 LLM 平台的 API，想自己搭建一个网页 UI 聚合这些 API 进行聊天，于是看到了 [Open WebUI](https://openwebui.com/)。用了一段时间觉得它的占用太大了，于是寻找其它类似产品。

找了一圈，看到了 [Lobe Chat](https://lobehub.com/zh)、[Dify](https://dify.ai/zh)、[Hugging Face Chat UI](https://huggingface.co/docs/chat-ui/index) 等，本来以为它们占用能小一点，结果发现和 Open WebUI 比半斤八两。

Lobe Chat 要自己一个一个选模型，对我这种 API 和模型比较多的很不友好，而且语言模型设置页面非常卡。

Hugging Face 的 ChatUI 要 MongoDB，而我只装了 MySQL，另外它不支持中文。

Dify 的 docker-compose 要 7 个容器，我装都不想装了，根本吃不消😂

于是最后，我又用回了 Open WebUI（