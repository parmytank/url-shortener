var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://parmytank:1qaz!QAZ@ds023485.mlab.com:23485/url-shortener';
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
    
    url_array(function(data){
        console.log(data);
        //console.log('Enter short_url to delete');
        var arr = [];
        urls.remove({
            short_url: {$in: arr}
        })
        db.close();
    })
})