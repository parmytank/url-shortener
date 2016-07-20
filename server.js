var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = process.env.MONGOLAB_URI;
var express = require('express');
var app = express();
var path = require('path');

MongoClient.connect(url, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      console.log('Connection established to', url);
    }
    var urls = db.collection('urls');
    
    //passes array of original and short urls to the callback function
   function url_array(callback){
      urls.find(
            {}, {short_url:1, original_url:1, _id:0}
            ).toArray(function(err, item){ 
                if (err) throw err;
                callback(item);
        })
    }
    
    //finds the lowest unused index
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
        else{res.end('invalid address: url must be of "http://www.example.com"'
        + 'or "https://www.example.com" format')};
    }

    app.get('/', function(req,res){
        url_array(function(arr){
            res.sendFile(path.join(__dirname +'/intro.html'));
            //res.write(JSON.stringify(arr));
            //res.end();
        })
    })
    
    app.get('/list', function(req,res){
        url_array(function(arr){
            arr.sort(function(a,b){
                return a.short_url - b.short_url;
            })
            res.write('<html><body><table><tr><th>Original URL</th><th>Short URL</th></tr>')
            for(var i = 0; i<arr.length; i++){
                res.write('<tr><td>' + arr[i].original_url + '</td><td>' + arr[i].short_url + '</td></tr>')
            }
            res.end('</table></body></html>');
        })
    })
    
    app.get('/new/http://:input', function(req, res){
        addSite(req,res, 'http://');
    })
    
    app.get('/new/https://:input', function(req, res){
        addSite(req,res, 'https://');
    })
    
    function addSite(req, res, start){
        var new_url = start + req.params.input;
        checkSite(res,new_url,function(res, new_url){
            insertSite(res,new_url);
        });
       
    }
    function checkSite(res, new_url, callback){
        var exists = false;
        
        //check if url already in database
        url_array(function(data){
            for(var i = 0; i<data.length; i++){
                if(data[i].original_url === new_url){
                    exists = true;
                    res.end('url already in database: ' + JSON.stringify(data[i]));
                    return;
                }
            }
            if(!exists){callback(res, new_url);}
        })
    }
    
    function insertSite(res, new_url){
        unused_index(function(i){
            var index = i;
            urls.insert({'original_url':new_url, 'short_url':index}, function(err, data){ 
                if(err) console.log(err);
                res.write('url already in database\n');
                res.end('original_url:' + data.ops[0].original_url + ', short_url:' + data.ops[0].short_url);
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

