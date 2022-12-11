# koishi-plugin-color

生成色图 (其实只是生成纯色图片)。

<chat-panel>
<chat-message nickname="Alice">color #66ccff</chat-message>
<chat-message nickname="Koishi">
<div style="width: 100px; height: 100px; background-color: #66ccff;"></div>
</chat-message>
</chat-panel>

## 指令：color

- 基本语法：`color <color>`

以 `color` 指定的颜色生成一张图片，支持颜色名、十六进制色号、`rgb()` 函数等等。

## 配置项

### width

- 类型：`number`
- 默认值：`100`

默认图片宽度。

### height

- 类型：`number`
- 默认值：`100`

默认图片高度。
