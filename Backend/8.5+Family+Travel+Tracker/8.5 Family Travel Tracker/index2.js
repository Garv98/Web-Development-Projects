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

let currentUserId = 1;

async function checkVisisted() {
  if (!currentUserId) {
    console.error("Error: currentUserId is not set.");
    return [];
  }

  const result = await db.query(
    "SELECT country_code FROM visited_countries JOIN users ON users.id=visited_countries.user_id WHERE visited_countries.user_id=$1",
    [currentUserId]
  );

  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

const result = await db.query("SELECT * FROM users");
let users = result.rows;

async function getCurrentUser() {
  if (!currentUserId) {
    console.error("Error: currentUserId is not set.");
    return null;
  }

  const result = await db.query("SELECT * FROM users");
  users = result.rows;

  const currentUser = users.find((user) => user.id == currentUserId);
  if (!currentUser) {
    console.error(`User with ID ${currentUserId} not found.`);
    return null;
  }

  return currentUser;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUser = await getCurrentUser();
  console.log(currentUser);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    if (result.rows.length === 0) {
      console.error("Country not found.");
      const visited_code = await checkVisisted();
      return res.render("index.ejs", {
        total: visited_code.length,
        countries: visited_code,
        error: "Country Name does not exist. Try again.",
      });
    }

    const data = result.rows[0];
    const countryCode = data.country_code;

    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.error("Error adding country:", err);
      const visited_code = await checkVisisted();
      res.render("index.ejs", {
        total: visited_code.length,
        countries: visited_code,
        error: "Country has already been added. Try again.",
      });
    }
  } catch (err) {
    console.error("Error fetching country:", err);
    const visited_code = await checkVisisted();
    res.render("index.ejs", {
      total: visited_code.length,
      countries: visited_code,
      error: "An error occurred. Try again.",
    });
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    console.log(req.body); // Debugging
    if (req.body.user) {
      currentUserId = parseInt(req.body.user); // Ensure it's an integer
      console.log(`Switched to user ID: ${currentUserId}`); // Debugging
      res.redirect("/");
    } else {
      res.status(400).send("Invalid user selection.");
    }
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const result = await db.query("INSERT INTO users (name,color) values ($1,$2) RETURNING *;",[req.body.name,req.body.color]);
  currentUserId = result.rows[0].id;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
