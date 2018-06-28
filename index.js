const http = require('http');
const socketIO = require('socket.io');

const server = http.createServer();
const io = socketIO(server);

const Canvas = require('./PingPongGame/Canvas');
const PingPongGame = require('./PingPongGame/PingPongGame');

const games = {};

io.on('connection', socket => {
    socket.on('joinRoom', ({ roomID, userID, skills, battleTypeData }) => {
        socket.join(roomID, () => {
            if (games[roomID] && games[roomID].coconnectedPlayers.length === 2) {
                const index = games[roomID].coconnectedPlayers.findIndex(userID => userID === socket.userID);
                socket.emit('joined', index);
                console.log(`USER ${userID} REJOINED TO THE ROOM WITH ID ${roomID}`);
            } else if (games[roomID] && games[roomID].coconnectedPlayers.length === 1) {
                games[roomID].coconnectedPlayers.push(userID);
                games[roomID].game.addRacket(userID).addSkills(userID, skills).initRackets().reset().start();
                socket.emit('joined', 1);
                console.log(`USER ${userID} JOINED TO THE ROOM WITH ID ${roomID}`);
            } else if (!games[roomID]) {
                games[roomID] = {
                    game: new PingPongGame(new Canvas(1440, 720), battleTypeData.name, roomID, io, battleTypeData.walls),
                    coconnectedPlayers: [userID]
                };
                games[roomID].game.addRacket(userID).addSkills(userID, skills);
                socket.emit('joined', 0);
                console.log(`USER ${userID} CREATED AND JOINED TO THE ROOM WITH ID ${roomID}`);
            }

            socket.on('play', userID => {
                games[roomID].game.play(userID);
            });

            socket.on('rackedMooved', ({ y_coordinate, userID }) => {
                console.log(`USER ${userID} MOVED RACKET TO Y:${y_coordinate}`);
                games[roomID].game.moveRacket(y_coordinate, userID);
                socket.broadcast.to(roomID).emit('enemyMovedRacket', y_coordinate);
            });

            socket.on('skillUsed', ({ skillButton, userID }) => {
                console.log(`USER_ID: ${userID}, SKILL_BUTTON: ${skillButton}`);
                games[roomID].game.execSkill(userID, skillButton);
            });
        });
        socket.on('leaveRoom', roomID => {
            if (games[roomID]) {
                delete games[roomID];
            }
            socket.leave(roomID);
        });
        socket.on('disconnect', () => {
            if (games[roomID] && games[roomID].game.isGameFinished) {
                delete games[roomID];
                socket.leave(roomID);
            }
        });
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));