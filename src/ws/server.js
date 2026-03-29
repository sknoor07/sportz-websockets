import { setInterval } from "timers/promises";
import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

const matchSubscribers= new Map();

function subscribe(matchId, socket){
    if(!matchSubscribers.has(matchId)){
        matchSubscribers.set(matchId, new Set());
    }
    matchSubscribers.get(matchId).add(socket);
}

function unsubscribe(matchId,socket){
    const subscribers= matchSubscribers.get(matchId);
    if(!subscribers) return;
    subscribers.delete(socket);
    if(subscribers.size===0){
        matchSubscribers.delete(matchId);
        return;
    }
}

function cleanUpSubscribers(socket){
    for( const matchId of socket.subscriptions){
        unsubscribe(matchId,socket);
    }
}

function sendJson(socket, payload){
    if(socket.readyState!== WebSocket.OPEN) return;
    try{
        socket.send(JSON.stringify(payload));
    }catch(e){
        console.error("Failed to send JSON",e);
    }
}

function broadcastToAll(wss,payload){
    for(const client of wss.clients){
       if(client.readyState!== WebSocket.OPEN) continue;
        try{
            client.send(JSON.stringify(payload));
        }catch(e){
            console.error("Failed to send JSON to client ",e);
        } 
    }
}

function broadcastToMatch(matchId, payload){
    const subscribers= matchSubscribers.get(matchId);
    if(!subscribers || subscribers.size===0){
        return;
    }
    const message = JSON.stringify(payload);
    for( const client of subscribers){
        if(client.readyState===WebSocket.OPEN){
            client.send(message);
        }
    }
}

function handleMessage(socket,data){
let message;
try{
    message=JSON.parse(data.toString());
}catch(e){
    sendJson(socket,{type:'error',message:'Invalid JSON'});
    return;
}
if(message?.type==="subscribe" && Number.isInteger(message.matchId)){
    subscribe(message.matchId,socket);
    socket.subscriptions.add(message.matchId);
    sendJson(socket,{type:'subscribed',matchId:message.matchId});
    return;
}
if(message?.type=== "unsubscribe" && Number.isInteger(message.matchId)){
    unsubscribe(message.matchId,socket);
    socket.subscriptions.delete(message.matchId);
    sendJson(socket,{type:'unsubscribed',matchId:message.matchId});
    return;
}
}

export function attachWebSocketToServer(server){
    const wss= new WebSocketServer({ noServer: true, maxPayload:1024*1024 });

    server.on('upgrade', async (req, socket, head) => {
        if (req.url !== '/ws') {
            return;
        }

        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);
                if (decision.isDenied()) {
                    const status = decision.reason.isRateLimit() ? 429 : 403;
                    const reason = decision.reason.isRateLimit() ? "Too Many Requests" : decision.reason.isBot() ? "Bot Detected" : "Access Denied";
                    socket.write(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\n\r\n`);
                    socket.destroy();
                    return;
                }
            } catch (e) {
                console.error("Arcjet WebSocket error:", e);
                socket.write('HTTP/1.1 500 Internal Server Error\r\nConnection: close\r\n\r\n');
                socket.destroy();
                return;
            }
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });

    wss.on('connection', (socket, req) => {
        socket.isAlive=true;
        socket.on('pong',()=>socket.isAlive=true);
        socket.subscriptions = new Set();
        
        sendJson(socket,{type:'welcome',message:'Connected to Sportz Live Feed'});
        
        socket.on('message', (data) => {
    try {
        handleMessage(socket, data);
    } catch (err) {
        console.error("Message handling error:", err);
        sendJson(socket, { type: "error", message: "Internal error" });
    }
});
        socket.on('close',()=>cleanUpSubscribers(socket));
        socket.on('error',err=>{
            console.error("WebSocket error",err);
        });

        const interval= setInterval(()=>{
            wss.clients.forEach((ws)=>{
                if(ws.isAlive===false) return ws.terminate();
                ws.isAlive=false;
                ws.ping();
            });
        },3000);
        wss.on('close',()=>clearInterval(interval));
    });

    function broadcastMatchCreated(match){
        broadcastToAll(wss,{type:'match_created',data:match});
    }
    function broadcastCommentary(matchId,comment){
        broadcastToMatch(matchId,{type:'commentary_added',data:comment});
    }
    return {broadcastMatchCreated,broadcastCommentary};
    
}