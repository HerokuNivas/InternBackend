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
    origin: 'http://localhost:3000', 
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
        const collectionIs = databaseIs.collection("user");
        var result = await collectionIs.find({$or:[{user1: REQUEST}, {user2: REQUEST}]});
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

app.get('/games', (req, res) => {
    const USERNAME = process.env.NAME;
    const PASSWORD = process.env.PASS;
    dataFindGame(USERNAME, PASSWORD, req.query.user).then(function(result){res.send({result})});
});

app.listen(PORT, function (err) {
    if (err) console.log("Error is" + err);
}); 

module.exports = app;