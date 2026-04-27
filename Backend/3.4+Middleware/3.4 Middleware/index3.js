import express from "express";

const app = express();
const port = 3000;

function logger(req,res,next)
{
  console.log("Request Method: ",req.method," | Request URL: ",req.url);
  next();             // next() is very important
}

app.use(logger);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
