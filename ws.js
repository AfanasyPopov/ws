var http = require('http');

 
var port = 8100;
 
function accept(req, res) {

  // если URL запроса /vote, то...
  if (req.url == '/vote') {
    // через 1.5 секунды ответить сообщением
    setTimeout(function() {
      res.end('Ваш голос принят: ' + new Date());
    }, 1500);
  } else {
    // иначе считаем это запросом к обычному файлу и выводим его
    //file.serve(req, res); // (если он есть)
  }

}


// ------ этот код запускает веб-сервер -------


 var s=http.createServer(accept).listen(port);

 
console.log("Listening on http://127.0.0.1:" + port + "/");
 