class Vec {
    /**
     * 
     * @param {Number} x 
     * @param {Number} y 
     */
    constructor(x = 0, y = 0) {
        this._x = x;
        this._y = y;
    }

    get x() {
        return this._x;
    }

    set x(val) {
        this._x = val;
    }

    get y() {
        return this._y;
    }

    set y(val) {
        this._y = val;
    }

    get len() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    set len(val) {
        if (this.len === 0) {
            this.x = 0;
            this.y = 0;
        } else {
            const f = val / this.len;
            this.x *= f;
            this.y *= f;
        }
    }
};

module.exports = Vec;