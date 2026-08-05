# StataBro 客户引导向导 · 部署指南

## 当前架构
- 纯静态前端：`index.html` + `assets/`（content.js / app.js / styles.css）
- 数据提交走 **Formspree**（免后端）：客户填写的需求通过 `assets/content.js` 里的 `formEndpoint` 发到 Formspree，你会收到邮件 + 后台可查看
- 文件（第6步）：Formspree 免费档不支持附件，已提示客户直接微信发你
- 微信"从聊天选文件"：可选功能，需配置微信公众号（见末尾）

## ⚠️ 为什么不要继续用 Vercel 给国内客户
Vercel 在**中国大陆没有 CDN 节点**，手机移动网络（尤其微信内打开）经常偶发慢 / 超时（实测偶发连接失败）。客户体验差。
→ 改用国内静态托管即可根治（下面两种都免费）。

---

## 方案 A（推荐）：Gitee Pages —— 免费 · 国内快 · 自带 HTTPS · 无需备案
1. 打开 https://gitee.com 注册，新建一个**空仓库**（如 `onb`，不要勾 README）
2. 把仓库地址（如 `https://gitee.com/你的名/onb.git`）发给开发助手，他会把代码 push 上去
3. 仓库设为**公开** → 顶部「服务」→「Gitee Pages」
4. 部署源选 `master` 分支，部署目录选「根目录 `/`」→ 点击「启动」
5. 得到地址：`https://你的名.gitee.io/onb`（这就是给客户的链接，国内打开快）
6. 以后每次修改后重新 push，再到 Gitee Pages 页面点一下「更新」即可生效

## 方案 B：腾讯云 COS 静态网站（需实名，流量极低）
1. 腾讯云控制台 → 对象存储 COS → 新建存储桶（公有读，所属地域选离客户近的）
2. 把本目录所有文件上传到桶根目录
3. 桶设置 → 静态网站 → 开启，得到 `http://xxx.cos-website.ap-xxx.myqcloud.com`
4. 想要 HTTPS / 自定义域名：需有已备案域名 + 腾讯云 CDN + 证书（略复杂，长期再用）
5. 微信里打开 HTTP 链接可能提示"不安全"，建议最终配 HTTPS

---

## 本地预览（开发用，非线上）
```bash
cd client-onboarding
node server.js          # 默认 http://localhost:3210
```
注意：线上用 Formspree 收数据，无需运行 server.js；server.js 仅用于本地调试 / 自托管后端场景。

## 微信"从聊天选文件"配置（可选，增强体验）
仅当你想在微信里让客户直接从聊天记录选 .dta/.do 等文件时才需要：
1. 准备一个**已认证**的公众号 / 服务号 AppId + AppSecret
2. 公众号后台 → 功能设置 → 填写「JS 接口安全域名」= 你的部署域名（不带 http）
3. 部署时注入环境变量 `WX_APPID` / `WX_APPSECRET`（仅自托管 Node 后端时需要；纯静态 + Formspree 方案下此功能走标准文件选择降级，iOS 仅能选图片）
