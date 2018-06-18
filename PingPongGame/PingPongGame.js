//@ts-check
const Ball = require('./Ball');
const Canvas = require('./Canvas');
const Racket = require('./Racket');
const Wall = require('./Wall');

/**
 * Return random value between min and max inclusive
 * @param {Number} min 
 * @param {Number} max 
 */
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

class PingPongGame {
    /**
     * 
     * @param {Canvas} canvas 
     * @param {String} gameType classic or advanced
     * @param {String} roomID
     * @param {SocketIO.Server} io 
     * @param {Number} walls
     */
    constructor(canvas, gameType, roomID, io, walls) {
        this._canvas = canvas;
        this._gameType = gameType;
        this._roomID = roomID;
        this._io = io;
        this.wallsCount = walls || 0;
        this.walls = [];
        this.innings = Math.random() >= 0.5;
        this.initialSpeed = this.gameType === 'classic' ? 250 : 350;
        this.increaseSpeedPerCollide = this.gameType === 'classic' ? 0.01 : 0.05;
        this.increaseSpeedPerRound = this.gameType === 'classic' ? 0.02 : 0.05;
        this.dt = 0.01663399999999092;
        this.isGameFinished = false;
        this.isInning = true;
        this.ball = new Ball();
        this.rackets = [];

        this.updateState = (dt) => {
            if (!this.isGameFinished) {
                this.update(dt);
                setTimeout(() => {
                    this.updateState(dt);
                }, 15);
            }
        }
        this.callback = () => {
            if (!this.isGameFinished) {
                const state = {
                    ball: this.ball,
                    rackets: this.rackets
                };
                if (this.gameType === 'advanced') {
                    state.walls = this.walls;
                }
                io.sockets.to(roomID).emit('state', state);
                setTimeout(() => {
                    this.callback();
                }, 100);
            }
        };
    }

    get canvas() {
        return this._canvas;
    }

    get gameType() {
        return this._gameType;
    }

    get roomID() {
        return this._roomID;
    }

    get io() {
        return this._io;
    }

    /**
     * 
     * @param {String} userID 
     */
    addRacket(userID) {
        this.rackets.push(new Racket(userID));
        return this;
    }

    initRackets() {
        this.rackets[0].pos.x = 10 + (this.rackets[0].size.x / 2);
        this.rackets[1].pos.x = this._canvas.width - 10 - (this.rackets[0].size.x / 2);
        this.rackets.forEach(r => r.pos.y = this._canvas.height / 2);
        return this;
    }

    setupWalls() {
        this.walls.length = 0;
        for (let i = 0; i < this.wallsCount; ++i) {
            this.walls.push(new Wall(10, rand(40, 90)));
            const oneThirdOfCanvas = this.canvas.width / 3;
            const halfOfWall = Math.round(this.walls[i].size.y / 2);
            this.walls[i].pos.x = rand(0, Math.round(oneThirdOfCanvas)) + oneThirdOfCanvas;
            this.walls[i].pos.y = rand(halfOfWall, this.canvas.height - halfOfWall); 
        }
    }

    /**
     * 
     * @param {Number} y_coordinate 
     * @param {String} userID 
     */
    moveRacket(y_coordinate, userID) {
        this.rackets.find(r => r.userID === userID).pos.y = y_coordinate;
        if (this.isInning && this.rackets[this.innings ? 0 : 1].userID === userID) {
            this.ball.pos.y = y_coordinate;
        }
        return this;
    }


    /**
     * 
     * @param {Racket} racket 
     * @param {Ball} ball 
     */
    collideBall(racket, ball) {
        if (racket.left < ball.right && racket.right >= ball.left &&
            racket.top < ball.bottom && racket.bottom > ball.top) {
            ball.vel.x = -(ball.vel.x + ball.vel.x * this.increaseSpeedPerCollide);
            const len = ball.vel.len;
            ball.vel.y += racket.vel.y * this.increaseSpeedPerCollide / 2;
            ball.vel.len = len;
        }
    }

    /**
     * 
     * @param {Wall} wall 
     * @param {Ball} ball 
     */
    collideWall(wall, ball) {
        if (wall.top <= ball.bottom && wall.bottom >= ball.top &&
            ball.pos.x >= wall.left && ball.pos.x <= wall.right) {
            ball.vel.y = -ball.vel.y;
        } else if (wall.left <= ball.right && wall.right >= ball.left &&
                   ball.pos.y >= wall.top && ball.pos.y <= wall.bottom) {
            ball.vel.x = -ball.vel.x;
        } 
    }
    
    /**
     * 
     * @param {String} userID 
     */
    play(userID) {
        if (this.rackets[this.innings ? 0 : 1].userID !== userID) return;
        this.isInning = false;
        if (this.ball.vel.x === 0 && this.ball.vel.y === 0) {
            this.ball.vel.x = 200 * (this.innings ? 1 : -1);
            this.ball.vel.y = Math.random() >= 0.5 ? rand(100, 300) : rand(-300, -100);
            this.initialSpeed += this.initialSpeed * this.increaseSpeedPerRound;
            this.ball.vel.len = this.initialSpeed;
        }
    }

    isEndGame() {
        return (this.rackets[0].score >= 11 || this.rackets[1].score >= 11) && Math.abs(this.rackets[0].score - this.rackets[1].score) >= 2;
    }

    /**
     * Reset state of all objects every inning
     */
    reset() {
        this.isInning = true;
        // Check if this is the end
        if (this.isEndGame()) {
            this.isGameFinished = true;
            return this;
        }

        // Set up walls on battleground if this is advanced mode
        if (this.gameType === 'advanced' && this.wallsCount != 0) {
            this.setupWalls();
        }
        
        let indexOfRacket = this.innings ? 0 : 1;
        if (this.rackets[indexOfRacket].countInnings === 2 
            || (this.rackets[0].countInnings >= 10 && this.rackets[1].countInnings >= 10 && this.rackets[indexOfRacket].countInnings === 1)) {
            this.rackets[indexOfRacket].countInnings = 0;
            this.innings = !this.innings;
            indexOfRacket = this.innings ? 0 : 1;
        } 
        ++this.rackets[indexOfRacket].countInnings;

        const b = this.ball;
        b.vel.x = 0;
        b.vel.y = 0;
        
        const offset = this.innings ? (this.rackets[indexOfRacket].size.x / 2)+20 : (-this.rackets[indexOfRacket].size.x / 2)-20;
        b.pos.x = this.rackets[indexOfRacket].pos.x + offset;
        b.pos.y = this.rackets[indexOfRacket].pos.y;
        return this;
    }

    start() {
        this.updateState(this.dt);
        this.callback();
        return this;
    }

    update(dt) {
        this.ball.pos.x += this.ball.vel.x * dt;
        this.ball.pos.y += this.ball.vel.y * dt;

        if (this.ball.left < 0 || this.ball.right > this._canvas.width) {
            ++this.rackets[this.ball.vel.x < 0 ? 1 : 0].score;
            this.reset();
        }

        if (this.ball.vel.y < 0 && this.ball.top < 0 ||
            this.ball.vel.y > 0 && this.ball.bottom > this._canvas.height) {
            this.ball.vel.y = -this.ball.vel.y;
        }

        this.rackets[0].update(dt);
        this.collideBall(this.rackets[0], this.ball);
        this.rackets[1].update(dt);
        this.collideBall(this.rackets[1], this.ball);

        this.walls.forEach(wall => this.collideWall(wall, this.ball));
    }
};

module.exports = PingPongGame;