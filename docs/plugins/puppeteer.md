# koishi-plugin-puppeteer

浏览器服务。

## 配置项

### executablePath

- 类型：`string`

可执行文件的路径。缺省时将自动从系统中寻找。

::: tip
目前仅支持 Chrome 和 Edge 的寻找。Firefox 用户请手动配置此项或者欢迎 pull request。
:::

### headless

- 类型：`boolean`
- 默认值：`true`

是否开启[无头模式](https://developer.chrome.com/blog/headless-chrome/)。

### args

- 类型：`string[]`

额外的浏览器参数。Chromium 参数可以参考[这个页面](https://peter.sh/experiments/chromium-command-line-switches/)。

### defaultViewport

默认的设备缩放比率。有以下属性：

- width: `number` 视图宽度，默认为 800
- height: `number` 视图高度，默认为 600
- deviceScaleFactor: `number` 设备缩放比率，默认为 2

### ignoreHTTPSErrors

- 类型：`boolean`
- 默认值：`false`

在导航时忽略 HTTPS 错误。
