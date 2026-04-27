import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Garv@gr897",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function visit(){
  const code = await db.query("SELECT country_code FROM visited_countries");
  let visit_code = [];
  code.rows.forEach((country)=>{
    visit_code.push(country.country_code);
  });
  return visit_code;
}

app.get("/", async (req, res) => {
  //Write your code here.
  const visited_code = await visit();
  res.render("index.ejs",{
    total:visited_code.length,
    countries: visited_code,
  });
});

app.post("/add", async (req,res)=>{
  const countr = req.body.country;
  try{
    const codes = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",[countr.toLowerCase()]);
    const row = codes.rows[0];
    const code = row.country_code;   //Error triggered here if no such country exist since list will be empty.
    try{
        await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)",[code]);   //Error here if country already added to visited_countries since country_code is unique.
        res.redirect("/");
      } catch(err){
      console.log(err);
      const visited_code = await visit();
      res.render("index.ejs",{
        total:visited_code.length,
        countries: visited_code,
        error: "Country has already been added. Try again.",
      });
    }
  } catch (err){
    console.log(err);
    const visited_code = await visit();
    res.render("index.ejs",{
      total:visited_code.length,
      countries: visited_code,
      error: "Country Name doesn't exist. Try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
