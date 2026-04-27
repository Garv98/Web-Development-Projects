import express from "express";
const app = express();
const port = 3000;

app.get("/", (req, res)=>{
    res.send("<h1>Home Page</h1>");
});

app.get("/contact", (req, res)=>{
    res.send("<h1>Contact Number</h1><p>+91 6901085253</p>");
})

app.get("/about", (req, res)=>{
    res.send("<p>My name is Garv Agarwalla.<br />I am currently pursuing B.E. in AIML.</p>")
})

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}.`);
});