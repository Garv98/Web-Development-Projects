import express from "express";
import {dirname} from "path";
import {fileURLToPath} from "url";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const d = new Date();
const dayNum = d.getDay();
var day = "";
var info = "";

app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res)=>{
    if (dayNum==0 || dayNum==6){
        day = "It's a weekend";
        info =  "it's time to have fun!";
    }
    else{
        day = "It's a weekday";
        info = "it's time to work hard!";
    }

    res.render("index.ejs", {Name: day, advice: info});
})

app.listen(port, ()=>{
    console.log(`Server is connected to port ${port}.`);
})