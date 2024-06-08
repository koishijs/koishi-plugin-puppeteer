import puppeteer, { Browser, ConnectOptions, ElementHandle, Page } from 'puppeteer-core'
import find from 'puppeteer-finder'
import {} from 'undios-proxy-agent'
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

declare module 'puppeteer-core/lib/types' {
  interface Base64ScreenshotOptions extends ScreenshotOptions {
    encoding: 'base64'
  }

  interface BinaryScreenshotOptions extends ScreenshotOptions {
    encoding?: 'binary'
  }

  interface Page {
    screenshot(options?: Base64ScreenshotOptions): Promise<string>
    screenshot(options?: BinaryScreenshotOptions): Promise<Buffer>
  }

  interface ElementHandle {
    screenshot(options?: Base64ScreenshotOptions): Promise<string>
    screenshot(options?: BinaryScreenshotOptions): Promise<Buffer>
  }
}

type RenderCallback = (page: Page, next: (handle?: ElementHandle) => Promise<string>) => Promise<string>

class Puppeteer extends Service {
  static [Service.provide] = 'puppeteer'
  static inject = ['http']

  browser: Browser
  executable: string

  constructor(ctx: Context, public config: Puppeteer.Config) {
    super(ctx, 'puppeteer')
    ctx.plugin(Canvas)
  }

  async start() {
    if (this.config.connect.enabled && (this.config.connect.browserURL || this.config.connect.browserWSEndpoint)) {
      const { browserURL, browserWSEndpoint, headers } = this.config.connect
      const { defaultViewport, ignoreHTTPSErrors } = this.config
      // ws://{host}:{port}/devtools/browser/{id}
      if (browserWSEndpoint && new URL(browserWSEndpoint).pathname.startsWith('/devtools/browser/')) {
        throw new Error('invalid browserWSEndpoint for remote debugging')
      }
      // only browserURL or browserWSEndpoint is required
      const endpoint = (browserURL && browserWSEndpoint) ? { browserURL } : { browserURL, browserWSEndpoint }
      try {
        this.browser = await puppeteer.connect({
          ...endpoint,
          defaultViewport,
          ignoreHTTPSErrors,
          headers,
        })
        this.logger.info('browser connected to %c', browserURL || browserWSEndpoint)
      } catch (error) {
        this.logger.error(error.message)
      }
    } else {
      let { executablePath } = this.config
      if (!executablePath) {
        this.logger.info('chrome executable found at %c', executablePath = find())
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
      this.logger.debug('browser launched')
    }

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
        const screenshot = await page.screenshot({ clip }) as Buffer
        return h.image(screenshot, 'image/png')
      } finally {
        await page?.close()
      }
    })
  }

  async stop() {
    if (this.config.connect.enabled) {
      await this.browser?.disconnect()
    } else {
      await this.browser?.close()
    }
  }

  page = () => this.browser.newPage()

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

  export interface Config extends LaunchOptions {
    connect: { enabled: boolean } & ConnectOptions
  }

  export const Config = Schema.intersect([
    Schema.object({
      executablePath: Schema.string().description('可执行文件的路径。缺省时将自动从系统中寻找。'),
      headless: Schema.boolean().description('是否开启[无头模式](https://developer.chrome.com/blog/headless-chrome/)。').default(true),
      args: Schema.array(String)
        .description('额外的浏览器参数。Chromium 参数可以参考[这个页面](https://peter.sh/experiments/chromium-command-line-switches/)。')
        .default(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    }).description('启动设置'),
    Schema.object({
      connect: Schema.intersect([
        Schema.object({
          enabled: Schema.boolean().description('是否连接一个现有的浏览器实例，这将忽略本地浏览器连接。').default(false),
        }),
        Schema.union([
          Schema.object({
            enabled: Schema.const(true).required(),
            browserURL: Schema.string().description('浏览器的 URL 地址。'),
            browserWSEndpoint: Schema.string().description('浏览器的 WebSocket 端点。'),
            headers: Schema.dict(String).role('table').description('远程浏览器的请求头。'),
          }),
          Schema.object({}),
        ]),
      ]),
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
