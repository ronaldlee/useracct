function make(pool) {
  return new UserModel(pool);
}

function UserModel(pool) {
  this.pool = pool;
}

UserModel.prototype.addUser = function(name,phones) {

  for (var i=0; i<phones.length; i++) {
    var pool = this.pool;

    //this extra scope is for holding 'phone'
    (function() {
      var inner_pool = pool;
      var phone = phones[i];
      var sql="insert into user (name,phone) values('"+name+"','"+phone+"')";

//console.log("inert query: " + add_new_user_sql);

      inner_pool.getConnection(function(err, connection) {
        connection.query(sql, function(err, rows) {
           // And done with the connection.
           connection.release();
        });
      });
    })();
  }
};

UserModel.prototype.checkUser = function(name,phone,callback,index,endCallback) {
  var sql="select user_id from user where name='"+name+"' and phone='"+phone+"'";

//console.log("select sql: " + sql);

  this.pool.getConnection(function(err, connection) {
    connection.query(sql, function(err, rows) {
          // And done with the connection.
      if (err) {
        callback(true,false,phone,index,endCallback);
        return;
      }

//console.log("rows " + JSON.stringify(rows));

      connection.release();

      if (rows.length != 1) {
//console.log(" -- NOT app user: name: " + name +"; phone: " + phone);
        callback(true,false,phone,index,endCallback);     
      }
      else {
//console.log(" -- is app user: name: " + name +"; phone: " + phone);
        callback(true,true,phone,index,endCallback);     
      }
    });
  });

};
module.exports.make = make;
