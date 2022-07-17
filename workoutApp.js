// Author: Ren Demeis-Ortiz
// Course: CS290 Web Development
// Description: Backend for workout tracking app dbcon.js must
//				be modified to include mysql credentials


// Source: Week 8 lecture materials linked on below page
// http://eecs.oregonstate.edu/ecampus-video/CS290/core-content/sessions-http/
// sessions-http.html
var express = require('express');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var bodyParser = require("body-parser");
var mysql = require("./dbcon.js");

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static("public"));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 9584);

//Sources for mysql week 9 lectures:
//http://eecs.oregonstate.edu/ecampus-video/CS290/core-content/node-mysql/
//node-mysql.html

//Get request from client - Create table if one doesn't exist
app.get('/', function(req,res,next){
  var context = {};
  mysql.pool.query("SELECT 1 FROM workouts LIMIT 1", function(err){
    if(err){
      var createString = "CREATE TABLE workouts(" +
      "id INT PRIMARY KEY AUTO_INCREMENT," +
      "name VARCHAR(255) NOT NULL," +
      "reps INT," +
      "weight INT," +
      "dateDone VARCHAR(255)," +
      "units VARCHAR(255)," +
      "isLb BOOLEAN," +
      "isKg BOOLEAN)";
      mysql.pool.query(createString, function(err){
        var context = {};
        context.type = "Workout";
        res.render('home', context);
      });
    }
    else{
      res.render('home', context);
    }
  });
});

//Post request from client
app.post('/', function(req,res,next){
  //Source:
  //https://stackoverflow.com/questions/30460158/express-4-handlebars-render-without-layout
  //Check that table exists and create new table if it was reset
  mysql.pool.query("SELECT 1 FROM workouts LIMIT 1", function(err){
    if(err){
      var createString = "CREATE TABLE workouts(" +
      "id INT PRIMARY KEY AUTO_INCREMENT," +
      "name VARCHAR(255) NOT NULL," +
      "reps INT," +
      "weight INT," +
      "dateDone VARCHAR(255)," +
      "units VARCHAR(255)," +
      "isLb BOOLEAN," +
      "isKg BOOLEAN)";
      mysql.pool.query(createString, function(err){
      });
    }
  
    //Send table data on page load
    if(req.body['loadTable']){
      sendTable(res);
    }
  
    //If Add is clicked add item to table
    if(req.body['Add']){
      var isKg = req.body.units=="kg";
      var isLb = req.body.units=="lb";
      mysql.pool.query(
       "INSERT INTO workouts (name,reps,weight,dateDone,units,isLb,isKg) VALUES (?,?,?,?,?,?,?)", 
       [req.body.name, req.body.reps, req.body.weight, req.body.dateDone, req.body.units, isLb, isKg],
       function(err, result){
        if(err){
          next(err);
          return;
        }
        else{
          sendTable(res);
        }
      });
    
    }
  
    //If Edit is clicked store id of item to be changed
    if(req.body['Edit']){
      var context = {};
      mysql.pool.query("DROP TABLE IF EXISTS changeItem", function(err){
        if(err){
          console.log("Error dropping table");
          next(err);
          return;
        }
        else{
          var createString =  "CREATE TABLE changeItem(" +
          "id INT PRIMARY KEY," +
          "itemId INT)";
          mysql.pool.query(createString, function(err){
            if(err){
              next(err);
              return;
            }
            else{
              mysql.pool.query( "INSERT INTO changeItem (id, itemId) VALUES (1,?)", [req.body.id],function(err){
                if(err){
                  next(err);
                  return;
                }
                else{
                  mysql.pool.query("SELECT * FROM changeItem WHERE id=1", function(err, result){
                  var changeItem = result[0].id;
                  });
                }
              });
            }
          });
        }
      });
        res.send('success');
    }
  
    //If Update is clicked update table to new values
    if(req.body['Update']){
      //Get ID from changeItem database
      mysql.pool.query("SELECT * FROM changeItem WHERE id=1", function(err, result){
        if(err){
          next(err);
          return;
        }
        else{
          var targetItem = result[0];
          //Update data at id
          mysql.pool.query("SELECT * FROM workouts WHERE id=?", [targetItem.itemId], 
          function(err, result){
            if(err){
              next(err);
              return;
            }
            else{
              var vals = result[0];
              vals.isKg = req.body.units == "kg";
              vals.isLb = req.body.units == "lb";
              mysql.pool.query("UPDATE workouts SET name=?, reps=?, weight=?, dateDone=?, units=?, isLb=?, isKg=? WHERE id=? ",
              [req.body.name || vals.name, req.body.reps || vals.reps, req.body.weight || vals.weight, req.body.dateDone || vals.dateDone, req.body.units || vals.units, vals.isLb, vals.isKg, req.body.id],
              function(err, result){
                if(err){
                  next(err);
                  return;
                }
                else{
                  sendTable(res);
                }
              });
            }
          });
        }
      });
    }
  
  
    //If Delete is clicked
    if(req.body['Delete']){
      var context = {};
      mysql.pool.query("DELETE FROM workouts WHERE id=?", [req.body.id], 
       function(err, result){
        if(err){
          next(err);
          return;
        }
        else{
          sendTable(res);
        }
      });
    }
    
    //Reset Database
    if(req.body['Reset']){
    var context = {};
      mysql.pool.query("DROP TABLE IF EXISTS workouts", function(err){
        if(err){
          console.log("error dropping table");
          next(err);
          return;
        }
        else{
          context.workouts = "All workouts Data Deleted";
          mysql.pool.query("DROP TABLE IF EXISTS changeItem", function(err){
            if(err){
              console.log("error dropping table");
              next(err);
              return;
            }
            else{
              context.changeItem = "All changeItem Data Deleted";
              res.send(context);
            }
          });
        }
      });
    }
  });
});

//When there is a post send item data to populate default values
app.post('/edit-item.html', function(req,res,next){
    var context = {};
    mysql.pool.query("SELECT * FROM changeItem WHERE id=1", function(err, result){
      if(err){
        next(err);
        return;
      } 
      else{
        var id = result[0].itemId;
        //Get data for id in body and store in context
        mysql.pool.query("SELECT * FROM workouts WHERE id=?", [id], function(err, result){
          if(err){
            next(err);
            return;
          }
          context.item = result;
          res.send(context.item);
        });
      }
    });
});

app.use(function(req,res){
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on flip3:' + app.get('port') + '; press Ctrl-C to terminate.');
});

function sendTable(res){
  var context = {};
      mysql.pool.query("SELECT * FROM workouts", function(err, rows){
        if(err){
          next(err);
          return;
        }
        context.workouts = rows;
        res.set('Content-Type', 'text/plain');
        res.send(context.workouts);
      });
}
