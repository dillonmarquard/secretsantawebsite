// mssql libraries
var mysql = require('mysql');
var http = require('http');
var url = require('url');
var fs = require('fs');
var Cookies = require('cookies')
var mongo = require('mongodb');
var mongoClient = mongo.MongoClient;

async function createUser(_first_name,_last_name,_username,_password){
	var uri = "mongodb+srv://admin:zO6UqEbAGH7CKe5Y@marqdatabase-l0nln.mongodb.net/test?retryWrites=true&w=majority"
	var client = new mongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
	client.connect(function(err) {
		if(err) throw err;
		var collection = client.db("secretSanta").collection("people");
		var myobj = { first_name: _first_name, last_name: _last_name, username: _username, password:_password,groups:[],owned_groups:[]};
		collection.insertOne(myobj, function(err, res) {
			if (err) throw err;
			console.log("user added");
			client.close();
		});
	});
};

async function getUserInfo(){
	
}

async function createGroup(_owner_id,){
	
}

// start the webserver and handles interacting with the server
var keys = ['penguin']

function login(_username,_password,cookies){
	// Set the cookie to a value
	cookies.set('username',_username, { signed: true })
	cookies.set('password',_password, { signed: true })
};

http.createServer(function (req, res) {
	var q = url.parse(req.url, true);
	var pathname = "C:/Users/dmarq/Desktop/server/secretsanta/" + q.pathname;
	var qdata = q.query;
	
	// Create a cookies object
	var cookies = new Cookies(req, res, { keys: keys })
	
	if(q.pathname == '/login.php'){
		login("Dillon","1234",cookies);
	}
	
	// Get a cookie
	var _username = cookies.get('username', { signed: true })
	var _password = cookies.get('password', { signed: true })
	
	if(_username && _password){
		return res.end('username: ' + _username + ' password: ' + _password)
		
	}
	
	fs.readFile(pathname, function(err, data) {
		if (err) {
		  res.writeHead(302, {'Location': 'index.html' });
		  return res.end("404 Not Found");
		} 
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(data);
		return res.end();
	});
	
}).listen(80);


// createUser("Dillon","Marquard","dmarquard","1234");