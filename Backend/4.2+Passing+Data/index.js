import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/submit", (req, res) => {
  var fNameLen = req.body["fName"].length;
  var lNameLen = req.body["lName"].length;
  res.render("index.ejs", {
    totalLen: fNameLen+lNameLen
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
