import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer-core'
import find from 'puppeteer-finder'
import { Context, Logger, Schema, segment, Service } from 'koishi'
import { SVG, SVGOptions } from './svg'

export * from './svg'

declare module 'koishi' {
  interface Context {
    puppeteer: Puppeteer
  }
}

type RenderCallback = (page: Page, next: (handle?: ElementHandle) => Promise<string>) => Promise<string>

const logger = new Logger('puppeteer')

class Puppeteer extends Service {
  browser: Browser

  constructor(ctx: Context, public config: Puppeteer.Config) {
    super(ctx, 'puppeteer')
    if (!config.executablePath) {
      logger.debug('chrome executable found at %c', config.executablePath = find())
    }
  }

  async start() {
    this.browser = await puppeteer.launch(this.config)
    logger.debug('browser launched')

    this.ctx.component('html', async (attrs, children, session) => {
      const page = await this.page()
      await page.setContent(`<html>
        <body style="display: inline-block">${children.join('')}</body>
      </html>`)
      const body = await page.$('body')
      const clip = await body.boundingBox()
      return segment.image(await page.screenshot({ clip }))
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
      return segment.image(buffer).toString()
    })

    page.close()
    return output
  }
}

namespace Puppeteer {
  type LaunchOptions = Parameters<typeof puppeteer.launch>[0]

  export interface Config extends LaunchOptions {}

  export const Config = Schema.intersect([
    Schema.object({
      executablePath: Schema.string().description('可执行文件的路径。缺省时将自动从系统中寻找。'),
      headless: Schema.boolean().description('是否开启[无头模式](https://developer.chrome.com/blog/headless-chrome/)。').default(true),
      args: Schema.array(String).description('额外的浏览器参数。Chromium 参数可以参考[这个页面](https://peter.sh/experiments/chromium-command-line-switches/)。'),
    }).description('启动设置'),
    Schema.object({
      defaultViewport: Schema.object({
        width: Schema.natural().description('默认的视图宽度。').default(800),
        height: Schema.natural().description('默认的视图高度。').default(600),
        deviceScaleFactor: Schema.number().min(0).description('默认的设备缩放比率。').default(2),
      }),
      ignoreHTTPSErrors: Schema.boolean().description('在导航时忽略 HTTPS 错误。').default(false),
    }).description('浏览器设置'),
  ]) as Schema<Config>
}

export default Puppeteer
