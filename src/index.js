import express from "express";
import matchRouter from "./routes/matches.js";
const app= express();
const port= 8000;

app.use(express.json());
app.use('/matches',matchRouter);

app.get("/",(req,res)=>{
    res.send("Hello from express");
});



app.listen(port,()=>{
    console.log(`server running on port: ${port}`)
});
