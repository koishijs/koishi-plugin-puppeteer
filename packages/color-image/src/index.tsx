import { Context, Schema } from 'koishi'

export const name = 'color-image'
export const using = ['puppeteer'] as const

export interface Config {
  width?: number
  height?: number
}

export const Config: Schema<Config> = Schema.object({
  width: Schema.number().default(100).description('默认图片宽度。'),
  height: Schema.number().default(100).description('默认图片高度。'),
})

export function apply(ctx: Context, config: Config) {
  ctx.command('color-image <color>', '生成色图')
    .action((_, color) => {
      if (!color) return '请输入颜色。'
      return <html>
        <div style={`width: ${config.width}px; height: ${config.height}px; background: ${color}`}></div>
      </html>
    })
}
