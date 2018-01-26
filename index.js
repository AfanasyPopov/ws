var app1 = require('express')();
var http = require('http').Server(app1);
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

app1.get('/', function(req, res){
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
    console.log('chat message/message: ' + msg);
    io.emit('chat message', msg);
  });
  
  socket.on('login event', function(data){
    console.log('login event/message: ' + data["username"] +';'+data["password"]);
    io.emit('chat message', 'ligin evet...');
    db.any('SELECT u.id, u.uuid_key, u.username, u.last_name, u.email, u.active, u.description, u.contragent_flag, u.user_flag, u.group_flag, u.organization, ur.role_name, uc.user_pass FROM users u INNER JOIN user_roles ur ON ( u.role_in_project = ur.id  )   INNER JOIN user_cred uc ON ( u.uuid_key = uc.user_key  ) WHERE u.email=$1 AND uc.user_pass=$2',[data["username"],data["password"]])
        .then(data => {
            console.log('login event/DATA:', data);
            console.log('login event/DATA lenght:', data.length);
            if (data.length>0 ){
                socket.emit('login event done', data[0]);
            } else {
                socket.emit('login event error', 'пара логин/пароль не найдены.');
            }
        })
        .catch(error => {
            console.log('login event/ERROR:', error);
            socket.emit('login event error', 'ERROR:'+error);
        }) 
        
  });
  
  socket.on('admin getUsersList', function(data){
    console.log('admin getUsersList/message: ' + data["username"] +';'+data["password"]);
    //----check for ROOT status of requared user
    db.any('SELECT u.id, u.uuid_key, u.username, u.last_name, u.email, u.active, u.description, u.contragent_flag, u.user_flag, u.group_flag, u.organization, ur.role_name, uc.user_pass FROM users u INNER JOIN user_roles ur ON ( u.role_in_project = ur.id  ) INNER JOIN user_cred uc ON ( u.uuid_key = uc.user_key  ) WHERE u.email=$1 AND uc.user_pass=$2',[data["username"],data["password"]])
        .then(data => {
            console.log('admin getUsersList/DATA:', data);
            console.log('admin getUsersList/DATA lenght:', data.length);
            if (data[0].role_name=='root' ){
                console.log('admin getUsersList/DATA:', data[0].role_name+'-  доступ к данным открыт');
                db.any('SELECT u.id, u.uuid_key, u.username, u.last_name, u.email, u.active, u.description, u.contragent_flag, u.user_flag, u.group_flag, u.organization, ur.role_name, uc.user_pass FROM users u INNER JOIN user_roles ur ON ( u.role_in_project = ur.id  )  INNER JOIN user_cred uc ON ( u.uuid_key = uc.user_key  )')
                        .then(allUsersData => {
                            statusList = [{label: 'root', value: '1'},{ label: 'admin',value: '2'}];
                            console.log('admin getUsersList/SELECT * from users/DATA lenght:', allUsersData.length);
                            console.log('admin getUsersList/SELECT * from users/DATA:', allUsersData);
                            socket.emit('admin getuserslist data', [allUsersData,statusList]);
                            console.log('admin getUsersList data/SELECT * from users/DATA:',' data sended');
                        })
                        .catch(allUsersError => {
                            console.log('admin getUsersList SELECT * from users/ERROR:', allUsersError);
                        }) 
                
            } else {
                socket.emit('admin getUsersList error', 'доступ к данным закрыт Администратором.');
            }
        })
        .catch(error => {
            console.log('admin getUsersList/ERROR:', error);
            socket.emit('admin getUsersList error', 'ERROR:'+error);
        });
  


        
  });
  
  socket.on('send data', function(msg){
    console.log('send data/message: ' + msg);
    io.emit('chat message', msg["username"]+";"+md5(msg["password"]));
  });
});

http.listen(8080, function(){
  console.log(__dirname+' listening on *:8080');
});
//---HTTP-------------------------------    
var http = require('http');
var port = 8101;
function accept(req, res) {

  // если URL запроса /vote, то...
  if (req.url == '/login') {
    console.log('"login" request recived');
    console.log('req:'+JSON.parse(req));
    //res.json({ user: 'tobi' });
    res.end('Your request recieved: ' + new Date());
  }
  if (req.url == '/addUser') {
    console.log('adduser request recived');
    console.log('req:'+req.query);
  }
  	console.log('Post: ');
  	data ={
    email: 'test@test.com',
    password: 'HTTP fucking test again',
    userAdge: 8101,
  };
    res.end(JSON.stringify(data));
	console.log(req.query);

	
}
// ------ этот код запускает веб-сервер -------
var s=http.createServer(accept).listen(port);
console.log("Listening on http://127.0.0.1:" + port + "/");

//-------EXPRESS-------------------------- 
var port = 8100;

var expresss = require('express')
  , bodyParser = require('body-parser');

var app = expresss();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS, HEAD');
  next();
});
app.use(bodyParser.json());


app.get('/', function(req, res, next) {
  // Handle the get for this route
});

app.post('/login', function(req, res){
  console.log('Express:'+JSON.stringify(req.body));      // your JSON
  data ={
    email: 'test@test.com',
    password: '"login" EXPRESS fucking test again',
    userAdge: 8100,
  };

   res.send(JSON.stringify(data));    // echo the result back
});
app.post('/addUser', function(req, res){
  console.log('Express:'+JSON.stringify(req.body));      // your JSON
  data ={
    email: 'test@test.com',
    password: '"addUser" EXPRESS fucking test again',
    userAdge: 8100,
  };
   res.send(JSON.stringify(data));    // echo the result back
});

app.listen(port);
console.log("Listening Express on port:" + port);