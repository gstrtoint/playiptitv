/**
 * Created by Gilmar N. Lima on 01/05/17.
 */
module.exports = function(){
  //var ffmpeg = require('ffmpeg');
  var ffmpeg = require('fluent-ffmpeg');
  var fs = require('fs');
  var url = require('url');
  var path = require('path');
  var zlib = require('zlib');
  var exec = require('child_process').exec;
  var gravando = [];
  var validaExtencion = function(file, ext){
    var f= file.split('.');
    return f[f.length -1] == ext;
  }
  var ControllerIndex={
    index: function(req, res){
      res.render('index',{title:'Player IPTV'});
    },
    lista: function(req, res){
      var filename = './public/videos/canais.m3u';
      var error = {
        dados: {
          message: 'Desculpe, não foi possível carregar a lista de canais!',
          tipo: 1
        }, token: "token"
      }
      fs.exists(filename, function (exists) {
    		if (!exists) {
          res.json(error);
        }else{
          fs.readFile(filename, function (err, contents) {
            if (err) {
              res.json(error);
            }else{
              res.json({
                dados:{
                  lista:contents.toString(),
                  gravando:gravando,
                  message: 'Lista de canais cadastrados atualizada!',
                  tipo: 2
                },
                token: "token"}
              )
            }
          })
        }
      });
    },
    novocanal: function(req, res){
      var filename = './public/videos/canais.m3u';
      var obj = req.body;
      fs.exists(filename, function(exists){
        if (!exists) {
          var file = '#EXTM3U\n'+
            '#EXTINF:-1 tvg-logo="'+obj.urlimg+'" group-title="'+obj.nome+'", '+obj.descricao+'\n'+
            obj.url+'\n';

          fs.appendFile(filename,file,function(err){
            if(err){
              res.json({ dados: {
                message: 'Falha inesperada! Conate o administrador.',
                tipo: 1
              }, token: "token"})
            }else{
              res.json({ dados: {
                message: 'Canal includio com sucesso!',
                tipo: 2
              },token: "token"})
            }
          })
        }else{
          var file = '\n#EXTINF:-1 tvg-logo="'+obj.urlimg+'" group-title="'+obj.nome+'", '+obj.descricao+'\n'+
            obj.url+'\n';
          fs.appendFile(filename,file,function(err){
            if(err){
              res.json({ dados: {
                message: 'Falha inesperada! Conate o administrador.',
                tipo: 1
              }, token: "token" })
            }else{
              res.json({ dados: {
                message: 'Canal includio com sucesso!',
                tipo: 2
              },token: "token" })
            }
          })
        }
      })
    },
    convert: function(req, res){
      var dias = ['seg','ter','qua','qui','sex','sab','dom']
      var mes = ['janeiro','fevereiro','março','abril','maio','junho','julho',
          'agosto','setembro','outubro','novembro','dezembro']
      now = new Date();
      var marco = dias[now.getDay()-1]+' '+now.getDate().toString()+' '+
        mes[now.getMonth()]+' '+now.getFullYear().toString()+' '+
        now.getHours().toString()+':'+
        (now.getMinutes()<10?'0'+now.getMinutes().toString():
        now.getMinutes().toString())+' ';

      var canal = req.body;
      var pid = 0;
      var i;
      for(i=0; i< gravando.length; i++){
        if (gravando[i].url == canal.url){
          pid = canal.pid;
          break;
        }
      }
      if(pid>0){
        var cmd = 'kill $(ps aux|grep '+canal.url+' | awk \'{print $2}\')';
        exec(cmd,function(error,stdout,stderr){
          console.log(error);
          console.log(stdout);
          console.log(stderr);
          pid = 0;
          gravando.splice(i);
          res.json({
            dados: {
              pid: pid,
              message: 'Gravação finalizada para o '+canal.nome,
              tipo: 2
            }, token: "token"
          });
        })
      }else {
        if (canal.converter){
          var command0 = ffmpeg(canal.url)
          .output('./public/videos/'+canal.nome+'.m3u8')
          .outputOptions([
            '-c:v libx264',
            '-c:a copy',
            '-ac 2',
            '-strict -2',
            '-crf 25',
            '-b:v 145k',//qualidade do video
            '-profile:v baseline',
            '-maxrate 400k',
            '-bufsize 1835k',
            '-pix_fmt yuv420p',
            '-hls_time 10',
            '-hls_list_size 6',
            '-hls_wrap 10',
            '-s 300x224',
            '-start_number 1'
          ])
          .output('./public/videos/'+marco+canal.nome+'.mp4')
          .audioCodec('copy')
          .videoCodec('libx264')
          //.size('320x240')
          .outputOptions([
            '-ac 2',
            '-b:a 96k', // qualidade do audio
            '-ar 44100',
            '-b:v 345k',//qualidade do video
            '-s 300x224',
            '-c:a copy'
          ])
          .on('error', function(err) {
            console.log('An error occurred: ' + err.message);
          })
          .on('end', function() {
            console.log('Processing finished !');
          })
          .on('start', function() {
            // Send SIGSTOP to suspend ffmpeg
            //command0.kill('SIGSTOP');

            doSomething(function() {
              // Send SIGCONT to resume ffmpeg
              command0.kill('SIGCONT');
            });
          })
          //.pipe('./public/videos/output.M3U8')
          .run();
          var time = function() {
            if(command0.ffmpegProc){
              pid = command0.ffmpegProc.pid;
              gravando.push({pid: pid, url:canal.url});
              res.json({
                dados: {
                  pid: pid,
                  message: 'Gravando agora o canal '+canal.nome,
                  tipo: 2
                }, token: "token"
              });
            }else {
              setTimeout(time,2500);
            }
            //console.log(command1);
            //command1.kill('SIGCONT');
            //command1.kill('SIGSTOP');
            //command1.kill();
          };
          setTimeout(time,500);
        }else {
          var command1 = ffmpeg(canal.url);

          command1.audioCodec('copy');
          command1.videoCodec('libx264');
          //.size('320x240')
          command1.outputOptions([
            '-ac 2',
            '-b:a 96k', // qualidade do audio
            '-ar 44100',
            '-b:v 345k',//qualidade do video
            '-s 300x224',
            '-c:a copy'
          ]);
          command1.save('./public/videos/'+marco+canal.nome+'.mp4');
          command1.on('error', function(err) {
            console.log('An error occurred: ' + err.message);
          });
          command1.on('end', function() {
            console.log('Processing finished !');
          });
          /*.on('start', function() {
            // Send SIGSTOP to suspend ffmpeg
            //command0.kill('SIGSTOP');

            doSomething(function() {
              // Send SIGCONT to resume ffmpeg
              command1.kill('SIGCONT');
            });
          })*/
          command1.run();

          var time = function() {
            if(command1.ffmpegProc){
              pid = command1.ffmpegProc.pid;
              gravando.push({pid: pid, url:canal.url});
              res.json({
                dados: {
                  pid: pid,
                  message: 'Gravando agora o canal '+canal.nome,
                  tipo: 2
                }, token: "token"
              });
            }else {
              setTimeout(time,2500);
            }
            //console.log(command1);
            //command1.kill('SIGCONT');
            //command1.kill('SIGSTOP');
            //command1.kill();
          };
          setTimeout(time,500);
        }
      }
    },
    getvideo: function(req, res){
      var uri = decodeURI(url.parse(req.url).pathname.replace('/getvideo',''));
      //debugger;
      //uri = './public/videos/output.M3U8';
      //var filename = uri;//path.join("./", uri);

      var filename = './public/videos/'+path.join("./", uri);
    	fs.exists(filename, function (exists) {
    		if (!exists) {
    			console.log('file not found: ' + filename);
    			res.writeHead(404, { 'Content-Type': 'text/plain' });
    			res.write('file not found: %s\n', filename);
    			res.end();
    		} else {
    			console.log('sending file: ' + filename);
    			switch (path.extname(uri)) {
    			case '.m3u8':
    				fs.readFile(filename, function (err, contents) {
    					if (err) {
    						res.writeHead(500);
    						res.end();
    					} else if (contents) {
    						//res.writeHead(200,
    						//    {'Content-Type':
    						//    'application/vnd.apple.mpegurl'});
    						var ae = req.headers['accept-encoding'];
    						if (ae.match(/\bgzip\b/)) {
    							zlib.gzip(contents, function (err, zip) {
    								if (err) throw err;

    								res.writeHead(200,
    								    {
                          'Content-Type': 'application/vnd.apple.mpegurl',
                          'content-encoding': 'gzip'
                        }
                      );
    								res.end(zip);
    							});
    						} else {
                  res.writeHead(200,
                      {
                        'Content-Type': 'application/vnd.apple.mpegurl',
                      }
                    )
    							res.end(contents, 'utf-8');
    						}
    					} else {
    						console.log('emptly playlist');
    						res.writeHead(500);
    						res.end();
    					}
    				});
    				break;
    			case '.ts':
    				res.writeHead(200, { 'Content-Type':
    				    'video/MP2T' });
    				var stream = fs.createReadStream(filename,
    				    { bufferSize: 64 * 1024 });
    				stream.pipe(res);
    				break;
    			default:
    				console.log('unknown file type: ' +
    				    path.extname(uri));
    				res.writeHead(500);
    				res.end();
    			}
    		}
      });
    },
    getvideorec: function(req, res){
      var fs = require("fs"),
      http = require("http"),
      url = require("url"),
      path = require("path");

      var uri = decodeURI(url.parse(req.url).pathname.replace('/getvideorec',''));
      var filename = './public/videos/'+path.join("./", uri);

      //http.createServer(function (req, res) {
      //  if (req.url != "/movie.mp4") {
      //    res.writeHead(200, { "Content-Type": "text/html" });
      //    res.end('<video src="http://localhost:8888/movie.mp4" controls></video>');
      //  } else {
          //var file = path.resolve('./public/videos/',"movie.mp4");
          fs.stat(filename, function(err, stats) {
            if (err) {
              if (err.code === 'ENOENT') {
                // 404 Error if file not found
                return res.sendStatus(404);
              }
            res.end(err);
            }
            var range = req.headers.range;
            if (!range) {
             // 416 Wrong range
             return res.sendStatus(416);
            }
            var positions = range.replace(/bytes=/, "").split("-");
            var start = parseInt(positions[0], 10);
            var total = stats.size;
            var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
            var chunksize = (end - start) + 1;

            res.writeHead(206, {
              "Content-Range": "bytes " + start + "-" + end + "/" + total,
              "Accept-Ranges": "bytes",
              "Content-Length": chunksize,
              "Content-Type": "video/mp4"
            });

            var stream = fs.createReadStream(filename, { start: start, end: end })
              .on("open", function() {
                stream.pipe(res);
              }).on("error", function(err) {
                res.end(err);
              });
          });
      //  }
      //}).listen(8888);

    },
    listrec: function(req, res){
      var listgrav = [];
      const folder = './public/videos/';
      fs.readdir(folder, (err, files) => {
        files.forEach(file => {
          if(validaExtencion(file,'mp4')){
            listgrav.push({url:file})
          }
        });
        if (err) {
          res.json(error);
        }else{
          res.json({
            dados:{
              listgrav:listgrav,
              message: 'Lista de canais gravados!',
              tipo: 2
            },
            token: "token"
          })
        }
      });
    },
    removeCanal: function(req, res){
      //data.lista.toString().split('\n')
      var filename = './public/videos/canais.m3u';
      var error = {
        dados: {
          message: 'Desculpe, não foi possível excluir o canal!',
          tipo: 1
        }, token: "token"
      }
      fs.exists(filename, function (exists) {
    		if (!exists) {
          res.json(error);
        }else{
          fs.readFile(filename,'utf8', function (err, contents) {
            if (err) {
              res.json(error);
            }else{
              try{
                var r='';
                var linhas = contents.split('\n');
                for(var i=0; i<linhas.length;i++){
                  if(linhas[i].indexOf(req.body.url)>-1){
                    linhas.splice(i-1,2)
                    break;
                  }
                };
                for(var i=0; i<linhas.length;i++){
                  r += linhas[i]+'\n'
                };
                fs.writeFile(filename,r);
                res.json({
                  dados:{
                    ok:'ok',
                    message: 'Canal excluido com sucesso!',
                    tipo: 2
                  },
                  token: "token"}
                )
              }catch(e){
                res.json(error);
              }
            }
          })
        }
      });
    }
  }
  return ControllerIndex;
}
