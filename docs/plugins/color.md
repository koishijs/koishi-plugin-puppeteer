# koishi-plugin-color

生成色图 (其实只是生成有颜色的图片)。

:::: tabs
::: tab color:code 纯色
:::
::: tab color:gradient 渐变
:::
::::

<chat-panel>
<chat-message nickname="Alice">color {{ colors[active] }}</chat-message>
<chat-message nickname="Koishi">
<div :style="`width: 100px; height: 100px; background: ${colors[active]};`"></div>
</chat-message>
</chat-panel>

<script lang="ts" setup>
import { useActiveTab } from '@cordisjs/vitepress/client'
const colors = {
  'color:code': '#66ccff',
  'color:gradient': 'linear-gradient(-30deg, #fc6076 0%, #ff9a44 100%)',
}
const active = useActiveTab(Object.keys(colors))
</script>

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
