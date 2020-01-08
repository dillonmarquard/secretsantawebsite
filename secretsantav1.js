// mssql libraries
var mysql = require('mysql');
var nodemailer = require('nodemailer');
var http = require('http');
var url = require('url');
var fs = require('fs');
// email settings
var primaryemail = 'dillonmarquard3@gmail.com';
var primaryemailpassword = 'Ducksliveforev3r';

// email sender details
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: primaryemail,
    pass: primaryemailpassword
  }
});

// returns a formatted mail Object with the reciever(email_to) and text body(xmas_list)
function getMailOptionsObject (email_to, xmas_list) {
	var mailOptions;
	return mailOptions = {
		from: primaryemail,
		to: email_to,
		subject: 'secret santa',
		text: xmas_list
	};
}

// straight up sends the mail
function sendMail(mailOptions){
	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log('Email not sent.');
			console.log(error);
		} else {
			console.log('Email sent.');
  }
});
};

// connects to the 'secretsantadb' mySQL database as 'root'
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "secretsantadb"
});

// connects to the 'secretsantadb' mySQL database as 'root'
var pool = mysql.createPool({
    connectionLimit : 10, // default = 10
    host            : 'localhost',
    user            : 'root',
    password        : '',
    database        : 'secretsantadb'
});

// adds a family member to the mySQL database OR replaced information
function newFamilyMember(first_name, email, xmas_list, entered_password) {
	/*con.connect(function(err) {
		if (err) throw err;
		*/
	pool.getConnection(function (err, con) {
		// console.log("Connected to database");
		var values = [
			[first_name, email, xmas_list, entered_password]
		];
		/* console.log(email == '');
		console.log(xmas_list == ''); */
		
		// find if column already exists
		con.query("SELECT first_name, email, xmas_list, password FROM people WHERE first_name = '" + first_name + "'", function (err, result, fields) {
			if (err) throw err;
			// if the object returned is less than 1 object then the column doesnt exist and will be inserted
			if(Object.keys(result).length < 1){
				// console.log("inserting");
				var sql = "INSERT INTO people (first_name,email,xmas_list,password) VALUES ?";
				con.query(sql,[values], function (err, result, fields) {
					if (err) throw err;
					/* Object.keys(result).forEach(function(key) {
						var row = result[key];
						console.log(row);
					}); */
				});
			} else {
				var row;
				Object.keys(result).forEach(function(key) {
						row = result[key];
						if(email == ''){
							email = row.email;
						}
						if(xmas_list == ''){
							xmas_list = row.xmas_list;
						}
					});
				if (row.password == entered_password){
					// console.log("updating");
					// prevent setting the email or xmas_list to '' from php
					var sql = "UPDATE people SET email='" + email + "',xmas_list='" + xmas_list + "' WHERE first_name = '" + first_name + "'";
					con.query(sql, function (err, result, fields) {
						if (err) throw err;
						/* Object.keys(result).forEach(function(key) {
							var row = result[key];
							console.log(row);
						}); */
					});
				}
			}
		});
	});
};
// start the webserver for interacting with the database
http.createServer(function (req, res) {
	var q = url.parse(req.url, true);
	var filename = "C:/Users/dmarq/Desktop/server/secretsanta/" + q.pathname;
	qdata = q.query;
	if(q.pathname == '/info_page.php'){ // for when the url is a get request
		if(qdata.first_name != ''){
			console.log("client submission for information update");
			newFamilyMember(qdata.first_name.trim(),qdata.email.trim(),qdata.xmas_list,qdata.password);
		} 
		res.writeHead(302, {'Location': 'index.html' });
		return res.end();
		/* console.log(qdata.first_name);
		console.log(qdata.email);
		console.log(qdata.xmas_list); */
		
	}else if (q.pathname == '/my_santa.php'){
		//findData(); // will only return html if the password matches the database
		console.log("client request for santa_data");
		pool.getConnection(function (err, con) {
			con.query("SELECT password FROM people WHERE first_name = '" + qdata.seeSanta.trim() + "'",function (err, result3){
				Object.keys(result3).forEach(function(key) {
					var row = result3[key];
					if (row.password == qdata.password){
						con.query("SELECT gifter_id FROM people WHERE first_name = '" + qdata.seeSanta.trim() + "'",function(err,result){
							if (err) throw err;
							Object.keys(result).forEach(function(key) {
								var row = result[key];
								con.query("SELECT first_name,xmas_list FROM people WHERE id = " + row.gifter_id + "",function(err,result2){
									if (err) throw err;
									Object.keys(result2).forEach(function(key) {
										var row = result2[key];
										// console.log(row.first_name,row.xmas_list);
										res.write("You're " + row.first_name + "'s Secret Santa\n" + "Their List is Currently:\n" +row.xmas_list);
										return res.end();
									});
								});
							});
						});
					} else {
						res.write("Failed AUTH");
						return res.end();
					}
				});
			});
			con.release();
		});
	} else {
		fs.readFile(filename, function(err, data) {
			if (err) {
			  res.writeHead(302, {'Location': 'index.html' });
			  return res.end("404 Not Found");
			} 
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write(data);
			return res.end();
		});
	}
}).listen(80);

//newFamilyMember('Drew','drewbeauchamp@gmail.com','a ring');
/* transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
}); */
