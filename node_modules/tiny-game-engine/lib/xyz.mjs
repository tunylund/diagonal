class XYZ {
  constructor(x = 0, y = 0, z = 0) {
    if (x instanceof XYZ) {
      this._x = x.x
      this._y = x.y
      this._z = x.z
    } else {
      this._x = x
      this._y = y
      this._z = z
    }
    this._x2 = this._x / 2
    this._y2 = this._y / 2
    this._z2 = this._z / 2

    this._radian = (Math.atan2(this._y, this._x) + Math.PI * 2) % (Math.PI * 2)
    this._angle = (this._radian * 180 / Math.PI + 360) % 360
  }

  get x () { return this._x }
  get y () { return this._y }
  get z () { return this._z }

  get x2 () { return this._x2 }
  get y2 () { return this._y2 }
  get z2 () { return this._z2 }

  get angle () { return this._angle }
  get radian () { return this._radian }

  get signature() { return xyz(
    this._x === 0 ? 1 : Math.abs(this._x) / this._x,
    this._y === 0 ? 1 : Math.abs(this._y) / this._y,
    this._z === 0 ? 1 : Math.abs(this._z) / this._z
  )}

  get unit() { return this.signature.mul(xyz(
    this._x === 0 ? 0 : 1,
    this._y === 0 ? 0 : 1,
    this._z === 0 ? 0 : 1
  ))}

  get size () { return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z) }

  add (v) { return xyz(this._x + v.x, this._y + v.y, this._z + v.z) }
  sub (v) { return xyz(this._x - v.x, this._y - v.y, this._z - v.z) }
  mul (v) { return xyz(this._x * v.x, this._y * v.y, this._z * v.z) }
  sum () { return this._x + this._y + this._z }
}

function xyz (x = 0, y = 0, z = 0) { return new XYZ(x, y, z) }
function vector2(radian, size = 1) { return xyz(
  Math.round(size * Math.cos(radian) * 10000) / 10000,
  Math.round(size * Math.sin(radian) * 10000) / 10000
)}

export { xyz, vector2 }
