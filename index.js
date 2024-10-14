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

let comments = [
    {
        id: uuid(),
        username: 'Todd',
        comment: 'lol that is so funny!'
    },
    {
        id: uuid(),
        username: 'Skyler',
        comment: 'I like to go birdwatching with my dog'
    },
    {
        id: uuid(),
        username: 'Sk8erBoi',
        comment: 'Plz delete your account, Todd'
    },
    {
        id: uuid(),
        username: 'onlysayswoof',
        comment: 'woof woof woof'
    }
];

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
console.log(userData);

voteData = getConfig('public/data/vote.json');
console.log(voteData);


app.get("/home", (req, res) => {
    res.render("home", {comments});
});

app.get("/view1", (req, res) => {
    res.render("view1");
});

app.get("/editor", (req, res) => {
    res.render("editor");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/vote_card", (req, res) => {
    res.render("vote_card", {voteData});
});

// Fallback route should be placed at the end
app.get("*", (req, res) => {
    res.render("home", {comments});
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
