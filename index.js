var app1 = require('express')();
var http = require('http').Server(app1);
var io = require('socket.io')(http);
var md5 = require ('md5');
const pgp = require('pg-promise')();
var bodyParser = require('body-parser');
var fs = require("fs");
const cn = {
    host: 'localhost',
    port: 5432,
    database: 'smartdasdb',
    user: 'postgres',
    password: 'Loop'
};
const db = pgp(cn);
app1.use(bodyParser.json({ limit: '50mb' }))
app1.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
const img_db_ref = '../files_db/';

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
  console.log('SOCKET Listening on port:8080');
});
//---HTTP----отстой НЕРАБОТАЕТ---------------------------    
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
//var s=http.createServer(accept).listen(port);
//console.log("Listening on http://127.0.0.1:" + port + "/");

//-------EXPRESS-рабочий код для POST 8100------------------------- 
var port = 8100;
var img_id=null;


var expresss = require('express')
  , bodyParser = require('body-parser');

var app = expresss();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS, HEAD');
  next();
});
//app.use(bodyParser.json());

app.use(bodyParser.json({ limit: '50mb' }))

app.get('/', function(req, res, next) {
  // Handle the get for this route
});

app.post('/login', function(req, res){
	console.log('Express:'+JSON.stringify(req.body));      // your JSON
    console.log('login event: ' + req.body.email +';'+req.body.password);
    db.any('SELECT u.id, u.uuid_key, u.username, u.last_name, u.email, u.active, u.description, u.contragent_flag, u.user_flag, u.group_flag, u.organization, ur.role_name, uc.user_pass FROM users u INNER JOIN user_roles ur ON ( u.role_in_project = ur.id  )   INNER JOIN user_cred uc ON ( u.uuid_key = uc.user_key  ) WHERE u.email=$1 AND uc.user_pass=$2',[req.body.email,req.body.password])
        .then(data => {
            console.log('login event/DATA:', data);
            if (data.length>0 ){
					res.send(JSON.stringify(data[0]));    // send SQL[0] result
        			console.log('login event/send DATA lenght:', data.length);
            } else {
            		err_mess='пара логин/пароль не найдены.';
					console.log('login event/not authorized send:'+ err_mess);
					res.send(JSON.stringify(err_mess));    // echo the result back
            }
        })
        .catch(error => {
            		err_mess='ошибка выполнения SQL запроса.';
					console.log('login event/ERROR QSL request:'+ err_mess);
					res.send(JSON.stringify(err_mess));    // echo the result back
        }) 

	console.log('login event/SQL request not started');
});

app.post('/addUser', function(req, res){
    var item =req.body.item;
    sqlReq="WITH x AS (INSERT INTO user_cred (user_key) VALUES (uuid_generate_v4()) RETURNING user_key),"+
      "y AS (INSERT INTO users ( uuid_key,username,last_name,description,status,role_in_project)"+
      "SELECT user_key,$1,$2,$3,0,0 FROM x RETURNING *)"+
      "SELECT * FROM y;";
      db.any(sqlReq,[item.name, item.last_name, item.about])
      .then(data=>{
        console.log('Express addUser res:'+JSON.stringify(data));  
        res.send(JSON.stringify(data));    // echo the result back
        
        if (req.body.item.profilePic){
            var bodyData = req.body.item.profilePic;
            var imageBuffer = decodeBase64Image(bodyData);
            updateUserImg(data[0].uuid_key,imageBuffer);
            console.log('addUser updateUserImg:', imageBuffer.type);
            console.log('addUser req.body.item.uuid_key:', JSON.stringify(data[0].uuid_key));
        }
    
        })
});
app.post('/updateUserImg', function (req, res) {
    var item =req.body.item;
    updateUserImg(item.uuid_key,item.url);
})
app.post('/delUser', function(req, res){
    console.log('Express delUser:'+JSON.stringify(req.body));      // your JSON
    var item =req.body.item;

    const makeAsyncRequest = async () => {
        var deletedUser = await  db.any('DELETE FROM users where uuid_key=$1 RETURNING *',[item.uuid_key]);
        await  db.any('DELETE FROM user_cred where user_key=$1 RETURNING *',[item.uuid_key]);
        res.send(JSON.stringify(deletedUser));    // send SQL result 
        console.log('Express delUser deletedUser:'+JSON.stringify(deletedUser));      // your JSON   
      }
      makeAsyncRequest()
        .catch(err => {
            console.log(err);
        })

});
    
app.post('/updateUser', function(req, res){
    const makeAsyncRequestupdateUser = async () => {
        item = req.body.item;

        if (req.body.profilePic){
            var bodyData = req.body.profilePic;
            var imageBuffer = decodeBase64Image(bodyData);
            img_id= await updateUserImg(item.uuid_key,imageBuffer);
            console.log('updateUserafter updateUserImg -> img_id:', img_id);
            item['img_id']=img_id[0];
            
        }

        str=objToSQLforUpdate(item);
        strSQL='UPDATE users SET '+str+' WHERE users.uuid_key =$1 RETURNING *';
        console.log('updateUser strSQL:', strSQL);
        updatedUserRet = await db.any(strSQL,[item.uuid_key])
        updatedUser = await db.any('SELECT * FROM users WHERE users.uuid_key =$1',[item.uuid_key])
        updatedUser[0]['ext']=img_id[1]
        console.log('updateUser 1 updatedUser:', updatedUser);
        res.send(updatedUser); 
    }
    makeAsyncRequestupdateUser()
})

app.post('/getUserList', function(req, res){
    console.log("getUserList begin");
    const makeRequest = async () => {
        var dataWithDir ={
            data: [],
            users:[],
            dir:{
                role_in_project:'',
                status:''
            }
        };    
        console.log('getUserList async start:------"'+JSON.stringify(dataWithDir));
        dataWithDir.dir.role_in_project = await  db.any('SELECT ur.id as value, ur.caption as label FROM user_roles ur	ORDER BY ur.id ASC');
        dataWithDir.dir.status = await db.any('SELECT us.id as value, us.caption as label FROM user_status us ORDER BY us.id ASC');
        dataWithDir.users = await db.any("SELECT u.id, u.uuid_key, u.username, u.last_name, u.email, u.active, u.description, u.contragent_flag, u.user_flag, u.group_flag, u.organization,u.img_id, ur.caption as role_in_project, us.caption as status,concat( f.id,'.',f.extention )as url FROM users u INNER JOIN user_roles ur ON ( u.role_in_project = ur.id  )  INNER JOIN user_status us ON ( u.status = us.id  ) LEFT OUTER JOIN files f ON( u.img_id =f.id)",[]);
        console.log('async end:------"'+JSON.stringify(dataWithDir));
        res.send(JSON.stringify(dataWithDir));    // send SQL result    
      }
      console.log(" getUserList before makeRequest() ");
      makeRequest()
        .catch(err => {
            console.log(err);
        })
    console.log("getUserList end");
});

function objToSQLforUpdate (item){
    count=0;
    str='';
    length=Object.keys(item).length;
    for (var element in item) {
        count++;
        if (typeof(item[element])=='string'){ 
            value = "'"+item[element]+"'"
        } else {
            value=item[element]
        }
        str=str+element+' = ' + value;
        if (count<length)  {
            str=str+',';
        }
    }
    return str;
}

function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {};
  
    if (matches.length !== 3) {
      return new Error('Invalid input string');
    }
  
    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}

function updateUserImg (uuidKey, imgBuf){
    const makeAsyncRequest = async () => {
        if (imgBuf.type==="image/jpeg") {var extention = 'jpg'} else { extention=''};
        var fileId = await db.any('INSERT INTO files (file_type, extention) values ($1,$2) RETURNING id',[imgBuf.type,extention]);
        console.log("updateUserImg fileId:", fileId[0].id);
        console.log("updateUserImg uuidKey:", uuidKey);
        console.log("updateUserImg imgBuf:", imgBuf);
        console.log("updateUserImg extention:", extention);
        var fileName=img_db_ref+fileId[0].id+'.'+extention;
        await fs.writeFile(fileName, imgBuf.data , function(err, data) {
            if (err) {
                console.log('file write err', err);
            }
                console.log('file write success');
                var fileSize= fs.statSync(fileName).size;
                console.log("file write success fileSize:", fileSize);

                 db.any('UPDATE files SET file_size=$2 where id=$1',[fileId[0].id,fileSize]);
                // db.any('UPDATE users SET img_id=$2 where uuid_key=$1 RETURNING img_id',[uuidKey,fileId[0].id]);
            });
        console.log('updateUserImg', fileId[0].id);
        return   [fileId[0].id,extention];    
    }
      return makeAsyncRequest()
        .catch(err => {
            console.log(err);
        })
  }
app.listen(port);
console.log("EXPRESS: Listening on port:" + port);

