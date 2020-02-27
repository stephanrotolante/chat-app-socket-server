var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
const fs = require('fs');
const path = require('path');

const getUUID  = require('./getUUID');

const indexPath = path.join(__dirname,'/src/public/index.html');
const jsPath = path.join(__dirname,'/dist/main.js');
// Data Structure to hold all of the unconnected sockets
let sockets = {};
let unmatchedSockets = []

let chatRooms = {};




app.get('/',(req,res) => {
    fs.readFile(indexPath, (err, file) => {
        if(err) {
            res.send(500,{error: err});
        } else {
            res.writeHeader(200, {"Content-Type": "text/html"});
            res.write(file);
            res.end();
        }
    })
});


app.get('/dist/main.js',(req,res) => {
    fs.readFile(jsPath, (err, file) => {
        if(err) {
           console.log("Error getting the javaScript")
        }
        res.writeHeader(200, {"Content-Type": "text/javascript"});
        res.write(file);
        res.end();
    })
})

io.on('connection',  socket => {
   

    socket.on('client-disconnected', id => {
        console.log("a client disconnected", id);

        const {matched = false, partnerClientID, matchedID} = sockets[id] || {};
        //have to do some clean up incase the 
        if(matched) {
            sockets[partnerClientID].matched = false;

            //reset the partner partner id
            sockets[partnerClientID].partnerClientID = '';

            sockets[partnerClientID].matchedID = undefined;

            io.to(matchedID).emit('partner-disconnected');   

            //push partner id to unmatched pool

            unmatchedSockets.push(partnerClientID);
        } 
        

        delete sockets[id];

    })

    //New client connects
    socket.on("new-client",  id => {
        console.log('new connection', id);
        if(!sockets[id]){
            const socketData = {
                id,
                matched: false,
                socket,
                matchedID: undefined,
                partnerClientID: ''
            };

            sockets[id] = socketData;
            unmatchedSockets.push(id);
        }

    });

  
    socket.on('find-new-match', id => {
        console.log("find new match")
    })

    socket.on('message',({id, message}) =>  {

        const { matchedID } =  sockets[id];

        console.log(id, 'sending message'); 

        io.to(matchedID).emit('message',message);
    });


    socket.on('find-new-match', id  => {

        const { matchedID, partnerClientID } =  sockets[id];

        // set client id to unmatched
        sockets[id].matched = false
     
        sockets[partnerClientID].matched = false;

        //reset the partner partner id
        sockets[partnerClientID].partnerClientID = '';

        sockets[partnerClientID].matchedID = undefined;

        io.to(matchedID).emit('partner-disconnected');
    
        // push client ID to the umatched pool
        unmatchedSockets.push(id);

        //push partner id to unmatched pool

        unmatchedSockets.push(partnerClientID);

        //reset the  client partner id
        sockets[id].partnerClientID = '';
        sockets[id].matchedID = undefined;
       


    })

});

server.listen(3000, '0.0.0.0',() => {
    console.log("Server is up");
});

setInterval(() => {
 
    if(unmatchedSockets.length >1){

        const ID = unmatchedSockets.splice(0,2);

        let client1;
        let client2;

        //Checks to ses if the sockets exist
        if(sockets[ID[0]] && !sockets[ID[1]]) {

            unmatchedSockets.push(ID[0]);

            return;

        } else if(!sockets[ID[0]] && sockets[ID[1]]) {

            unmatchedSockets.push(ID[1]);

            return;

        }else {
            client1 = sockets[ID[0]];
            client2 = sockets[ID[1]];
        }

        client1.matchedID = client2.socket.id;
        client2.matchedID = client1.socket.id;

        client1.partnerClientID = ID[1];
        client2.partnerClientID = ID[0];

        client1.matched = true;
        client2.matched = true;

        client1.socket.emit('match-found');
        client2.socket.emit('match-found');
       

        console.log("matched");


    }
}, 7000);
