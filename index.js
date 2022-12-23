const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions ={
    origin: 'https://intern-frontend-rho.vercel.app', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));
const PORT = process.env.PORT || 5000;

// async function totalSize(USERNAME, PASSWORD){
//     const uri = "mongodb+srv://"+USERNAME+":"+PASSWORD+"@cluster0.5bgl0yw.mongodb.net/?retryWrites=true&w=majority";
//     const client = new MongoClient(uri);
//     try {
//         const databaseIs = client.db("AsyncTicTacToe");
//         const collectionIs = databaseIs.collection("user");
//         return await collectionIs.count();
//     }
//     catch(err) {
//         console.log(err);
//     }
//     finally {
//         await client.close();
//     }
// }

async function dataFindGame(USERNAME, PASSWORD, REQUEST){
    const uri = "mongodb+srv://"+USERNAME+":"+PASSWORD+"@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try{
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("games");
        var result = await collectionIs.find({$or:[{user1:REQUEST}, {user2: REQUEST}]}).toArray();
        return result;
    }
    catch(err){
        return err;
    }
    finally{
        await client.close();
    }
    return {};  
}

async function datainsertuser(USERNAME, PASSWORD, REQUEST){
    const uri = "mongodb+srv://"+USERNAME+":"+PASSWORD+"@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("user");
        var findUser = await collectionIs.findOne({UserName: REQUEST.UserName});
        if(findUser != null){
            return ({success: false, message: "Already signed up."})
        }
        const doc = {
            UserName : REQUEST.UserName,
            Email: REQUEST.Email,
            Name: REQUEST.Name,
            Password: REQUEST.Password
        }
        await collectionIs.insertOne(doc);
    }
    catch(err) {
        return {success: false, message: "Error Occured."}
    }
    finally {
        await client.close();
    }
    return {success: true, message: ""}
}

async function dataCreateGame(USERNAME, PASSWORD, REQUEST){
    const uri = "mongodb+srv://"+USERNAME+":"+PASSWORD+"@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try{
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("games");
        const doc = {
            user1: REQUEST.user1,
            user2: REQUEST.user2,
            current: REQUEST.user1,
            board: [["","",""],["","",""],["","",""]],
            winby: "",
            time: REQUEST.time
        }
        await collectionIs.insertOne(doc);
    }
    catch(err) {
        return "Done";
    }
    finally {
        await client.close();
    }
    return "Done";
}

async function dataUpdateGame(USERNAME, PASSWORD, REQUEST){
    const uri = "mongodb+srv://"+USERNAME+":"+PASSWORD+"@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try{
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("games");
        const res = await collectionIs.updateOne({user1: REQUEST.user1, user2: REQUEST.user2}, {$set:{user1: REQUEST.user1, user2: REQUEST.user2, current: REQUEST.current, board: REQUEST.board, winby: REQUEST.winby, time: REQUEST.time, last: REQUEST.last}});
    }
    catch(err) {
        return "Done";
    }
    finally {
        await client.close();
    }
    return "Done";
}


async function dataFind(USERNAME, PASSWORD, REQUEST){
    const uri = "mongodb+srv://"+USERNAME+":"+PASSWORD+"@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("user");
        const sendTo = await collectionIs.findOne({UserName: REQUEST.user, Password: REQUEST.password});
        if(sendTo !== null)
            return true;
    }
    catch(err) {
        return false;
    }
    finally {
        await client.close();
    }
    return false;
}

async function dataMyRequests(USERNAME, PASSWORD, USER){
    const uri = "mongodb+srv://"+USERNAME+":"+PASSWORD+"@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try{
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("requests");
        var result = await collectionIs.find({$and:[{to:USER}, {message: "Request in progress"}]}).toArray();
        return result;
    }
    catch(err){
        return {};
    }
    finally{
        client.close();
    }
}

async function dataRequestGame(USERNAME, PASSWORD, USER, EMAIL){
    const uri = "mongodb+srv://"+USERNAME+":"+PASSWORD+"@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try{
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("user");
        const sendTo = await collectionIs.findOne({Email: EMAIL});
        if(sendTo == null)
            return {success: false, message: "No user found"}
        else{
            const collectionIsOne = databaseIs.collection("requests");
            const findAgain = await collectionIsOne.findOne({user1: USER, user2: sendTo.UserName})
            if(findAgain !== null){
                return {success: false, message: findAgain.message}
            }
            else{
                const doc = {
                    user1: USER,
                    user2: sendTo.UserName,
                    to: sendTo.UserName,
                    message: "Request in progress"
                }
                await collectionIsOne.insertOne(doc);
                return {success: true, message: "successfully sent"}
            }
        }
    }
    catch(err){
        return {success: false, message: "An error occured"}
    }
    finally{
        client.close();
    }
}

async function dataAcceptGame(USERNAME, PASSWORD, USER1, USER2){
    const uri = "mongodb+srv://"+USERNAME+":"+PASSWORD+"@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try{
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("requests");
        const data = await collectionIs.updateOne({$and:[{user1: USER1}, {user2: USER2}]}, {$set:{message: "Game in progress"}});
        return true;
    }
    catch(err){
        return false;
    }
}

async function dataRejectGame(USERNAME, PASSWORD, USER1, USER2){
    const uri = "mongodb+srv://"+USERNAME+":"+PASSWORD+"@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try{
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("requests");
        const data = await collectionIs.deleteOne({user1: USER1, user2: USER2});
        return true;
    }
    catch(err){
        return false;
    }
}

async function dataFindParGame(USERNAME, PASSWORD, USER1, USER2){
    const uri = "mongodb+srv://"+USERNAME+":"+PASSWORD+"@cluster0.ciz9ysq.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try{
        const databaseIs = client.db("AsyncTicTacToe");
        const collectionIs = databaseIs.collection("games");
        const result = await collectionIs.findOne({USER1, USER2});
        return result;
    }
    catch(err){
        return err;
    }
    finally{
        await client.close();
    }
    return {};  
}


app.post('/insertUser', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    datainsertuser(USERNAME, PASSWORD, req.body).then(function(result){res.send({success: result.success, message: result.message})});
});

app.post('/login', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataFind(USERNAME, PASSWORD, req.body).then(function(result){res.send({success: result})});
});

app.post('/creategame', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataCreateGame(USERNAME, PASSWORD, req.body).then(function(result){res.send({success: result})});
});

app.get('/games', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataFindGame(USERNAME, PASSWORD, req.query.user).then(function(result){res.send({games: result})});
});

app.get('/requests', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataRequestGame(USERNAME, PASSWORD, req.query.user, req.query.email).then(function(result){res.send({success: result.success, message: result.message})})
});

app.get('/myrequests', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataMyRequests(USERNAME, PASSWORD, req.query.user).then(function(result){res.send(({result: result}))});
});

app.get('/accept', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataAcceptGame(USERNAME, PASSWORD, req.query.user1, req.query.user2).then(function(result){res.send({success: result})});
});

app.get('/reject', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataRejectGame(USERNAME, PASSWORD, req.query.user1, req.query.user2).then(function(result){res.send({success: result})});
});

app.post('/update', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataUpdateGame(USERNAME, PASSWORD, req.body).then(function(result){res.send({result: result})});
});

app.listen(PORT, function (err) {
    if (err) console.log("Error is" + err);
}); 

app.get('/pargame', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataFindParGame(USERNAME, PASSWORD, req.user1, req.user2).then(function(result){res.send({games: result})});
})

module.exports = app;