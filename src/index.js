import express from "express";
import matchRouter from "./routes/matches.js";
import commentaryRouter from "./routes/commentary.js";
import http from "http";
import { attachWebSocketToServer } from "./ws/server.js";
import securityMiddleware from "./arcjet.js";

const PORT= Number(process.env.PORT || 8000);
const HOST= process.env.HOST || '0.0.0.0';

const app= express();
const server = http.createServer(app);

app.use(express.json());
app.use(securityMiddleware());
app.use('/matches',matchRouter);
//app.use('/commentary', commentaryRouter);
app.use('/matches/:id/commentary',commentaryRouter);

app.get("/",(  req,res)=>{
    res.send("Hello from express");
});

const { broadcastMatchCreated,broadcastCommentary }= attachWebSocketToServer(server);
app.locals.broadcastMatchCreated=broadcastMatchCreated; 
app.locals.broadcastCommentary=broadcastCommentary;

server.listen(PORT,HOST,()=>{
    const baseUrl=HOST==='0.0.0.0'?`http://localhost:${PORT}`:`http://${HOST}:${PORT}`;
    console.log(`server running on: ${baseUrl}`)
    console.log(`websocket server running on: ${baseUrl.replace('http','ws')}/ws`);
});
