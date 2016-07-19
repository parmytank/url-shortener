var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = process.env.MONGOLAB_URI;
var express = require('express');
var app = express();

MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', url);
  }
  var urls = db.collection('urls');
  function url_array(callback){
      urls.find(
            {}, {short_url:1, original_url:1, _id:0}
            ).toArray(function(err, item){ 
                if (err) throw err;
                callback(item);
        })
    }
    
    function unused_index(callback){
        var i = 1;
        url_array(function(array){
            while(true){
                for(var j = 0; j<array.length; j++){
                    if(array[j].short_url == i){
                        i++
                        break;
                    }
                    if(j == array.length -1){
                        callback(i);
                        return;
                    }
                }
            }
        })
    }
    
    
    app.use('/new/http://:input',function(req, res, next){
        var check = checkurl(req, res, next);
    })
    
    app.use('/new/https://:input',function(req, res, next){
        var check = checkurl(req, res, next);
    })
    
    function checkurl(req, res, next){
        var input = req.params.input;
        if(input.substr(0,4) == 'www.' && 
        input.substr(input.length - 4,4) == '.com'){return next();}
        else{res.end('invalid address')};
    }

    app.get('/', function(req,res){
        url_array(function(arr){
            res.end(JSON.stringify(arr));
            res.end('Welcome to the url-shortener service.');
        })
    })
    
    app.get('/new/http://:input', function(req, res){
        addSite(req,res, 'http://');
    })
    app.get('/new/https://:input', function(req, res){
        addSite(req,res, 'https://');
    })
    
    function addSite(req, res, start){
        var input = req.params.input;
        unused_index(function(i){
            var index = i;
            var url = start + input;
            urls.insert({'original_url':url, 'short_url':index}, function(err, data){ 
                if(err) console.log(err);
                console.log(JSON.stringify(data.ops));
                res.end(JSON.stringify(data.ops));
            });
        })
    }
       
    app.get('/:index',function(req, res){
        var index = parseInt(req.params.index);
        url_array(function(array){
            for(var i=0; i < array.length; i++){
                if(array[i].short_url == index){
                    console.log(array[i].original_url);
                    res.redirect(array[i].original_url);
                    return;
                }
            }
        }) 
    })
    app.listen(process.env.PORT, process.env.IP);
    
    app.onbeforeunload = function (e) {db.close();}
  }
);

