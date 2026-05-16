---
date: 2026-05-16 14:11:07
category: 作品
tag: 
  - AI
  - 工具
---

# 做了个多 AI 平台的 API Key 批量检测脚本

GitHub 项目链接如下

https://github.com/purainity/api-key-checker

使用方法在 README 里已经写得很详细了，这篇文章主要谈谈我制作这个项目的动机以及一些细节。

这个项目的代码都是 AI 写的，为了让 AI 写出令我满意的代码，我发现写详细而具体的提示词、不断与它交互提要求修改也是非常耗费精力的一件事。

## 背景与动机

### OpenRouter / SiliconFlow / DeepSeek 检测

早在去年，硅基流动新用户注册有赠金，论坛里很多人注册账号分享 API Key。那时我就有批量检测 API Key 可用性的需求了。起初我还是手动测试，把每个 API Key 复制到软件里实际请求一遍看能不能用。

后来随着 API Key 数量的增加，一个一个手动测试效率就很低了，就让 AI 写了个 Bash 脚本配合 `curl` 和 `jq` 来检测。

后来有不少人分享 OpenRouter 的免费 API Key，我也在 GitHub 上爬到了不少，就稍改脚本换成 OpenRouter 的端点来测试。DeepSeek 测试脚本亦是如此。

### Gemini API 检测

不同于现在 Gemini Free Tier 的免费额度被砍得几乎没法用，去年 Gemini 额度还很慷慨的时候，论坛里流行“打野”——扫描 GitHub 上他人无意公开的 `AIzaSy` 开头的 Google Cloud API Key 组成号池来调用 Gemini。

虽然当时我没参与“打野”，但谷歌大砍额度后，我手里现有的 API Key 不够用了，于是开始寻找新的。先在论坛里找到了一百多条，又让 AI 写了个检测脚本：先获取模型列表粗测，后来发现有些 Key 虽能获取列表却无法实际调用生成内容，于是又增加了通过实际生成进行深度检测的脚本。

那时也没有 OpenCode 这类 AI 编程工具，我就通过对话让 AI 生成脚本。脚本也很简单，没有去重，没有重试，就是一个一个测下来再汇总。

### 转机

转机出现在最近我翻有关“打野”的陈年旧帖时，看到有人发了一个包含十万多个 Gemini API Key 的文件。如果用我之前的脚本去测，跑几天也跑不完，还有很多 Key 会因网络波动而测试失败。加上 AI 编程工具的成熟，我决定用 Python 重写所有脚本，以便增加更多功能并避免对 `curl`、`jq` 等外部工具的依赖。

## OpenRouter / SiliconFlow / DeepSeek 批量检测

先从复杂度比较低的 OpenRouter / SiliconFlow / DeepSeek API Key 批量检测脚本开始。我把所有的 API Key 分成四类，即余额大于0、余额为0、不可用、检测失败。

为了方便处理大量 API Key 在文件里的情况以及只有一两个 API Key 手动测试的场景，脚本同时支持从文件读取 API Key 列表，也支持直接传入单个或多个 API Key。为了适配不同的分割方式，可用空格、换行、`,`、`;`、`/`、`|`、`&` 分隔多个 API Key。

之前如果在不同地方看到同一个 API Key 而粘贴了两次，脚本也会傻傻地测两遍。现在增加了自动去重功能，测试前先剔除重复项，避免重复测试。

考虑到测试用时可能较长，在测试过程中可能会出现网络波动连接失败的情况，我还增加了网络错误自动重试，同时复用 TCP session 加速检测。

默认情况下这三个脚本仅在终端输出测试结果，也支持通过 `--report` 参数输出报告到文件，以及用 `--sep` 参数指定报告文件中 API Key 的分隔符（换行、逗号、分号、斜杠等），方便满足不同软件对多 API Key 格式的要求。该参数仅对报告文件生效，终端输出始终使用英文逗号，避免混乱。

## Gemini API 检测

### Gemini API Key 基础检测

接下来就是复杂度比较高的 Gemini 测试脚本。由于 Gemini API Key 有十万多个，即使复用了 TCP session 加速检测，测下来也得花上好几天，所以我在获取模型列表的粗测脚本中加入了多线程并发检测。

光有多线程还不够，每次全量重测仍然耗时。于是我在本地建立了缓存文件，每个 API Key 的状态会缓存下来。下次测试时优先读取缓存：若上次无效则直接跳过（无效 Key 不可能自动变有效），节省大量时间；若上次有效，为防止被谷歌停用，默认会重测。此外还增加了 `--force` 参数用于忽略缓存全部重测，以及 `--cache` 参数（乐观模式），只要命中缓存无论状态如何都直接跳过。脚本还支持空输入，自动重测缓存中有效的 API Key。

实际测试中发现，多线程同时写入缓存时如果 `Ctrl+C` 手动中断，会导致缓存文件损坏。于是增加了原子写入，支持 `Ctrl+C` 安全中断并保存缓存。

被谷歌送中的 IP 无法调用 Gemini API。为了防止测完才发现所有 Key 都因返回 `400 - User location is not supported for the API use.` 而不可用，脚本在检测到 IP 不支持时会自动中止。

测试中还遇到谷歌 API 服务不稳定返回 `503 - Service Temporarily Unavailable` 的情况，因此脚本在遇到 API 返回 5xx 时会同网络错误一样自动重试。

十万多个 API Key 粗测下来：一万多个被 `reported as leaked`，一万多个被 `suspended`，近五万个未启用 Gemini API 不能跨服务调用，三千多个过期，一万多个无效（可能已被删除或本就是假的）。还有几千个有各种限制。粗测有效的剩一万五千个左右。

### Gemini API Key 深度检测

接下来是实际调用 `generateContent` 方法生成内容进行深度检测。考虑到这个脚本会让 AI 生成回复，多线程可能被谷歌视为可疑行为而拉黑，因此去掉了多线程改为单线程。默认使用 `gemini-2.5-flash-lite` 模型，也可换成限额更多的 Gemma 系列模型或 `gemini-robotics-er-1.5-preview`。

为与粗测缓存配合，深度测试脚本在无输入时从缓存读取“有效密钥”作为默认输入。

在实际调用时还发现了 429 有两种，第一种是类似于这样的，这种是当日的额度用完了，这个 API Key 还是正常的。

::: details
```json
{
  "error": {
    "code": 429,
    "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-2.5-flash-lite\nPlease retry in 41.065029449s.",
    "status": "RESOURCE_EXHAUSTED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.Help",
        "links": [
          {
            "description": "Learn more about Gemini API quotas",
            "url": "https://ai.google.dev/gemini-api/docs/rate-limits"
          }
        ]
      },
      {
        "@type": "type.googleapis.com/google.rpc.QuotaFailure",
        "violations": [
          {
            "quotaMetric": "generativelanguage.googleapis.com/generate_content_free_tier_requests",
            "quotaId": "GenerateRequestsPerDayPerProjectPerModel-FreeTier",
            "quotaDimensions": {
              "location": "global",
              "model": "gemini-2.5-flash-lite"
            },
            "quotaValue": "20"
          }
        ]
      },
      {
        "@type": "type.googleapis.com/google.rpc.RetryInfo",
        "retryDelay": "41s"
      }
    ]
  }
}
```
:::

另外还有一种是这样的，注意它是整个 Generate Content API 的 `quota_limit_value` 为 0，这就不正常了，代表它被人设置了不能调用 Generate Content API，是不能用的。

::: details
```json
{
  "error": {
    "code": 429,
    "message": "Quota exceeded for quota metric 'Generate Content API requests per minute' and limit 'GenerateContent request limit per minute for a region' of service 'generativelanguage.googleapis.com' for consumer '[项目ID隐藏]'.",
    "status": "RESOURCE_EXHAUSTED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "RATE_LIMIT_EXCEEDED",
        "domain": "googleapis.com",
        "metadata": {
          "quota_metric": "generativelanguage.googleapis.com/generate_content_requests",
          "service": "generativelanguage.googleapis.com",
          "quota_limit_value": "0",
          "quota_limit": "GenerateContentRequestsPerMinutePerProjectPerRegion",
          "quota_location": "us-south1",
          "quota_unit": "1/min/{project}/{region}",
          "consumer": "[项目ID隐藏]"
        }
      },
      {
        "@type": "type.googleapis.com/google.rpc.Help",
        "links": [
          {
            "description": "Request a higher quota limit.",
            "url": "https://cloud.google.com/docs/quotas/help/request_increase"
          }
        ]
      }
    ]
  }
}
```
:::

因此脚本增加了对 429 的区分逻辑：识别是零限额还是已达当日限额。

深度测试跑完，一万五千多个 API Key 中只有三十个左右能用，其余全部是 Generate Content API 的 `quota_limit_value` 为 0。说 Gemini API Key 是万不存一也不为过了。

### Gemini 模型方法可用性检测

哪些 Gemini API Key 能用的问题解决了，但还有另一个问题：2025 年 12 月谷歌大砍额度后，免费账户已无法使用 `gemini-2.5-pro` 模型，甚至老一代的 `gemini-2.0-flash` 也用不了，返回的 429 中 `limit` 为 0。

::: details
```json
{
  "error": {
    "code": 429,
    "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.5-pro\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.5-pro\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.5-pro\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.5-pro\nPlease retry in 29.083414095s.",
    "status": "RESOURCE_EXHAUSTED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.Help",
        "links": [
          {
            "description": "Learn more about Gemini API quotas",
            "url": "https://ai.google.dev/gemini-api/docs/rate-limits"
          }
        ]
      },
      {
        "@type": "type.googleapis.com/google.rpc.QuotaFailure",
        "violations": [
          {
            "quotaMetric": "generativelanguage.googleapis.com/generate_content_free_tier_input_token_count",
            "quotaId": "GenerateContentInputTokensPerModelPerDay-FreeTier",
            "quotaDimensions": {
              "location": "global",
              "model": "gemini-2.5-pro"
            }
          },
          {
            "quotaMetric": "generativelanguage.googleapis.com/generate_content_free_tier_input_token_count",
            "quotaId": "GenerateContentInputTokensPerModelPerMinute-FreeTier",
            "quotaDimensions": {
              "location": "global",
              "model": "gemini-2.5-pro"
            }
          },
          {
            "quotaMetric": "generativelanguage.googleapis.com/generate_content_free_tier_requests",
            "quotaId": "GenerateRequestsPerMinutePerProjectPerModel-FreeTier",
            "quotaDimensions": {
              "location": "global",
              "model": "gemini-2.5-pro"
            }
          },
          {
            "quotaMetric": "generativelanguage.googleapis.com/generate_content_free_tier_requests",
            "quotaId": "GenerateRequestsPerDayPerProjectPerModel-FreeTier",
            "quotaDimensions": {
              "location": "global",
              "model": "gemini-2.5-pro"
            }
          }
        ]
      },
      {
        "@type": "type.googleapis.com/google.rpc.RetryInfo",
        "retryDelay": "29s"
      }
    ]
  }
}
```
:::

拿到模型列表后发现一堆模型不可用，于是又写了模型方法可用性检测脚本，遍历所有可用模型，逐一测试每个模型声明的所有方法。

这个脚本不涉及多 API Key，但不同模型支持的方法各异，让 AI 自行搜索谷歌文档构建最小化测试请求体并不容易，经常遇到参数无效的问题。最终反复修改总算找到了可行的请求体，需要注意的点如下：

1. TTS 模型的 `generateContent` 请求体和其他模型不一样，必须带 `generationConfig.responseModalities=["AUDIO"]` 和 `speechConfig`
2. `deep-research-*` 系列虽然在 `supportedGenerationMethods` 中声明了 `generateContent`，但实测会返回 `400 - This model only supports Interactions API.`，跳过测试
3. `bidiGenerateContent` 是 Live/双向流式交互能力，不能按普通 `models/{model}:{method}` 的单次调用方式测试，跳过测试
4. `createCachedContent` 是独立端点且对最小 token 数有要求，跳过测试

脚本最终会汇总完全可用模型（具有 `generateContent` 方法的对话模型和具有 `embedContent` 方法的嵌入模型并且可调用或到限额的模型），方便导入软件的模型列表。

Gemini 的三个测试脚本中，只有模型方法可用性检测的报告文件输出逻辑与前面脚本相同：默认终端输出，也支持 `--report` 参数输出到文件。而基础检测和深度检测脚本仅在非直接输入模式（从文件读取 API Key）下自动生成报告文件，毕竟几万个 Key 仅靠终端输出不现实。直接输入一两个 Key 时则无此必要。

### 谷歌错误返回一览

另外，谷歌的错误返回种类繁多且复杂，这里挑几个粗测中遇到的给大家看看：

1. API Key 不存在
::: details
```json
{
  "error": {
    "code": 400,
    "message": "API Key not found. Please pass a valid API key.",
    "status": "INVALID_ARGUMENT",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "API_KEY_INVALID",
        "domain": "googleapis.com",
        "metadata": {
          "service": "generativelanguage.googleapis.com"
        }
      },
      {
        "@type": "type.googleapis.com/google.rpc.LocalizedMessage",
        "locale": "en-US",
        "message": "API Key not found. Please pass a valid API key."
      }
    ]
  }
}
```
:::

2. API Key 过期
::: details
```json
{
  "error": {
    "code": 400,
    "message": "API key expired. Please renew the API key.",
    "status": "INVALID_ARGUMENT",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "API_KEY_INVALID",
        "domain": "googleapis.com",
        "metadata": {
          "service": "generativelanguage.googleapis.com"
        }
      },
      {
        "@type": "type.googleapis.com/google.rpc.LocalizedMessage",
        "locale": "en-US",
        "message": "API key expired. Please renew the API key."
      }
    ]
  }
}
```
:::

3. API Key 无效
::: details
```json
{
  "error": {
    "code": 400,
    "message": "API key not valid. Please pass a valid API key.",
    "status": "INVALID_ARGUMENT",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "API_KEY_INVALID",
        "domain": "googleapis.com",
        "metadata": {
          "service": "generativelanguage.googleapis.com"
        }
      },
      {
        "@type": "type.googleapis.com/google.rpc.LocalizedMessage",
        "locale": "en-US",
        "message": "API key not valid. Please pass a valid API key."
      }
    ]
  }
}
```
:::

4. 账单国家/地区限制
::: details
```json
{
  "error": {
    "code": 403,
    "message": "Access to generativelanguage.googleapis.com is restricted from your billing country and was denied for [项目ID隐藏].",
    "status": "PERMISSION_DENIED"
  }
}
```
:::

5. Gemini API 未启用
::: details
```json
{
  "error": {
    "code": 403,
    "message": "Gemini API has not been used in [项目ID隐藏] before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=[项目ID隐藏] then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.",
    "status": "PERMISSION_DENIED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "SERVICE_DISABLED",
        "domain": "googleapis.com",
        "metadata": {
          "service": "generativelanguage.googleapis.com",
          "activationUrl": "https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=[项目ID隐藏]"
          "consumer": "[项目ID隐藏]",
          "serviceTitle": "Gemini API",
          "containerInfo": "587517297089"
        }
      },
      {
        "@type": "type.googleapis.com/google.rpc.LocalizedMessage",
        "locale": "en-US",
        "message": "Gemini API has not been used in [项目ID隐藏] before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=[项目ID隐藏] then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry."
      },
      {
        "@type": "type.googleapis.com/google.rpc.Help",
        "links": [
          {
            "description": "Google developers console API activation",
            "url": "https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=[项目ID隐藏]"
          }
        ]
      }
    ]
  }
}
```
:::

6. API Key 已封禁
::: details
```json
{
  "error": {
    "code": 403,
    "message": "Permission denied: Consumer '[密钥隐藏]' has been suspended.",
    "status": "PERMISSION_DENIED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "CONSUMER_SUSPENDED",
        "domain": "googleapis.com",
        "metadata": {
          "service": "generativelanguage.googleapis.com",
          "containerInfo": "[密钥隐藏]
          "consumer": "[项目ID隐藏]"
        }
      },
      {
        "@type": "type.googleapis.com/google.rpc.LocalizedMessage",
        "locale": "en-US",
        "message": "Permission denied: Consumer '[密钥隐藏]' has been suspended."
      }
    ]
  }
}
```
:::

7. HTTP 来源限制
::: details
```json
{
  "error": {
    "code": 403,
    "message": "Requests from referer <empty> are blocked.",
    "status": "PERMISSION_DENIED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "API_KEY_HTTP_REFERRER_BLOCKED",
        "domain": "googleapis.com",
        "metadata": {
          "service": "generativelanguage.googleapis.com",
          "consumer": "[项目ID隐藏]",
          "httpReferrer": "<empty>"
        }
      },
      {
        "@type": "type.googleapis.com/google.rpc.LocalizedMessage",
        "locale": "en-US",
        "message": "Requests from referer <empty> are blocked."
      }
    ]
  }
}
```
:::

8. Android 应用限制
::: details
```json
{
  "error": {
    "code": 403,
    "message": "Requests from this Android client application <empty> are blocked.",
    "status": "PERMISSION_DENIED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "API_KEY_ANDROID_APP_BLOCKED",
        "domain": "googleapis.com",
        "metadata": {
          "service": "generativelanguage.googleapis.com",
          "androidPackage": "<empty>",
          "consumer": "[项目ID隐藏]"
        }
      },
      {
        "@type": "type.googleapis.com/google.rpc.LocalizedMessage",
        "locale": "en-US",
        "message": "Requests from this Android client application <empty> are blocked."
      }
    ]
  }
}
```
:::

9. iOS 应用限制
::: details
```json
{
  "error": {
    "code": 403,
    "message": "Requests from this iOS client application <empty> are blocked.",
    "status": "PERMISSION_DENIED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "API_KEY_IOS_APP_BLOCKED",
        "domain": "googleapis.com",
        "metadata": {
          "service": "generativelanguage.googleapis.com",
          "consumer": "[项目ID隐藏]",
          "iosBundleId": "<empty>"
        }
      },
      {
        "@type": "type.googleapis.com/google.rpc.LocalizedMessage",
        "locale": "en-US",
        "message": "Requests from this iOS client application <empty> are blocked."
      }
    ]
  }
}
```
:::

10. API 方法限制
::: details
```json
{
  "error": {
    "code": 403,
    "message": "Requests to this API generativelanguage.googleapis.com method google.ai.generativelanguage.v1beta.ModelService.ListModels are blocked.",
    "status": "PERMISSION_DENIED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "API_KEY_SERVICE_BLOCKED",
        "domain": "googleapis.com",
        "metadata": {
          "service": "generativelanguage.googleapis.com",
          "consumer": "[项目ID隐藏]",
          "apiName": "generativelanguage.googleapis.com",
          "methodName": "google.ai.generativelanguage.v1beta.ModelService.ListModels"
        }
      },
      {
        "@type": "type.googleapis.com/google.rpc.LocalizedMessage",
        "locale": "en-US",
        "message": "Requests to this API generativelanguage.googleapis.com method google.ai.generativelanguage.v1beta.ModelService.ListModels are blocked."
      }
    ]
  }
}
```
:::

11. IP 地址限制
::: details
```json
{
  "error": {
    "code": 403,
    "message": "The provided API key has an IP address restriction. The originating IP address of the call ([IP隐藏]) violates this restriction.",
    "status": "PERMISSION_DENIED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "API_KEY_IP_ADDRESS_BLOCKED",
        "domain": "googleapis.com",
        "metadata": {
          "callerIp": "[IP隐藏]",
          "service": "generativelanguage.googleapis.com",
          "consumer": "[项目ID隐藏]"
        }
      },
      {
        "@type": "type.googleapis.com/google.rpc.LocalizedMessage",
        "locale": "en-US",
        "message": "The provided API key has an IP address restriction. The originating IP address of the call ([IP隐藏]) violates this restriction."
      }
    ]
  }
}
```
:::

12. API Key 已泄露
::: details
```json
{
  "error": {
    "code": 403,
    "message": "Your API key was reported as leaked. Please use another API key.",
    "status": "PERMISSION_DENIED"
  }
}
```
:::

13. 请求频率超限
::: details
```json
{
  "error": {
    "code": 429,
    "message": "Quota exceeded for quota metric 'API requests' and limit 'Request limit per minute for a region' of service 'generativelanguage.googleapis.com' for consumer '[项目ID隐藏]'.",
    "status": "RESOURCE_EXHAUSTED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "RATE_LIMIT_EXCEEDED",
        "domain": "googleapis.com",
        "metadata": {
          "quota_limit_value": "0",
          "quota_unit": "1/min/{project}/{region}",
          "quota_location": "us-south1",
          "service": "generativelanguage.googleapis.com",
          "quota_metric": "generativelanguage.googleapis.com/api_requests",
          "quota_limit": "ApiRequestsPerMinutePerProjectPerRegion",
          "consumer": "[项目ID隐藏]"
        }
      },
      {
        "@type": "type.googleapis.com/google.rpc.Help",
        "links": [
          {
            "description": "Request a higher quota limit.",
            "url": "https://cloud.google.com/docs/quotas/help/request_increase"
          }
        ]
      }
    ]
  }
}
```
:::

再加上上面提到的 IP 不支持以及各种零限额与到限额情况，凑出二十多种报错不成问题。

### 谷歌的草台班子时刻

还值得一提的是谷歌也真是个草台班子，比如：

1. 嵌入系列模型虽然在 `supportedGenerationMethods` 中声明了 `countTextTokens` 方法，但实测会返回 `404 - Requested entity was not found.`。虽然我知道 `countTextTokens` 是旧方法，新方法是 `countTokens`，但是你显示支持旧方法，实际却不给用，这是什么意思？
2. `gemini-robotics-er-1.5-preview` 模型出现在了模型列表中，但实测会返回 `404 - This model models/gemini-robotics-er-1.5-preview is no longer available. Please update your code to use a newer model for the latest features and improvements.`，不知道谷歌为什么会这样子。之前 `gemini-3-pro-preview` 突然关停是直接获取不到这个模型，调用直接重定向到 `gemini-3.1-pro-preview`。Gemma 3 系列也是偷偷下掉，调用直接返回 `404- models/gemma-3-12b-it is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.`，这个模型就一直还在但是就是不让你用
3. `batchGenerateContent` 方法和嵌入模型的 `asyncBatchEmbedContent` 方法实测返回 `400 - Precondition check failed.`。我一直以为是请求体的问题，查了才知道原因是 API Key/项目处于 Free Tier，所在地区或功能要求必须启用 Billing。免费账户不能用却返回 400，而非更明确的错误提示。
4. 模型列表中有个叫 `aqa` 的模型，但谷歌 Gemini 文档中完全没有提及。查了一圈才知道它是较早推出的专用任务模型，用于 RAG，使用专用的 `generateAnswer` 方法，详见 https://github.com/google/generative-ai-docs/blob/main/site/en/gemini-api/docs/semantic_retrieval.ipynb 。后续我可能会专门写一篇文章介绍这个模型。

## 结语

本来这篇文章只想谈谈项目的动机、制作过程和细节，写完一看又成了几千字的小作文，不得不佩服自己“话痨”的能力😂。
