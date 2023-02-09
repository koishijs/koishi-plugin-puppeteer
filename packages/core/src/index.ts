import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer-core'
import find from 'puppeteer-finder'
import { Context, hyphenate, Logger, Schema, segment, Service } from 'koishi'
import { SVG, SVGOptions } from './svg'
import { resolve } from 'path'

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

  interface Shooter {
    screenshot(options?: Base64ScreenshotOptions): Promise<string>
    screenshot(options?: BinaryScreenshotOptions): Promise<Buffer>
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

const logger = new Logger('puppeteer')

class Puppeteer extends Service {
  browser: Browser
  executable: string

  constructor(ctx: Context, public config: Puppeteer.Config) {
    super(ctx, 'puppeteer')
  }

  async start() {
    let { executablePath } = this.config
    if (!executablePath) {
      logger.info('chrome executable found at %c', executablePath = find())
    }
    this.browser = await puppeteer.launch({
      ...this.config,
      executablePath,
    })
    logger.debug('browser launched')

    const transformStyle = (source: {}, base = {}) => {
      return Object.entries({ ...base, ...source }).map(([key, value]) => {
        return `${hyphenate(key)}: ${Array.isArray(value) ? value.join(', ') : value}`
      }).join('; ')
    }

    const transform = (element: segment) => {
      const attrs = { ...element.attrs }
      if (typeof attrs.style === 'object') {
        attrs.style = transformStyle(attrs.style)
      }
      return segment(element.type, attrs, element.children.map(transform))
    }

    this.ctx.component('html', async (attrs, children, session) => {
      let page: Page
      try {
        page = await this.page()
        await page.goto('file:///' + resolve(__dirname, '../index.html'))
        const bodyStyle = typeof attrs.style === 'object'
          ? transformStyle({ display: 'inline-block' }, attrs.style)
          : ['display: inline-block', attrs.style].filter(Boolean).join('; ')
        await page.setContent(`<html>
          <body style="${bodyStyle}">${children.map(transform).join('')}</body>
        </html>`)
        const body = await page.$('body')
        const clip = await body.boundingBox()
        const screenshot = await page.screenshot({ clip }) as Buffer
        return segment.image(screenshot, 'image/png')
      } finally {
        await page?.close()
      }
    })
  }

  async stop() {
    await this.browser?.close()
  }

  page = () => this.browser.newPage()

  svg = (options?: SVGOptions) => new SVG(options)

  render = async (content: string, callback?: RenderCallback) => {
    const page = await this.page()
    if (content) await page.setContent(content)

    callback ||= async (_, next) => page.$('body').then(next)
    const output = await callback(page, async (handle) => {
      const clip = handle ? await handle.boundingBox() : null
      const buffer = await page.screenshot({ clip })
      return segment.image(buffer, 'image/png').toString()
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
