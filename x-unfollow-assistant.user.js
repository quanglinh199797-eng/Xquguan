// ==UserScript==
// @name         X/Twitter 免费未回关检测与批量取关助手
// @namespace    https://local.sage.tools/
// @version      1.0.0
// @description  免费检测 X (Twitter) 上没有回关你的用户，支持单个取关与防风控安全批量取关，完全本地运行零收费。
// @author       Sage
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // 避免重复挂载
  if (document.getElementById('sage-x-helper-root')) return;

  // 1. 获取当前登录用户的 CSRF Token (ct0)
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // 2. 状态变量
  let isScanning = false;
  let isUnfollowing = false;
  let shouldStop = false;
  let notFollowingBackList = [];

  // 3. 创建悬浮控制面板 UI
  const root = document.createElement('div');
  root.id = 'sage-x-helper-root';
  root.innerHTML = `
    <div id="sage-panel" style="
      position: fixed;
      top: 80px;
      right: 20px;
      width: 360px;
      max-height: 520px;
      background: #ffffff;
      border: 1px solid #e1e8ed;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #0f1419;
    ">
      <!-- 头部 -->
      <div style="
        padding: 12px 16px;
        background: #f7f9f9;
        border-bottom: 1px solid #eff3f4;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div style="font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 6px;">
          <span>⚡ X 取关助手</span>
          <span style="font-size: 11px; background: #00ba7c; color: #fff; padding: 1px 6px; border-radius: 10px;">免费无限制</span>
        </div>
        <button id="sage-btn-minimize" style="background: none; border: none; cursor: pointer; color: #536471; font-size: 16px; font-weight: bold;">✕</button>
      </div>

      <!-- 操作与说明 -->
      <div style="padding: 12px 16px; border-bottom: 1px solid #eff3f4;">
        <div style="font-size: 12px; color: #536471; margin-bottom: 10px; line-height: 1.4;">
          👉 <b>操作说明</b>：请先在网页上进入<strong>你的个人主页</strong>（包含 Following 与 Followers 列表），然后点击扫描。
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="sage-btn-scan" style="
            flex: 1;
            background: #1d9bf0;
            color: #fff;
            border: none;
            border-radius: 20px;
            padding: 8px 0;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          ">🔍 扫描当前页未回关</button>
          <button id="sage-btn-batch" style="
            display: none;
            background: #f4212e;
            color: #fff;
            border: none;
            border-radius: 20px;
            padding: 8px 12px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          ">批量取关(慢速)</button>
          <button id="sage-btn-stop" style="
            display: none;
            background: #536471;
            color: #fff;
            border: none;
            border-radius: 20px;
            padding: 8px 12px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          ">停止</button>
        </div>
        <div id="sage-status" style="margin-top: 8px; font-size: 12px; color: #1d9bf0;">等待扫描...</div>
      </div>

      <!-- 列表展示区域 -->
      <div id="sage-list" style="
        flex: 1;
        overflow-y: auto;
        max-height: 320px;
        padding: 0;
      ">
        <div style="text-align: center; color: #888; font-size: 12px; padding: 40px 10px;">
          暂无数据。进入个人主页的 Following 列表后点击上方按钮检测。
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // 绑定收起/关闭按钮
  const panel = document.getElementById('sage-panel');
  const btnMinimize = document.getElementById('sage-btn-minimize');
  btnMinimize.onclick = () => {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  };

  const btnScan = document.getElementById('sage-btn-scan');
  const btnBatch = document.getElementById('sage-btn-batch');
  const btnStop = document.getElementById('sage-btn-stop');
  const statusDiv = document.getElementById('sage-status');
  const listDiv = document.getElementById('sage-list');

  // DOM 快速扫描方案（免被 Twitter GraphQL 接口签名封禁，安全第一）
  // 直接从 Twitter 网页 DOM 结构提取：在 Following 列表中，已回关你的账号会显示 "Follows you" / "关注了你"
  btnScan.onclick = async () => {
    if (isScanning) return;
    
    // 检查当前 URL 是否在 following 列表页
    const path = window.location.pathname;
    if (!path.includes('/following')) {
      statusDiv.innerHTML = `<span style="color:#f4212e;">请先点击进入你的“正在关注”列表页面（例如 x.com/你的ID/following）</span>`;
      return;
    }

    isScanning = true;
    shouldStop = false;
    btnScan.disabled = true;
    statusDiv.textContent = '正在通过网页解析未回关用户 (向下自动扫描)...';
    notFollowingBackList = [];

    // 持续自动滚动扫描到底，直到触底或用户主动停止
    let lastHeight = 0;
    let noChangeCount = 0;
    let scrollCount = 0;

    btnStop.style.display = 'inline-block'; // 扫描期间也可以随时点停止保留当前成果

    while (!shouldStop) {
      scrollCount++;
      statusDiv.textContent = `深度扫描中... 已滚动 ${scrollCount} 次，发现 ${notFollowingBackList.length} 位未回关`;
      
      // 提取页面中的用户单元格
      const userCells = document.querySelectorAll('[data-testid="UserCell"]');
      userCells.forEach(cell => {
        // 判断是否带有“关注了你”或者“Follows you”标记
        const text = cell.innerText || '';
        const followsYou = text.includes('关注了你') || text.includes('Follows you');
        
        // 提取用户名 (@handle) 和 昵称
        const linkElem = cell.querySelector('a[role="link"][href^="/"]');
        const handle = linkElem ? linkElem.getAttribute('href').replace('/', '') : '';
        const nameElem = cell.querySelector('span');
        const displayName = nameElem ? nameElem.innerText : handle;

        // 获取取关按钮
        const unfollowBtn = cell.querySelector('[data-testid$="-unfollow"]');

        if (handle && unfollowBtn && !followsYou) {
          if (!notFollowingBackList.some(u => u.handle === handle)) {
            notFollowingBackList.push({
              handle,
              displayName,
              cell
            });
          }
        }
      });

      // 自动向下平滑滚动
      window.scrollBy(0, 1200);
      await new Promise(r => setTimeout(r, 1000));

      // 检查是否已经到达页面最底部
      const newHeight = document.documentElement.scrollHeight;
      if (newHeight === lastHeight) {
        noChangeCount++;
        // 连续两次高度不变，可能网络稍微卡顿，再等等
        if (noChangeCount >= 3) {
          statusDiv.textContent = '已成功滚动到底部！';
          break; // 彻底到底了
        }
      } else {
        noChangeCount = 0;
        lastHeight = newHeight;
      }
    }

    btnStop.style.display = 'none';

    isScanning = false;
    btnScan.disabled = false;
    renderList();
  };

  // 渲染名单列表
  function renderList() {
    statusDiv.textContent = `扫描完毕！找到 ${notFollowingBackList.length} 个未回关用户`;
    if (notFollowingBackList.length === 0) {
      listDiv.innerHTML = `<div style="text-align: center; color: #00ba7c; font-size: 12px; padding: 30px;">全部都回关了你，或者列表为空！🎉</div>`;
      btnBatch.style.display = 'none';
      return;
    }

    btnBatch.style.display = 'inline-block';

    let html = '';
    notFollowingBackList.forEach((user, idx) => {
      html += `
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-bottom: 1px solid #eff3f4;
        " id="sage-user-${idx}">
          <div style="overflow: hidden; max-width: 200px;">
            <div style="font-weight: 700; font-size: 13px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${user.displayName}</div>
            <div style="font-size: 11px; color: #536471;">@${user.handle}</div>
          </div>
          <button class="sage-unfollow-single" data-index="${idx}" style="
            background: #fff;
            color: #0f1419;
            border: 1px solid #cfd9de;
            border-radius: 16px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          ">取关</button>
        </div>
      `;
    });
    listDiv.innerHTML = html;

    // 绑定单个取关事件
    document.querySelectorAll('.sage-unfollow-single').forEach(btn => {
      btn.onclick = async (e) => {
        const idx = e.target.getAttribute('data-index');
        await doUnfollowSingle(idx, e.target);
      };
    });
  }

  // Twitter 官方前端 Web 端通用公共 Bearer Token
  const TWITTER_BEARER = 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

  // 执行真实取关（通过 X 官方 Web API 直连，不受虚拟滚动 DOM 节点销毁影响）
  async function doUnfollowSingle(idx, btnElem) {
    const user = notFollowingBackList[idx];
    if (!user) return false;

    btnElem.disabled = true;
    btnElem.textContent = '取关中...';

    const ct0 = getCookie('ct0');
    if (!ct0) {
      alert('未获取到 ct0 CSRF Token，请确保已正常登录 x.com 并刷新网页！');
      btnElem.textContent = '未登录';
      return false;
    }

    try {
      const response = await fetch('https://x.com/i/api/1.1/friendships/destroy.json', {
        method: 'POST',
        headers: {
          'authorization': TWITTER_BEARER,
          'x-csrf-token': ct0,
          'x-twitter-active-user': 'yes',
          'x-twitter-auth-type': 'OAuth2Session',
          'content-type': 'application/x-www-form-urlencoded'
        },
        body: `screen_name=${encodeURIComponent(user.handle)}`
      });

      if (response.ok) {
        // 成功！真实取关成功
        btnElem.textContent = '已取关';
        btnElem.style.background = '#eff3f4';
        btnElem.style.color = '#536471';
        btnElem.style.borderColor = 'transparent';
        return true;
      } else {
        const errorText = await response.text();
        console.error('取关失败详情:', response.status, errorText);
        if (response.status === 429) {
          btnElem.textContent = '被限流';
          alert('Twitter 提示操作过于频繁 (429 Too Many Requests)，请稍后再试！');
        } else {
          btnElem.textContent = `失败(${response.status})`;
        }
        btnElem.disabled = false;
        return false;
      }
    } catch (err) {
      console.error('网络请求异常:', err);
      btnElem.textContent = '网络错误';
      btnElem.disabled = false;
      return false;
    }
  }

  // 批量慢速安全取关
  btnBatch.onclick = async () => {
    if (isUnfollowing) return;
    if (!confirm(`即将开始慢速安全批量取关（为防封号，每个间隔 3~6 秒）。\n建议单次不要超过 50 个。是否继续？`)) {
      return;
    }

    isUnfollowing = true;
    shouldStop = false;
    btnBatch.style.display = 'none';
    btnStop.style.display = 'inline-block';
    btnScan.disabled = true;

    for (let i = 0; i < notFollowingBackList.length; i++) {
      if (shouldStop) {
        statusDiv.textContent = '用户已手动停止批量取关。';
        break;
      }

      const row = document.getElementById(`sage-user-${i}`);
      const btn = row ? row.querySelector('.sage-unfollow-single') : null;
      if (btn && btn.textContent !== '已取关') {
        statusDiv.textContent = `正在取关 (${i + 1}/${notFollowingBackList.length}) @${notFollowingBackList[i].handle}...`;
        const success = await doUnfollowSingle(i, btn);

        if (!success) {
          // 如果失败（比如限流或权限问题），停止继续批量取关，防止被封
          statusDiv.textContent = `取关中断于 @${notFollowingBackList[i].handle}，请检查提示。`;
          break;
        }

        // 随机休眠 3.5 ~ 5.5 秒，模拟真人操作防封控
        const delay = Math.floor(Math.random() * 2000) + 3500;
        await new Promise(r => setTimeout(r, delay));
      }
    }

    isUnfollowing = false;
    btnStop.style.display = 'none';
    btnBatch.style.display = 'inline-block';
    btnScan.disabled = false;
    statusDiv.textContent = '批量取关任务完成！';
  };

  // 停止按钮
  btnStop.onclick = () => {
    shouldStop = true;
    statusDiv.textContent = '正在停止...';
  };

})();
