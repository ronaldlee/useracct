function make(pool) {
  return new UserModel(pool);
}

function UserModel(pool) {
  this.pool = pool;
}

UserModel.prototype.addUser = function(name,phone,openudid,endCallback) {
  var sql="insert into user (name,phone,openudid) values('"+name+"','"+phone+"','"+openudid+"') on duplicate key update last_play_date=NULL";
//console.log("inert query: " + add_new_user_sql);
  this.pool.getConnection(function(err, connection) {
    connection.query(sql, function(err, result) {
       connection.release();
       if (err) {
         console.log("err: " + JSON.stringify(err));
         endCallback(null);
         return;
       }
//console.log("add user result: " + JSON.stringify(result));
       var user_id = result.insertId;

       endCallback(user_id);
    });
  });
};

UserModel.prototype.checkUser = function(name,phone,callback,index,endCallback) {
  var sql="select user_id,name,phone from user where name='"+name+"' and phone='"+phone+"'";

//console.log("select sql: " + sql);

  this.pool.getConnection(function(err, connection) {
    connection.query(sql, function(err, rows) {
      connection.release();

      if (err) {
        callback(true,false,phone,index,endCallback);
        return;
      }
//console.log("rows " + JSON.stringify(rows));

      if (rows.length != 1) {
//console.log(" -- NOT app user: name: " + name +"; phone: " + phone);
        callback(true,false,phone,index,endCallback);     
      }
      else {
//console.log(" -- is app user: name: " + name +"; phone: " + phone);
//console.log("data: " + JSON.stringify(rows));
        callback(true,true,rows[0],index,endCallback);     
      }
    });
  });

};
module.exports.make = make;
