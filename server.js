// use: npm install -g nodemon --save
// and start server with: nodemon --inspect server.js

var crypto = require("crypto-js");
var fs = require("fs");
var express = require("express");
var ws = require("ws");
var http = require("http");

var app = express();
var server = http.createServer(app);
var wss = new ws.Server({
    server: server
});

app.use("/js", express.static(__dirname + "/public/js"));
app.use("/css", express.static(__dirname + "/public/css"));
app.use("/webfonts", express.static(__dirname + "/public/webfonts"));
app.use("/md", express.static(__dirname + "/public/md"));


app.get("/", (req, res) => {
    res.status(301).redirect("http://localhost:8181/app");
});

app.get("/app", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});
app.get("/app/:topic", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});
app.get("/app/:topic/:step(\\d+)", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/api/topics", (req, res) => {
    let response = []
    fs.readdirSync(__dirname + "/public/md").forEach(file => {
        response.push(file.substring(0, file.length - 3));
    });
    res.send(response);
});

app.get("/api/status/:topic/:hash", (req, res) => {
    let path = __dirname + "/public/md/" + req.params.topic; 
    if (fs.existsSync(path)) {
        if (req.params.hash === crypto.SHA256(fs.readFileSync(path, {
            encoding: "utf8"
        })).toString(crypto.enc.Hex)) {
            res.sendStatus(304);
        } else {
            res.sendStatus(205);
        }
    } else {
        res.sendStatus(404);
    }
});



wss.on("connection", (socket, req) => {
    if (req.url.match(/^\/ws\/topicstatus$/)) {
        let params = {
            topic: "",
            hash: ""
        };
        socket.on("message", (data) => {
            let msg = JSON.parse(data.toString());
            if (msg.topic && msg.hash) {
                if (fs.existsSync(__dirname + "/public/md/" + msg.topic))
                params.topic = __dirname + "/public/md/" + msg.topic;
                params.hash = msg.hash;
            }
        });
        let int = setInterval(() => {
            if (params.topic.length == 0 || params.hash.length == 0 || !fs.existsSync(params.topic)) return;
            if (params.hash !== crypto.SHA256(fs.readFileSync(params.topic, {
                encoding: "utf8"
            })).toString(crypto.enc.Hex)) {
                socket.send(JSON.stringify({status: "outdated"}));
            }
        }, 500);
        socket.on("close", () => {
            clearInterval(int);
        });
    } else if (req.url.match(/^\/ws\/topiclist$/)) {
        let sendTopics = () => {
            let response = []
            fs.readdirSync(__dirname + "/public/md").forEach(file => {
                response.push(file.substring(0, file.length - 3));
            });
            socket.send(JSON.stringify({
                topics: response
            }));
        }
        let int = setInterval(() => {
            sendTopics();
        }, 3000);
        sendTopics();
        socket.on("close", () => {
            clearInterval(int);
        });
    } else {
        socket.close();
    }
});



server.listen(8181, () => {
    console.log("Started Express Training Webserver on Port 8181");
});