// mssql libraries
var http = require('http');
var url = require('url');
var fs = require('fs');
var Cookies = require('cookies')
var mongo = require('mongodb');
var mongoClient = mongo.MongoClient;
var ObjectId = require('mongodb').ObjectId;

function createUser(_res,_first_name,_last_name,_username,_password){
	var uri = "mongodb+srv://admin:zO6UqEbAGH7CKe5Y@marqdatabase-l0nln.mongodb.net/test?retryWrites=true&w=majority"
	var client = new mongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
	client.connect(function(err) {
		if(err) throw err;
		var collection = client.db("secretSanta").collection("people");
		var myobj = { first_name: _first_name, last_name: _last_name, username: _username, password:_password,groups:[],owned_groups:[],wish_list:[]};
		collection.insertOne(myobj, function(err, res) {
			if (err){
				return _res.end('username taken')
				console.log("username taken");
				return false;
			} else {
				return _res.end('user added')
				console.log("user added");
				return true;
				client.close(); 
			}
		});
	});
};

function createGroup(_owner_id,_password){
	var uri = "mongodb+srv://admin:zO6UqEbAGH7CKe5Y@marqdatabase-l0nln.mongodb.net/test?retryWrites=true&w=majority"
	var client = new mongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
	client.connect(function(err) {
		if(err) throw err;
		// first query adding a new group to groups with the owners id and password
		var collection = client.db("secretSanta").collection("groups");
		var myobj = { owner_id: _owner_id, group_password: _password, people_list: [ new ObjectId(_owner_id)] };
		collection.insertOne(myobj, function(err, res) {
			if (err) throw err;
			// second query adding the group_id to the owner's owned_groups and groups Arrays
			collection = client.db("secretSanta").collection("people");
			collection.updateOne({_id: new ObjectId(_owner_id)}, { $push: { owned_groups: myobj._id, groups: myobj._id }}, function(err, res2) {
				if (err) throw err;
				client.close();
			}); 
		});
		
	});
};

function joinGroup(__id, _group, _grouppsw,res){
	var uri = "mongodb+srv://admin:zO6UqEbAGH7CKe5Y@marqdatabase-l0nln.mongodb.net/test?retryWrites=true&w=majority"
	var client = new mongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
	client.connect(function(err) {
		var collection = client.db("secretSanta").collection("groups");
		var query = { _id: new ObjectId(_group), group_password: _grouppsw};
		collection.find(query).toArray(function(err, result) {
			if (err) throw err;
			if (result.length == 0) {
				client.close();
				return res.end("group auth failed");
			} else {
				collection = client.db("secretSanta").collection("people");
				var query = { _id: new ObjectId(__id), groups: new ObjectId(_group)};
				collection.find(query).toArray(function(err, result2) {
					if (err) throw err;
					// console.log(result2)
					if (result2.length == 0) {
						collection = client.db("secretSanta").collection("groups"); // add to people_list in groups for __id
						collection.updateOne({_id: new ObjectId(_group)}, { $push: { people_list: new ObjectId(__id)}}, function(err, res2) { // adds to group people_list
							if (err) throw err;
						});
						collection = client.db("secretSanta").collection("people"); // add to groups in people for __id
						collection.updateOne({_id: new ObjectId(__id)}, { $push: { groups: new ObjectId(_group)}}, function(err, res2) { // adds to group people_list
							if (err) throw err;
							return res.end();
							client.close();
						});
					} else {
						client.close();
						// console.log('already in group');
						return res.end();
					}
				});
			}
		});
	});
};

function login_verificiation(_username, _password,cookies,_res){
	var mongo = require('mongodb');
	var mongoClient = mongo.MongoClient;
	var uri = "mongodb+srv://tempuser:LYiYF5eT8iLasguV@marqdatabase-l0nln.mongodb.net/test?retryWrites=true&w=majority";
	var client = new mongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
	client.connect(function(err) {
		if(err) throw err;
		var collection = client.db("secretSanta").collection("people");
		var query = { username: _username, password: _password};
		collection.find(query).toArray(function(err, result) {
			if (err) throw err;
			if (result.length == 0){
				_res.end('failed auth')
			} else {
				cookies.set("_id", result[0]._id, { signed: true })
				cookies.set('username',_username, { signed: true })
				cookies.set('password',_password, { signed: true })
				cookies.set('first_name',result[0].first_name, { signed: true })
				_res.writeHead(302, {'Location': 'home.html' });
				_res.end('you have logged in')
			}
			client.close();
		});
	});
};

// start the webserver and handles interacting with the server
var keys = ['penguin']

http.createServer(function (req, res) {
	var q = url.parse(req.url, true);
	var path = "C:/Users/dmarq/Desktop/server/secretsanta/" + q.pathname;
	var loggedpath = "C:/Users/dmarq/Desktop/server/secretsanta/home.html";
	var qdata = q.query;
	
	// Create a cookies object
	var cookies = new Cookies(req, res, { keys: keys })
	
	// Get a cookie
	var _id = cookies.get("_id", { signed: true })
	var _username = cookies.get('username', { signed: true })
	var _password = cookies.get('password', { signed: true })
	var _first_name = cookies.get('first_name', { signed: true })
	
	if(q.pathname == '/logout'){
		cookies.set("_id", "", { signed: true, maxAge:0 })
		cookies.set('username',"", { signed: true, maxAge: 0 })
		cookies.set('password',"", { signed: true, maxAge: 0 })
		cookies.set('first_name',"", { signed: true, maxAge: 0 })
		res.writeHead(302, {'Location': 'index.html' });
		return res.end();
	}
	if(q.pathname == '/joingroup.php'){
		joinGroup(_id, qdata.group, qdata.grouppsw,res);
		res.writeHead(302, {'Location': 'home.html' });
		return res.end();
	}
	if(q.pathname == '/creategroup.php'){
		createGroup(_id, qdata.psw);
		res.writeHead(302, {'Location': 'home.html' });
		return res.end();
	}
	if(q.pathname == '/login.php'){
		login_verificiation(qdata.uname,qdata.psw,cookies,res);
	}
	else if(q.pathname == '/signup.php'){
		if(qdata.psw == qdata.pswrepeat){
			createUser(res,qdata.first_name,qdata.last_name,qdata.uname,qdata.psw);
		}
	}
	else { // home.html
		if(_id != null && _username != null && _password != null){ // logged in
			fs.readFile(loggedpath, function(err, data) { 
				if (err) {
				  res.writeHead(302, {'Location': 'home.html' });
				  return res.end("404 Not Found");
				} 
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write(data);
				res.write("<script>document.getElementById('userinfo').textContent='Welcome " + _first_name + "';</script>");
				// add list of current users owned_groups
				var uri = "mongodb+srv://tempuser:LYiYF5eT8iLasguV@marqdatabase-l0nln.mongodb.net/test?retryWrites=true&w=majority";
				var client = new mongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
				client.connect(function(err) {
					if(err) throw err;
					var collection = client.db("secretSanta").collection("people");
					var query = { _id: new ObjectId(_id) };
					collection.find(query).toArray(function(err, result) {
						// console.log(result[0].owned_groups)
						if (err) throw err;
						result[0].owned_groups.forEach(index => {
							res.write("<script>var tableRef = document.getElementById('ownedgroups').getElementsByTagName('tbody')[0];var newRow   = tableRef.insertRow();var newCell  = newRow.insertCell(0);var newText  = document.createTextNode('" + index + "');newCell.appendChild(newText);</script>");
						});
					});
					collection = client.db("secretSanta").collection("people");
					query = { _id: new ObjectId(_id) };
					collection.find(query).toArray(function(err, result) {
						// console.log(result[0].owned_groups)
						if (err) throw err;
						result[0].groups.forEach(index => {
							res.write("<script>var tableRef = document.getElementById('mygroups').getElementsByTagName('tbody')[0];var newRow   = tableRef.insertRow();var newCell  = newRow.insertCell(0);var newText  = document.createTextNode('" + index + "');newCell.appendChild(newText);</script>");
						});
						client.close();
						res.end();
					});
				});
					
				
			}); 
		} else { //index.html										// not logged in
			fs.readFile(path, function(err, data) { 
				if (err) {
				  res.writeHead(302, {'Location': 'index.html' });
				  return res.end("404 Not Found");
				} 
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write(data);
				return res.end();
			});
		}
	}
}).listen(80);