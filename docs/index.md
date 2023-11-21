# koishi-plugin-puppeteer

koishi-plugin-puppeteer 提供了通用的浏览器服务，可用于网页截图和图片渲染等。

::: tip
为了正常使用这个插件，你首先需要确保你的电脑上已经安装有 Chrome / Edge / Firefox。同时，我们建议你保持浏览器和本插件的更新，因为版本不匹配可能会导致本插件无法正常使用。
:::

::: warning
由于 Ubuntu 中 `Software Updater` 会使用 [snap](https://snapcraft.io/) 安装 Chromium 与 Chrome。这会将应用隔离运行在一个 namespace 沙箱中。

当 Chromium 浏览器在隔离环境下使用时， Koishi 会抛出以下错误：
```bash
[W] app Error: net::ERR_FILE_NOT_FOUND at file:///your-koishi-workspace-path/node_modules/koishi-plugin-puppeteer/index.html
```

<details>
  <summary>点我查看解决方法</summary>

可以选择下列方法**之一**解决：
- 使用其他 Linux 发行版
- 不使用 `Software Updater`
- 使用传统 `deb` 包进行安装
    ```bash
    > curl -o https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb chrome.deb
    > dpkg chrome.deb
    ```
- 将你想使用的文件夹添加到 `snap` 应用程序访问列表中
    ```bash
    sudo snap connect <snap app name>:your-koishi-workspace-path
    ```
- 移动到 `snap` 允许访问的文件夹或挂载点中（具体允许文件夹或挂载点请查询 snap 级别）
  - `/home/$USER`: 用户家目录
  - `/media`: 可移动媒体设备的挂载点
  - ~~`/mnt`: 临时挂载点~~
  - ~~`/tmp`: 临时文件夹~~

</details>
:::

## 相关生态

以下是本仓库提供的插件：

- [生成色图 (Color)](./plugins/color.md)
- [浏览器 (Puppeteer)](./plugins/puppeteer.md)
- [网页截图 (Screenshot)](./plugins/screenshot.md)

以下是其他用到此服务的插件：

- [棋类游戏 (Chess)](https://chess.koishi.chat)
