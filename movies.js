const config = require("config");
const express = require("express");
const logger = require("./logger");
const authenticate = require("./auth");
const Joi = require("joi");
const helmet = require("helmet");
const morgan = require("morgan");
const startupDebugger = require("debug")("app:startup");
const dbDebugger = require("debug")("app:db");
const app = express();

app.set("view engine", "pug");
app.set("views", "./views");

// app.set("view engine", "ejs");

app.use(express.json());
app.use(logger);
app.use(authenticate);
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(helmet({ referrerPolicy: { policy: "no-referrer" } }));

//configuration
console.log("Application:" + config.get("name"));
console.log("Mail Server:" + config.get("mail.host"));
// console.log("Mail Password:" + config.get("mail.password"));

if (app.get("env") === "development") {
  app.use(morgan("tiny"));
  startupDebugger("Morgan enabled...");
}

//dbConnection

dbDebugger("Connected to db successfully...");
console.log(`env:${app.get("env")}`);

const movies = [
  { id: 1, genre: "action" },
  { id: 2, genre: "horror" },
  { id: 3, genre: "thriller" },
];

app.get("/", (req, res) => {
  res.render("index", {
    title: "My movie app",
    message: "Welcome to movie genres!",
  });
});

app.get("/api/genres", (req, res) => {
  res.send(movies);
});

app.get("/api/genres/:id", (req, res) => {
  const movie = movies.find((c) => c.id === parseInt(req.params.id));
  if (!movie) return res.status(400).send("movie not found");
  res.send(movie);
});

app.post("/api/genres", (req, res) => {
  const { error } = validateMovie(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const movie = {
    id: movies.length + 1,
    genre: req.body.genre,
  };
  movies.push(movie);
  res.send(movie);
});

app.put("/api/genres/:id", (req, res) => {
  const movie = movies.find((c) => c.id === parseInt(req.params.id));
  if (!movie) return res.status(400).send("movie not found");

  const { error } = validateMovie(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  movie.genre = req.body.genre;
  res.send(movie);
});

app.delete("/api/genres/:id", (req, res) => {
  const movie = movies.find((c) => c.id === parseInt(req.params.id));
  if (!movie) return res.status(400).send("movie not found");
  const index = movies.indexOf(movie);
  movies.splice(index, 1);
  res.send(movie);
});

function validateMovie(movie) {
  const schema = {
    genre: Joi.string().min(5).required(),
  };
  return Joi.validate(movie, schema);
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
