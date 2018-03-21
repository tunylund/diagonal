import { intersects } from "./collision.mjs"
import { xyz } from './xyz.mjs'

const GRAVITY = -981

class Position {
  constructor (x = 0, y = 0, z = 0, vx = 0, vy = 0, vz = 0, ax = 0, ay = 0, az = 0) {
    if (x instanceof Position) {
      this._cor = xyz(x.cor)
      this._vel = xyz(x.vel)
      this._acc = xyz(x.acc)
    } else if (typeof x === 'number') {
      this._cor = xyz(x, y, z)
      this._vel = xyz(vx, vy, vz)
      this._acc = xyz(ax, ay, az)
    } else {
      this._cor = x
      this._vel = y
      this._acc = z
    }
  }

  static position (x = 0, y = 0, z = 0, vx = 0, vy = 0, vz = 0, ax = 0, ay = 0, az = 0) {
    return new Position(...arguments)
  }

  get cor () { return this._cor }
  get vel () { return this._vel }
  get acc () { return this._acc }

  set cor (v) { this._cor = v }
  set pos (v) { this._pos = v }
  set vel (v) { this._vel = v }
  
  isAt(cor, precision = 0.1) {
    let dim = xyz(precision, precision, precision)
    return intersects(this, dim, position(cor), dim)
  }
}

function move (pos, step, collidables = []) {
  let vel = pos.vel.add(pos.acc.mul(xyz(step, step, step)))
  let cor = pos.cor.add(vel.mul(xyz(step, step, step)))
  return new Position(cor, vel, pos.acc)
}

function stop (pos) {
  return new Position(pos.cor, xyz(), xyz())
}

function gravity (pos) {
  return new Position(pos.cor, pos.vel, pos.acc.add(xyz(0, 0, GRAVITY)))
}

const position = Position.position
const dimension = xyz

export { position, dimension, move, gravity, stop }
