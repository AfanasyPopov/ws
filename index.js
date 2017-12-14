var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var md5 = require ('md5');
const pgp = require('pg-promise')();
const cn = {
    host: 'localhost',
    port: 5432,
    database: 'smartdasdb',
    user: 'postgres',
    password: 'Loop'
};
const db = pgp(cn);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.emit('connected', 'user connected');
  
  socket.on('disconnect', function(){
    console.log('user disconnected');
    socket.emit('disconnected', 'user disconnected');
    io.emit('chat message', 'user disconnected');

  });
  
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
  
  socket.on('login event', function(data){
    console.log('message: ' + data["username"] +';'+data["password"]);
    io.emit('chat message', 'ligin evet...');
    db.any('SELECT u.id, u.uuid_key, u.username, u.last_name, u.email, u.active, u.description, u.contragent_flag, u.user_flag, u.group_flag, u.organization, ur.role_name, us.status_name, uc.user_pass FROM users u INNER JOIN user_roles ur ON ( u.role_in_project = ur.id  ) INNER JOIN user_status us ON ( u.status = us.id  )  INNER JOIN user_cred uc ON ( u.uuid_key = uc.user_key  ) WHERE u.email=$1 AND uc.user_pass=$2',[data["username"],data["password"]])
        .then(data => {
            console.log('DATA:', data);
            console.log('DATA lenght:', data.length);
            if (data.length>0 ){
                socket.emit('login event done', data[0]);
            } else {
                socket.emit('login event error', 'пара логин/пароль не найдены.');
            }
        })
        .catch(error => {
            console.log('ERROR:', error);
            socket.emit('login event error', 'ERROR:'+error);
        }) 
        
  });
  
  socket.on('send data', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg["username"]+";"+md5(msg["password"]));
  });
});

http.listen(8080, function(){
  console.log(__dirname+' listening on *:8080');
});
    
