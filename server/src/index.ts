import express from "express";
import "dotenv/config";


const app = express();
const port = process.env.PORT || 8081;


 app.get("/",(req,res)=>{
   res.send("server is running");
 }
 )
 app.get("/health",(req,res)=>{
  res.json({success:true,message:"server is running"});
 })

 app.listen(port, () => {
   console.log(`server is running on port no ${port}`);
});
