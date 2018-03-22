import { intersects, bump } from './../node_modules/tiny-game-engine/lib/collision.mjs'
import { position, move, gravity, stop } from './../node_modules/tiny-game-engine/lib/position.mjs'
import { xyz } from './../node_modules/tiny-game-engine/lib/xyz.mjs'
import { drawing } from './../node_modules/tiny-game-engine/lib/draw.mjs'
import { timeBasedTurn, turnBasedTurn } from './../node_modules/tiny-game-engine/lib/turn.mjs'

const TILESIZE = 20
const GROUNDHEIGHT = -200
const SPLASHCOLOR = xyz(8, 167, 214)
const PORTALCOLOR = xyz(255, 255, 255)
const TIMEBETWEENTURNS = 150

function range(minormax, max) {
  max = max || minormax
  let res = []
  let min = max ? minormax : 0
  for (let i = min; i <= max; i++) {
    res.push(i)
  }
  return res
}

function sample(arr) {
  return arr[Math.floor(arr.length * Math.random())]
}

function removeAll(arr, filter) {
  return arr.filter(filter).map(el => arr.splice(arr.indexOf(el), 1) && el)
}

function buildBg (draw) {
  const pos = position(0, 0, GROUNDHEIGHT * 2)
  const dim = xyz()
  return step => {
    draw((ctx, cw, ch) => {
      const bgGradient = ctx.createLinearGradient(0, 0, 0, ch)
      bgGradient.addColorStop(0, '#63d6fb')
      bgGradient.addColorStop(1, `#63e9fe`)
      ctx.fillStyle = bgGradient
      ctx.fillRect(-cw, -ch, cw * 2, ch * 2)
    }, pos, dim)
  }
}

function buildPlane (draw, portalBuilder, enemyBuilder) {
  const tiles = [], maxRadius = 10
  let radius = 4
  let maxTiles = Math.pow((radius * 2) + 1, 2)
  let birthRate = 1000

  const level = drawing(TILESIZE, TILESIZE, ctx => {
    ctx.fillStyle = '#29e9ff'
    ctx.strokeStyle = '#09c9df'
    ctx.fillRect(0, 0, TILESIZE, TILESIZE)
    ctx.strokeRect(0, 0, TILESIZE, TILESIZE)
  })

  const shadow = drawing(TILESIZE, TILESIZE, ctx => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
    ctx.fillRect(0, 0, TILESIZE, TILESIZE)
  })

  function newTiles () {
    radius = 4
    maxTiles = Math.pow((radius * 2) + 1, 2)
    range(-radius, radius).map(x => range(-radius, radius).map(y => ({x, y})))
    .reduce((xys, row) => xys.concat(row), [])
    .map((xy, i, arr) => setTimeout(() => newTile(xy.y * TILESIZE, xy.x * TILESIZE), i * 10))
  }

  function newTile(x, y) {
    const tile = { pos: position(x, y, GROUNDHEIGHT, 0, 0, 0, 0, 0, 981), dim: xyz(TILESIZE, TILESIZE, 2), alpha: 1 }
    tiles.push(tile)
    portalBuilder(tile.pos.cor, SPLASHCOLOR)
  }

  function dropTiles() {
    tiles.reverse().map((tile, i) => setTimeout(() => tile.pos = gravity(stop(tile.pos)), i * 10))
  }

  function dropTileAt(cor) {
    tiles.filter(t => t.pos.isAt(cor, 10))
      .map(t => t.pos = gravity(t.pos))
  }

  function randomTiles () {
    if (timeBasedTurn('tiles', birthRate)) {
      if (birthRate > 250) birthRate -= 10
      while (tiles.length < maxTiles) {
        let x = sample(range(-radius, radius)) * TILESIZE
        let y = sample(range(-radius, radius)) * TILESIZE
        if (tiles.filter(t => t.pos.cor.x === x && t.pos.cor.y === y).length === 0) {
          return newTile(x, y)
        }
      }
    }
  }

  function enlargeRadius () {
    if (tiles.length >= maxTiles && radius < maxRadius) {
      radius++
      maxTiles = Math.pow((radius * 2) + 1, 2)
    }
  }

  function stopTilesThatReachGamePlay () {
    tiles.filter(tile => tile.pos.vel.z > 0 && tile.pos.cor.z >= 1)
      .map(tile => tile.pos = stop(position(tile.pos.cor.mul(xyz(1, 1, 0)))))
      .filter(pos => pos.cor.sum() != 0)
      .filter(pos => Math.random() > Math.max((maxRadius - radius) / 10 + 0.2))
      .map(enemyBuilder)
  }

  function tileStep (step) {
    tiles.map(tile => {
      tile.pos = move(tile.pos, step)
      draw(tile.pos.vel.z < 0 ? shadow : level, tile.pos, tile.dim)
    })
    stopTilesThatReachGamePlay()
    removeAll(tiles, tile => tile.pos.cor.z < GROUNDHEIGHT)
      .map(tile => portalBuilder(tile.pos.cor, SPLASHCOLOR))
    enlargeRadius()
  }

  return { tiles, tileStep, newTiles, dropTiles, randomTiles, dropTileAt }
}

function buildBall (draw, tiles, isEnemyAt, dropTileAt, portalBuilder) {
  const ball = { pos: position(0, 0, GROUNDHEIGHT -1), dim: xyz(10, 10, 4) }

  const circle = drawing(ball.dim.x, ball.dim.y, ctx => {
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(ball.dim.x / 2, ball.dim.y / 2, ball.dim.x / 2, 0, 2 * Math.PI)
    ctx.fill()
  })

  turnBasedTurn('player')
  let stepTowards = null
  document.body.addEventListener('keyup', keyControls, false)
  document.body.addEventListener("touchstart", touchControls, false)

  function keyControls (e) {
    if ([37, 38, 39, 40].includes(e.keyCode)) {
      const dir = xyz(
        e.keyCode == 37 ? -1 : e.keyCode == 39 ? 1 : 0,
        e.keyCode == 38 ? -1 : e.keyCode == 40 ? 1 : 0
      )
      stepTowards = dir.mul(xyz(TILESIZE, TILESIZE, TILESIZE))
    }
  }

  function touchControls (e) {
    const touch = e.changedTouches[0]
    let x = touch.pageX, y = touch.pageY
    let w2 = window.innerWidth / 2
    let h2 = window.innerHeight / 2
    const dir = xyz(
      x < w2 && y < h2 ? -1 : x > w2 && y > h2 ? 1 : 0,
      x > w2 && y < h2 ? -1 : x < w2 && y > h2 ? 1 : 0
    )
    stepTowards = dir.mul(xyz(TILESIZE, TILESIZE, TILESIZE))
  }
  
  function controls() {
    if (stepTowards && turnBasedTurn('player', TIMEBETWEENTURNS)) {
      let nextCor = ball.pos.cor.add(stepTowards)
      while (isEnemyAt(nextCor)) {
        dropTileAt(nextCor)
        nextCor = nextCor.add(stepTowards)
      }
      ball.pos.cor = nextCor
      stepTowards = null
    }
  }

  function ballStep (step) {
    if (ball.pos.cor.z < GROUNDHEIGHT) return
    controls()

    ball.pos = bump({pos: move(ball.pos, step), dim: ball.dim}, tiles, 'z')
    if (ball.pos.cor.z < GROUNDHEIGHT) portalBuilder(ball.pos.cor, SPLASHCOLOR)

    draw(circle, ball.pos, ball.dim)
  }

  function dropBall () {
    ball.pos = gravity(position(0, 0, -GROUNDHEIGHT))
    portalBuilder(ball.pos.cor, PORTALCOLOR)
  }

  return { ball, ballStep, dropBall }
}

function buildEnemies (draw, tiles, ball, portalBuilder, dropTileAt) {
  const dim = xyz(10, 10, 4)
  const enemies = []

  const circle = drawing(dim.x, dim.y, ctx => {
    ctx.fillStyle = '#0b0b0b'
    ctx.beginPath()
    ctx.arc(dim.x / 2, dim.y / 2, dim.x / 2, 0, 2 * Math.PI)
    ctx.fill()
  })

  function stepCloser (enemy) {
    const r = Math.random()
    enemy.pos.cor = enemy.pos.cor.add(ball.pos.cor.sub(enemy.pos.cor).unit.mul(xyz(r > 0.5 ? TILESIZE : 0, r <= 0.5 ? TILESIZE : 0, 0)))
  }

  function isEnemyAt (cor) {
    return enemies.filter(enemy => enemy.pos.isAt(cor)).length > 0
  }

  function enemyStep (step) {
    if (turnBasedTurn('enemies', TIMEBETWEENTURNS)) {
      enemies.map(enemy => {
        stepCloser(enemy)
        if (intersects(enemy.pos, enemy.dim, ball.pos, ball.dim)) {
          dropTileAt(enemy.pos, enemy.dim)
        }
      })
    }

    enemies.map(enemy => {
      enemy.pos = bump({pos: move(enemy.pos, step), dim: enemy.dim}, tiles, 'z')
      if (enemy.pos.cor.z < GROUNDHEIGHT) portalBuilder(enemy.pos.cor, SPLASHCOLOR)
      draw(circle, enemy.pos, enemy.dim)
    })

    removeAll(enemies, enemy => enemy.pos.cor.z < GROUNDHEIGHT)
  }

  function enemyBuilder (pos) {
    enemies.push({ pos: gravity(pos), dim })
  }

  return { isEnemyAt, enemyStep, enemyBuilder }
}

function buildPortal (draw) {
  const portals = []
  const dim = xyz(10, 10, 4)

  function portalBuilder (cor, color) {
    portals.push({ pos: position(cor.add(xyz(dim.x2, dim.y2))), alpha: 1, scale: 5, dim, color })
  }

  function portalStep (step) {
    portals.map(p => {
      p.alpha -= step
      p.scale += step * 10
      draw(ctx => {
        ctx.strokeStyle = `rgba(${p.color.x}, ${p.color.y}, ${p.color.z}, ${p.alpha}`
        ctx.beginPath()
        ctx.arc(p.pos.cor.x - p.dim.x / 2, p.pos.cor.y - p.dim.y / 2, p.scale, 0, 2 * Math.PI)
        ctx.stroke()
      }, p.pos) 
    })

    removeAll(portals, p => p.alpha <= 0)
  }

  return { portalStep, portalBuilder }
}

export default function gameLoop(draw, isometricDraw) {
  const bg = buildBg(draw)
  const { portalStep, portalBuilder } = buildPortal(isometricDraw)
  const { tileStep, tiles, newTiles, dropTiles, dropTileAt, randomTiles } = buildPlane(isometricDraw, portalBuilder, pos => enemyBuilder(pos), () => dropBall())
  const { ball, ballStep, dropBall } = buildBall(isometricDraw, tiles, (cor) => isEnemyAt(cor), dropTileAt, portalBuilder)
  const { enemyStep, isEnemyAt, enemyBuilder } = buildEnemies(isometricDraw, tiles, ball, portalBuilder, dropTileAt)
  let nextGameAt

  function gameStep(step, total) {
    if (ball.pos.cor.z < GROUNDHEIGHT) {
      dropTiles()
      nextGameAt = total + 3000
      mode = 'outro'
    }
    randomTiles()
  }

  function introStep (step, total) {
    if (tiles.length > 0 && tiles.filter(t => t.pos.acc.z != 0).length === 0) {
      enemyBuilder(tiles[0].pos)
      enemyBuilder(tiles[tiles.length - 1].pos)
      dropBall()
      mode = 'game'
    }
  }

  function outroStep (step, total) {
    if (!nextGameAt || nextGameAt <= total) {
      newTiles()
      mode = 'intro'
    }
  }

  let mode = 'outro'
  return function step (step, total) {
    bg(step)

    if (mode === 'intro') introStep(step, total)
    else if (mode === 'outro') outroStep(step, total)
    else if (mode === 'game') gameStep(step, total)

    tileStep(step)
    ballStep(step)
    portalStep(step)
    enemyStep(step)
  }
}