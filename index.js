import path from 'path';
import methodOverride from 'method-override';
import { v4 as uuid } from 'uuid';
import express from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as databaseHelper from './public/javascripts/databaseHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 6060;

// Views folder and EJS setup:
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.json()); // To parse incoming JSON in POST request body
app.use(methodOverride('_method')); // To 'fake' put/patch/delete requests
app.use(express.static(path.join(__dirname, 'public')));
app.use("/stylesheets", express.static('public/stylesheets'));

// In-memory storage for votes (replace with database in production)
let votes = {};

app.get("/dashboard", async (req, res) => {
    try {
        const voteData = await databaseHelper.getVoteData();
        res.render("dashboard", { voteData: voteData });
    } catch (error) {
        console.error("Error fetching vote data:", error);
        res.status(500).send("Error fetching vote data");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/navbar", (req, res) => {
    res.render("navbar");
});

// New API route to save vote data
app.post("/api/vote/update", async (req, res) => {
    const voteData = req.body;
    console.log("voteData", voteData);

    try {
        const updatedVote = await databaseHelper.updateVote(voteData.voteId, voteData);
        res.json({ success: true, message: "Vote saved successfully", vote: updatedVote });
    } catch (error) {
        console.error("Error updating vote:", error);
        res.status(500).json({ success: false, message: "Error updating vote", error: error.message });
    }
});

// Fallback route should be placed at the end
app.get("*", async (req, res) => {
    try {
        const voteData = await databaseHelper.getVoteData();
        res.render("index", { voteData: voteData });
    } catch (error) {
        console.error("Error fetching vote data:", error);
        res.status(500).send("Error fetching vote data");
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});