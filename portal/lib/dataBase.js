var collections = ["users", "controllers", "lights"],
	databaseUrl = "light100",
	BSON = require('mongodb').BSONPure,
	db = require("mongojs").connect(databaseUrl, collections);

////////////////////////user table//////////////////////////////
exports.getUser = function (name, callback) {
	"use strict";
	
	db.users.findOne({username: name}, function (err, user) {
		if(err || !user)
			callback(null);
		else
			callback(user);
    });
};

exports.getUser1 = function (index, code, callback) {
	"use strict";
	
	db.users.findOne({index: index, code: code}, function (err, user) {
		if(err || !user)
			callback(null);
		else
			callback(user);
    });
};

exports.addUser = function (user, callback) {
    "use strict";

    db.users.findOne({username: user.username}, function (err, res) {
    	if (res !== undefined && res !== null){
    		callback('Repeated');
    	}
    	else {
    		db.users.save(user, function (error, saved) {
    	        callback(saved);
    	    });
    	}
    });    
    
};

exports.authenticate = function (name, pwd, callback){
	"use strict";
	
	db.users.findOne({username: name, password: pwd}, function (err, user) {
        callback(user);
    });
};

exports.getAllUsers = function (callback) {
	"use strict";
	
	db.users.find({$query:{level:"normal"},$orderby:{index:1}}, function(err, users){
		if(err || !users || users.length === 0){
			callback(null);
		} else {
			callback(users);
		}		
	});	
};

exports.getSettingLights = function (ctl,callback) {
	"use strict";
	
	db.lights.find({$query:{uindex:ctl.index,ucode:ctl.code,cid:ctl.cid,bSet:1},$orderby:{index:1}}, 
			function(err, lts){
		if(err || !lts || lts.length === 0){
			callback(null);
		} else {
			callback(lts);
		}
	});
};

exports.getAllControllers = function (user, callback) {
	"use strict";
	
	db.controllers.find({$query:{index:user.index, code:user.code},$orderby:{cid:1}}, function(err, users){
		if(err || !users || users.length === 0){
			callback(null);
		} else {
			callback(users);
		}	
	});	
};

exports.getController = function (ctl, callback) {
	"use strict";
	
	db.controllers.findOne({index:ctl.index, code:ctl.code, cid:ctl.cid}, function(err, result){
		if(err || !result){
			callback(null);
		} else {
			callback(result);
		}	
	});	
};

exports.addController = function (ctl, callback) {
	"use strict";
	
	db.controllers.save({index:ctl.index, code:ctl.code, cid:ctl.cid, state:0, name:""}, function(err, saved){
		if(err){
			callback('failed');
		} else {
			callback('succeed');
		}	
	});
};

exports.addLight = function (lt, callback) {
	"use strict";
	
	lt.time = new Date();
	db.lights.save({uindex:lt.uindex,
					ucode:lt.ucode,
					cid:lt.cid,
					index:lt.index,
					state:lt.state,
					charging:lt.charging,
					onoff:lt.onoff,
					cpower:lt.cpower,
					lpower:lt.lpower,
					battery:lt.battery,
					temp:lt.temp,
					batype:lt.batype,
					capacity:lt.capacity,
					voltage:lt.voltage,
					pdate:lt.pdate,
					ctltype:lt.ctltype,
					autotype:lt.autotype,
					ontime:lt.ontime,
					lcvoltage:lt.lcvoltage,
					abright:lt.abright,
					atime:lt.atime,
					bbright:lt.bbright,
					btime:lt.btime,
					cbright:lt.cbright,
					ctime:lt.ctime,
					dbright:lt.dbright,
					dtime:lt.dtime,
					bSet:lt.bSet,
					time:lt.time
					}, 
	function(err, saved){
		if(err){
			callback('failed');
		} else {
			callback('succeed');
		}	
	});
};

exports.updateControllerState = function (ctl,st, callback){
	"use strict";
	
	db.controllers.update({index:ctl.index, code:ctl.code, cid:ctl.cid}, {$set:{state:st}}, function(err, result){
		if(err) 
			callback("failed");
		else
			callback("success");
	});
};

exports.updateControllerName = function (ctl, callback){
	"use strict";
	
	db.controllers.update({index:ctl.index, code:ctl.code, cid:ctl.cid}, {$set:{name:ctl.name}}, function(err, result){
		if(err) 
			callback("failed");
		else
			callback("success");
	});
};

exports.removeAllLights = function(userindex,usercode,ctlid, callback){
	"use strict";
	
	db.lights.remove({uindex:userindex,ucode:usercode,cid:ctlid},function(result){
		callback("success");
	});
};

exports.updateLight = function (lt, callback){
	"use strict";	
	
	lt.time = new Date();
	db.lights.update({_id: new BSON.ObjectID(lt.id)}, {$set:{ctltype:lt.ctltype,
															autotype:lt.autotype,
															ontime:lt.ontime,
															lcvoltage:lt.lcvoltage,
															abright:lt.abright,
															atime:lt.atime,
															bbright:lt.bbright,
															btime:lt.btime,
															cbright:lt.cbright,
															ctime:lt.ctime,
															dbright:lt.dbright,
															dtime:lt.dtime,
															bSet:1,
															time:lt.time}}, 
	function(err, result){
		if(err) 
			callback("failed");
		else
			callback("success");
	});
};

exports.updateLight1 = function (id, lt, callback){
	"use strict";	
	
	lt.time = new Date();
	db.lights.update({_id: new BSON.ObjectID(id)}, {$set:{uindex:lt.uindex,
														ucode:lt.ucode,
														cid:lt.cid,
														index:lt.index,
														state:lt.state,
														charging:lt.charging,
														onoff:lt.onoff,
														cpower:lt.cpower,
														lpower:lt.lpower,
														battery:lt.battery,
														temp:lt.temp,
														batype:lt.batype,
														capacity:lt.capacity,
														voltage:lt.voltage,
														pdate:lt.pdate,
														ctltype:lt.ctltype,
														autotype:lt.autotype,
														ontime:lt.ontime,
														lcvoltage:lt.lcvoltage,
														abright:lt.abright,
														atime:lt.atime,
														bbright:lt.bbright,
														btime:lt.btime,
														cbright:lt.cbright,
														ctime:lt.ctime,
														dbright:lt.dbright,
														dtime:lt.dtime,
														bSet:lt.bSet,
														time:lt.time
														}}, 
			function(err, result){
				if(err) 
					callback("failed");
				else
					callback("success");
	});
};

exports.updateAllLights = function (lt, callback){
	"use strict";
	
	var updates = {},
		isEmpty = true;
	for(var a in lt){
		if(a !== 'uindex' || a !== 'ucode' || a !== 'cid'){
			updates[a] = lt[a];
			isEmpty = false;
		}
	}
	if(!isEmpty){
		updates['bSet'] = 1;
		console.log('!!!!updateAllLights...updates:',updates);
		db.lights.update({uindex:lt.uindex,ucode:lt.ucode,cid:lt.cid}, 
				{$set:updates}, 
				{multi:true},
		function(err, result){
		if(err) 
			callback("failed");
		else
			callback("success");
		});
	}
	else{
		callback('failed');
	}
};

exports.updateSingleLights = function (lt, callback){
	"use strict";
	
	var updates = {},
		isEmpty = true;
	for(var a in lt){
		if(a !== 'uindex' || a !== 'ucode' || a !== 'cid'){
			updates[a] = lt[a];
			isEmpty = false;
		}
	}
	if(!isEmpty){
		updates['bSet'] = 1;
		console.log('!!!!updateSingleLights...updates:',updates);
		db.lights.update({uindex:lt.uindex,ucode:lt.ucode,cid:lt.cid,index:{$mod:[2,1]}}, 
					{$set:updates}, 
					{multi:true},
		function(err, result){
			if(err) 
				callback("failed");
			else
				callback("success");
		});
	}
	else{
		callback('failed');
	}
};

exports.updateDoubleLights = function (lt, callback){
	"use strict";
	
	var updates = {},
		isEmpty = true;
	for(var a in lt){
		if(a !== 'uindex' || a !== 'ucode' || a !== 'cid'){
			updates[a] = lt[a];
			isEmpty = false;
		}
	}
	if(!isEmpty){
		updates['bSet'] = 1;
		console.log('!!!!updateDoubleLights...updates:',updates);
		db.lights.update({uindex:lt.uindex,ucode:lt.ucode,cid:lt.cid,index:{$mod:[2,0]}}, 
					{$set:updates}, 
					{multi:true},
		function(err, result){
			if(err) 
				callback("failed");
			else
				callback("success");
		});
	}
	else{
		callback('failed');
	}
};

function setAllZeroState(lts){
	for(var index in lts){
		var lt = lts[index];
		if(lt.state !== -1 && lt.abright === 0 && lt.atime === 0 && 
			lt.battery === 0 && lt.bbright === 0 && lt.btime === 0 &&  
			lt.capacity === 0 && lt.cbright === 0 && lt.cpower === 0 &&
			lt.ctime === 0 && lt.dbright === 0 && lt.dtime === 0 &&
			lt.lcvoltage === 0 && lt.lpower === 0 && lt.ontime === '00:00' &&
			lt.pdate === '00/00/0000'){
			lts[index].state= -1;
		}
	}
}

exports.getLights = function (ctl, callback) {
	"use strict";
	
	db.lights.find({$query:{uindex:ctl.index, ucode:ctl.code, cid:ctl.cid},$orderby:{index:1}}, function(err, ls){
		if(err || !ls || ls.length === 0){
			callback(null);
		} else {
			setAllZeroState(ls);
			callback(ls);
		}	
	});	
};

exports.getLight = function (ctl, ltid, callback) {
	"use strict";
	
	db.lights.findOne({uindex:ctl.index, ucode:ctl.code, cid:ctl.cid, index:ltid}, function(err, lt){
		if(err || !lt){
			callback(null);
		} else {
			callback(lt);
		}	
	});	
};

exports.updateLightSetting = function (ctl, ltid, callback) {
	"use strict";
	
	db.lights.update({uindex:ctl.index, ucode:ctl.code, cid:ctl.cid, index:ltid}, {$set:{bSet:0}}, function(err, result){
		if(err){
			callback('failed');
		} else {
			callback('succeed');
		}	
	});	
};

exports.updateLightName = function (ctl, ltid, myName, callback) {
	"use strict";
	
	db.lights.update({uindex:ctl.index, ucode:ctl.code, cid:ctl.cid, index:ltid}, {$set:{name:myName}}, function(err, result){
		if(err){
			callback('failed');
		} else {
			callback('succeed');
		}	
	});	
};

exports.getUserById = function (id, callback) {
	"use strict";
	
	db.users.findOne({_id: new BSON.ObjectID(id)}, function (err, user) {
        callback(user);
    });
};

exports.authticateDevice = function (devId, callback) {
	"use strict";
	
	db.users.findOne({deviceId: devId}, function (err, user) {
		if(user !== undefined && user !== null){
			callback(true);
		}
		else {
			callback(false);
		}        
    });
};

exports.updateUserPass = function (id, val) {
    "use strict";

    db.users.update({_id: new BSON.ObjectID(id)}, {$set:{password:val}});
};

exports.removeUserByName = function (name, callback) {
	"use strict";
	
	db.users.findOne({username: name}, function (err, user) {
        if (user !== undefined && user !== null){
        	db.users.remove({username: name});
        	callback('success');
        } else {
        	callback('failed');
        }
    });
};

exports.removeUser = function (id, callback) {
	"use strict";
	
	db.users.findOne({_id: new BSON.ObjectID(id)}, function (err, user) {
        if (user !== undefined){
        	db.users.remove({_id: new BSON.ObjectID(id)});
        	callback('success');
        }
        else {
        	callback('failed');
        }
    });
};
