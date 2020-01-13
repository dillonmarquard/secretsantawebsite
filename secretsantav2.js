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
		if(err) return;
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

function create_wish_list(_res,__id,_group_id,_wish_list){
	var uri = "mongodb+srv://admin:zO6UqEbAGH7CKe5Y@marqdatabase-l0nln.mongodb.net/test?retryWrites=true&w=majority"
	var client = new mongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
	client.connect(function(err) {
		if(err) return;
		
		var collection = client.db("secretSanta").collection("groups");
		var query = { _id: new ObjectId(_group_id), people_list: new ObjectId(__id)};
		collection.find(query).toArray(function(err, result) { // verify user is in group
			if (err) return;
			if (result.length == 1) { // verified; add wish list to user's document
				// remove existing list for group if it exists
				var collection = client.db("secretSanta").collection("people");
				var myquery = { _id: new ObjectId(__id)};
				var newvalues = { $pull: { "wish_list": { "group_id": new ObjectId(_group_id) } } };
				collection.updateOne(myquery, newvalues, function(err, res) {
				});		
				// add new wish_list to user's wish_list
				var collection = client.db("secretSanta").collection("people");
				var myquery = { _id: new ObjectId(__id)};
				var wish_listobj = {group_id:new ObjectId(_group_id), wish: _wish_list};
				var newvalues = { $push: { "wish_list":  wish_listobj } };
				collection.updateOne(myquery, newvalues, function(err, res) {
					client.close()
					return _res.end();
				});		
			} else {
				client.close()
				return _res.end();
			}
		}); 
	});
}

function createGroup(_owner_id, _group_name, _password){
	var uri = "mongodb+srv://admin:zO6UqEbAGH7CKe5Y@marqdatabase-l0nln.mongodb.net/test?retryWrites=true&w=majority"
	var client = new mongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
	client.connect(function(err) {
		if(err) return;
		// first query adding a new group to groups with the owners id and password
		var collection = client.db("secretSanta").collection("groups");
		var myobj = { owner_id: new ObjectId(_owner_id), group_password: _password, group_name: _group_name, people_list: [ new ObjectId(_owner_id)],people_assignments:[] };
		collection.insertOne(myobj, function(err, res) {
			if (err) return;
			// second query adding the group_id to the owner's owned_groups and groups Arrays
			collection = client.db("secretSanta").collection("people");
			collection.updateOne({_id: new ObjectId(_owner_id)}, { $push: { owned_groups: myobj._id, groups: myobj._id }}, function(err, res2) {
				if (err) return;
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
			if (err) return;
			if (result.length == 0) {
				client.close();
				return res.end("group auth failed");
			} else {
				collection = client.db("secretSanta").collection("people");
				var query = { _id: new ObjectId(__id), groups: new ObjectId(_group)};
				collection.find(query).toArray(function(err, result2) {
					if (err) return;
					// console.log(result2)
					if (result2.length == 0) {
						collection = client.db("secretSanta").collection("groups"); // add to people_list in groups for __id
						collection.updateOne({_id: new ObjectId(_group)}, { $push: { people_list: new ObjectId(__id)}}, function(err, res2) { // adds to group people_list
							if (err) return;
						});
						collection = client.db("secretSanta").collection("people"); // add to groups in people for __id
						collection.updateOne({_id: new ObjectId(__id)}, { $push: { groups: new ObjectId(_group)}}, function(err, res2) { // adds to group people_list
							if (err) return;
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
	var uri = "mongodb+srv://tempuser:LYiYF5eT8iLasguV@marqdatabase-l0nln.mongodb.net/test?retryWrites=true&w=majority";
	var client = new mongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
	client.connect(function(err) {
		if(err) return;
		var collection = client.db("secretSanta").collection("people");
		var query = { username: _username, password: _password};
		collection.find(query).toArray(function(err, result) {
			if (err) return;
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

http.createServer(async function (req, res) {
	req.setTimeout(10000);
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
	if(q.pathname == '/assignsantas.php'){ // from the group doc in people_list, randomize and then create objects with santa: and giftee:
		var uri = "mongodb+srv://admin:zO6UqEbAGH7CKe5Y@marqdatabase-l0nln.mongodb.net/test?retryWrites=true&w=majority"
		var client = new mongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
		client.connect(function(err) {
			if(err) return;
			var collection = client.db("secretSanta").collection("groups");
			var query = { _id: new ObjectId(qdata.group)};
			//console.log(query)
			collection.find(query, { projection: {_id:0,people_list:1}}).toArray(function(err, result) {
				if (err) {
					return;
				} else {
					//console.log(result[0].people_list)
					for (var i = result[0].people_list.length - 1; i > 0; i--) { // randomize list
						var j = Math.floor(Math.random() * (i + 1));
						var temp = result[0].people_list[i];
						result[0].people_list[i] = result[0].people_list[j];
						result[0].people_list[j] = temp;
					}
					
					var sendobj = [];
					var collection = client.db("secretSanta").collection("groups");
					var newvalues = { $set: { "people_assignments":  sendobj } };
					collection.updateOne(query, newvalues, function(err, res2) {
						if(err) return;
					});
					
					// console.log(result[0].people_list)
					for(var i = 0; i < result[0].people_list.length; i++){ // assign people to each other sequentially
						var sendobj = {santa: new ObjectId(result[0].people_list[i]), giftee: new ObjectId(result[0].people_list[(i+1)%result[0].people_list.length])};
						var collection = client.db("secretSanta").collection("groups");
						var newvalues = { $push: { "people_assignments":  sendobj } };
						collection.updateOne(query, newvalues, function(err, res2) {
							if(err) return;
						});		
					}
				}
			});
		});
	}
	if(q.pathname == '/createwishlist.php'){
		create_wish_list(res, _id, qdata.group, qdata.wishlist);
		res.writeHead(302, {'Location': 'home.html' });
		return res.end();
	}
	if(q.pathname == '/joingroup.php'){
		joinGroup(_id, qdata.group, qdata.grouppsw,res);
		res.writeHead(302, {'Location': 'home.html' });
		return res.end();
	}
	if(q.pathname == '/creategroup.php'){
		createGroup(_id, qdata.group_name, qdata.psw);
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
					if(err) return;
					var dbo = client.db('secretSanta');
					dbo.collection('people').aggregate([
					{ $lookup:
						{
							from: 'groups',
							localField: 'groups',
							foreignField: '_id',
							as: 'groupdetails'
						}
					}]).toArray(function(err, result) {
						if (err) return;
						// console.log(result[0].groupdetails);
						// console.log(result[0]._id == _id);
						result.forEach(people => {
							if(people._id == _id){
								people.groupdetails.forEach(index => {
									//console.log(index)
									res.write("<script>var tableRef = document.getElementById('mygroups').getElementsByTagName('tbody')[0];var newRow   = tableRef.insertRow();var newCell  = newRow.insertCell(0);var newText  = document.createTextNode('" + index._id + "');newCell.appendChild(newText);var newCell  = newRow.insertCell(0);var newText  = document.createTextNode('" + index.group_name + "');newCell.appendChild(newText);</script>");
								});
							}
						});
					});
					
					dbo.collection('people').aggregate([
					{ $lookup:
						{
							from: 'groups',
							localField: 'owned_groups',
							foreignField: '_id',
							as: 'groupdetails'
						}
					}]).toArray(function(err, result) {
						if (err) return;
						// console.log(result[0].groupdetails);
						// console.log(result[0]._id == _id);
						result.forEach(people => {
							if(people._id == _id){
								people.groupdetails.forEach(index => {
								res.write("<script>var tableRef = document.getElementById('ownedgroups').getElementsByTagName('tbody')[0];var newRow   = tableRef.insertRow();var newCell  = newRow.insertCell(0);var newText  = document.createTextNode('" + index.group_name + "');newCell.appendChild(newText);var newCell  = newRow.insertCell(1);var newText  = document.createTextNode('" + index._id + "');newCell.appendChild(newText);var newCell  = newRow.insertCell(2);var newText  = document.createTextNode('" + index.group_password + "');newCell.appendChild(newText);var newCell  = newRow.insertCell(3);var btn = document.createElement('input');btn.type = 'button';btn.className = 'btn';btn.value = 'assign';btn.onclick = function(){window.location='http://secretsanta.hopto.org/assignsantas.php?group=" + index._id + "';};newCell.appendChild(btn);</script>");
								});
								// console.log(people);
								// client.close();
								// res.end();
							}
						});
					});
					
					var dbo = client.db('secretSanta');
					dbo.collection('groups').aggregate([
					{ $lookup:
						{
							from: 'people',
							localField: 'people_assignments.giftee',
							foreignField: '_id',
							as: 'gifteedetails'
						}
					}]).toArray(function(err, result) {
						if (err) return;
						//console.log(result)
						result.forEach(group3 => {
							group3.people_assignments.forEach(assignment => {
								if(_id == assignment.santa){
									var dbo = client.db("secretSanta");
									var query = { _id: new ObjectId(assignment.giftee)};
									dbo.collection('people').find(query).toArray(function(err, result2) {
										if (err) return;
										// console.log(result2[0]);
										if(result2[0].wish_list.length == 0){
											res.write("<script>var tableRef = document.getElementById('mysanta').getElementsByTagName('tbody')[0];var newRow   = tableRef.insertRow();var newCell  = newRow.insertCell(0);var newText  = document.createTextNode('" + group3.group_name + "');newCell.appendChild(newText);var newCell  = newRow.insertCell(1);var newText  = document.createTextNode('" + result2[0].first_name + " " + result2[0].last_name + "');newCell.appendChild(newText);var newCell  = newRow.insertCell(2);var newText  = document.createTextNode('');newCell.appendChild(newText);</script>");
										}
										result2[0].wish_list.forEach(wishlist => {
											if (group3._id.toString() == wishlist.group_id.toString() ){
												res.write("<script>var tableRef = document.getElementById('mysanta').getElementsByTagName('tbody')[0];var newRow   = tableRef.insertRow();var newCell  = newRow.insertCell(0);var newText  = document.createTextNode('" + group3.group_name + "');newCell.appendChild(newText);var newCell  = newRow.insertCell(1);var newText  = document.createTextNode('" + result2[0].first_name + " " + result2[0].last_name + "');newCell.appendChild(newText);var newCell  = newRow.insertCell(2);var newText  = document.createTextNode('" + wishlist.wish + "');newCell.appendChild(newText);</script>");
											}
										});
									});
									//res.write("<script>var tableRef = document.getElementById('mysanta').getElementsByTagName('tbody')[0];var newRow   = tableRef.insertRow();var newCell  = newRow.insertCell(0);var newText  = document.createTextNode('" + group.group_name + "');newCell.appendChild(newText);var newCell  = newRow.insertCell(1);var newText  = document.createTextNode('" + assignment.giftee + "');newCell.appendChild(newText);var newCell  = newRow.insertCell(2);var newText  = document.createTextNode('" +  + "');newCell.appendChild(newText);</script>");

								}
							});
							//client.close();
							//return res.end();
						});
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