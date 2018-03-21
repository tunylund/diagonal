import setup from './../node_modules/tiny-game-engine/lib/draw.mjs'
import loop from './../node_modules/tiny-game-engine/lib/loop.mjs'
import gameLoop from './game.mjs'

const { draw, isometricDraw, stopDrawLoop } = setup(window)
const stopGameLoop = loop(gameLoop(draw, isometricDraw))
