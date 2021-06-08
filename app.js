/**
 * Created by Gilmar N. Lima on 01/05/17.
 */
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var load = require('express-load');
var bodyParser = require('body-parser');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
//app.use(express.json({limit:'5mb'}));
//app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json({limit:'5mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '5mb'}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

load('models')
  .then('controllers')
  .then('routes')
  .into(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
gravando = [];
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
