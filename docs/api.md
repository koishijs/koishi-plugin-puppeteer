# API

## 类：Puppeteer

可以通过 `ctx.puppeteer` 访问。

### browser

- 类型: `Browser`

浏览器实例。

### puppeteer.stop()

- 返回值: `Promise<void>`

关闭浏览器并取消连接。

::: tip
在使用远程浏览器时，关闭浏览器不会关闭远程浏览器进程。
:::

### puppeteer.page()

- 返回值: `Promise<Page>`

创建一个新页面。

### puppeteer.svg(options?)

- 返回值: `SVG`

创建一个 SVG 实例。

### puppeteer.render(content, callback?)

- **content:** `string` 要渲染的 HTML
- **callback:** `(page, next) => Promise<string>` 回调函数
  - **page:** `Page` 页面实例
  - **next:** `(handle: ElementHandle) => Promise<string>` 渲染函数
- 返回值: `string`

渲染一个 HTML 页面。
