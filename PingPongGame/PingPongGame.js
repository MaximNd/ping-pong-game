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
        this.increaseSpeedPerCollide = this.gameType === 'classic' ? 1.01 : 1.05;
        this.increaseSpeedPerRound = this.gameType === 'classic' ? 1.02 : 1.05;
        this.dt = 0.01663399999999092;
        this.isGameFinished = false;
        this.ball = new Ball();

        this.rackets = [
            new Racket(),
            new Racket(),
        ];

        this.rackets[0].pos.x = 40;
        this.rackets[1].pos.x = this._canvas.width - 40;
        this.rackets.forEach(r => r.pos.y = this._canvas.height / 2);
        // TODO remove i var
        let i = 0;
        this.callback = (dt) => {
            if(i === 200) this.isGameFinished = true;
            if (!this.isGameFinished) {
                this.update(dt);
                ++i;
                process.nextTick(() => {
                    this.callback(this.dt);
                });
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

        this.reset();
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
     * @param {Racket} racket 
     * @param {Ball} ball 
     */
    collide(racket, ball) {
        if (racket.left < ball.right && racket.right > ball.left &&
            racket.top < ball.bottom && racket.bottom > ball.top) {
            ball.vel.x = -ball.vel.x * 1.05;
            const len = ball.vel.len;
            ball.vel.y += racket.vel.y * .2;
            ball.vel.len = len;
        }
    }
    
    play() {
        const b = this.ball;
        if (b.vel.x === 0 && b.vel.y === 0) {
            b.vel.x = 200 * (Math.random() > .5 ? 1 : -1);
            b.vel.y = 200 * (Math.random() * 2 - 1);
            b.vel.len = this.initialSpeed;
        }
    }

    isEndGame() {
        return (this.rackets[0].score >= 12 || this.rackets[1].score >= 12) && Math.abs(this.rackets[0].score - this.rackets[1].score) >= 2;
    }

    reset() {
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
        
        const offset = this.innings ? this.rackets[indexOfRacket].size.x / 2 : -this.rackets[indexOfRacket].size.x / 2;
        b.pos.x = this.rackets[indexOfRacket].pos.x + offset;
        b.pos.y = this.rackets[indexOfRacket].pos.y;
    }

    start() {
        this.callback(this.dt);
        return this;
    }

    update(dt) {
        const cvs = this._canvas;
        const ball = this.ball;
        ball.pos.x += ball.vel.x * dt;
        ball.pos.y += ball.vel.y * dt;

        if (ball.left < 0 || ball.right > cvs.width) {
            ++this.rackets[ball.vel.x < 0 ? 1 : 0].score;
            this.reset();
        }

        if (ball.vel.y < 0 && ball.top < 0 ||
            ball.vel.y > 0 && ball.bottom > cvs.height) {
            ball.vel.y = -ball.vel.y;
        }

        this.rackets.forEach(r => {
            r.update(dt);
            this.collide(r, ball);
        });
    }
};

module.exports = PingPongGame;