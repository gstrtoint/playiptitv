// loosely based on https://gist.github.com/bnerd/2011232
// requires node.js >= v0.10.0
// assumes that HLS segmenter filename base is 'out'
// and that the HLS playlist and .ts files are in the current directory
// point Safari browser to http://<hostname>:PORT/player.html

var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');
var zlib = require('zlib');

PORT = 8000;

http.createServer(function (req, res) {
	var uri = url.parse(req.url).pathname;

	if (uri == '/player.html') {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.write('<!DOCTYPE html>'+
				'<html>'+
				'  <head>'+
				'    <link rel="stylesheet" href="http://localhost:3000/node_modules/video.js/dist/video-js.min.css">'+
				'  </head>'+
				'  <body ng-app="appplay">'+
				'    <script type="text/javascript" src="http://localhost:3000/node_modules/video.js/dist/video.min.js"></script>'+
				'    <script type="text/javascript" src="http://localhost:3000/node_modules/videojs-contrib-hls/dist/videojs-contrib-hls.min.js"></script>'+
				'    <div ng-controller="controllerIndex" ng-cloak>'+
				'            <button type="button" name="button" class="md-primary" onclick="addplay()">Play</button>'+
				'        <div id="container"></div>'+
				'          <video id="example-video" width=600 height=300 class="video-js vjs-default-skin" preload="auto" controls data-setup="{}">'+
				'            <source src="http://192.99.46.182:1935/pioneira-tv3/pioneira-tv3/chunklist_w133088733.m3u8" type="application/x-mpegURL"> </video>'+
				'          <script>'+
				'            addplay =function(){'+
				'              var html = \'<video id="play" width=600 height=300 class="video-js vjs-default-skin" controls preload="auto" width="640" height="268" data-setup="{}">\';'+
				'              html += \'<source src="http://localhost:8000/canal.m3u8" type="application/x-mpegURL">\';'+
				'              html += \'</video>\';'+
				'              document.getElementById("container").innerHTML = html;'+
				'              var player = videojs(\'play\');'+
				              //player.play();
				'            }'+
				'          </script>'+

				'      </md-content>'+
				'    </div>'+
				'  </body>'+
				'</html>');
		res.end();
		return;
	}

	var filename = './'+path.join("./", uri);
	console.log(filename);
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
						res.writeHead(200,
						    {'Content-Type':
						    'application/vnd.apple.mpegurl'});
						var ae = req.headers['accept-encoding'];
						if (ae.match(/\bgzip\b/)) {
							zlib.gzip(contents, function (err, zip) {
								if (err) throw err;

								res.writeHead(200,
								    {'content-encoding': 'gzip'});
								res.end(zip);
							});
						} else {
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
}).listen(PORT);
