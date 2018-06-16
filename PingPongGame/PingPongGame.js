//@ts-check
const Ball = require('./Ball');
const Canvas = require('./Canvas');
const Racket = require('./Racket');
const Rect = require('./Rect');

class PingPongGame {
    /**
     * 
     * @param {Canvas} canvas 
     * @param {String} gameType classic or advanced
     * @param {String} roomID
     * @param {SocketIO.Server} io 
     */
    constructor(canvas, gameType, roomID, io) {
        this._canvas = canvas;
        this._gameType = gameType;
        this._roomID = roomID;
        this._io = io;
        this.innings = Math.random() >= 0.5;
        this.initialSpeed = this.gameType === 'classic' ? 250 : 350;
        this.increaseSpeedPerCollide = this.gameType === 'classic' ? 0.01 : 0.05;
        this.increaseSpeedPerRound = this.gameType === 'classic' ? 0.02 : 0.05;
        this.dt = 0.01663399999999092;
        // this.dt = 0.001;
        console.log(this.dt);
        this.isGameFinished = false;
        this.isInning = true;
        this.ball = new Ball();
        this.rackets = [];
        // TODO remove i var
        // let i = 0;
        this.updateState = (dt) => {
            if (!this.isGameFinished) {
                this.update(dt);
                setTimeout(() => {
                    this.updateState(dt);
                }, 15);
            }
        }
        this.callback = () => {
            // if(i === 10000) this.isGameFinished = true;
            if (!this.isGameFinished) {
                // ++i;
                // console.log(this.ball.pos.x);
                io.sockets.to(roomID).emit('state', {
                    ball: this.ball,
                    rackets: this.rackets
                });
                setTimeout(() => {
                    this.callback();
                }, 1000);
            }
        };
        
        // this._frameCallback = (millis) => {
        //     if (lastTime !== null) {
        //         const diff = millis - lastTime;
        //         this.update(diff / 1000);
        //     }
        //     lastTime = millis;
        //     requestAnimationFrame(this._frameCallback);
        // };

        // this.reset();
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
        this.rackets[0].pos.x = 40;
        this.rackets[1].pos.x = this._canvas.width - 40;
        this.rackets.forEach(r => r.pos.y = this._canvas.height / 2);
        return this;
    }

    /**
     * 
     * @param {Number} y_coordinate 
     * @param {String} userID 
     */
    moveRacket(y_coordinate, userID) {
        this.rackets.find(r => r.userID === userID).pos.y = y_coordinate;
        return this;
    }


    /**
     * 
     * @param {Racket} racket 
     * @param {Ball} ball 
     */
    collide(racket, ball) {
        if (racket.left < ball.right && racket.right >= ball.left &&
            racket.top < ball.bottom && racket.bottom > ball.top) {
            ball.vel.x = -ball.vel.x * this.increaseSpeedPerCollide;
            const len = ball.vel.len;
            ball.vel.y += racket.vel.y * this.increaseSpeedPerCollide / 2;
            ball.vel.len = len;
        }
    }
    
    play() {
        this.isInning = false;
        if (this.ball.vel.x === 0 && this.ball.vel.y === 0) {
            this.ball.vel.x = 200 * (this.innings ? 1 : -1);
            this.ball.vel.y = 200 * (Math.random() * 2 - 1);
            this.initialSpeed += this.initialSpeed * this.increaseSpeedPerRound;
            this.ball.vel.len = this.initialSpeed;
        }
    }

    isEndGame() {
        return (this.rackets[0].score >= 12 || this.rackets[1].score >= 12) && Math.abs(this.rackets[0].score - this.rackets[1].score) >= 2;
    }

    reset() {
        this.isInning = true;
        if (this.isEndGame()) {
            this.isGameFinished = true;
            return;
        }
        
        let indexOfRacket = this.innings ? 0 : 1;
        if (this.rackets[indexOfRacket].countInnings === 2 
            || (this.rackets[0].countInnings >= 11 && this.rackets[1].countInnings >= 11) && this.rackets[indexOfRacket].countInnings === 1) {
            this.rackets[indexOfRacket].countInnings = 0;
            this.innings = !this.innings;
            indexOfRacket = this.innings ? 0 : 1;
        } else {
            ++this.rackets[indexOfRacket].countInnings;
        }

        const b = this.ball;
        b.vel.x = 0;
        b.vel.y = 0;
        
        const offset = this.innings ? (this.rackets[indexOfRacket].size.x / 2)+5 : (-this.rackets[indexOfRacket].size.x / 2)-5;
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
        this.collide(this.rackets[0], this.ball);
        this.rackets[1].update(dt);
        this.collide(this.rackets[1], this.ball);
    }
};

module.exports = PingPongGame;