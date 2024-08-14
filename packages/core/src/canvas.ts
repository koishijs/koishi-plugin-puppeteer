import CanvasService, { Canvas, CanvasRenderingContext2D, Image } from '@koishijs/canvas'
import { Binary, Context } from 'koishi'
import { Page } from 'puppeteer-core'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

const kElement = Symbol('element')

class BaseElement {
  public [kElement] = true

  constructor(protected page: Page, protected id: string) {}

  get selector() {
    return `document.querySelector("#${this.id}")`
  }

  async dispose() {
    await this.page.evaluate(`${this.selector}?.remove()`)
    this.id = null
  }
}

class CanvasElement extends BaseElement implements Canvas {
  private stmts: string[] = []
  private ctx = new Proxy({
    canvas: this,
    direction: 'inherit',
    fillStyle: '#000000',
    filter: 'none',
    font: '10px sans-serif',
    fontKerning: 'auto',
    fontStretch: 'normal',
    fontVariantCaps: 'normal',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'low',
    letterSpacing: '0px',
    lineCap: 'butt',
    lineDashOffset: 0,
    lineJoin: 'miter',
    lineWidth: 1,
    miterLimit: 10,
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    strokeStyle: '#000000',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    textRendering: 'auto',
    wordSpacing: '0px',
  } as unknown as CanvasRenderingContext2D, {
    get: (target, prop, receiver) => {
      if (Reflect.has(target, prop) || typeof prop === 'symbol') {
        return Reflect.get(target, prop, receiver)
      }
      return new Proxy(() => {}, {
        apply: (target, thisArg, argArray) => {
          this.stmts.push(`ctx.${prop}(${argArray.map((value) => {
            if (value[kElement]) return value.selector
            return JSON.stringify(value)
          }).join(', ')});`)
        },
      })
    },
    set: (target, prop, value, receiver) => {
      if (Reflect.has(target, prop)) {
        if (typeof prop !== 'symbol') {
          this.stmts.push(`ctx.${prop} = ${JSON.stringify(value)};`)
        }
        return Reflect.set(target, prop, value, receiver)
      }
    },
  })

  constructor(page: Page, id: string, public width: number, public height: number) {
    super(page, id)
  }

  getContext(type: '2d') {
    return this.ctx
  }

  async toDataURL(type: 'image/png') {
    if (!this.id) throw new Error('canvas has been disposed')
    try {
      this.stmts.unshift(`(async (ctx) => {`)
      const expr = this.stmts.join('\n  ') + `\n})(${this.selector}.getContext('2d'))`
      this.stmts = []
      await this.page.evaluate(expr)
      return await this.page.evaluate(`${this.selector}.toDataURL(${JSON.stringify(type)})`) as string
    } catch (err) {
      await this.dispose()
      throw err
    }
  }

  async toBuffer(type: 'image/png') {
    const url = await this.toDataURL(type)
    return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64')
  }
}

class ImageElement extends BaseElement implements Image {
  public naturalHeight: number
  public naturalWidth: number

  constructor(private ctx: Context, page: Page, id: string, private source: string | URL | Buffer | ArrayBufferLike) {
    super(page, id)
  }

  async initialize() {
    let base64: string
    if (this.source instanceof URL) {
      this.source = this.source.href
    }
    if (typeof this.source === 'string') {
      const file = await this.ctx.http.file(this.source)
      base64 = Binary.toBase64(file.data)
    } else if (Buffer.isBuffer(this.source)) {
      base64 = this.source.toString('base64')
    } else {
      base64 = Binary.toBase64(this.source)
    }
    const size = await this.page.evaluate(`loadImage(${JSON.stringify(this.id)}, ${JSON.stringify(base64)})`) as any
    this.naturalWidth = size.width
    this.naturalHeight = size.height
  }
}

export default class extends CanvasService {
  static inject = ['puppeteer', 'http']

  private page: Page
  private counter = 0

  async start() {
    const page = await this.ctx.puppeteer.page()
    try {
      await page.goto(pathToFileURL(resolve(__dirname, '../index.html')).href)
      this.page = page
    } catch (err) {
      await page.close()
      throw err
    }
  }

  async stop() {
    await this.page?.close()
    this.page = null
  }

  async createCanvas(width: number, height: number) {
    try {
      const name = `canvas_${++this.counter}`
      await this.page.evaluate([
        `const ${name} = document.createElement('canvas');`,
        `${name}.width = ${width};`,
        `${name}.height = ${height};`,
        `${name}.id = ${JSON.stringify(name)};`,
        `document.body.appendChild(${name});`,
      ].join('\n'))
      return new CanvasElement(this.page, name, width, height)
    } catch (err) {
      this.ctx.logger('puppeteer').warn(err)
      throw err
    }
  }

  async loadImage(source: string | URL | Buffer | ArrayBufferLike): Promise<Image> {
    const id = `image_${++this.counter}`
    const image = new ImageElement(this.ctx, this.page, id, source)
    await image.initialize()
    return image
  }
}
