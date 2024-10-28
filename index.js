const path = require('path');
const methodOverride = require('method-override');
const {v4: uuid} = require('uuid');
const express = require('express');
const fs = require('fs');
const app = express();
// const voteUtils = require("./public/javascripts/voteUtils");

const port = 6060;

// Views folder and EJS setup:
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.json()); // To parse incoming JSON in POST request body
app.use(methodOverride('_method')); // To 'fake' put/patch/delete requests
app.use(express.static(path.join(__dirname, 'public')));
app.use("/stylesheets", express.static('public/stylesheets'));

function readJsonFileSync(filepath, encoding) {

    if (typeof (encoding) == 'undefined') {
        encoding = 'utf8';
    }
    var file = fs.readFileSync(filepath, encoding);
    return JSON.parse(file);
}

function getConfig(file) {

    var filepath = __dirname + '/' + file;
    return readJsonFileSync(filepath);
}

userData = getConfig('public/data/user.json');

voteData = getConfig('public/data/vote.json');

app.get("/dashboard", (req, res) => {
    res.render("dashboard");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/navbar", (req, res) => {
    res.render("navbar");
});

// Fallback route should be placed at the end
app.get("*", (req, res) => {
    res.render("index", {voteData});
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
