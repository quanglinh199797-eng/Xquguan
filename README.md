# X (Twitter) Unfollower & Following Tracker ⚡

<p align="center">
  <b>A lightweight, completely free, and secure Tampermonkey userscript to detect who doesn't follow you back on X (Twitter) and safely clean up your followings.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-X%20%2F%20Twitter-1DA1F2?logo=x&logoColor=white" alt="Platform" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
  <img src="https://img.shields.io/badge/Type-Tampermonkey%20Script-brightgreen" alt="Type" />
  <img src="https://img.shields.io/badge/Cost-100%25%20Free-orange" alt="Cost" />
</p>

---

## 🌟 为什么做这个项目？ / Why This Project?

市面上的很多 X 取关插件不仅要收取昂贵的月付订阅费（$9~$29/月），还常常将用户的私密凭据上传到第三方云端，甚至频繁暴力调用接口导致推特账号被风控限流或封禁。

本项目是一个**纯前端、本地运行、零收费、代码完全透明**的油猴（Tampermonkey）脚本：
- 🛡️ **绝对安全**：纯本地运行，不上传任何 Cookie、Token 或隐私。
- 🔍 **深度扫描**：自动向下滚动，深度检测所有没有回关你的用户。
- ⚡ **真实有效**：直接对接 X 官方 Web 前端接口，拒绝虚拟滚动“假取关”。
- ⏱️ **拟人防风控**：内置 3.5 ~ 5.5 秒随机拟人化冷却延迟，遇到限流立即暂停，保护你的账号健康与粉关比。

---

## 🚀 安装方法 / Installation

### 方式一：直接在油猴中安装 (Recommended)
1. 确保浏览器已安装脚本管理器：[Tampermonkey](https://www.tampermonkey.net/)、[Violentmonkey](https://violentmonkey.github.io/) 或 [ScriptCat (脚本猫)](https://scriptcat.org/)。
2. 打开脚本源码文件：[`x-unfollow-assistant.user.js`](./x-unfollow-assistant.user.js)。
3. 点击 **Raw**，或者直接复制代码粘贴进油猴新建脚本中保存即可。

---

## 📖 使用说明 / Usage

1. 打开网页版 [x.com](https://x.com/) 并登录你的账号。
2. 点击进入你的**个人主页**，然后进入 **“正在关注 (Following)”** 列表（URL 如 `https://x.com/your_username/following`）。
3. 网页右上角会自动浮现 **【⚡ X 取关助手】** 悬浮控制面板。
4. 点击 **“🔍 扫描当前页未回关”**：
   - 脚本会自动向下平滑滚动，并精准筛选出所有未回关你的账号。
   - 扫描期间可随时点击 **“⏹ 停止”** 保留当前已经扫出来的名单。
5. **取关操作**：
   - **单个取关**：点击对应账号后面的“取关”按钮。
   - **批量取关**：点击“批量取关(慢速)”，脚本将按照拟人化安全间隔逐一执行，并实时反馈结果。

---

## ⚠️ 免责声明 / Disclaimer

- 本项目仅供学习、交流与个人账号日常维护使用。
- 建议单次批量取关不要超过 50~100 个，合理控制频率以遵守 X 平台的使用规范。

---

## 📄 开源许可 / License

本项目基于 [MIT License](./LICENSE) 开源。
