exports.communicate = function (spec) {
	"use strict";
	
	var dgram = require('dgram'),
		db = require('./dataBase'),
		dp = require('./dgram_protocal'),
		server = dgram.createSocket('udp4'),
		DIS_TIME = 60 * 1000,	//断线时长设置为30分钟
		INTERVAL_TIME = 5000,
		that = {},
		eventListeners = {},
		hashMap = {},
		msgQueue = [],
		logger = spec.logger,
		exlog = spec.exLogger,
		channelEvent  = function (spec) {
			"use strict";
			
			var that = {};
			that.data = "";
			that.type = "";
			if(spec.hasOwnProperty('type'))
				that.type = spec.type;
			if(spec.hasOwnProperty('data'))
				that.data = spec.data;		
			return that;
		},
		dispatchEventListener = function (event,index) {
			"use strict";
			
			if (eventListeners.hasOwnProperty(event.type)) {
				for (var listener in eventListeners[event.type]) {
		    		if (eventListeners[event.type].hasOwnProperty(listener)) {
		        		eventListeners[event.type][listener](event.data,index);
		    		}
				}
			}
		},
		interval = setInterval(function(){
			
			//清理长时间未收到心跳的设备
			for(var index in hashMap){
				if(hashMap[index].state === 1 &&
					new Date() - hashMap[index].cnnTime > DIS_TIME){
					db.updateControllerState({index:hashMap[index].index,code:hashMap[index].code,cid:hashMap[index].cid},0,function(res){});
					var evt = new channelEvent({type:'controller-disconnect'});
					dispatchEventListener(evt,index);
					//delete hashMap[index];
					hashMap[index].state = 0;
					break;
				}
			}
		}, INTERVAL_TIME),
		isCnnCodeExist = function (cid, cnnCode){
			"use strict";

			for(var id in hashMap){
				if(hashMap[id].hasOwnProperty('cnnCode') && 
					hashMap[id].cnnCode === cnnCode){
					logger.info('@@@@@@Connecting... controller ' + cid + ' has the same cnnCode ' + cnnCode + ' with controller ' + hashMap[id].cid);
					return true;
				}
			}
			return false;
		},
		newCnnCode = function(cid, cnnCode, callback){
			"use strict";

			if(isCnnCodeExist(cid, cnnCode)){
				var code = dp.newCnnCode();
				logger.info('@@@@@@newCnnCode is ' + code);
				newCnnCode(cid, code, callback);
			}
			else{
				callback(cnnCode);
			}
		},
		recordException = function(lt, cnnCode, ip, bExist, qlt){
			"use strict";
			
			if(lt.cid === '8002' && lt.index !== 0){
				if(bExist){
					exlog.info('!!!!!!updating controller 8003 light ' + lt.index + '...' + 'from ' + ip);
					exlog.info('!!!!!!cnnCode is ' + cnnCode + ' light is ' + JSON.stringify(lt));
					exlog.info('!!!!!!query result is ' + JSON.stringify(qlt));
					exlog.info('!!!!!!hashMap is ' + JSON.stringify(hashMap));
				} else {
					exlog.info('!!!!!!adding controller 8003 light ' + lt.index + '...' + 'from ' + ip);
					exlog.info('!!!!!!cnnCode is ' + cnnCode + ' light is ' + JSON.stringify(lt));
					exlog.info('!!!!!!hashMap is ' + JSON.stringify(hashMap));
				}
			}
		},
		findCtlByCnnCode = function(data){
			"use strict";
			
			for(var index in hashMap){
				if(hashMap[index].cnnCode === data){
					return index;
				}
			}
			return null;
		},
		initialHashMap = function(){
			"use strict";
			
			hashMap = {};
			db.getAllCtlers(function(ctls){
				if(ctls){
					for(var n in ctls){
						var ctl = ctls[n];
						hashMap[ctl._id] = ctl;
					}
				}
			});
		},
		procRegister = function(data, callback){
			"use strict";
			
			var idx = data[1],
			code = data.readUInt16BE(2),
			cid = data.readUInt32BE(4),
			sec = data.readUInt32BE(8);				
			if(dp.verifyReg(cid,sec)){
				var scid = new Buffer(4);
				scid.writeUInt32BE(cid,0);
				scid = scid.toString('ascii');
				logger.info('Registering...verfiy succeed!!! idx:',idx,' code:',code,' cid:',scid);
				db.getUser1(idx,code,function(result){
					if(!result){							
						logger.info('Unknown user index and code!!!');
						dp.replyReg(server,2,data.ip,data.port,function(bytes){
							if(bytes === -1) {
								logger.debug('Registering!!!Sending error...');
								callback('error');
							}else {
								logger.info('Registering!!!Sending bytes:',bytes);
								callback('succeed');
							}
						});	
					}else {
						db.getController({index:idx,code:code,cid:scid},function(result){
							if(!result){
								logger.info('Ready to register ',scid);
								dp.replyReg(server,0,data.ip,data.port,function(bytes){
									if(bytes === -1) {
										logger.debug('Registering!!!Sending error...');
										callback('error');
									}else {
										logger.info('Registering!!!Sending bytes:',bytes,' begin to register...');
										db.addController({index:idx,code:code,cid:scid},function(result){
											db.getController({index:idx,code:code,cid:scid},function(nctl){
												if(nctl){
													var evt = new channelEvent({type:'controller-registered',data:nctl});
													dispatchEventListener(evt,nctl._id);
												} else {
													logger.info('Register failed!!!',scid);
												}
												callback('succeed');
											});
										});
									}
								});
							}else {
								logger.info('Has been registered of ',scid);
								dp.replyReg(server,1,data.ip,data.port,function(bytes){
									if(bytes === -1) {
										logger.debug('Registering!!!Sending error...');
										callback('error');
									}else {
										logger.info('Registering!!!Sending bytes:',bytes);
										callback('succeed');
									}
								});
							}
						});
					}
				});
			}
			else {
				logger.info('verfiy failed...idx:',idx,' code:',code,' cid:',cid,' sec:',sec);
				dp.replyReg(server,3,data.ip,data.port,function(bytes){
					if(bytes === -1) {
						logger.debug('Registering!!!Sending error...');
						callback('error');
					}else {
						logger.info('Registering!!!Sending bytes:',bytes);
						callback('succeed');
					}
				});
			}
		},
		procConnect = function(data, callback){
			"use strict";
			
			var idx = data[1],
				code = data.readUInt16BE(2),
				cid = data.readUInt32BE(4),
				sec = data.readUInt32BE(8),
				pt = data.readUInt16BE(12),
				vt = data.readUInt16BE(14),
				tp = -50 + data.readUInt8(16)/2;
			if(dp.verifyCnt(cid,sec)){
				var scid = new Buffer(4);
				scid.writeUInt32BE(cid,0);
				scid = scid.toString('ascii');
				logger.info('Connecting...verfiy succeed!!! idx:',idx,' code:',code,' cid:',scid);
				db.getController({index:idx,code:code,cid:scid},function(result){
					if(!result){
						logger.info('Connecting...Unknown controller!!!');
						dp.replyCnn(server,1,0,data.ip,data.port,null,null,function(res){
							if(res === -1) {
								logger.debug('Connecting!!!Sending error...');
								callback('error');
							}else {
								logger.debug('Connecting!!!Sending succeed');
								callback('succeed');
							}
						});	
					}else {
						db.getSettingLights({index:idx,code:code,cid:scid},function(lts){
							var setting;
							if(lts)	setting = true;
							else setting = false;
							var ccode = dp.newCnnCode();
							//get new one, make sure no repeat
							newCnnCode(scid, ccode, function(newCode){
								db.getOneSetLight({index:idx,code:code,cid:scid},function(_lt){
									var ltid = 255;
									if(_lt) ltid = _lt.index;
									dp.replyCnn(server,0,newCode,data.ip,data.port,setting,ltid,function(rs){
										if(rs === -1) {
											logger.debug('Connecting!!!Reply error...');
											callback('error');
										}else {
											logger.debug('Connecting!!!Reply succeed');
											if(hashMap.hasOwnProperty(result._id)){
												hashMap[result._id].cnnTime = new Date();
												hashMap[result._id].cnnCode = newCode;
												hashMap[result._id].people = pt;
												hashMap[result._id].vehicle = vt;
												hashMap[result._id].temperature = tp;
												if(hashMap[result._id].state !== 1){
													//当hashMap中有且状态为未连接时
													hashMap[result._id].state = 1;
													var evt = new channelEvent({type:'controller-connect',data:hashMap[result._id]});
													dispatchEventListener(evt,result._id);
												}else{
													//当hashMap中有且状态为连接时
													var evt = new channelEvent({type:'update-data',data:hashMap[result._id]});
													dispatchEventListener(evt,result._id);
												}
											}else{
												//当hashMap中没有时
												result.cnnTime = new Date();
												result.cnnCode = newCode;
												result.people = pt;
												result.vehicle = vt;
												result.temperature = tp;
												result.state = 1;
												hashMap[result._id] = result;
												var evt = new channelEvent({type:'controller-connect',data:result});
												dispatchEventListener(evt,result._id);
											}
											var bSave = data.readUInt8(17);
											if(bSave === 1){
												db.saveUsefulData({index:idx,code:code,cid:scid,
													people:pt,vehicle:vt,temperature:tp,time:new Date()},
												function(saveResult){
														if(saveResult == 'success') 
															logger.info('saveUsefulData success!');
														else 
															logger.error('saveUsefulData failed!');
												});
											}
											db.updateControllerState({index:idx,code:code,cid:scid},1,function(res){
												if(res === 'success'){
													logger.info('connecting...update controller state!',JSON.stringify({index:idx,code:code,cid:scid}));
												}else{
													logger.error('connecting...update controller error!',JSON.stringify({index:idx,code:code,cid:scid}));
												}
												callback(res);
												/*db.getController({index:idx,code:code,cid:scid},function(nctl){
													if(nctl){
														nctl.people = data.readUInt16BE(12);
														nctl.vehicle = data.readUInt16BE(14);
														nctl.temperature = -50 + data.readUInt8(16)/2;
														var bSave = data.readUInt8(17);
														if(bSave === 1){
															db.saveUsefulData({index:idx,code:code,cid:scid,
																people:nctl.people,vehicle:nctl.vehicle,
																temperature:nctl.temperature,time:new Date()},
															function(saveResult){
																	if(saveResult == 'success') 
																		logger.info('saveUsefulData success!');
																	else 
																		logger.error('saveUsefulData failed!');
															});
														}
														if(!hashMap.hasOwnProperty(nctl._id)){
															logger.info('Connecting...adding controller to hashmap!!!',scid,' hashKey:', nctl._id);
															hashMap[nctl._id] = nctl;
															var evt = new channelEvent({type:'controller-connect',data:nctl});
															dispatchEventListener(evt,nctl._id);
														}else{
															var evt = new channelEvent({type:'update-data',data:nctl});
															dispatchEventListener(evt,nctl._id);
														}
														hashMap[nctl._id].timestamp = new Date();
														hashMap[nctl._id].cnnCode = newCode;
														logger.info('Update ' + scid + ' to hashMap, newCode is ' + newCode);
													} else {
														logger.info('Connecting...getController failed!!!',scid);
													}
													callback('succeed');
												});*/
											});//updateControllerState
										}//reply succeed
									});	//replyCnn
								});//getOneSetLight
                            });	//newCnnCode													
						});	//getSettingLight					
					}//getController succeed
				});	//getController				
			}//dp.verifyCnt
			else {
				logger.info('Connecting...verfiy failed...idx:',idx,' code:',code,' cid:',cid,' sec:',sec);
				dp.replyCnn(server,2,0,data.ip,data.port,null,null,function(res){
					if(res === -1) {
						logger.debug('Connecting!!!Sending error...');
						callback('error');
					}else {
						logger.debug('Connecting!!!Sending succeed');
						callback('succeed');
					}
				});	
			}
		},
		procGet = function(data, callback){
			"use strict";
			
			var sec_code = data.readUInt32BE(1),
				ltId = data.readUInt8(5),
				cnn_code = dp.getCnnCode(sec_code),
				ctl_idx = findCtlByCnnCode(cnn_code);
			if(ctl_idx){
				logger.debug('Getting...Found controller!!!');
				var ctl = hashMap[ctl_idx],
					curTime = new Date();
				hashMap[ctl_idx].cnnTime = curTime;
				hashMap[ctl_idx].updateTime = curTime;
				db.getLight({index:ctl.index,code:ctl.code,cid:ctl.cid},ltId,function(lt){
					if(!lt){
						logger.debug('Getting...Not found light ', ltId);
						dp.replyGet(server,1,data.ip,data.port,null,ltId,null,function(bytes){
							if(bytes === -1) {
								logger.debug('Getting!!!Sending error...');
								callback('error');
							}else {
								logger.debug('Getting!!!Sending succeed');
								callback('succeed');
							}
						});
					} else {
						db.updateCtlUpdateTime(ctl,curTime,function(upResult){});
						if(lt.bSet){
							logger.debug('Getting...Light has setting ',ltId);
							db.getNextOneSetLight({index:ctl.index,code:ctl.code,cid:ctl.cid},ltId,function(_lt){
								var ltid = 255;
								if(_lt) 
									ltid = _lt.index;
								dp.replyGet(server,0,data.ip,data.port,cnn_code,lt,ltid,function(bytes){
									if(bytes === -1) {
										logger.debug('Getting!!!Sending error...');
										callback('error');
									}else {
										logger.debug('Getting!!!Sending succeed');
										db.updateLightSetting({index:ctl.index,code:ctl.code,cid:ctl.cid},ltId,function(result){
											if(result === 'succeed'){
												lt.bSet = 0;
												var evt = new channelEvent({type:'light-getparams',data:lt});
												dispatchEventListener(evt,lt._id);
											}
											callback('succeed');
										});
									}
								});
							});
						} else {
							logger.debug('Getting...No setting of light ',ltId);
							dp.replyGet(server,3,data.ip,data.port,null,ltId,null,function(bytes){
								if(bytes === -1) {
									logger.debug('Getting!!!Sending error...');
									callback('error');
								}else {
									logger.debug('Getting!!!Sending succeed');
									callback('succeed');
								}
							});
						}
					}
				});
			}
			else {
				logger.debug('Getting...No found controller of temp code ',cnn_code);
				dp.replyGet(server,2,data.ip,data.port,null,null,null,function(bytes){
					if(bytes === -1) {
						logger.debug('Getting!!!Sending error...');
						callback('error');
					}else {
						logger.debug('Getting!!!Sending succeed');
						callback('succeed');
					}
				});
			}
		},
		procPut = function(data, callback){
			"use strict";
			
			var sec_code = data.readUInt32BE(1),
			lt = dp.getLightData(data),
			cnn_code = dp.getCnnCode(sec_code);
			var ctl_idx = findCtlByCnnCode(cnn_code);
			if(ctl_idx){
				var ctl = hashMap[ctl_idx];				
				hashMap[ctl_idx].cnnTime = new Date();
				lt.uindex = ctl.index;
				lt.ucode = ctl.code;
				lt.cid = ctl.cid;
				logger.debug('Putting...Found controller!!!index:',lt.uindex, ' code:', lt.ucode, ' cid:', lt.cid, ' cnnCode:',cnn_code,' ip:',data.ip, ' port:',data.port);
				db.getLight({index:ctl.index,code:ctl.code,cid:ctl.cid},lt.index,function(qlt){
					if(qlt){
						//如果是更新状态，则不设置
						if(qlt.bSet === 1){
							logger.info('light ', lt.index, ' is setting status, cannot be udpated!');
							dp.replyPut(server,2,data.ip,data.port,lt.index,function(bytes){
								if(bytes === -1) {
									logger.debug('Putting!!!Sending error...');
									callback('error');
								}else {
									logger.debug('Putting!!!Sending succeed');
									callback('succeed');
								}
							});
						}else{
							logger.debug('Putting...Found light updating...index',lt.index,' query result:{', qlt._id.toString(),',',qlt.uindex,',',qlt.ucode,',',qlt.cid,'}');
							db.updateLight1(qlt._id.toString(), lt, function(result){
								if(result === 'success'){
									dp.replyPut(server,0,data.ip,data.port,lt.index,function(bytes){
										if(bytes === -1) {
											logger.debug('Putting!!!Sending error...');
											callback('error');
										}else {
											logger.debug('Putting!!!Sending succeed');
											callback('succeed');
											var evt = new channelEvent({type:'light-putparams',data:lt});
											dispatchEventListener(evt,qlt._id.toString());
										}
									});
								}
							});
						}
					}else{
						logger.debug('Putting...Not found light adding...',lt.index);
						db.addLight(lt, function(result){
							if(result === 'succeed'){
								dp.replyPut(server,0,data.ip,data.port,lt.index,function(bytes){
									if(bytes === -1) {
										logger.debug('Putting!!!Sending error...');
										callback('error');
									}else {
										logger.debug('Putting!!!Sending succeed');
										callback('succeed');						
										db.getLight({index:ctl.index,code:ctl.code,cid:ctl.cid},lt.index,function(qlt){
											if(qlt){
												var evt = new channelEvent({type:'light-putparams',data:lt});
												dispatchEventListener(evt,qlt._id.toString());
											}
										});											
									}
								});
							}
						});
					}
				});
			}
			else {
				logger.debug('Putting...No found controller of temp code ',cnn_code);
				dp.replyPut(server,1,data.ip,data.port,null,function(bytes){
					if(bytes === -1) {
						logger.debug('Putting!!!Sending error...');
						callback('error');
					}else {
						logger.debug('Putting!!!Sending succeed');
						callback('succeed');
					}
				});
			}
		},
		handleInstruction = function(){
			"use strict";
			
			var inst = msgQueue[0];
			if(!inst) return;
			switch(inst[0]){
				//注册指令
				case 10:{
					procRegister(inst, function(result){
						msgQueue.splice(0,1);
						handleInstruction();
					});
				}
				break;
				//连接指令
				case 20: {
					procConnect(inst, function(result){
						msgQueue.splice(0,1);
						handleInstruction();
					});
				}				
				break;
				//获取参数指令
				case 30:{
					procGet(inst, function(result){
						msgQueue.splice(0,1);
						handleInstruction();
					});
				}				
				break;
				//发送参数指令
				case 40:{
					procPut(inst, function(result){
						msgQueue.splice(0,1);
						handleInstruction();
					});
				}				
				break;
				default:{
					msgQueue.splice(0,1);
				}
				break;
			}
		},
		handleInstruction0 = function(inst){
			"use strict";
			
			switch(inst[0]){
			//注册指令
			case 10:{
				procRegister(inst, function(result){
					logger.info('procRegister ',result);
				});
			}
			break;
			//连接指令
			case 20: {
				procConnect(inst, function(result){
					logger.info('procConnect ',result);
				});
			}				
			break;
			//获取参数指令
			case 30:{
				procGet(inst, function(result){
					logger.info('procGet ',result);
				});
			}				
			break;
			//发送参数指令
			case 40:{
				procPut(inst, function(result){
					logger.info('procPut ',result);
				});
			}				
			break;
			default:				
			}
		};
	
	that.addEventListener = function (eventType, listener) {
		"use strict";

		if (!eventListeners.hasOwnProperty(eventType)) {
	    	eventListeners[eventType] = [];
		}
		eventListeners[eventType].push(listener);
	};
	
	that.removeEventListener = function (eventType, listener) {
		"use strict";

		if (eventListeners.hasOwnProperty(eventType)) {	    	
			var index = eventListeners[eventType].indexOf(listener);
			if (index !== -1) {
	    		eventListeners[eventType].splice(index, 1);
			}
		}
	};
	
	that.getDeviceInfo = function(deviceId) {
		"use strict";
		
		if(hashMap.hasOwnProperty(deviceId)){
			return hashMap[deviceId];
		}
		return null;
	};
	
	that.getLastesCtlUpdateTime = function(ctl,callback){
		"use strict";
		
		for(var c in hashMap){
			if(hashMap[c].index === ctl.index &&
				hashMap[c].code === ctl.code &&
				hashMap[c].cid === ctl.cid){
				if(hashMap[c].hasOwnProperty('updateTime'))
					callback(hashMap[c].updateTime);
				else
					callback('failed');
				return;
			}
		}
		callback('failed');
	};
		
	that.start = function () {
		"use strict";
	
		server.on("error", function (err) {
			logger.info("server error:\n" + err.stack);
			clearInterval(interval);
		  	server.close();
		});
		
		server.on('listening', function () {
		    var address = server.address();
		    logger.info('UDP Server listening on ' + address.address + ":" + address.port);
		});
		
		server.on('message', function (message, remote) {			
			var buffer = new Buffer(message).toJSON(),		
				data = new Buffer(buffer);
			logger.info("receiving data...", data);
			data.ip = remote.address;
			data.port = remote.port;
			//handleInstruction0(data);
			if(data[0] === 10 || data[0] === 20 ||
				data[0] === 30 || data[0] === 40){
				msgQueue.push(data);
			}
		});
		
		server.on('close', function () {
			logger.info('udp server closed...');
		});
		
		server.bind(1000);
		
		initialHashMap();
		
		setInterval(function(){
			handleInstruction();
		},100);
	};
	
	return that;
};
