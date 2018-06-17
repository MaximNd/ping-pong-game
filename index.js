const http = require('http');
const socketIO = require('socket.io');

const server = http.createServer();
const io = socketIO(server);

const Canvas = require('./PingPongGame/Canvas');
const PingPongGame = require('./PingPongGame/PingPongGame');

const games = {};

io.on('connection', socket => {
    socket.on('joinRoom', ({ roomID, userID, battleTypeData }) => {
        socket.join(roomID, () => {
            io.sockets.clients((err) => {
                if (err) {
                    console.log(`JOIN ROOM ID(${roomID}), ERROR:`, err);
                    return;
                } else if (games[roomID]) {
                    games[roomID].addRacket(userID).initRackets().reset().start();
                } else {
                    games[roomID] = new PingPongGame(new Canvas(1440, 720), battleTypeData.name, roomID, io, battleTypeData.walls);
                    games[roomID].addRacket(userID);
                }
                console.log(`USER ${userID} JOINED TO THE ROOM WITH ID ${roomID}`);
                socket.emit('joined', games[roomID].rackets.length === 1 ? 0 : 1);
            });

            socket.on('play', userID => {
                games[roomID].play(userID);
            });

            socket.on('rackedMooved', ({ y_coordinate, userID }) => {
                console.log(`USER ${userID} MOVED RACKET TO Y:${y_coordinate}`);
                games[roomID].moveRacket(y_coordinate, userID);
                socket.broadcast.to(roomID).emit('enemyMovedRacket', y_coordinate);
            });
        });
    });
    

    socket.on('leaveRoom', roomID => {
        if (games[roomID]) {
            delete games[roomID];
        }
        socket.leave(roomID);
    });
    
    // socket.on('send message', function(data) {
    //     console.log('sending room post', data.room);
    //     socket.broadcast.to(data.room).emit('conversation private post', {
    //         message: data.message
    //     });
    // });
});

// let i = 0;

// function test() {
//     if ( i < 100 ) {
  
//         ++i;
//         console.log('TEST - i: ', i);
//         process.nextTick(function() {
//             console.log('(nextTick) TEST - i: ', i);
//             test();
//         });
//     }
// };
// test();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));