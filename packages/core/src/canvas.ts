import { Logger } from 'koishi'
import CanvasService, { Canvas, CanvasRenderingContext2D } from '@koishijs/canvas'
import { ElementHandle, Page } from 'puppeteer-core'

const logger = new Logger('puppeteer')

class CanvasInstance implements Canvas {
  private stmts: string[] = []
  private ctx: CanvasRenderingContext2D = new Proxy({
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
          this.stmts.push(`ctx.${prop}(${argArray.map(v => JSON.stringify(v)).join(', ')});`)
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

  constructor(private page: Page, private handle: ElementHandle, public width: number, public height: number) {}

  getContext(type: '2d') {
    return this.ctx
  }

  async toDataURL(type: 'image/png') {
    if (!this.page) throw new Error('canvas has been disposed')
    try {
      this.stmts.unshift(`const ctx = document.querySelector('canvas').getContext('2d');`)
      await this.page.evaluate(this.stmts.join('\n'))
      this.stmts = []
      return await this.page.evaluate(`document.querySelector('canvas').toDataURL(${JSON.stringify(type)})`) as string
    } catch (err) {
      await this.dispose()
      throw err
    }
  }

  async toBuffer(type: 'image/png') {
    const url = await this.toDataURL(type)
    return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64')
  }

  async dispose() {
    const page = this.page
    if (!page) return
    this.page = null
    await page.close().catch(logger.warn)
  }
}

export default class extends CanvasService {
  static using = ['puppeteer']

  async createCanvas(width: number, height: number) {
    const page = await this.ctx.puppeteer.page()
    try {
      await page.setContent(`<html><body><canvas width="${width}" height="${height}"></canvas></body></html>`)
      const el = await page.$('canvas')
      return new CanvasInstance(page, el, width, height)
    } catch (err) {
      await page.close()
      throw err
    }
  }
}
