import path from 'path';
import methodOverride from 'method-override';
import express from 'express';
import cookieSession from "cookie-session"
import {fileURLToPath} from 'url';
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

app.use(cookieSession({
    name: 'session',
    keys: ['sdkfhkdshfkjhdksfjhghsjdfgkjhfadskjgh'],
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.get("/dashboard", async (req, res) => {
    try {
        const voteData = await databaseHelper.getVoteData();
        res.render("dashboard", {voteData: voteData});
    } catch (error) {
        console.error("Error fetching vote data:", error);
        res.status(500).send("Error fetching vote data");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/Register", (req, res) => {
    res.render("Register");
});

app.get("/navbar", (req, res) => {
    res.render("navbar");
});

app.post("/api/user/check-credentials", async (req, res) => {
    if (req.session.authenticated) {
        console.log("User already authenticated");
        res.redirect("/index");
    } else {
        const username = req.body.username;
        const password = req.body.password;

        try {
            const uid = await databaseHelper.checkCredentials(username, password);
            if (uid) {
                req.session.uid = uid;
                req.session.authenticated = true;
                res.json({success: true, message: "Login successful", uid: uid});
                console.log("User logged in successfully");
            } else {
                res.json({success: false, message: "Login failed", uid: null});
                console.log("User login failed");
            }
        } catch (err) {
            res.json({success: false, message: "Login failed", uid: null});
            console.error("Check your credentials again", err);
        }
    }

});

app.post("/api/user/change-username", async (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).json({success: false, message: "User is not logged in, cannot perform action"});
    }
    try {
        const result = await databaseHelper.changeUserName(req.session.uid, req.body.newUsername);
        res.json({success: true, message: "Change username successful", newUsername: result.username});
    } catch (error) {
        console.error("Error changing username:", error);
        res.status(400).json({success: false, message: error.message});
    }
});

app.post("/api/user/change-password", async (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).json({success: false, message: "User is not logged in, cannot perform action"});
    }
    if (!req.body.newPassword || !req.body.oldPassword) {
        return res.status(400).json({success: false, message: "Please provide your old and new password"});
    }
    try {
        const result = await databaseHelper.changeUserName(req.session.uid, req.body.oldPassword, req.body.newPassword);
        res.json({success: true, message: "Change password successful"});
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(400).json({success: false, message: error.message});
    }
});

app.post("/api/user/change-email", async (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).json({success: false, message: "User is not logged in, cannot perform action"});
    }

    if (!req.body.newEmail) {
        return res.status(400).json({success: false, message: "New email is required"});
    }

    try {
        const result = await databaseHelper.changeUserEmail(req.session.uid, req.body.newEmail);
        res.json({success: true, message: "Email changed successfully", newEmail: result.email});
    } catch (error) {
        console.error("Error changing email:", error);
        res.status(400).json({success: false, message: error.message});
    }
});

app.post("/api/user/register", async (req, res) => {
    if (req.session.authenticated) {
        return res.status(400).json({success: false, message: "User is already logged in, cannot register a new account"});
    }

    const { username, password, email, phoneNum } = req.body;

    if (!username || !password || !email || !phoneNum) {
        return res.status(400).json({success: false, message: "Please provide all required fields"});
    }

    try {
        const result = await databaseHelper.createNewUser(username, password, email, phoneNum);

        // Set session data
        req.session.authenticated = true;
        req.session.uid = result.uid;
        req.session.username = username;

        res.json({
            success: true,
            message: "User registered successfully",
            uid: result.uid,
            username: result.userInfo.username,
            email: result.userInfo.email
        });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(400).json({success: false, message: error.message});
    }
});

app.post("/api/user/logout", async (req, res) => {
    if (req.session.authenticated) {
        req.session = null;
        res.json({success: true, message: "Logout successful", redirect: "/login"});
    } else {
        res.status(401).json({success: false, message: "Logout failed due to session not found", redirect: "/login"});
    }
});

app.post("/api/vote/vote-for-options", async (req, res) => {
    if (req.session.authenticated) {

    } else {
        res.redirect("/login");
    }
});

app.post("/api/vote/update", async (req, res) => {
    const voteData = req.body;
    console.log("voteData", voteData);

    try {
        const updatedVote = await databaseHelper.updateVote(voteData.voteId, voteData);
        res.json({success: true, message: "Vote saved successfully", vote: updatedVote});
    } catch (error) {
        console.error("Error updating vote:", error);
        res.status(500).json({success: false, message: "Error updating vote", error: error.message});
    }
});

app.post("/api/vote/delete", async (req, res) => {
    const voteId = req.body.voteId;
    try {
        await databaseHelper.removeVoteEntry(voteId);
        console.log(`Vote ${voteId} deleted successfully`);
    } catch (err) {
        console.error("Error deleting vote:", err);
        res.status(500).json({success: false, message: "Error deleting vote", error: err.message});
    }
});

// Fallback route should be placed at the end
app.get("*", async (req, res) => {
    try {
        const voteData = await databaseHelper.getVoteData();
        res.render("index", {voteData: voteData});
    } catch (error) {
        console.error("Error fetching vote data:", error);
        res.status(500).send("Error fetching vote data");
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});