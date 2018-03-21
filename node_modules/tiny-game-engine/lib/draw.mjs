import loop from './loop.mjs'

export default function setup (window) {

  const canvas = window.document.createElement('canvas')
  const context = canvas.getContext('2d')

  let cw, ch
  function onResize () {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    cw = canvas.width / 2
    ch = canvas.height / 2
  }
  onResize()
  window.addEventListener('resize', onResize)
  window.document.body.appendChild(canvas)

  let drawables = []
  function addDrawable(z, draw) {
    let ix = drawables.length
    while (ix-- > 0) if (drawables[ix].z <= z) break;
    drawables.splice(ix + 1, 0, { z, draw })
  }

  function draw (fnOrEl, pos, dim) {
    addDrawable(pos.cor.z, () => {
      context.save()
      context.translate(cw, ch)
      if (typeof fnOrEl === 'function') {
        fnOrEl(context, cw, ch)
      } else {
        context.drawImage(fnOrEl, pos.cor.x - dim.x / 2, pos.cor.y - dim.y / 2)
      }
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.restore()
    })
  }

  function isometricDraw (fnOrEl, pos, dim) {
    draw((ctx, cw, ch) => {
      ctx.transform(0.707, 0.409, -0.707, 0.409, 0, -0.816)
      ctx.translate(-pos.cor.z, -pos.cor.z)
      if (typeof fnOrEl === 'function') {
        fnOrEl(ctx, cw, ch)
      } else {
        ctx.drawImage(fnOrEl, pos.cor.x - dim.x / 2, pos.cor.y - dim.y / 2)
      }
    }, pos, dim)
  }

  const stopDrawLoop = loop((step, total) => {
    const iteration = drawables.splice(0, drawables.length)
    while(iteration.length > 0) iteration.shift().draw()
  }, window)
  
  return { draw, isometricDraw, stopDrawLoop }
}

function drawing (w, h, fn, win) {
  const canvas = (win || window).document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = 
  fn(canvas.getContext('2d'))
  return canvas
}

export { setup, drawing }