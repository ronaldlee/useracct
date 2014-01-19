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

function getFormattedCurrentDate() {
  var d = new Date();

  var month = d.getMonth()+1;
  month = month.toString().length == 1 ? '0'+month : month;
  var minutes = d.getMinutes().toString().length == 1 ? '0'+d.getMinutes() : d.getMinutes();
  var hours = d.getHours().toString().length == 1 ? '0'+d.getHours() : d.getHours();
  var ampm = d.getHours() >= 12 ? 'pm' : 'am';

  return d.getFullYear()+"-"+month+"-"+d.getDate()+" " + hours +":"+minutes+"_"+ampm;
/*
  minutes = d.getMinutes().toString().length == 1 ? '0'+d.getMinutes() : d.getMinutes(),
  hours = d.getHours().toString().length == 1 ? '0'+d.getHours() : d.getHours(),
  ampm = d.getHours() >= 12 ? 'pm' : 'am',
  months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return days[d.getDay()]+' '+months[d.getMonth()]+' '+d.getDate()+' '+d.getFullYear()+' '+hours+':'+minutes+ampm;
*/
}

app.post('/log',function(req,res) {
  console.log(getFormattedCurrentDate()+":req body: " + JSON.stringify(req.body));
});

app.post('/registerUser',function(req,res) {
  console.log(getFormattedCurrentDate()+":registerUser: " + JSON.stringify(req.body));

  //var name = req.body.name;
  var phone = req.body.phone;
  var openudid = req.body.openudid;
  console.log("registerUser: phone: " + phone + "; openudid: " + openudid);

  var endCallback = function(user_id) {
    var response = {};
    response['code'] = "0";
    if (!user_id) {
      response['code'] = "-1";
    }
    response['user_id'] = user_id+"";
    var body = JSON.stringify(response);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(body));
    res.end(body);
  }

  userModel.addUser(phone,openudid,endCallback);
});

app.post('/checkUsersByContactsWithOpenUDID', function(req, res){
  console.log(getFormattedCurrentDate()+":checkUsersByContactsWithOpenUDID: " + JSON.stringify(req.body));

  var contacts = req.body.contacts;
  var openudid = req.body.openudid;
  console.log("checkUsersByContactsWithOpenUDID: openudid: " + openudid);

  var app_users = [];

  var endCallback = function() {
    var body = JSON.stringify(app_users);

//console.log("EEEEEEEEEEEEEEEEEEE");
//console.log(body);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(body));
    res.end(body);
  }

  if (contacts.length == 0) {
    endCallback();
    return;
  }

  //keep track of all the queries that are being processed.
  //since they can be processed in any order, all calls are passed the endCallback function
  var process_count = 0;

  for (var i = 0; i < contacts.length; i++) {
    var contact = contacts[i];

    process_count += contact.phones.length;
//console.log("OUTter process count: " + process_count);

    //for each contact and their phone numbers, recursively check if any combination is registered user.
    //scope to capture contact
    (function() {
      var inner_contact = contact;
      //var name = inner_contact.name;

      var checkResultCallback = function(is_from_callback,is_ok,appuser_data,index,endCallbackFunc) {
        if (is_ok) {
//console.log("PPPPPP push app user phone: " + JSON.stringify(appuser_data));
          app_users.push(appuser_data);
        }

//console.log(">>>> process_count: " + process_count + "; data: " + JSON.stringify(appuser_data));
        if (is_from_callback) { //only start counting when is from model callback
          process_count--;
          if (process_count == 0) {
            endCallbackFunc();
          }
        }

        index++;
        if (index >= inner_contact.phones.length) {
          return;
        }

        phone = inner_contact.phones[index];
        userModel.checkUser(phone,checkResultCallback,index,endCallbackFunc);
      };

      checkResultCallback(false,false,null,-1,endCallback);
    })();

    //console.log("end loop for name: " + contact.name);
  }

});

app.post('/checkUsersByContacts', function(req, res){
  console.log(getFormattedCurrentDate()+":checkUsersByContacts: " + JSON.stringify(req.body));

  var app_users = [];

  var endCallback = function() {
    var body = JSON.stringify(app_users);

//console.log("EEEEEEEEEEEEEEEEEEE");
//console.log(body);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(body));
    res.end(body);
  }

  if (req.body.length == 0) {
    endCallback();
    return;
  }

  //keep track of all the queries that are being processed.
  //since they can be processed in any order, all calls are passed the endCallback function
  var process_count = 0;

  for (var i = 0; i < req.body.length; i++) {
    var contact = req.body[i];

    process_count += contact.phones.length;
//console.log("OUTter process count: " + process_count);

    //for each contact and their phone numbers, recursively check if any combination is registered user.
    //scope to capture contact
    (function() {
      var inner_contact = contact;
      //var name = inner_contact.name;

      var checkResultCallback = function(is_from_callback,is_ok,appuser_data,index,endCallbackFunc) {
        if (is_ok) {
//console.log("PPPPPP push app user phone: " + JSON.stringify(appuser_data));
          app_users.push(appuser_data);
        }

//console.log(">>>> process_count: " + process_count + "; data: " + JSON.stringify(appuser_data));
        if (is_from_callback) { //only start counting when is from model callback
          process_count--;
          if (process_count == 0) {
            endCallbackFunc();
          }
        }

        index++;
        if (index >= inner_contact.phones.length) {
          return;
        }

        phone = inner_contact.phones[index];
        userModel.checkUser(phone,checkResultCallback,index,endCallbackFunc);
      };

      checkResultCallback(false,false,null,-1,endCallback);
    })();

    //console.log("end loop for name: " + contact.name);
  }

});

app.post('/uploadAvatarImage', function (req, res) {

    var tempPath = req.files.file.path;
    console.error("upload file: " + tempPath);
/*
    var targetPath = path.resolve('./uploads/image.png');

    if (path.extname(req.files.file.name).toLowerCase() === '.png') {
        fs.rename(tempPath, targetPath, function(err) {
            if (err) throw err;
            console.log("Upload completed!");
        });
    } else {
        fs.unlink(tempPath, function () {
            if (err) throw err;
            console.error("Only .png files are allowed!");
        });
    }
*/
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
