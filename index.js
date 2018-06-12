const http = require('http');
const socketIO = require('socket.io');

const server = http.createServer();
const io = socketIO(server);

const Canvas = require('./PingPongGame/Canvas');
const PingPongGame = require('./PingPongGame/PingPongGame');

const games = {};
// pingPong.start().play();

io.on('connection', socket => {
    // console.log('UserConnected: ', socket);
    socket.on('joinRoom', roomID => {
        socket.join(roomID, () => {
            io.sockets.clients((err) => {
                if (err) return;
                else if (games[roomID]) {
                    // TODO - Call start and play on games[roomID] obj
                } else {
                    games[roomID] = new PingPongGame(new Canvas(1000, 480), 'classic', roomID, io);
                }
            });
        });
    });
    

    socket.on('leaveRoom', roomID => {
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