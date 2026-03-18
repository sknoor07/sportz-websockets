import { WebSocket, WebSocketServer } from "ws";

function sendJson(socket, payload){
    if(socket.readyState!== WebSocket.OPEN) return;
    try{
        socket.send(JSON.stringify(payload));
    }catch(e){
        console.error("Failed to send JSON",e);
    }
}

function broadcast(wss,payload){
    for(const client of wss.clients){
       if(client.readyState!== WebSocket.OPEN) return;
        try{
            client.send(JSON.stringify(payload));
        }catch(e){
            console.error("Failed to send JSON to client ",e);
        } 
    }
}

export function attachWebSocketToServer(server){
    const wss= new WebSocketServer({server,path:"/ws",maxPayload:1024*1024});

    wss.on('connection',(socket)=>{
        sendJson(socket,{type:'welcome',message:'Connected to Sportz Live Feed'});
        socket.on('error',err=>{
            console.error("WebSocket error",err);
        });
    });

    function broadcastMatchCreated(match){
        broadcast(wss,{type:'match_created',data:match});
    }
    return {broadcastMatchCreated};
    
}