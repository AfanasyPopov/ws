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

//----start-----------PROJECT'S EVENTS---------------------------
/** req=>: { account_key: '5a4b298a-f903-4fbe-b53b-049b1a0d8d9b' } */
app.post('/getProjectsList', function(req, res){
    console.log('getProjectsList req.body:', req.body);
    const makeAsyncRequest = async () => {
        account_key = req.body.account_key;
        console.log('getProjectsList user:', account_key);
        havePermission = await isHavePermission(account_key);
        accountUserId= await getUserId(account_key);
        usersList=await getUsersList();
        console.log('isHavePermission:'+ havePermission+' , id:'+accountUserId)
        if(havePermission) {
           projectsList = await db.any("SELECT p.id,p.project_name,p.manager,p.parent,p.description,concat( u.last_name,' ',u.username) as owner_user, false as show FROM projects p INNER JOIN users u ON (p.owner_user=u.id)",[ ])
           console.log('getProjectsList projectsList[0]:', projectsList[0]);
           usersList= await getUsersList();
           projectsList.forEach(element => { //conver manager [array] to  String Names of UsersList 
            element.manager.forEach(function(elem,ind,arr){
                usersList.findIndex(function (index){
                    if (index.id==elem){
                        element.manager[ind]=' '+index.last_name+' '+index.username;
                    }
                })
            })
           });
        }
        if (projectsList.length>0){
            data={
                projectsList: projectsList,
                mess:"Список проектов получен!"
            }
        } else {
           if(!havePermission) {data.mess="Отказано в доступе"}
        }
        //console.log('getProjectsList data:', data);
        res.send(data); 
    }
    makeAsyncRequest()
})
    /**formData -> req=>(
        account_key:"5a4b298a-f903-4fbe-b53b-049b1a0d8d9b"
        contragentCostumer:""
        contragentOur:""
        profilePic:""
        projectDescription:""
        projectManager:""
        projectName:"явсяфвы")*/
app.post('/addProject', function(req, res){
            const makeAsyncRequest = async () => {
                account = req.body;
                console.log('addProject account:', account);
                havePermission = await isHavePermission(account.account_key);
                ownerUserId= await getUserId(account.account_key);
                console.log('isHavePermission:'+ havePermission+' , id:'+ownerUserId)
                if(havePermission) {
                   addedProject = await db.any('INSERT INTO projects (  project_name, owner_user, manager, description) VALUES (   $1, $2, $3, $4 ) RETURNING *',[account.projectName,ownerUserId,account.projectManager,account.projectDescription ])
                 }
                if (addedProject.length>0){
                    mess=[{mess:"Проект успешно создан!"}]
                } else {
                    mess=[{mess:"ОШИБКА СОЗДАНИЯ ПРОЕКТА!"}]
                }
                res.send(mess); 
            }
            makeAsyncRequest()
})

/*var data={
    account_key : this.myApp.user.uuid_key,
    projectId:item
  }*/
app.post('/delProject', function(req, res){
    const makeAsyncRequest = async () => {
        account = req.body;
        console.log('addProject account:', account);
        havePermission = await isHavePermission(account.account_key);
        ownerUserId= await getUserId(account.account_key);
        console.log('delProject havePermission:'+ havePermission+' , ownerUserId:'+ownerUserId)
        if(havePermission) {
           deleledProject = await db.any('DELETE FROM projects where id=$1 RETURNING *',[ account.projectId])
         }
        if (deleledProject.length>0){
            mess=[{mess:"Проект успешно УДАЛЕН!"}]
        } else {
            mess=[{mess:"Ошибка удаления проекта!"}]
        }
        res.send(mess); 
    }
    makeAsyncRequest()
})
        


//----end-----------PROJECT'S EVENTS---------------------------

//----start-----------LOGIN---------------------------
app.post('/login', function(req, res){
	console.log('Express:'+JSON.stringify(req.body));      // your JSON
    console.log('login event: ' + req.body.email +';'+req.body.password);
    db.any('SELECT u.id, u.uuid_key, u.username, u.last_name, u.email, u.active, u.description, u.contragent_flag, u.user_flag, u.group_flag, u.organization, ur.role_name, uc.user_pass, u.img_id,f.extention FROM users u INNER JOIN user_roles ur ON ( u.role_in_project = ur.id  )   INNER JOIN user_cred uc ON ( u.uuid_key = uc.user_key  ) LEFT OUTER JOIN files f ON (f.id=u.img_id) WHERE u.email=$1 AND uc.user_pass=$2',[req.body.email,req.body.password])
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
app.post('/getUserList', function(req, res){
    console.log("getUserList begin");
    const makeRequest = async () => {
        var dataWithDir ={
            data: [],
            users:[],
            dir:{
                organization:'',
                role_in_project:'',
                status:''
            }
        };    
        console.log('getUserList async start:------"'+JSON.stringify(dataWithDir));
        dataWithDir.dir.organization = await  db.any('SELECT id as value,org_short_name as label  FROM contragents c ORDER BY c.id ASC');
        dataWithDir.dir.role_in_project = await  db.any('SELECT ur.id as value, ur.caption as label FROM user_roles ur	ORDER BY ur.id ASC');
        dataWithDir.dir.status = await db.any('SELECT us.id as value, us.caption as label FROM user_status us ORDER BY us.id ASC');
        dataWithDir.users = await db.any("SELECT u.id, u.uuid_key, u.username, u.last_name, u.email, u.active, u.description, u.contragent_flag, u.user_flag, u.group_flag, contr.org_short_name organization,u.img_id, ur.caption as role_in_project, us.caption as status,concat( f.id,'.',f.extention )as url FROM users u INNER JOIN user_roles ur ON ( u.role_in_project = ur.id  )  INNER JOIN user_status us ON ( u.status = us.id  ) LEFT OUTER JOIN files f ON( u.img_id =f.id) LEFT OUTER JOIN contragents contr ON( u.organization =contr.id)",[]);
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

//----end-----------LOGIN---------------------------

//----start-----------USER'S EVENTS---------------------------
app.post('/addUser', function(req, res){
    var item =req.body.item;
    const makeAsyncRequest = async () => {
        sqlReq="WITH x AS (INSERT INTO user_cred (user_key) VALUES (uuid_generate_v4()) RETURNING user_key),"+
        "y AS (INSERT INTO users ( uuid_key,username,last_name,email,status,role_in_project)"+
        "SELECT user_key,$1,$2,$3,0,0 FROM x RETURNING *)"+
        "SELECT * FROM y;";
        addedUserData = await db.any(sqlReq,[item.name, item.last_name, item.email])
        console.log('Express addUser res:'+JSON.stringify(addedUserData));  
        
        if (req.body.item.profilePic){
            var bodyData = req.body.item.profilePic;
            var imageBuffer = decodeBase64Image(bodyData);
            img_id=await updateUserImg(addedUserData[0].uuid_key,imageBuffer);
            console.log('addUser updateUserImg:', imageBuffer.type);
            console.log('addUser addedUserData.uuid_key:', JSON.stringify(addedUserData[0].uuid_key));
            console.log('updateUserafter updateUserImg -> img_id:', img_id[0]);
            await db.any('UPDATE users SET img_id=$1 WHERE uuid_key=$2',[img_id[0],addedUserData[0].uuid_key])
        }
        res.send(JSON.stringify(addedUserData));    // echo the result back
    }
    makeAsyncRequest()
});
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
        if (req.body.profilePic){
            updatedUser[0]['ext']=img_id[1]
        }
        console.log('updateUser 1 updatedUser:', updatedUser);
        res.send(updatedUser); 
    }
    makeAsyncRequestupdateUser()
})
app.post('/passRepGetData', function(req, res){
    const makeAsyncRequestupdateUser = async () => {
        item = req.body;
        item.uuid_key=item.secretStr.slice(0, 36);
        console.log('passRepGetData item:', item);
        userData = await db.any('SELECT * FROM users WHERE users.uuid_key =$1',[item.uuid_key])
        console.log('passRepGetData userPass:', userData);
        res.send(userData); 
    }
    makeAsyncRequestupdateUser()
})

app.post('/passRepGetLink', function(req, res){
    const makeAsyncRequestupdateUser = async () => {
        console.log('passRepGetLink req.body:',req.body);
        userLink = await db.any("SELECT u.email,uc.user_pass,u.uuid_key FROM users u INNER JOIN user_cred uc ON(u.uuid_key=uc.user_key) WHERE u.uuid_key =$1",[req.body.uuid_key])
        console.log('passRepGetLink userLink:', userLink);

        res.send(userLink); 
    }
    makeAsyncRequestupdateUser()
})

app.post('/passRepSetPass', function(req, res){
    const makeAsyncRequestupdateUser = async () => {
        console.log('passRepGetData req:',item = req.body);
        item.uuid_key=item.secretStr.slice(0, 36);
        updatedPas = await db.any('UPDATE user_cred  SET user_pass=$2 WHERE user_key =$1 RETURNING * ',[item.uuid_key, item.password])
        updatedPas[0]['mess']='УСПЕШНО'
        console.log('passRepSetPass updatedPas:', updatedPas);
        res.send(updatedPas); 
    }
    makeAsyncRequestupdateUser()
})


//----end-----------USER'S EVENTS---------------------------

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
    console.log("updateUserImg uuidKey:", uuidKey);
    console.log("updateUserImg imgBuf:", imgBuf);
    const makeAsyncRequest = async () => {
        if (imgBuf.type==="image/jpeg") {var extention = 'jpg'} else {if (imgBuf.type==='image/png') {var extention = 'png'} else { extention=''}};
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
function isHavePermission(key){
    console.log('isHavePermission key: ', key)
    const makeAsyncRequest = async () => {
        data= await db.any('select uuid_key, role_in_project from users where uuid_key=$1',[key])
        console.log('isHavePermission data: ', data)
        if (data[0].role_in_project===6) {
            return true
            console.log('isHavePermission:'+ true+' , key:'+data[0].uuid_key+', role_in_project:'+data[0].role_in_project)
         } else {
            return false
            console.log('isHavePermission:'+ false+' , key:'+data[0].uuid_key+', role_in_project:'+data[0].role_in_project)
         }
     }
   return makeAsyncRequest()
}
function getUserId(key){
    console.log('isHavePermission key: ', key)
    const makeAsyncRequest = async () => {
        data= await db.any('select id from users where uuid_key=$1',[key])
        console.log('isHavePermission data: ', data)
        if (data[0].id) {
            return data[0].id
            console.log('getUserId:'+data[0].id)
         } else {
            return false
            console.log('getUserId:'+false)
         }
     }
   return makeAsyncRequest()
}
function getUsersList(){
    console.log('getUsersList start')
    const makeAsyncRequest = async () => {
        data= await db.any('select id, last_name, username from users ',[])
        console.log('getUsersList data: ', data)
        return data;
    }
   return makeAsyncRequest()
}

app.listen(port);
console.log("EXPRESS: Listening on port:" + port);

