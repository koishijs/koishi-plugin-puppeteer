# koishi-plugin-screenshot

[![npm](https://img.shields.io/npm/v/koishi-plugin-screenshot?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-screenshot)

网页截图。

## 指令：shot

网页截图。

- 基本语法：`shot <url>`
- 别名：screenshot
- 选项列表：
  - `-f, --full` 对整个可滚动区域截图
  - `-v, --viewport <viewport>` 指定视口

## 配置项

### protocols

- 类型: `string[]`
- 默认值: `['http', 'https']`

允许的协议列表。如果提供的 URL 的协议不在这个列表内将会提示“请输入正确的网址”。

### loadTimeout

- 类型: `number`
- 默认值: `10000`

加载页面的最长时间，单位为毫秒。当一个页面等待时间超过这个值时，如果此页面主体已经加载完成，则会发送一条提示消息“正在加载中，请稍等片刻”并继续等待加载；否则会直接提示“无法打开页面”并终止加载。

### idleTimeout

- 类型: `number`
- 默认值: `30000`

等待页面空闲的最长时间，单位为毫秒。当一个页面等待时间超过这个值时，将停止进一步的加载并立即发送截图。

### maxLength

- 类型: `number`
- 默认值: `1000000`

单张图片的最大尺寸，单位为字节。当截图尺寸超过这个值时会自动截取图片顶部的一段进行发送。
