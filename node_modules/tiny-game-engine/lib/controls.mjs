import { xyz, vector2 } from './xyz.mjs'

class Controls {
  
  constructor (window) {
    this._keys = {}
    this._dir = xyz()

    const keyDownListener = ev => this._key(ev.code, true)
    const keyUpListener = ev => this._key(ev.code, false)
    const touchStartListener = ev => this._touch(ev.changedTouches[0], window)
    const touchEndListener = ev => this._dir = xyz()

    const body = window.document.body
    body.addEventListener('keydown', keyDownListener, false)
    body.addEventListener('keyup', keyUpListener, false)
    body.addEventListener("touchstart", touchStartListener, false)
    body.addEventListener("touchend", touchEndListener, false)

    this.detach = () => {
      body.removeEventListener('keydown', keyDownListener)
      body.removeEventListener('keyup', keyUpListener)
      body.removeEventListener('touchstart', touchStartListener)
      body.removeEventListener('touchend', touchEndListener)
    }
  }

  _touch (touchPoint, window) {
    const { pageX, pageY } = touchPoint
    const w2 = window.innerWidth / 2, h2 = window.innerHeight / 2
    this._dir = vector2(Math.atan2(h2 - pageY, pageX - w2), 1)
  }

  _key (key, isDown) {
    this._keys[key] = isDown
    const angle = this._keys.ArrowRight  ? ( this._keys.ArrowUp ? 45  : this._keys.ArrowDown ? 315 : 0 ) :
                  this._keys.ArrowLeft   ? ( this._keys.ArrowUp ? 135 : this._keys.ArrowDown ? 225 : 180 ) :
                  this._keys.ArrowUp     ? 90 :
                  this._keys.ArrowDown   ? 270 : Infinity
    this._dir = angle > 360 ? xyz() : vector2(angle * (Math.PI / 180), 1)
  }
  
  get dir ()      { return this._dir }
  get touch ()    { return this._dir.size > 0 && Object.values(this._keys).filter(t => t).length === 0 }

  get leftdown () { return this._dir.size > 0 && this.dir.angle >= 180 && this.dir.angle <= 270 }
  get left ()     { return this._dir.size > 0 && this.dir.angle >= 135 && this.dir.angle <= 225 }
  get leftup ()   { return this._dir.size > 0 && this.dir.angle < 180 && this.dir.angle > 90 }
  get upleft ()   { return this.leftup }
  get up ()       { return this._dir.size > 0 && this.dir.angle > 45 && this.dir.angle < 135 }
  get upright ()  { return this._dir.size > 0 && this.dir.angle <= 90 && this.dir.angle >= 0 }
  get rightup ()  { return this.upright }
  get right ()    { return this._dir.size > 0 && ((this.dir.angle >= 275 && this.dir.angle <= 360) || this.dir.angle <= 45) }
  get rightdown () { return this._dir.size > 0 && this.dir.angle <= 360 && this.dir.angle > 270 }
  get down ()     { return this._dir.size > 0 && this.dir.angle > 225 && this.dir.angle < 275 }
  get downright () { return this.rightdown }
  get downleft () { return this.leftdown }

}

export default Controls