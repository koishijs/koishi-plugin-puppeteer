# koishi-plugin-puppeteer

浏览器服务，可用于网页截图等。

> 注意：为了正常使用这个插件，你首先需要确保你的电脑上已经安装有 Chromium。同时，我们建议你保持 Chromium 和本插件的更新，因为版本不匹配可能会导致本插件无法正常使用。

## 类：Puppeteer

可以通过 `ctx.puppeteer` 访问。

### puppeteer.launch()

- 返回值: `Promise<void>`

启动并连接浏览器。

### puppeteer.close()

- 返回值: `Promise<void>`

关闭浏览器并取消连接。

### puppeteer.page()

- 返回值: `Promise<Page>`

创建一个新页面。

### puppeteer.render(content, callback?)

- **content:** `string` 要渲染的 HTML
- **callback:** `(page, next) => Promise<string>` 回调函数
  - **page:** `Page` 页面实例
  - **next:** `(handle: ElementHandle) => Promise<string>` 渲染函数
- 返回值: `string`

渲染一个 HTML 页面。
