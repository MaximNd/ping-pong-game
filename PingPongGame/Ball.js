//@ts-check
const Rect = require('./Rect');
const Vec = require('./Vec');

class Ball extends Rect {
    constructor() {
        super(10, 10);
        this.vel = new Vec(0, 0);
    }
}

module.exports = Ball;