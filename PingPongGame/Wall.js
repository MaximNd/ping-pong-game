//@ts-check
const Rect = require('./Rect');
const Vec = require('./Vec');

class Wall extends Rect {
    constructor(w, h) {
        super(w, h);
    }

    setPosition(x, y) {
        this.pos.x = x;
        this.pos.y = y;
        return this;
    }
};

module.exports = Wall;