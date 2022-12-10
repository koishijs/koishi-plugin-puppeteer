# API

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
