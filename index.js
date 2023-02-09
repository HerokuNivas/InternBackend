const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions = {
    origin: '*', 
    // origin: 'http://localhost:3000',
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));
const PORT = process.env.PORT || 5000;

const X = "X";
const O = "O";
const DRAW = "Draw";

function checkWinner(board) {
    // Check rows
    for (let i = 0; i < 3; i++) {
        if (board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
            return board[i][0];
        }
    }

    // Check columns
    for (let i = 0; i < 3; i++) {
        if (board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
            return board[0][i];
        }
    }

    // Check diagonals
    if (board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
        return board[0][0];
    }

    if (board[2][0] === board[1][1] && board[1][1] === board[0][2]) {
        return board[2][0];
    }

    // Check if there is a draw
    let moves = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i][j] !== "") {
                moves++;
            }
        }
    }

    if (moves === 9) {
        return DRAW;
    }

    return null;
}

function getAvailableMoves(board) {
    let availableMoves = [];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i][j] === "") {
                availableMoves.push([i, j]);
            }
        }
    }
    return availableMoves;
}

function minimax(board, player) {
    let winner = checkWinner(board);
    if (winner === X) {
        return { score: -10 };
    } else if (winner === O) {
        return { score: 10 };
    } else if (winner === DRAW) {
        return { score: 0 };
    }

    let moves = [];
    let availableMoves = getAvailableMoves(board);
    for (let i = 0; i < availableMoves.length; i++) {
        let move = {};
        move.index = availableMoves[i];
        board[availableMoves[i][0]][availableMoves[i][1]] = player;

        if (player === O) {
            let result = minimax(board, X);
            move.score = result.score;
        } else {
            let result = minimax(board, O);
            move.score = result.score;
        }

        board[availableMoves[i][0]][availableMoves[i][1]] = "";
        moves.push(move);
    }

    let bestMove;
    if (player === O) {
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    return moves[bestMove];
}

async function dataFindGame(USERNAME, PASSWORD, REQUEST) {
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("games");
        var result = await collectionIs.find({ $or: [{ user1: REQUEST }, { user2: REQUEST }] }).toArray();
        return result;
    }
    catch (err) {
        return err;
    }
    finally {
        await client.close();
    }
    return {};
}

async function datainsertuser(USERNAME, PASSWORD, REQUEST) {
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("user");
        var findUser = await collectionIs.findOne({ UserName: REQUEST.UserName });
        if (findUser != null) {
            return ({ success: false, message: "Username already taken." })
        }
        const doc = {
                UserName: REQUEST.UserName,
                Email: REQUEST.Email,
                Name: REQUEST.Name,
                Password: REQUEST.Password,
                Won: 0,
                Lost: 0,
                Draw: 0
            }
            await collectionIs.insertOne(doc);
        }
    catch (err) {
        return { success: false, message: "Error Occured." }
    }
    finally{
        client.close();
    }
    
    return { success: true, message: "" }
}

async function dataCreateGame(USERNAME, PASSWORD, REQUEST) {
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("games");
        const doc = {
            user1: REQUEST.user1,
            user2: REQUEST.user2,
            current: REQUEST.user1,
            board: [["", "", ""], ["", "", ""], ["", "", ""]],
            winby: "",
            time: REQUEST.time,
            winpo: ""
        }
        await collectionIs.insertOne(doc);
    }
    catch (err) {
        return "Done";
    }
    finally {
        await client.close();
    }
    return "Done";
}

async function dataUpdateGame(USERNAME, PASSWORD, REQUEST) {
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("games");
        const ObjectID = require("mongodb").ObjectId;
        const o_id = ObjectID(REQUEST.id);
        if(REQUEST.winby === "draw"){
                const databaseIs = client.db("AsyncTicTacToe");
                const collectionIs2 = databaseIs.collection("games");
                await collectionIs2.updateOne({ _id: o_id }, { $set: { user1: REQUEST.user1, user2: "@Async", current: "", board: REQUEST.board, winby: "draw", time: new Date().toLocaleDateString(), winpo: "" } });
                const collectionIs = databaseIs.collection("requests");
                const data = await collectionIs.deleteOne({ user1: REQUEST.USER1, user2: "@Async" });
                const collectionIs1 = databaseIs.collection("user");
                await collectionIs1.updateOne({ UserName: REQUEST.user1}, {$inc: {Draw: 1}});
                await collectionIs1.updateOne({ UserName: "@Async"}, {$inc: {Draw: 1}});
        }
        else if(REQUEST.user2 !== "@Async" && REQUEST.winby === REQUEST.user1){
            await collectionIs.updateOne({ _id: o_id }, { $set: { user1: REQUEST.user1, user2: REQUEST.user2, current: REQUEST.current, board: REQUEST.board, winby: REQUEST.winby, time: REQUEST.time, winpo: REQUEST.winpo } });
            if (REQUEST.winby !== "") {
                dataRejectGame(USERNAME, PASSWORD, REQUEST.user1, REQUEST.user2)
            }
        }
        else{
            const result = minimax(REQUEST.board, 'O');
            var boardCurrent = REQUEST.board;
            boardCurrent[result.index[0]][result.index[1]] = "O";
            var Won = checkWinner(boardCurrent);
            if(Won === "O"){
                const databaseIs = client.db("AsyncTicTacToe");
                const collectionIs2 = databaseIs.collection("games");
                await collectionIs2.updateOne({ _id: o_id }, { $set: { user1: REQUEST.user1, user2: REQUEST.user2, current: "", board: boardCurrent, winby: "@Async", time: new Date().toLocaleDateString(), winpo: "" } });
                const collectionIs = databaseIs.collection("requests");
                const data = await collectionIs.deleteOne({ user1: REQUEST.user1, user2: "@Async" });
                const collectionIs1 = databaseIs.collection("user");
                await collectionIs1.updateOne({ UserName: REQUEST.user1}, {$inc: {Lost: 1}});
                await collectionIs1.updateOne({ UserName: "@Async"}, {$inc: {Won: 1}});
            }
            else{
                await collectionIs.updateOne({ _id: o_id }, { $set: { user1: REQUEST.user1, user2: REQUEST.user2, current: REQUEST.user1, board: boardCurrent, winby: "", time: REQUEST.time, winpo: REQUEST.winpo } });
            }
        }
    }
    catch (err) {
        return "Done";
    }
    finally {
        await client.close();
    }
    return "Done";
}


async function dataFind(USERNAME, PASSWORD, REQUEST) {
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("user");
        const sendTo = await collectionIs.findOne({ UserName: REQUEST.user});
        return {success: true, password: sendTo.Password, email: sendTo.Email};
    }
    catch (err) {
        return {success: false, password: "", email: ""};
    }
    finally {
        await client.close();
    }
}

async function dataMyRequests(USERNAME, PASSWORD, USER) {
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("requests");
        var result = await collectionIs.find({ $and: [{ to: USER }, { message: "Request in progress" }] }).toArray();
        return result;
    }
    catch (err) {
        return {};
    }
    finally {
        client.close();
    }
}

async function dataRequestGame(USERNAME, PASSWORD, USER, EMAIL) {
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("user");
        const sendTo = await collectionIs.findOne({ Email: EMAIL });
        if (sendTo == null)
            return { success: false, message: "No user found" }
        else if (sendTo.UserName === USER) {
            return { success: false, message: "You cannot send request to you" }
        }
        else {
            const collectionIsOne = databaseIs.collection("requests");
            const findAgain = await collectionIsOne.findOne({ user1: USER, user2: sendTo.UserName })
            if (findAgain !== null) {
                return { success: false, message: findAgain.message }
            }
            else if(EMAIL === "async.ai.com"){
                const doc = {
                    user1: USER,
                    user2: "@Async",
                    to: "@Async",
                    message: "Game in progress"
                }
                await collectionIsOne.insertOne(doc);
                const databaseIs1 = client.db("AsyncTicTacToe");
                const collectionIs1 = databaseIs1.collection("games");
                const doc1 = {
                    user1: USER,
                    user2: "@Async",
                    current: USER,
                    board: [["", "", ""], ["", "", ""], ["", "", ""]],
                    winby: "",
                    time: new Date().toLocaleString(),
                    winpo: ""
                }
                
                const inserted = await collectionIs1.insertOne(doc1);
                return { success: true, message: "successfully sent" }
            }
            else {
                const doc = {
                    user1: USER,
                    user2: sendTo.UserName,
                    to: sendTo.UserName,
                    message: "Request in progress"
                }
                await collectionIsOne.insertOne(doc);
                return { success: true, message: "successfully sent" }
            }
        }
    }
    catch (err) {
        console.log(err);
        return { success: false, message: "An error occured" }
    }
    finally {
        client.close();
    }
}

async function dataAcceptGame(USERNAME, PASSWORD, USER1, USER2) {
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("requests");
        const data = await collectionIs.updateOne({ $and: [{ user1: USER1 }, { user2: USER2 }] }, { $set: { message: "Game in progress" } });
        return true;
    }
    catch (err) {
        return false;
    }
}

async function dataRejectGame(USERNAME, PASSWORD, USER1, USER2) {
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("requests");
        const data = await collectionIs.deleteOne({ user1: USER1, user2: USER2 });
        return true;
    }
    catch (err) {
        return false;
    }
}

async function dataFindParGame(USERNAME, PASSWORD, ID) {
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("games");
        const ObjectID = require("mongodb").ObjectId;
        const o_id = ObjectID(ID);
        const result = await collectionIs.findOne({ _id: o_id })
        return result;
    }
    catch (err) {
        return err;
    }
    finally {
        await client.close();
    }
    return {};
}

async function dataPasswordChange(USERNAME, PASSWORD,REQUEST){
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("user");
        await collectionIs.updateOne({ UserName : REQUEST.user }, { $set: { Password : REQUEST.password } });
    }
    catch (err) {
        return "Done";
    }
    finally {
        await client.close();
    }
    return "Done";
}

async function dataTotalRequests(USERNAME, PASSWORD, REQUEST){
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("requests");
        const returnVal = await collectionIs.count({ to : REQUEST.user, message: "Request in progress" });
        return returnVal;
    }
    catch (err) {
        return 0;
    }
    finally {
        await client.close();
    }
    return 0;
}

async function getProfile(USERNAME, PASSWORD, USER){
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("user");
        const user = await collectionIs.findOne({ UserName: USER });
        return user;
    }
    catch (err) {
        return {};
    }
    finally {
        await client.close();
    }
    return {};
}

async function dataWonLost(USERNAME, PASSWORD, REQ){
    const uri = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("user");
        if(REQ.status === "Draw"){
            await collectionIs.updateOne({ UserName: REQ.user1 }, {$inc: {Draw: 1}});
            await collectionIs.updateOne({ UserName: REQ.user2 }, {$inc: {Draw: 1}});
        }
        else if(REQ.status === "Won"){
            await collectionIs.updateOne({ UserName: REQ.user1}, {$inc: {Won: 1}});
            await collectionIs.updateOne({ UserName: REQ.user2}, {$inc: {Lost: 1}});
        }
        else{
            await collectionIs.updateOne({ UserName: REQ.user1}, {$inc: {Lost: 1}});
            await collectionIs.updateOne({ UserName: REQ.user2}, {$inc: {Won: 1}});
        }
        return {Success: "Done"};
    }
    catch (err) {
        return {Success: "Fail"};
    }
    finally {
        await client.close();
    }
    return {};
}


app.post('/insertUser', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    datainsertuser(USERNAME, PASSWORD, req.body).then(function (result) { res.send({ success: result.success, message: result.message }) });
});

app.post('/login', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataFind(USERNAME, PASSWORD, req.body).then(function (result) { res.send({ success: result }) });
});

app.post('/creategame', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataCreateGame(USERNAME, PASSWORD, req.body).then(function (result) { res.send({ success: result }) });
});

app.get('/games', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataFindGame(USERNAME, PASSWORD, req.query.user).then(function (result) { res.send({ games: result }) });
});

app.get('/requests', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataRequestGame(USERNAME, PASSWORD, req.query.user, req.query.email).then(function (result) { res.send({ success: result.success, message: result.message }) })
});

app.get('/myrequests', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataMyRequests(USERNAME, PASSWORD, req.query.user).then(function (result) { res.send(({ result: result })) });
});

app.get('/accept', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataAcceptGame(USERNAME, PASSWORD, req.query.user1, req.query.user2).then(function (result) { res.send({ success: result }) });
});

app.get('/reject', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataRejectGame(USERNAME, PASSWORD, req.query.user1, req.query.user2).then(function (result) { res.send({ success: result }) });
});

app.post('/update', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataUpdateGame(USERNAME, PASSWORD, req.body).then(function (result) { res.send({ result: result }) });
});

app.get('/pargame', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataFindParGame(USERNAME, PASSWORD, req.query.id).then(function (result) { res.send({ games: result }) });
});

app.get('/profile', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    getProfile(USERNAME, PASSWORD, req.query.user).then(function (result){res.send({user: result})});
});


app.post('/passwordChange', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataPasswordChange(USERNAME, PASSWORD, req.body).then(function (result) { res.send({ result: result }) });
});

app.post('/totalRequests', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataTotalRequests(USERNAME, PASSWORD, req.body).then(function(result) { res.send({number: result})});
});

app.post('/countWonLost', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataWonLost(USERNAME, PASSWORD, req.body).then(function(result) { res.send({sucess: result})})
});


app.listen(PORT, function (err) {
    if (err) console.log("Error is" + err);
});


module.exports = app;