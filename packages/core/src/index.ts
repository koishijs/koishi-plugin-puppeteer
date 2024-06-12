import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer-core'
import find from 'puppeteer-finder'
import {} from '@cordisjs/plugin-proxy-agent'
import { Context, h, hyphenate, Schema, Service } from 'koishi'
import { SVG, SVGOptions } from './svg'
import Canvas from './canvas'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

export * from './svg'

declare module 'koishi' {
  interface Context {
    puppeteer: Puppeteer
  }
}

type RenderCallback = (page: Page, next: (handle?: ElementHandle) => Promise<string>) => Promise<string>

class Puppeteer extends Service {
  static [Service.provide] = 'puppeteer'
  static inject = ['http']

  browser: Browser
  executable: string
  private browserWSEndpoint: string

  constructor(ctx: Context, public config: Puppeteer.Config) {
    super(ctx, 'puppeteer')
    ctx.plugin(Canvas)
  }

  async start() {
    let { executablePath } = this.config
    if (!executablePath) {
      this.ctx.logger.info('chrome executable found at %c', executablePath = find())
    }
    const { proxyAgent } = this.ctx.http.config
    const args = this.config.args || []
    if (proxyAgent && !args.some(arg => arg.startsWith('--proxy-server'))) {
      args.push(`--proxy-server=${proxyAgent}`)
    }
    this.browser = await puppeteer.launch({
      ...this.config,
      executablePath,
      args,
    })
    this.ctx.logger.debug('browser launched')
    this.browserWSEndpoint = this.browser.wsEndpoint()

    const transformStyle = (source: {}, base = {}) => {
      return Object.entries({ ...base, ...source }).map(([key, value]) => {
        return `${hyphenate(key)}: ${Array.isArray(value) ? value.join(', ') : value}`
      }).join('; ')
    }

    this.ctx.component('html', async (attrs, children, session) => {
      const head: h[] = []

      const transform = (element: h) => {
        if (element.type === 'head') {
          head.push(...element.children)
          return
        }
        const attrs = { ...element.attrs }
        if (typeof attrs.style === 'object') {
          attrs.style = transformStyle(attrs.style)
        }
        return h(element.type, attrs, element.children.map(transform).filter(Boolean))
      }

      const page = await this.page()
      try {
        if (attrs.src) {
          await page.goto(attrs.src)
        } else {
          await page.goto(pathToFileURL(resolve(__dirname, '../index.html')).href)
          const bodyStyle = typeof attrs.style === 'object'
            ? transformStyle({ display: 'inline-block' }, attrs.style)
            : ['display: inline-block', attrs.style].filter(Boolean).join('; ')
          const content = children.map(transform).filter(Boolean).join('')
          const lang = attrs.lang ? ` lang="${attrs.lang}"` : ''
          await page.setContent(`<html${lang}>
            <head>${head.join('')}</head>
            <body style="${bodyStyle}">${content}</body>
          </html>`)
        }
        await page.waitForNetworkIdle({
          timeout: attrs.timeout ? +attrs.timeout : undefined,
        })
        const body = await page.$(attrs.selector || 'body')
        const clip = await body.boundingBox()
        const screenshot = await page.screenshot({ clip })
        return h.image(screenshot, 'image/png')
      } finally {
        await page?.close()
      }
    })
  }

  async stop() {
    await this.browser?.close()
  }

  page = async () => {
    if (!this.browser.connected) {
      this.browser = await puppeteer.connect({
        ...this.config,
        browserWSEndpoint: this.browserWSEndpoint
      })
      this.ctx.logger.debug('browser reconnect')
    }
    return this.browser.newPage()
  }

  svg = (options?: SVGOptions) => new SVG(options)

  render = async (content: string, callback?: RenderCallback) => {
    const page = await this.page()
    await page.goto(pathToFileURL(resolve(__dirname, '../index.html')).href)
    if (content) await page.setContent(content)

    callback ||= async (_, next) => page.$('body').then(next)
    const output = await callback(page, async (handle) => {
      const clip = handle ? await handle.boundingBox() : null
      const buffer = await page.screenshot({ clip })
      return h.image(buffer, 'image/png').toString()
    })

    page.close()
    return output
  }
}

namespace Puppeteer {
  export const filter = false

  type LaunchOptions = Parameters<typeof puppeteer.launch>[0]

  export interface Config extends LaunchOptions {}

  export const Config = Schema.intersect([
    Schema.object({
      executablePath: Schema.string().description('可执行文件的路径。缺省时将自动从系统中寻找。'),
      headless: Schema.boolean().description('是否开启[无头模式](https://developer.chrome.com/blog/headless-chrome/)。').default(true),
      args: Schema.array(String)
        .description('额外的浏览器参数。Chromium 参数可以参考[这个页面](https://peter.sh/experiments/chromium-command-line-switches/)。')
        .default(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    }).description('启动设置'),
    Schema.object({
      defaultViewport: Schema.object({
        width: Schema.natural().description('默认的视图宽度。').default(1280),
        height: Schema.natural().description('默认的视图高度。').default(768),
        deviceScaleFactor: Schema.number().min(0).description('默认的设备缩放比率。').default(2),
      }),
      ignoreHTTPSErrors: Schema.boolean().description('在导航时忽略 HTTPS 错误。').default(false),
    }).description('浏览器设置'),
  ]) as Schema<Config>
}

export default Puppeteer
