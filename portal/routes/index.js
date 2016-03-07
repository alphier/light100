var db = require('../lib/dataBase'),
	moment = require('moment'),
	server = require('../lib/communicate'),
	log4js = require('log4js'),
	config = require('../config'),
	fs = require('fs'),
	iconv = require('iconv-lite'),
	io = require('socket.io')(8080),
	sockets = [];

log4js.configure({
    appenders: [
        {
            type: "file",
            filename: "./log/server.log",
            category: 'server',
			maxLogSize: 20 * 1024 * 1024,
			backup: 5
        },
        {
        	type: "console"
        }
    ],
    replaceConsole: true
});
log4js.addAppender(log4js.appenders.file('./log/exception.log'), 'exception');

var logger = log4js.getLogger('server'),
	exlog = log4js.getLogger('exception');

process.on('uncaughtException', function(err) {
    logger.error('Error caught in uncaughtException event:', err);
    process.exit(0);
});

var sendMsgToRoom = function (type, arg) {
    "use strict";

    for (var id in sockets) {
        if (sockets.hasOwnProperty(id)) {
            logger.info('Sending message to', sockets[id]);
            io.sockets.to(sockets[id]).emit(type, arg);
        }
    }
};

var recaculateCtlerInfo = function (idx, co, ci, callback){
	"use strict";
	
	db.getController({index:idx, code:co, cid:ci},function(ct){
		if(!ct){ 
			callback('failed');
		} else {
			db.getLights({index:idx, code:co, cid:ci},function(result){
				if(!result){
					callback({index:ct.index,code:ct.code,cid:ct.cid,state:ct.state,name:ct.name,
						lightCount:0,chargeState:"no-charging",chargeNum:0,lightState:"no-lighting",lightNum:0,
						brokenState:"no-broken",brokenNum:0});
				}
				else{
					var c = 0,
						o = 0,
						b = 0;
					for(var i in result){
						if(result[i].charging === 1)
							c ++;
						if(result[i].onoff === 1)
							o ++;
						if(result[i].state === 1)
							b ++;
					}
					var cs, os, bs;
					if(c > config.light.charging){
						cs = "charing";
					}
					else {
						cs = "no-charging";
					}
					if(o > config.light.onoff){
						os = "lighting";
					}
					else {
						os = "no-lighting";
					}
					if(b > config.light.broken){
						bs = "broken";
					}
					else {
						bs = "no-broken";
					}
					var cTime = -1;
					if(ct.hasOwnProperty('cnnTime'))
						cTime = ct.cnnTime;
					callback({index:ct.index,code:ct.code,cid:ct.cid,state:ct.state,name:ct.name,cnnTime:cTime,
						lightCount:result.length,chargeState:cs,chargeNum:c,lightState:os,lightNum:o,
						brokenState:bs,brokenNum:b});
				}
			});
		}
	});		
};

var exportUsefulData = function(ctl,callback){
	"use strict";
	
	var datetime = moment().format("YYYYMMDDHHmmss"),
		fullpath = './public/data/usefulData_' + datetime + '.csv',
		filename = '/data/usefulData_' + datetime + '.csv',
		header = "时间,人流量,车流量,温度\r\n",
		gbkbuf = iconv.encode(header, 'GBK');
	fs.writeFile(fullpath,gbkbuf,function(err){
		if(err) 
			callback('failed');
		else{
			db.getCtlUsefulData(ctl,function(result){
				if(!result){
					callback('failed');
					return;
				}
				for(var id in result){
					var data = moment(result[id].time).format('YYYY-MM-DD HH:mm:ss') + ',' + 
							result[id].people + ',' + result[id].vehicle + ',' + result[id].temperature + '\r\n';
					fs.appendFile(fullpath,data,function(err){});
				}
				callback(filename);
			});
		}
	});
};

var chargeTimes = ['06','07','08','09','10','11','12','13','14','15','16','17','18','19'];
var exportMaxChargePower = function(ctl,callback){
	"use strict";
	
	var datetime = moment().format("YYYYMMDDHHmmss"),
		fullpath = './public/data/maxChargePower_' + datetime + '.csv',
		filename = '/data/maxChargePower_' + datetime + '.csv',
		header = "日期,6时,7时,8时,9时,10时,11时,12时,13时,14时,15时,16时,17时,18时,19时\r\n",
		gbkbuf = iconv.encode(header, 'GBK');
	fs.writeFile(fullpath,gbkbuf,function(err){
		if(err) 
			callback('failed');
		else{
			db.getCtlLightsMaxPowers(ctl,function(result){
				if(!result){
					callback('failed');
					return;
				}
				for(var id in result){
					var power = result[id];
					var data = "";
					data += power.time+",";
					for(var t in chargeTimes){
						if(power.hasOwnProperty(chargeTimes[t])){
							var field = chargeTimes[t],
								maxPower = power[field];
							if(maxPower.cpower === -1)
								maxPower.cpower = "";
							data += maxPower.cpower+",";
						}
					}
					data = data.substr(0,data.length-1);
					data += "\r\n";
					fs.appendFile(fullpath,data,function(err){});
				}
				callback(filename);
			});
		}
	});
};

var dischargeTimes = ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];
var exportMaxDischargePower = function(ctl,callback){
	"use strict";
	
	var datetime = moment().format("YYYYMMDDHHmmss"),
		fullpath = './public/data/maxDischargePower_' + datetime + '.csv',
		filename = '/data/maxDischargePower_' + datetime + '.csv',
		header = "日期,6时,7时,8时,9时,10时,11时,12时,13时,14时,15时,16时,17时,18时,19时\r\n",
		gbkbuf = iconv.encode(header, 'GBK');
	fs.writeFile(fullpath,gbkbuf,function(err){
		if(err) 
			callback('failed');
		else{
			db.getCtlLightsMaxPowers(ctl,function(result){
				if(!result){
					callback('failed');
					return;
				}
				for(var id in result){
					var power = result[id];
					var data = "";
					data += power.time+",";
					for(var t in dischargeTimes){
						if(power.hasOwnProperty(dischargeTimes[t])){
							var field = dischargeTimes[t],
								maxPower = power[field];
							if(maxPower.dpower === -1)
								maxPower.dpower = "";
							data += maxPower.dpower+",";
						}
					}
					data = data.substr(0,data.length-1);
					data += "\r\n";
					fs.appendFile(fullpath,data,function(err){
						logger.debug("appendFile result is ", err);
					});
				}
				callback(filename);
			});
		}
	});
};

io.on('connection', function(socket){
  logger.info('Incoming a connection...id',socket.id);
  sockets.push(socket.id);
  socket.on('disconnect',function (){
	  logger.info('Disconnected...id',socket.id);
	  var index = sockets.indexOf(socket.id);
	  if(index !== -1)
		  sockets.splice(index, 1);
  });
});

var udpServer = new server.communicate({logger: logger, exLogger: exlog});

udpServer.addEventListener("controller-registered", function (data, id){
	logger.info("controller " + id + " registered!!!" + JSON.stringify(data));
	sendMsgToRoom('onCtlRegistered',data);
});

udpServer.addEventListener("controller-connect", function (data, id){
	logger.info("controller " + id + " connect!!!" + JSON.stringify(data));
	sendMsgToRoom('onCtlOnline',data);
});

udpServer.addEventListener("update-data", function (data, id){
	logger.info("controller " + id + " update data!!!" + JSON.stringify(data));
	sendMsgToRoom('onUpdateData',data);
});

udpServer.addEventListener("controller-disconnect", function (data, id){
	var device = udpServer.getDeviceInfo(id);
	logger.info("controller " + id + " disconnect!!!" + JSON.stringify(device));
	sendMsgToRoom('onCtlOffline',device);
});

udpServer.addEventListener("light-getparams", function (data, id){
	logger.info("light " + id + " getting set!!!" + JSON.stringify(data));
	sendMsgToRoom('onLightGetSet',data);
});

udpServer.addEventListener("light-putparams", function (data, id){
	logger.info("light " + id + " putting set!!!" + JSON.stringify(data));
	sendMsgToRoom('onLightPutSet',data);
});

udpServer.start();

function doGetCtlersInfos(ctlers, infos, callback){
	var ctl = ctlers.pop();
	if(ctl){
		db.getLights({index:ctl.index, code:ctl.code, cid:ctl.cid},function(result){
			if(!result){
				infos.push({index:ctl.index,code:ctl.code,cid:ctl.cid,name:ctl.name,
							state:ctl.state,lightCount:0});
				doGetCtlersInfos(ctlers,infos,callback);
			}
			else{
				var c = 0,
					o = 0,
					b = 0;
				for(var i in result){
					if(result[i].charging === 1)
						c ++;
					if(result[i].onoff === 1)
						o ++;
					if(result[i].state === 1)
						b ++;
				}
				var cs, os, bs;
				if(c > config.light.charging){
					cs = "charing";
				}
				else {
					cs = "no-charging";
				}
				if(o > config.light.onoff){
					os = "lighting";
				}
				else {
					os = "no-lighting";
				}
				if(b > config.light.broken){
					bs = "broken";
				}
				else {
					bs = "no-broken";
				}
				var cTime = -1;
				if(ctl.hasOwnProperty('cnnTime'))
					cTime = ctl.cnnTime;
				infos.push({index:ctl.index,code:ctl.code,cid:ctl.cid,name:ctl.name,state:ctl.state,cnnTime:cTime,
							lightCount:result.length,chargeState:cs,chargeNum:c,lightState:os,lightNum:o,
							brokenState:bs,brokenNum:b});
				doGetCtlersInfos(ctlers,infos,callback);
			}
		});
	}
	else {
		if(callback) callback(infos);
	}
};

function sortBy(field, reverse, primer){
	reverse = (reverse) ? -1 : 1;
	return function (a, b) {
		a = a[field];
		a = primer(a);
		b = b[field];
		b = primer(b); 	
		if (a < b) {
			return reverse * -1;  
		}  
		if (a > b) {
			return reverse * 1;  
		}  
	};
};

function MathRand(n, callback){ 
	var Num=""; 
	for(var i=0;i<n;i++) { 
		Num+=Math.floor(Math.random()*10); 
	}	
	callback(parseInt(Num));
};

exports.login = function(req, res){
	"use strict";
	
	res.render('login', { title: 'Login' });
};

exports.doLogin = function(req, res){
	"use strict";
	
	var name = req.body.username,
		pwd = req.body.password;
	
	logger.info('doLogin...name:' + name + ' password:' + pwd);
	db.authenticate(name, pwd, function (user){
		if(user !== undefined && user !== null){			
			if (user.level === 'normal'){
				req.session.user=user;
				return res.redirect('/home');
			} 
			else if(user.level === 'super'){
				req.session.user=user;
				return res.redirect('/admin');
			}
			else{
				req.session.error="未授权用户";
				return res.redirect('/');
			}
		}
		else {
			req.session.error="用户名密码错误，请重新输入！";
			return res.redirect('/');
		}
	});	
};

exports.register = function(req, res){
	"use strict";
	
	res.render('register', {title: 'Register'});
};

exports.doRegister = function(req, res){
	"use strict";
	
	var name = req.body.username,
	pwd = req.body.password,
	confirm = req.body.confirm;
	if(name === '' || pwd === '' || confirm === ''){
		req.session.error="请将信息填写完整！";
		return res.redirect('/register');
	}
	
	if(pwd !== confirm){
		req.session.error="密码输入错误，请重新输入！";
		return res.redirect('/register');
	}
	
	logger.info('doRegister...name:' + name + ' password:' + pwd);
	db.getUser(name, function (user){
		if(user === undefined || user === null){
			MathRand(4, function(token) {
			    db.getAllUsers(function(users){
			    	var idx = 0;
			    	if(users !== null){
			    		idx = users.length;			    		
			    	}
			    	idx += 1;			    	
			    	if(idx !== -1){
				    	db.addUser({username:name, password:pwd, index:idx, code:token, level:"normal"}, function(result){			    		
				    		return res.redirect('/admin');
				    	});
			    	}else {
			    		req.session.error="用户数已满！";
						return res.redirect('/register');
			    	}
			    });
			});  
		}
		else{
			req.session.error="已注册用户，请重新填写用户名";
			return res.redirect('/register');
		}
	});
};

exports.doModifyPwd = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	var oldpwd = req.body.oldpwd,
		newpwd = req.body.newpwd;
	
	logger.info('doModifyPwd...old pwd:' + oldpwd + ' new pwd:' + newpwd);
	db.getUserById(req.session.user._id.toString(), function (user){
		if(user !== undefined && user !== null){
			if(user.password === oldpwd){
				db.updateUserPass(req.session.user._id.toString(), newpwd);
				res.send('success');
			}
			else{
				res.send('密码错误！');
			}
		}
	});	
	
};

exports.doUpdateCtlName = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	var idx = parseInt(req.body.index),
		co = parseInt(req.body.code),
		ci = req.body.cid,
		na = req.body.name;
	logger.info('doUpdateCtlName...cid:' + ci);
	db.updateControllerName({index:idx,code:co,cid:ci,name:na}, function(result){
		res.send(result);
	});
};

exports.doSaveName = function(req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	var ctl = {};
	ctl.index = parseInt(req.session.user.index),
	ctl.code = parseInt(req.session.user.code),
	ctl.cid = String(req.session.user.cid);
	var lidx = parseInt(req.body.index),
		lname = req.body.name;
	logger.info('doSaveName...controller:',ctl,' light:',{id:lidx,name:lname});
	db.updateLightName(ctl,lidx,lname, function(result){
		res.send(result);
	});
};

exports.doExportUsefulData = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	var ctl = {};
	ctl.index = parseInt(req.session.user.index),
	ctl.code = parseInt(req.session.user.code),
	ctl.cid = String(req.session.user.cid);
	
	exportUsefulData(ctl, function (result){
		res.send(result);
	});
};

exports.doExportMaxChargePowerData = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	var ctl = {};
	ctl.index = parseInt(req.session.user.index),
	ctl.code = parseInt(req.session.user.code),
	ctl.cid = String(req.session.user.cid);
	
	exportMaxChargePower(ctl, function (result){
		res.send(result);
	});
};

exports.doExportMaxDischargePowerData = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	var ctl = {};
	ctl.index = parseInt(req.session.user.index),
	ctl.code = parseInt(req.session.user.code),
	ctl.cid = String(req.session.user.cid);
	
	exportMaxDischargePower(ctl, function (result){
		res.send(result);
	});
};

exports.doAddUser = function (req, res){
	"use strict";	

	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	var name = req.body.username,
		channel = req.body.channel;	
		
	logger.info('doAddUser...user name:' + name + ' channel:' + channel);
	var user = {relateid: req.session.user._id.toString(), userid: name, channel: channel};
	db.addDevice(user, function (saved){
		if (saved === 'Repeated'){
			res.send('用户ID重复，请重新输入');
		}
		else {
			res.send('success');
		}
		
	});
};

exports.doRemoteDel = function (req, res) {
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	var uid = req.body.userid,
	ch = req.body.channel,
	accid = req.session.user._id.toString();

	db.getDeviceByUserId(accid, uid, function(device){
		if(device !== undefined && device !== null){
			udpServer.remoteDel(req.session.user.deviceId, uid, ch, function (err, bytes){
				if(bytes > 0){
					if(err == 'answer'){
						answer = "Y";
						res.send('success');
					}
					else
						res.send('删除失败');
				}
				else {
					logger.info('doRemoteDel failed, caused by [' + err + ']');
					res.send(err);
				}
			});
		} else {
			logger.info('doRemoteDel failed, caused by [' + uid + ':' + ch + '] not found!');
			res.send("设备 [" + uid + ":" + ch + "] 未找到，请重新添加！");
		}
	});	
	logger.info('doRemoteDel...use id:' + uid);
};

exports.doSend = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	var msg = req.body.message,
		uid = req.body.userid,
		ch = req.body.channel,
		accid = req.session.user._id.toString(),
		datetime = moment().format("YYYY-MM-DD HH:mm:ss");
	
	logger.info('doSend...userid:' + uid + ' channel:' + ch + ' message:' + msg);
	db.getDeviceByUserId(accid, uid, function(device){
		if(device !== undefined && device !== null){
			udpServer.send(req.session.user.deviceId, uid, ch, 0, msg, function (err, bytes){
				if(bytes > 0){
					var answer = "N";
					if(err == 'answer'){
						answer = "Y";
					}
					db.getHistoryNumber(accid, function (num){
						db.addToHistory({accoutid: accid, 	// user表_id
										userid: uid,		// device表userid
										channel: ch,		// device表channel
										index: num+1, 		// 编号
										time: datetime, 	// 发送时间戳
										answer: answer, 	// 设备是否有应答
										message: msg},		// 发送数据
										function (saved){
											logger.info('doSend success');
											res.send('success');
										});	
					});
				}
				else {
					logger.info('doSend failed, caused by [' + err + ']');
					res.send(err);
				}
			});
		} else {
			logger.info('doSend failed, caused by [' + uid + ':' + ch + '] not found!');
			res.send("设备 [" + uid + ":" + ch + "] 未找到，请重新添加！");
		}
	});
	
};

exports.doDeleteUser = function (req, res) {
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
		
	var id = req.body.userid;
	logger.info('doDeleteUser...use id:' + id);
	db.removeUser(id, function (data){
		res.send(data);
	});
	
};

exports.getUserIds = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	var _id = req.session.user._id.toString(),
		page = req.query.page,
		rows = req.query.rows;
	
	logger.info('getUserIds...page:' + page + ' rows:' + rows);
	db.getDevicesCount(_id, function (count){
		db.getDevicesByPage(_id, page, rows, function (users){			
			res.send({total:count, rows:users});
		});
	});
	
};

exports.getAllUsers = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	logger.info('getAllUsers...');
	db.getAllUsers(function(users){
		res.send(users);
	});
};

exports.getAllControllers = function (req, res) {
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	var idx = parseInt(req.body.index),
		code = parseInt(req.body.code);
	//logger.info('getAllControllers...index:', idx, ' code:', code);
	db.getAllControllers({index:idx, code:code},function(result){
		if(!result){ 
			res.send('failed');
		} else {
			var cinfos = [];
			doGetCtlersInfos(result, cinfos, function(result){
				result.sort(sortBy('cid', false, parseInt));
				res.send(result);
			});	
		}
	});
};

exports.getCurrentTime = function (req, res) {
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	logger.info("getCurrentTime...query:",req.query);
	var datetime = moment().format("YYYY-MM-DD HH:mm:ss");
	res.send(datetime);
};

exports.doGetLastestCtlUpdateTime = function (req, res) {
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	logger.info("doGetLastestCtlUpdateTime...");
	var ctl = {};
	ctl.index = parseInt(req.session.user.index),
	ctl.code = parseInt(req.session.user.code),
	ctl.cid = String(req.session.user.cid);
	udpServer.getLastesCtlUpdateTime(ctl,function(time){
		res.send(time);
	});
};

exports.getCtlerLightsInfo = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	var idx = parseInt(req.body.index),
		co = parseInt(req.body.code),
		ci = String(req.body.cid);
	logger.info('getCtlerLightsInfo...index:', idx, ' code:', co, ' cid:', ci);	
	recaculateCtlerInfo(idx, co, ci, function (ct){
		res.send(ct);
	});
};

exports.getLights = function (req, res) {
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	var idx = parseInt(req.session.user.index),
		code = parseInt(req.session.user.code),
		cid = String(req.session.user.cid);
	logger.info('getLights...index:', idx, ' code:', code, ' cid:', cid);
	db.getLights({index:idx, code:code, cid:cid},function(result){
		if(result)
			logger.info('lights num is ',result.length);
		else{
			result = [];
			logger.info('lights is ',result);
		}
		res.send(result);
	});
};

exports.getLights1 = function (req, res) {
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	var idx = parseInt(req.query.index),
		code = parseInt(req.query.code),
		cid = String(req.query.cid);
	logger.info('getLights...index:', idx, ' code:', code, ' cid:', cid);
	db.getLights({index:idx, code:code, cid:cid},function(result){
		res.send(result);
	});
};

exports.getTraffic = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	var idx = parseInt(req.session.user.index),
		code = parseInt(req.session.user.code),
		cid = String(req.session.user.cid);
	
	db.getCtlUsefulData({index:idx, code:code, cid:cid},function(result){
		res.send(result);
	});
};

exports.getMaxChargePower = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	var idx = parseInt(req.session.user.index),
		code = parseInt(req.session.user.code),
		cid = String(req.session.user.cid);
	
	db.getCtlLightsMaxPowers({index:idx, code:code, cid:cid},function(result){
		if(result){
			for(var i in result){
				for(var t in chargeTimes){
					if(result[i].hasOwnProperty(chargeTimes[t])){
						result[i][chargeTimes[t]] = result[i][chargeTimes[t]].cpower;
					}
				}
			}
		}
		res.send(result);
	});
};

exports.getMaxDischargePower = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	var idx = parseInt(req.session.user.index),
		code = parseInt(req.session.user.code),
		cid = String(req.session.user.cid);
	
	db.getCtlLightsMaxPowers({index:idx, code:code, cid:cid},function(result){
		if(result){
			for(var i in result){
				for(var t in dischargeTimes){
					if(result[i].hasOwnProperty(dischargeTimes[t])){
						result[i][dischargeTimes[t]] = result[i][dischargeTimes[t]].dpower;
					}
				}
			}
		}
		res.send(result);
	});
};

exports.doUpdateLight = function (req, res) {
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	var _id = req.body._id,
		ct = parseInt(req.body.ctltype),
		at = parseInt(req.body.autotype),
		oi = req.body.ontime,
		lv = parseFloat(req.body.lcvoltage),
		ab = parseInt(req.body.abright),
		ai = parseFloat(req.body.atime),
		bb = parseInt(req.body.bbright),
		bi = parseFloat(req.body.btime),
		cb = parseInt(req.body.cbright),
		ci = parseFloat(req.body.ctime),
		dr = parseInt(req.body.dbright),
		di = parseFloat(req.body.dtime);
	logger.info('doUpdateLight...body:', req.body);
	db.updateLight({id:_id,ctltype:ct,autotype:at,ontime:oi,lcvoltage:lv,
				abright:ab,atime:ai,bbright:bb,btime:bi,
				cbright:cb,ctime:ci,dbright:dr,dtime:di},
	function(result){
		res.send(result);
	});
};

exports.doUpdateAllLights = function (req, res) {
	"use strict";

	if(!req.session.user){
		res.send('session expired');
		return;
	}	
	var data = req.body;
	for(var a in data){
		if(a === 'ctltype' || a === 'autotype' || 
			a === 'abright' || a === 'bbright' || 
			a === 'cbright' || a === 'dbright' ||
			a === 'uindex' || a === 'ucode'){
			data[a] = parseInt(data[a]);
		}
		if(a === 'lcvoltage' || a === 'atime' || 
			a === 'btime' || a === 'ctime' || 
			a === 'dtime' || a === 'voltage'){
			data[a] = parseFloat(data[a]);
		}
	}
	logger.info('doUpdateAllLights...data:', data);
	db.updateAllLights(data, function(result){
		res.send(result);
	});
};

exports.doUpdateSingleLights = function (req, res) {
	"use strict";
		
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	var data = req.body;
	for(var a in data){
		if(a === 'ctltype' || a === 'autotype' || 
			a === 'abright' || a === 'bbright' || 
			a === 'cbright' || a === 'dbright' ||
			a === 'uindex' || a === 'ucode'){
			data[a] = parseInt(data[a]);
		}
		if(a === 'lcvoltage' || a === 'atime' || 
			a === 'btime' || a === 'ctime' || 
			a === 'dtime' || a === 'voltage'){
			data[a] = parseFloat(data[a]);
		}
	}
	logger.info('doUpdateSingleLights...data:', data);
	db.updateSingleLights(data, function(result){
		res.send(result);
	});
};


exports.doUpdateDoubleLights = function (req, res) {
	"use strict";
		
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	var data = req.body;
	for(var a in data){
		if(a === 'ctltype' || a === 'autotype' || 
			a === 'abright' || a === 'bbright' || 
			a === 'cbright' || a === 'dbright' ||
			a === 'uindex' || a === 'ucode'){
			data[a] = parseInt(data[a]);
		}
		if(a === 'lcvoltage' || a === 'atime' || 
			a === 'btime' || a === 'ctime' || 
			a === 'dtime' || a === 'voltage'){
			data[a] = parseFloat(data[a]);
		}
	}
	logger.info('doUpdateDoubleLights...data:', data);
	db.updateDoubleLights(data, function(result){
		res.send(result);
	});
};

exports.getHistory = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	var accid = req.session.user._id.toString(),
		page = req.query.page,
		rows = req.query.rows;
	
	logger.info('getHistory...page:' + page + ' rows:' + rows);
	db.getHistoryCount(accid, function (count){
		db.getHistoryByPage(accid, page, rows, function (his){
			res.send({total:count, rows:his});
		});
	});	
};

exports.doClearHistory = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	var _id = req.session.user._id.toString();
	logger.info('doClearHistory..._id:' + _id);
	db.removeHistory(_id, function (data){
		res.send(data);
	});	
};

exports.doRemoveAllLights = function (req, res){
	"use strict";
	
	if(!req.session.user){
		res.send('session expired');
		return;
	}
	
	logger.info('doRemoveAllLights...user:',req.session.user);
	var idx = parseInt(req.session.user.index),
		code = parseInt(req.session.user.code),
		cid = String(req.session.user.cid);
	logger.info('doRemoveAllLights...ctlid:' + cid);
	db.removeAllLights(idx,code,cid, function (data){
		res.send(data);
	});	
};

exports.logout = function(req, res){
	"use strict";
	
	req.session.user=null;
	res.redirect('/');
};

exports.home = function(req, res){
	"use strict";
	
  	res.render('home', { title: 'Home'});
};

exports.light = function(req, res){
	"use strict";
	
	req.session.user.cid = req.query.cid;
  	res.render('light', { title: 'Light'});
};

exports.traffic = function(req, res){
	"use strict";
	
  	res.render('traffic', { title: 'Traffic'});
};

exports.maxpower = function(req, res){
	"use strict";
	
  	res.render('maxpower', { title: 'MaxPower'});
};

exports.admin = function(req, res){
	"use strict";
	
  	res.render('admin', { title: 'Adminstrator'});
};

//! 保存
var controllerLoop = function (datetime,ctls,callback){
	"use strict";
	
	var ctl = ctls.pop();
	if(!ctl) {
		callback('success');
		return;
	}
	
	db.addMaxPower({time:datetime,uindex:ctl.index,ucode:ctl.code,cid:ctl.cid},function(saved){
		controllerLoop(datetime,ctls,callback);
	});
};

var savedMap = {};
var saveMaxPower = function(){
	"use strict";

	var date = moment().format("YYYY-MM-DD");
	//凌晨0点开始添加一条当天的记录
	if("00:00" === moment().format("HH:mm") && !savedMap.hasOwnProperty(date)){
		db.getAllCtlers(function(ctls){
			if(ctls && ctls.length > 0){
				controllerLoop(date,ctls,function(result){
					setTimeout(saveMaxPower,5000);
					savedMap[date] = true;
				});
			}else{
				controllerLoop(date,[],function(result){
					setTimeout(saveMaxPower,5000);
					savedMap[date] = true;
				});
			}
		});
	}else{
		setTimeout(saveMaxPower,5000);
	}
};

//! 更新
var updateControllerLoop = function(datetime,ctls,field,callback){
	"use strict";
	
	var ctl = ctls.pop();
	if(!ctl) {
		callback('success');
		return;
	}
	db.getMaxChargePower(ctl,function(maxCPower){
		db.getMaxDischargePower(ctl,function(maxDPower){
			if(maxCPower === null) maxCPower = -1;
			if(maxDPower === null) maxDPower = -1;
			var updates = {};
			updates[field] = {cpower:maxCPower,dpower:maxDPower};
			db.updateMaxPower(datetime,ctl,updates,function(result){
				updateControllerLoop(datetime,ctls,field,callback);
			});
		});
	});
};

var updateMap = {};
var updateMaxPower = function(){
	"use strict";
	
	var curTime = moment().format("HH:mm"),
		date = moment().format("YYYY-MM-DD"),
		datetime = date + ' ' + curTime;
	if((curTime == '00:00' || curTime == '01:00' || curTime == '02:00' || curTime == '03:00' || 
		curTime == '04:00' || curTime == '05:00' || curTime == '06:00' || curTime == '07:00' || 
		curTime == '08:00' || curTime == '09:00' || curTime == '10:00' || curTime == '11:00' || 
		curTime == '12:00' || curTime == '13:00' || curTime == '14:00' || curTime == '15:00' || 
		curTime == '16:00' || curTime == '17:00' || curTime == '18:00' || curTime == '19:00' ||
		curTime == '20:00' || curTime == '21:00' || curTime == '22:00' || curTime == '23:00') && 
		!updateMap.hasOwnProperty(datetime)){
		
		db.getAllCtlers(function(ctls){
			if(ctls && ctls.length > 0){
				var fieldName = curTime.replace(":00","");
				updateControllerLoop(date,ctls,fieldName,function(result){
					setTimeout(updateMaxPower,5000);
					updateMap[datetime] = true;
				});
			}else{
				updateControllerLoop(date,[],fieldName,function(result){
					setTimeout(updateMaxPower,5000);
					updateMap[datetime] = true;
				});
			}
		});
	}else{
		setTimeout(updateMaxPower,5000);
	}
};

var ctlers = [];
var getAllCtlersMaxChargePower = function(){
	"use strict";
	
	ctlers = [];
	db.getAllCtlers(function(ctls){
		if(ctls){
			getCtlMaxChargePower(ctls,function(result){
				sendMsgToRoom('onMaxCtlPowers',ctlers);
				setTimeout(getAllCtlersMaxChargePower,15000);
			});
		}else{
			getCtlMaxChargePower([],function(result){
				setTimeout(getAllCtlersMaxChargePower,15000);
			});
		}
	});
};

var getCtlMaxChargePower = function(ctls,callback){
	var ctl = ctls.pop();
	if(!ctl){
		callback('success');
		return;
	}
	db.getMaxChargePower(ctl,function(maxCPower){
		db.getMaxDischargePower(ctl,function(maxDPower){
			var mcp = -1,mdp = -1;
			if(maxCPower !== null) mcp = maxCPower;
			if(maxDPower !== null) mdp = maxDPower;
			ctlers.push({index:ctl.index,code:ctl.code,cid:ctl.cid,cpower:mcp,dpower:mdp});
			getCtlMaxChargePower(ctls,callback);
		});
	});
};

//00点生成当天数据
saveMaxPower();

//整点更新最大功率数据
updateMaxPower();

//每隔15s更新最大功率数据，发送到client端
getAllCtlersMaxChargePower();
