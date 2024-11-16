import path from 'path';
import methodOverride from 'method-override';
import express from 'express';
import cookieSession from "cookie-session"
import {fileURLToPath} from 'url';
import * as databaseHelper from './public/javascripts/databaseHelper.js';
import {voteForOptions} from "./public/javascripts/databaseHelper.js";
import {v4 as uuid} from 'uuid';

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
    keys: ['8ddee61f-3694-4bb8-8750-5ef7f0076614'],
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.authenticated) {
        return res.redirect('/login');
    }
    next();
};

app.get("/", (req, res) => {
    res.redirect("/login");
});

app.get("/dashboard", requireAuth, async (req, res) => {
    try {
        const voteData = await databaseHelper.getVoteData();
        res.render("dashboard", {voteData: voteData});
    } catch (error) {
        console.error("Error fetching vote data:", error);
        res.status(500).send("Error fetching vote data");
    }
});

app.get("/register", (req, res) => {
    // Check if user is already authenticated
    if (req.session && req.session.authenticated) {
        return res.redirect("/index");
    }
    res.render("Register");
});

app.get("/login", (req, res) => {
    // Check if user is already authenticated
    if (req.session && req.session.authenticated) {
        return res.redirect("/index");
    }
    res.render("login");
});

app.get("/navbar", (req, res) => {
    res.render("navbar");
});

app.get("/settings", requireAuth, (req, res) => {
    res.render("settings");
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
    // Check if user is already logged in
    if (req.session && req.session.authenticated) {
        return res.status(400).json({
            success: false,
            message: "User is already logged in, please log out first"
        });
    }

    const { username, password, email, phoneNum } = req.body;

    try {
        const result = await databaseHelper.createNewUser(uuid(), username, password, email, phoneNum);

        // Set session data
        req.session = {
            authenticated: true,
            uid: result.uid,
            username: username
        };

        res.json({
            success: true,
            message: "User registered successfully",
            uid: result.uid,
            username: result.userInfo.username,
            email: result.userInfo.email
        });
    } catch (error) {
        // Catch the error and send it back to the client
        console.error("Error during user registration:", error.message); // Log the error for debugging
        res.status(400).json({ success: false, message: error.message });
    }
});

app.post("/api/user/logout", (req, res) => {
    // Destroy the session
    req.session = null;
    res.status(200).json({
        success: true,
        message: "Logout successful"
    });

});

app.post("/api/vote/vote-for-options", async (req, res) => {
    if (req.session.authenticated) {
        try {
            // Extract userUID from session, and voteID and voteOptionID from the request body
            const userUID = req.session.uid;
            const { voteID, voteOptionID } = req.body;

            // Validate input
            if (!voteID || !voteOptionID) {
                return res.status(400).json({ error: "Invalid voteID or voteOptionID" });
            }

            // Call the voteForOptions function to register the vote
            const updatedVoteRecord = await voteForOptions(userUID, voteID, voteOptionID);

            // Send a success response with the updated vote record
            res.status(200).json({ message: "Vote recorded successfully", updatedVoteRecord });
        } catch (err) {
            console.error("Error in voteForOptions:", err);
            res.status(500).json({ error: err.message });
        }
    } else {
        res.status(401).json({ error: "Unauthorized. Please log in." });
    }
});

app.post("/api/vote/update", async (req, res) => {
    const voteData = req.body;
    console.log("voteData", voteData);

    try {
        const updatedVote = await databaseHelper.updateVote(req.session.uid, voteData.voteId, voteData);
        res.json({success: true, message: "Vote saved successfully", vote: updatedVote, voteID: updatedVote.voteId});
    } catch (error) {
        console.error("Error updating vote:", error);
        res.status(500).json({success: false, message: "Error updating vote", error: error.message});
    }
});

app.post("/api/vote/delete", async (req, res) => {
    const voteId = req.body.voteId;
    try {
        console.log(`Deleting vote ${voteId}`);
        await databaseHelper.removeVoteEntry(req.session.uid, voteId);
        console.log(`Vote ${voteId} deleted successfully`);
    } catch (err) {
        console.error("Error deleting vote:", err);
        res.status(500).json({success: false, message: "Error deleting vote", error: err.message});
    }
});

app.post("/api/vote/getStat", async (req, res) => {
    try {
        const { voteId } = req.body;
        if (!voteId) {
            return res.status(400).json({ error: 'voteId is required' });
        }

        const voteStatistics = await databaseHelper.getVoteStatistics(voteId);

        res.json(voteStatistics);
    } catch (error) {
        console.error('Error fetching vote statistics:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

app.post("/api/vote/check-voted", async (req, res) => {
    try {
        console.log("Checking if user has voted");
        const hasVoted = await databaseHelper.checkIfVoted(req.body.voteID, req.session.uid);
        console.log("User has voted:", hasVoted);
        res.json({ hasVoted: hasVoted });
    } catch (error) {
        console.error("Error checking if user has voted:", error);
        res.status(500).json({ error: "An error occurred while checking vote status" });
    }
});

app.post("/api/vote/get-vote-option", async (req, res) => {
    const voteId = req.body.voteId;
    if (!voteId) {
        return res.status(400).json({ error: "voteId is required" });
    }

    try {
        const voteOption = await databaseHelper.getVotedOption(req.session.uid, voteId);
        res.json({ voteOption });
    } catch (error) {
        console.error("Error fetching vote option:", error);
        if (error.message.includes("not found")) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.get("/api/vote/getDateModified", async (req, res) => {
    const voteId = req.query.voteId;
    try {
        const vote = await databaseHelper.getVoteById(voteId);
        if (vote) {
            res.json({ dateModified: vote.dateModified });
        } else {
            res.status(404).json({ error: "Vote not found" });
        }
    } catch (error) {
        console.error("Error fetching vote date modified:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Fallback route should be placed at the end
app.get("*", async (req, res) => {
    try {
        const voteData = await databaseHelper.getVoteData();
        const userVotes = {};

        if (req.session.authenticated) {
            for (const vote of voteData) {
                const hasVoted = await databaseHelper.checkIfVoted(vote.voteId, req.session.uid);
                if (hasVoted) {
                    const stats = await databaseHelper.getVoteStatistics(vote.voteId);
                    userVotes[vote.voteId] = stats;
                }
            }
        }

        res.render("index", {voteData: voteData, userVotes: userVotes, isAuthenticated: req.session.authenticated});
    } catch (error) {
        console.error("Error fetching vote data:", error);
        res.status(500).send("Error fetching vote data");
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});