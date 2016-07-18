var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = process.env.MONGOLAB_URI;
var express = require('express');
var app = express();
app.use(express.static('/new/'));

MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', url);
  }
  var urls = db.collection('urls');
  function nextIndex(callback){
      var array = [];
      urls.find(
            {}, {short_url:1, _id:0}
            ).toArray(function(err, item){ 
                if (err) throw err;
                for(var i=0;i<item.length;i++){
                    array.push(item[i].short_url);
                }
                callback(array);
        })
    }
    
    app.use('/new/http://:input',function(req, res, next){
        var input = req.params.input;
        if(checkurl(input)){next();}
        else{res.end('invalid')};
    })

    app.get('/', function(req,res){
        var array = nextIndex(function(data){
            console.log(data);
        });
        res.end('Welcome to the url-shortener service.');
    })
    
    app.get('/new/http://:input', function(req, res){
        var input = req.params.input;
        var index = 1;
        urls.insert({'original_url':input, 'short_url':index}, function(err, data){ 
            if(err) console.log(err);
            console.log(JSON.stringify(data.ops));
            res.end(JSON.stringify(data.ops));
            db.close();
        });
     
    })
       
    app.get('/:index',function(req, res){
        var index = parseInt(req.params.index);
        var output = urls.find({
            short_url: {$eq: index}
        },
        {
            short_url:1,
            original_url:1
        }).toArray(function(err, docs){
            if (err) throw err;
            var new_url = 'https://' + docs[0].original_url;
            res.redirect(new_url);
        })    
    })
    app.listen(process.env.PORT, process.env.IP);
    
    app.onbeforeunload = function (e) {db.close();}
    
    

  }
);

function checkurl(string){
    if (string.substr(0,4) != 'www.'){return false;}
    return true;
}