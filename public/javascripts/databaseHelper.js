import fs from 'fs';
import path from 'path';
import {v4 as uuid} from 'uuid';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== File Operations =====

async function saveToVoteDatabase() {
    const filepath = path.join(__dirname, '..', '..', 'public/data/vote.json');
    return writeJsonFile(filepath, voteData);
}

async function saveToVoteRecordDatabase() {
    const filepath = path.join(__dirname, '..', '..', 'public/data/voteRecord.json');
    return writeJsonFile(filepath, voteRecords);
}

async function writeJsonFile(filepath, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8', (err) => {
            if (err) {
                console.error(`Error saving data to JSON file ${filepath}`, err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function readJsonFileSync(filepath, encoding) {
    if (typeof (encoding) == 'undefined') {
        encoding = 'utf8';
    }
    var file = fs.readFileSync(filepath, encoding);
    return JSON.parse(file);
}

function getConfig(file) {
    var filepath = path.join(__dirname, '..', '..', file);
    return readJsonFileSync(filepath);
}

const userData = getConfig('public/data/user.json');
const voteData = getConfig('public/data/vote.json');
const voteRecords = getConfig('public/data/voteRecord.json');

async function getVoteData() {
    return voteData;
}

// ===== Vote Operations =====

async function searchVote(voteId) {
    return voteData.find(item => item.voteId === voteId);
}

async function updateVote(userID, voteID, newVoteData) {
    try {
        let vote = await searchVote(voteID);
        console.log("Search result: ", vote);
        if (!vote) {
            console.log(`Vote with ID ${voteID} not found. Inserting new vote entry...`);
            newVoteData.authorUid = userID;
            if (voteID === "new-temporarily") {
                console.log("Detected new vote entry. Creating a new vote record with new voteID");
                return await insertNewVote(uuid(), newVoteData);
            } else {
                return await insertNewVote(voteID, newVoteData);
            }
        } else {
            Object.assign(vote, newVoteData);
            vote.dateModified = new Date().toISOString();
            vote.authorUid = userID;
            await saveToVoteDatabase();
            await initVoteRecord(voteID);
            return vote;
        }
    } catch (err) {
        console.error("Error updating vote:", err);
        throw err;
    }
}

async function insertNewVote(voteID, newVote) {
    try {
        console.log(`Inserting new vote entry with ID ${voteID}...`);
        newVote.voteId = voteID;
        newVote.dateModified = new Date().toISOString();
        newVote = rearrangeVoteJSONEntry(newVote);
        voteData.push(newVote);
        await saveToVoteDatabase();
        await initVoteRecord(voteID);
        return newVote;
    } catch (err) {
        console.error("Error inserting new vote:", err);
        throw err;
    }
}

async function removeVoteEntry(userUID, voteID) {
    console.log(`Removing vote entry with ID ${voteID}...`);
    const voteIndex = voteData.findIndex(item => item.voteId === voteID);

    if (voteIndex === -1) {
        throw new Error(`Vote entry with ID ${voteID} not found.`);
    }

    if (voteData[voteIndex].authorUid!== userUID) {
        throw new Error(`User ${userUID} is not the author of the vote entry with ID ${voteID}. Cannot remove the vote entry.`);
    }

    const removedVote = voteData.splice(voteIndex, 1)[0];
    await saveToVoteDatabase();
    console.log(`Vote entry with ID ${voteID} removed successfully.`);
    console.log("Now remove the voteRecord entry as well");
    await removeVoteRecord(voteID).then(() => {
        console.log(`Vote record for ID ${voteID} removed successfully.`);
    }).catch(err => {
        console.error("Error removing vote record:", err);
    });
    return removedVote;
}

function rearrangeVoteJSONEntry(vote) {
    return {
        "voteId": vote.voteId,
        "authorUid": vote.authorUid, // Just testing
        "dateModified": vote.dateModified,
        "voteTitle": vote.voteTitle,
        "voteOptions": vote.voteOptions,
    };
}

async function initVoteRecord(voteID) {
    console.log("Initializing vote record for vote ID ${voteID}...");
    let record = voteRecords.find(item => item.voteId === voteID);

    if (!record) {
        console.error(`Vote record with ID ${voteID} not found. Inserting new vote record...`);
        record = {
            "voteId": voteID,
            "voteStatistics": []
        };
        voteRecords.push(record);
    } else {
        console.log(`Vote record is found. Reinitialize vote record due to update to the vote...`);
        record.voteStatistics = [];
    }

    await saveToVoteRecordDatabase();
    console.log(`Vote record for ID ${voteID} initialized successfully.`);
}

async function removeVoteRecord(voteID) {
    return new Promise((resolve, reject) => {
        console.log(`Removing vote record with ID ${voteID}...`);
        const voteRecordIndex = voteRecords.findIndex(item => item.voteId === voteID);

        if (voteRecordIndex === -1) {
            reject(new Error(`Vote record with ID ${voteID} not found.`));
            return;
        }

        const removedRecord = voteRecords.splice(voteRecordIndex, 1)[0];

        saveToVoteRecordDatabase()
            .then(() => {
                console.log(`Vote record with ID ${voteID} removed successfully.`);
                resolve(removedRecord);
            })
            .catch(err => {
                console.error(`Error saving updated vote records after removal: ${err}`);
                // Revert the change if saving fails
                voteRecords.splice(voteRecordIndex, 0, removedRecord);
                reject(err);
            });
    });
}

async function voteForOptions(userUID, voteID, voteOptionID) {
    // Find the vote record in voteRecords array
    let voteRecord = voteRecords.find(item => item.voteId === voteID);

    // Find the vote in voteData array
    let vote = voteData.find(item => item.voteId === voteID);

    // Error if no vote record exists
    if (!voteRecord) {
        console.error(`Vote record with ID ${voteID} not found. Cannot vote`);
        throw new Error(`Vote record with ID ${voteID} not found`);
    }

    // Error if no vote exists
    if (!vote) {
        console.error(`Vote with ID ${voteID} not found in voteData`);
        throw new Error(`Vote with ID ${voteID} not found`);
    }

    // Error if the vote option doesn't exist
    if (!vote.voteOptions.some(option => option.id === voteOptionID)) {
        console.error(`Vote option with ID ${voteOptionID} does not exist for vote ${voteID}`);
        throw new Error(`Invalid vote option`);
    }

    // Check if the user has already voted
    if (voteRecord.voteStatistics.some(stat => stat.uid === userUID)) {
        console.error(`User ${userUID} has already voted for vote ${voteID}`);
        throw new Error(`User has already voted`);
    }

    console.log("Vote record found. Voting...");

    // Add the user's vote to the vote record
    voteRecord.voteStatistics.push({
        uid: userUID,
        vote: voteOptionID
    });

    // Save the updated vote record to the database (implement the save logic)
    await saveToVoteRecordDatabase(voteRecord);

    console.log(`Vote recorded successfully for user ${userUID} on vote ${voteID}`);
    return voteRecord;
}

async function getVoteStatistics(voteID) {
    const voteRecord = voteRecords.find(item => item.voteId === voteID);
    if (!voteRecord) {
        throw new Error(`Vote record with ID ${voteID} not found.`);
    }

    const vote = voteData.find(item => item.voteId === voteID);
    if (!vote) {
        throw new Error(`Vote with ID ${voteID} not found in voteData.`);
    }

    const totalVotes = voteRecord.voteStatistics.length;
    const voteCounts = {};

    // Initialize vote counts
    vote.voteOptions.forEach(option => {
        voteCounts[option.id] = 0;
    });

    // Count votes
    voteRecord.voteStatistics.forEach(stat => {
        voteCounts[stat.vote]++;
    });

    // Calculate percentages and prepare the result
    const result = {
        options: {}
    };

    for (const option of vote.voteOptions) {
        const count = voteCounts[option.id];
        const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
        result.options[option.id] = {
            optionText: option.text,
            percentage: parseFloat(percentage.toFixed(2))
        };
    }

    return result;
}

async function getVotedOption(uid, voteID) {
    const voteRecord = voteRecords.find(item => item.voteId === voteID);
    if (!voteRecord) {
        throw new Error(`Vote record with ID ${voteID} not found.`);
    }

    const vote = voteData.find(item => item.voteId === voteID);
    if (!vote) {
        throw new Error(`Vote with ID ${voteID} not found in voteData.`);
    }

    // Find the user's vote in the voteStatistics
    const userVote = voteRecord.voteStatistics.find(stat => stat.uid === uid);

    if (!userVote) {
        // User hasn't voted on this vote
        return null;
    }

    // Find the corresponding option in voteData
    const votedOption = vote.voteOptions.find(option => option.id === userVote.vote);

    if (!votedOption) {
        throw new Error(`Voted option with ID ${userVote.vote} not found in voteData.`);
    }

    return {
        optionId: votedOption.id,
    };
}

async function checkIfVoted(voteID, uid) {
    console.log(`Checking if user ${uid} has voted for vote ${voteID}...`);

    let vote = voteData.find(item => item.voteId === voteID);
    if (!vote) {
        console.error(`Vote with ID ${voteID} not found`);
        throw new Error(`Vote with ID ${voteID} not found`);
    }

    let voteRecord = voteRecords.find(item => item.voteId === voteID);
    if (!voteRecord) {
        console.error(`Vote record with ID ${voteID} not found`);
        throw new Error(`Vote record with ID ${voteID} not found`);
    }

    const hasVoted = voteRecord.voteStatistics.some(stat => stat.uid === uid);

    console.log(`User ${uid} has ${hasVoted ? '' : 'not '}voted for vote ${voteID}`);
    return hasVoted;
}

async function getVoteById(voteId) {
    return voteData.find(vote => vote.voteId === voteId);
}

async function saveToUserDatabase() {
    const filepath = path.join(__dirname, '..', '..', 'public/data/user.json');
    return writeJsonFile(filepath, userData);
}

// Update the changeUserName function
async function changeUserName(uid, newUsername) {
    return new Promise(async (resolve, reject) => {
        console.log(`Changing username to ${newUsername}...`);
        // Check if the new username is already taken
        const existingUser = await searchUser(newUsername);
        if (existingUser) {
            console.error(`Username ${newUsername} is already occupied`);
            reject(new Error(`Username ${newUsername} is already occupied`));
        }

        // Find the user by UID
        const userIndex = userData.findIndex(user => user.uid === uid);
        if (userIndex === -1) {
            console.error(`User with UID ${uid} not found`);
            reject(new Error(`User with UID ${uid} not found`));
        }

        // Update the username
        const oldUsername = userData[userIndex].username;
        userData[userIndex].username = newUsername;

        // Save the updated user data
        await saveToUserDatabase();
        console.log(`Username changed successfully from ${oldUsername} to ${newUsername}`);
        resolve({success: true, username: newUsername});
    });
}

async function changeUserPhoneNumber(uid, newPhoneNumber) {
    console.log(`Changing phone number to ${newPhoneNumber}...`);

    if (!newPhoneNumber.match(/^[4-9]\d{7}$/)) {
        console.error(`Invalid phone number format: ${newPhoneNumber}`);
        throw new Error('Invalid phone number format. Must be 8 digits and start with 4-9.');
    }

    const userIndex = userData.findIndex(user => user.uid === uid);
    if (userIndex === -1) {
        console.error(`User with UID ${uid} not found`);
        throw new Error(`User with UID ${uid} not found`);
    }

    const oldPhoneNumber = userData[userIndex].phoneNum;
    userData[userIndex].phoneNum = newPhoneNumber;

    try {
        await saveToUserDatabase();
        console.log(`Phone number changed successfully from ${oldPhoneNumber} to ${newPhoneNumber}`);
        return userData[userIndex];
    } catch (err) {
        console.error("Error saving updated user data:", err);
    }
}

async function changeUserPassword(uid, oldPassword, newPassword) {
    return new Promise(async (resolve, reject) => {
        console.log(`Changing password for uid ${uid}}`);

        const userIndex = userData.findIndex(user => user.uid === uid);
        if (userIndex === -1) {
            reject(new Error(`User with UID ${uid} not found`));
        }

        const user = userData[userIndex];
        if (user.password !== oldPassword) {
            reject(new Error(`Old password does not match`));
        }

        userData[userIndex].password = newPassword;

        try {
            await saveToUserDatabase();
            console.log(`Password changed successfully`);
            resolve({success: true, password: newPassword});
        } catch (err) {
            reject(new Error("Error saving updated user password\n" + err));
        }
    });
}

async function changeUserEmail(uid, newEmail) {
    return new Promise(async (resolve, reject) => {
        console.log(`Changing ${uid} email to ${newEmail}...`);

        const userIndex = userData.findIndex(user => user.uid === uid);
        if (userIndex === -1) {
            reject(new Error(`User with UID ${uid} not found`));
        }

        const oldEmail = userData[userIndex].email;
        userData[userIndex].email = newEmail;

        try {
            await saveToUserDatabase();
            console.log(`Email changed successfully from ${oldEmail} to ${newEmail}`);
            resolve({success: true, email: newEmail});
        } catch (err) {
            reject(new Error("Error saving updated user data\n" + err));
        }
    });
}

async function createNewUser(userUid, username, password, email, phoneNum) {
    return new Promise(async (resolve, reject) => {
        console.log(`Creating new user with username ${username}...`);

        // Check if username is already taken
        const existingUser = await searchUser(username);
        if (existingUser) {
            return reject(new Error(`Username ${username} is already taken`));
        }

        // Validate phone number
        if (!phoneNum.match(/^[4-9]\d{7}$/)) {
            return reject(new Error('Invalid phone number format. Must be 8 digits and start with 4-9.'));
        }

        // Validate email (basic validation)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.match(emailRegex)) {
            return reject(new Error('Invalid email format, email should contain "@"'));
        }

        // Create new user object
        const newUser = {
            uid: userUid,
            username: username,
            password: password, // Note: In a real application, you should hash the password
            email: email,
            phoneNum: phoneNum,
            dateCreated: new Date().toISOString()
        };

        // Add new user to userData array
        userData.push(newUser);

        // Save updated user data to database
        try {
            await saveToUserDatabase();
            console.log(`New user ${username} created successfully`);
            resolve({success: true, userInfo: newUser, uid: newUser.uid});
        } catch (err) {
            // Remove the new user from the array if saving fails
            userData.pop();
            reject(new Error("Unable to save new user data\n" + err));
        }
    });
}

// ===== User Operations =====

async function searchUser(username) {
    if (!userData) {
        await initializeData();
    }
    const user = userData.find(user => user.username === username);
    console.log("Searching user: ", user);
    return user;
}

async function getUserUID(username) {
    const user = await searchUser(username);
    if (user) {
        console.log("User found. Returning user ID.");
        return user.uid;
    } else {
        throw new Error("User not found");
    }
}

async function checkCredentials(username, password) {
    console.log(`Checking credentials for user ${username}...`);
    const user = await searchUser(username);

    if (user) {
        if (user.password === password) {
            console.log("Credentials are valid.");
            const uid = await getUserUID(username);
            console.log("UserID is", uid);
            return uid;
        } else {
            throw new Error("Check your credentials again (password)");
        }
    } else {
        throw new Error("Check your credentials again (username)");
    }
}

// Replace the module.exports at the end of the file with this:

export {
    searchUser,
    getUserUID,
    checkCredentials,
    changeUserName,
    changeUserPhoneNumber,
    changeUserPassword,
    changeUserEmail,
    createNewUser,
    checkIfVoted,
    voteForOptions,
    getVoteStatistics,
    removeVoteEntry,
    initVoteRecord,
    removeVoteRecord,
    updateVote,
    insertNewVote,
    saveToUserDatabase,
    saveToVoteDatabase,
    saveToVoteRecordDatabase,
    rearrangeVoteJSONEntry,
    getVoteData,
    getVoteById,
    getVotedOption
};