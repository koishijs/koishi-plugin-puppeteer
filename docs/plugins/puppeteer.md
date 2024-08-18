# koishi-plugin-puppeteer

浏览器服务。

## 配置项

### 连接配置

#### remote

- 类型：`boolean`

是否使用远程浏览器。

#### endpoint

- 类型：`string`

远程浏览器的地址。

::: tip
支持 HTTP 或 WebSocket 协议。请在启动浏览器时指定 `--remote-debugging-port` 参数以开启远程调试和确定其端口。

- HTTP 协议：`http(s)://{host}:{port}`
- WebSocket 协议：`ws(s)://{host}:{port}/devtools/browser/{id}`
:::

#### headers

- 类型：`Record<string, string>`

#### executablePath

- 类型：`string`

可执行文件的路径。缺省时将自动从系统中寻找。

::: tip
目前仅支持 Chrome 和 Edge 的寻找。Firefox 用户请手动配置此项或者欢迎 pull request。
:::

#### headless

- 类型：`boolean`
- 默认值：`true`

是否开启[无头模式](https://developer.chrome.com/blog/headless-chrome/)。

#### args

- 类型：`string[]`

额外的浏览器参数。Chromium 参数可以参考[这个页面](https://peter.sh/experiments/chromium-command-line-switches/)。

### 浏览器配置

#### defaultViewport

默认的设备缩放比率。有以下属性：

- width: `number` 视图宽度，默认为 800
- height: `number` 视图高度，默认为 600
- deviceScaleFactor: `number` 设备缩放比率，默认为 2

#### ignoreHTTPSErrors

- 类型：`boolean`
- 默认值：`false`

在导航时忽略 HTTPS 错误。
