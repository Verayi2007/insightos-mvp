# InsightOS MVP

InsightOS 是一个本地优先的 AI 知识消化驾驶舱，目标是把高质量商业阅读转化为文章卡片、实体/主题图谱和复盘问题。

这个仓库可以安全公开：内置数据全部是虚构 demo

## 项目定位

很多人读了大量长文、书籍和研究报告，但知识常常停留在收藏夹里。InsightOS 试图解决的是下一步：把内容拆成可复习、可关联、可迁移的决策资产。

当前 MVP 聚焦四件事：

- 今日消化：快速看到新增洞察和练习问题
- 文章卡片：把文章整理为核心论点和决策启发
- 主题图谱：查看实体、主题和行业之间的关系
- 每周复盘：生成高频主题、关键实体和决策问题

## 本地运行

不需要安装依赖，直接用 Node.js 启动静态服务：

```bash
node scripts/server.cjs
```

然后打开：

```text
http://localhost:4173
```

## 连接自己的 IMA 知识库

复制 `.env.example` 并填入你自己的配置，或者直接设置环境变量：

```bash
IMA_OPENAPI_CLIENTID=your_ima_client_id
IMA_OPENAPI_APIKEY=your_ima_api_key
INSIGHTOS_KB_NAME="Your Knowledge Base"
```

也可以把凭证放在：

- `~/.config/ima/client_id`
- `~/.config/ima/api_key`

同步元数据：

```bash
INSIGHTOS_KB_NAME="Your Knowledge Base" node scripts/ima-sync.cjs
```

Windows PowerShell：

```powershell
$env:INSIGHTOS_KB_NAME="Your Knowledge Base"
node scripts\ima-sync.cjs
```

或者直接传参：

```bash
node scripts/ima-sync.cjs --kb-name "Your Knowledge Base" --limit 20
```

同步结果会写入 `data/local-snapshot.json`。该文件已加入 `.gitignore`，不会被提交。默认只保存元数据，不保存正文。

如果你只想统计正文长度，而不保存正文内容：

```bash
INSIGHTOS_COUNT_CONTENT=1 node scripts/ima-sync.cjs --kb-name "Your Knowledge Base"
```

## 隐私设计

- `.env`、`.env.*`、`data/local-snapshot.json` 默认忽略
- demo 数据为虚构内容
- 同步脚本默认不保存文章正文
- 用户需要显式填写自己的知识库名称

## 当前范围

- 无构建依赖的静态 Web Dashboard
- 虚构 demo 文章卡片
- 实体/主题图谱
- 每周复盘与决策问题库
- IMA 只读同步脚本

## 后续路线

- 将 `data/local-snapshot.json` 转换为结构化文章卡片
- 接入 SQLite 保存长期知识资产
- 增加 AI processor，自动抽取实体、主题、观点和决策启发
- 增加定时同步和每周复盘生成
- 支持更多知识库来源

## License

MIT
