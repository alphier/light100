/************
 *bootstrap
 */

var cp = require('child_process'),
	//spawn = require('child_process').spawn,
	fs = require('fs'),
	path = require("path"),
	net = require("net"),
	server = net.createServer(),
	child;

var dtstr = function(){
    var dt = new Date();
	var dtstr = dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate() +
				' ' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds() + ' ';

	return dtstr;
};

var log = function(file, content, callback){
    "use strict";
	
	var c = '' + content;
	try{
		fs.appendFile(file, c, 'utf8', function(err){
			if(typeof(callback) === 'function'){
			    callback();
			}
		});
	}catch(err){
		console.log(err);
	}
};

var startProcess = function (){
	"use strict";
	
	try{
		process.chdir('portal');
		child = cp.fork( './app.js');
		process.chdir('../');
		
		child.on('exit', function (code, signal) {
			log('/mnt/light100/portal/log/light.log', dtstr() + ' Web server exit, restart it.\n');			
			startProcess();
		});
		
		child.on('error', function (code, signal) {
			log('/mnt/light100/portal/log/light.log', dtstr() + ' Web server error:' + code + '\n');
		});
		
		child.on('SIGTERM', function(){
			child.kill('SIGINT');
		});
	
		child.on('uncaughtException', function (err) {
			log('/mnt/light100/portal/log/server.log' + ' Web server exception:' + err + '\n');
		});
		
		log('/mnt/light100/portal/log/light.log', dtstr() + ' Web server start\n');
	}catch(err){
		log('/mnt/light100/portal/log/light.log', dtstr() + 'err:' + err + '\n');
		log('/mnt/light100/portal/log/light.log', dtstr() + ' Web server start failed\n');
	}
};

var exit = function(callback){	
	try{
		if(child){
			child.kill('SIGTERM');
			log('/mnt/light100/portal/log/light.log', dtstr() + ' Web server stop\n',function(){
				callback();
			});
		} else {
			callback();
		}
	}catch(err){
		console.log(err);
		log('/mnt/light100/portal/log/light.log', dtstr() + err + '\n');
	}

};

process.on('SIGINT', function(){
    exit(function(){
		process.exit(0);
	});
});

process.on('SIGTERM', function(){
    exit(function(){
		process.exit(0);
	});
});

server.listen(1300, function(){
    startProcess();
});

