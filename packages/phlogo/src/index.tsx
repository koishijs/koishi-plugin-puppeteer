import { Context, Schema } from 'koishi'

export const name = 'phlogo'
export const using = ['puppeteer'] as const

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context, config: Config) {
  ctx.command('phlogo <left:string> <right:string>', 'Pornhub 风格图标生成')
    .action((_, left, right) => {
      if (!left || !right) return '请输入以空格间隔的两段文本。'
      return <html style={{
        background: 'black',
        padding: '0.5em',
        paddingLeft: '0.375em',
        fontFamily: '-apple-system, Microsoft YaHei, sans-serif',
        fontWeight: 'bold',
      }}>
        <span style={{
          padding: '0 0.25em',
          color: 'white',
        }}>{left}</span>
        <span style={{
          background: '#F7971D',
          borderRadius: '0.2em',
          padding: '0 0.25em',
        }}>{right}</span>
      </html>
    })
}
