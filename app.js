var express = require('express');
var app = express();
app.use(express.bodyParser());

config_file = "config.json"
fs = require('fs');

var config = JSON.parse(fs.readFileSync(config_file));

//create a sql connection pool
var mysql = require('mysql');
var pool  = mysql.createPool({
  host     : config.host,
  user     : config.user,
  password : config.pwd,
  database : config.db
});


var userModel = require('./user_model.js').make(pool);

app.post('/checkUsersByContacts', function(req, res){
  console.log("req body: " + JSON.stringify(req.body));
  var app_users = [];

  var endCallback = function() {
//    console.log("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
//    console.log("is end: app users: " + JSON.stringify(app_users));

    var body = JSON.stringify(app_users);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(body));
    res.end(body);
  }

  //keep track of all the queries that are being processed.
  //since they can be processed in any order, all calls are passed the endCallback function
  var process_count = 0;

  for (var i = 0; i < req.body.length; i++) {
    var contact = req.body[i];

    var endCallbackRef = endCallback;

    process_count += contact.phones.length;
//console.log("OUTter process count: " + process_count);

    //for each contact and their phone numbers, recursively check if any combination is registered user.
    //scope to capture contact
    (function() {
      var inner_contact = contact;
      var name = inner_contact.name;
      var inner_endCallbackRef = endCallbackRef;

      var checkResultCallback = function(is_from_callback,is_ok,appuser_phone,index,endCallbackFunc) {
//console.log(">>>> process_count: " + process_count + "; phone num: " + appuser_phone);
        if (is_from_callback) { //only start counting when is from model callback
          process_count--;
          if (process_count == 0) {
            endCallbackFunc();
          }
        }

        if (is_ok) {
//console.log("PPPPPP push app user phone: " + appuser_phone);
          app_users.push(appuser_phone);
        }

        index++;
        if (index >= inner_contact.phones.length) {
          return;
        }

        phone = inner_contact.phones[index];
        userModel.checkUser(name,phone,checkResultCallback,index,endCallbackFunc);
      };

      checkResultCallback(false,false,"",-1,inner_endCallbackRef);
    })();

    //console.log("end loop for name: " + contact.name);
  }

});


app.listen(6699);
console.log('Listening on port 6699');

/*
    var phones = [];
    phones.push('010101','202020202');
    userModel.addUser("hello",phones);
*/

//    userModel.addUser(name,contact.phones);
/*
    for (var j = 0; j < contact.phones.length; j++) {
      phone = contact.phones[j];
      userModel.checkUser(name,phone,checkResultcallback);
    }
*/
