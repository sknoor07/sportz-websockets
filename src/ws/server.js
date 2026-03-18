import { setInterval } from "timers/promises";
import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";


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
       if(client.readyState!== WebSocket.OPEN) continue;
        try{
            client.send(JSON.stringify(payload));
        }catch(e){
            console.error("Failed to send JSON to client ",e);
        } 
    }
}

export function attachWebSocketToServer(server){
    const wss= new WebSocketServer({server,path:"/ws",maxPayload:1024*1024});

    wss.on('connection',async (socket,req)=>{
        if(wsArcjet){
            try{
                const decision = await wsArcjet.protect(req);
                if(decision.isDenied()){
                    const code=decision.reason.isRateLimit()?1013:1008;
                    const reason=decision.reason.isRateLimit()?"Too Many Requests":decision.reason.isBot()?"Bot Detected":"Access Denied";
                    socket.close(code,reason);
                    return;
                }
            }catch(e){
                console.error("Arcjet WebSocket error:",e);
                socket.close(1011,'Server Security Error');
                return;
            }
        }
        socket.isAlive=true;
        socket.on('pong',()=>socket.isAlive=true);
        sendJson(socket,{type:'welcome',message:'Connected to Sportz Live Feed'});
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
        broadcast(wss,{type:'match_created',data:match});
    }
    return {broadcastMatchCreated};
    
}