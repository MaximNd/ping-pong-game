//@ts-check
const Rect = require('./Rect');
const Vec = require('./Vec');

class Racket extends Rect {
    /**
     * 
     * @param {String} userID 
     */
    constructor(userID) {
        super(10, 100);
        this.userID = userID;
        this.vel = new Vec();
        this.score = 0;

        this._lastPos = new Vec();
        this.countInnings = 0;
    }

    update(dt) {
        this.vel.y = (this.pos.y - this._lastPos.y) / dt;
        this._lastPos.y = this.pos.y;
    }
};

module.exports = Racket;