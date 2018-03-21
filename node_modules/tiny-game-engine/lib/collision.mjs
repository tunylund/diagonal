import { xyz } from './xyz.mjs'
import { position } from './position.mjs'

export function intersects (apos, adim, bpos, bdim) {
  if (adim.sum() === 0) return false
  if (bdim.sum() === 0) return false
  return intersectsDir(apos.cor, adim, bpos.cor, bdim, 'x') && intersectsDir(apos.cor, adim, bpos.cor, bdim, 'y') && intersectsDir(apos.cor, adim, bpos.cor, bdim, 'z')
}

function intersectsDir (acor, adim, bcor, bdim, dir) {
  return overlapDir(acor[dir], acor[dir] + adim[dir], bcor[dir], bcor[dir] + bdim[dir]) > 0
}

function overlapDir(a1, a2, b1, b2) {
  return a1 > b2 ? 0 : a2 < b1 ? 0 :
         a1 < b1 ? a2 - b1 : a1 > b1 ? b2 - a1 :
         Math.max(a2, b2) - Math.min(a1, b1)
}

function overlap(acor, adim, bcor, bdim) {
  return xyz(
    overlapDir(acor.x, acor.x + adim.x, bcor.x, bcor.x + bdim.x),
    overlapDir(acor.y, acor.y + adim.y, bcor.y, bcor.y + bdim.y),
    overlapDir(acor.z, acor.z + adim.z, bcor.z, bcor.z + bdim.z)
  )
}

export function bump(a, collidables = [], dir = 'z') {
  const fixSelector = xyz(
    dir === 'x' ? 1 : 0,
    dir === 'y' ? 1 : 0,
    dir === 'z' ? 1 : 0
  )

  let correction = collidables
    .filter(c => intersects(a.pos, a.dim, c.pos, c.dim))
    .map(c => overlap(a.pos.cor, a.dim, c.pos.cor, c.dim))
    .reduce((a, b) => a.sum() > b.sum() ? a : b, xyz())
    .mul(a.pos.vel.signature)
    .mul(fixSelector)

  if (correction.sum() === 0) return a.pos
  else return position(
    a.pos.cor.sub(correction),
    a.pos.vel.mul(fixSelector.mul(xyz(-1, -1, -1)).add(xyz(1, 1, 1))),
    a.pos.acc
  )
}
