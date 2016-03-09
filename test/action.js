var PORT = 1000;
var HOST = 'localhost';		//115.28.23.23
//var HOST = '115.28.218.190';

var dgram = require('dgram'),
	client = dgram.createSocket('udp4');

function dtstr(){
    var dt = new Date();
	var dtstr = dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate() +
				' ' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds() + ' ';
	return dtstr;
};	

function registerInst(){
	message = new Buffer(14);
	message.writeUInt8(0x0a, 0);
	message.writeUInt8(0x01, 1);
	message.writeUInt8(0x15, 2);
	message.writeUInt8(0xf0, 3);
	//控制器编号9001
	message.writeUInt8(57, 4);
	message.writeUInt8(48, 5);
	message.writeUInt8(48, 6);
	message.writeUInt8(49, 7);
	//控制器编号9001^NEW1
	message.writeUInt8(8, 8);
	message.writeUInt8(126, 9);
	message.writeUInt8(117, 10);
	message.writeUInt8(102, 11);
	//\r\n
	message.write('\r\n', 12);
	
	return message;
}

function connectInst(){
	message = new Buffer(20);
	//指令：HARO - 0x48 0x41 0x52 0x4f
	//指令类型 20
	message.writeUInt8(0x14, 0);
	//编号 1
	message.writeUInt8(0x01, 1);
	//机器码 8948
	//message.writeUInt8(0x22, 2);
	//message.writeUInt8(0xf4, 3);
	//机器码 5616
	message.writeUInt8(0x15, 2);
	message.writeUInt8(0xf0, 3);
	//控制器编号(字符串) 5000
	message.writeUInt8(0x35, 4);
	message.writeUInt8(0x30, 5);
	message.writeUInt8(0x30, 6);
	message.writeUInt8(0x30, 7);
	//验证码 '5000' ^ 'HARO'
	message.writeUInt8(0x7d, 8);
	message.writeUInt8(0x71, 9);
	message.writeUInt8(0x62, 10);
	message.writeUInt8(0x7f, 11);
	
	//人流量
	message.writeUInt16BE(4000, 12);
	//车流量
	message.writeUInt16BE(30000, 14);
	//温度, 5℃
	message.writeUInt8(110, 16);
	//是否保存，是
	message.writeUInt8(1, 17);
	//\r\n
	message.write('\r\n', 18);
	
	return message;
};

function putInst(s,lid){
	var message = new Buffer(32),
		k = 'INTO',
		a = s.charCodeAt(0) ^ k.charCodeAt(0),
		b = s.charCodeAt(1) ^ k.charCodeAt(1),
		c = s.charCodeAt(2) ^ k.charCodeAt(2),
		d = s.charCodeAt(3) ^ k.charCodeAt(3);
	
	//指令类型 40
	message.writeUInt8(0x28, 0);
	//临时码 1234 ^ INTO
	message.writeUInt8(a, 1);
	message.writeUInt8(b, 2);
	message.writeUInt8(c, 3);
	message.writeUInt8(d, 4);
	//灯编号 1
	message.writeUInt8(lid, 5);
	//状态字 1011 0100 自动 铅24V 光控 充电 关灯 正常
	message.writeUInt8(180, 6);
	//光控时间 18:35
	message.writeUInt8(18, 7);
	message.writeUInt8(30, 8);
	//光控电压 3.5V
	message.writeUInt8(35, 9);
	//1亮度 100%
	message.writeUInt8(98, 10);
	//1时间 2.5h
	message.writeUInt8(25, 11);
	//2亮度 90%
	message.writeUInt8(89, 12);
	//2时间 2.7h
	message.writeUInt8(27, 13);
	//3亮度 80%
	message.writeUInt8(78, 14);
	//3时间 2.9h
	message.writeUInt8(29, 15);
	//4亮度 70%
	message.writeUInt8(65, 16);
	//4时间 3.5h
	message.writeUInt8(35, 17);
	//电量 78%
	message.writeUInt8(77, 18);
	//温度 62C°
	message.writeUInt8(62, 19);
	//容量 89A
	message.writeUInt8(78, 20);
	//充电功率 350W
	message.writeUInt16BE(28, 21);
	//放电功率 260W
	message.writeUInt16BE(32, 23);
	//生产日期 15/04/0322
	message.writeUInt8(5, 25);
	message.writeUInt8(2, 26);
	message.writeUInt16BE(21, 27);
	//灯当前进度
	message.writeUInt8(1, 29);
	//\r\n
	message.write('\r\n', 30);
	
	return message;
};

function getInst(s,lid) {

	message = new Buffer(8);

	k = 'INTO',
	a = s.charCodeAt(0) ^ k.charCodeAt(0),
	b = s.charCodeAt(1) ^ k.charCodeAt(1),
	c = s.charCodeAt(2) ^ k.charCodeAt(2),
	d = s.charCodeAt(3) ^ k.charCodeAt(3);

	//指令类型 30
	message.writeUInt8(0x1e, 0);
	//临时码
	message.writeUInt8(a, 1);
	message.writeUInt8(b, 2);
	message.writeUInt8(c, 3);
	message.writeUInt8(d, 4);
	//灯编号
	message.writeUInt8(lid, 5);
	//\r\n
	message.write('\r\n', 6);
	
	return message;
};

 function getCnnCode (data, key){
	var sec_code = new Buffer(4);
	sec_code.writeUInt32BE(data,0);
	var a = sec_code[0] ^ key.charCodeAt(0),
		b = sec_code[1] ^ key.charCodeAt(1),
		c = sec_code[2] ^ key.charCodeAt(2),
		d = sec_code[3] ^ key.charCodeAt(3);
	var cnnBuf = new Buffer(4);
	cnnBuf.writeUInt8(a,0);
	cnnBuf.writeUInt8(b,1);
	cnnBuf.writeUInt8(c,2);
	cnnBuf.writeUInt8(d,3);
	return cnnBuf.toString('ascii');
};

function start(){
	var cMsg = connectInst();
	client.send(cMsg, 0, cMsg.length, PORT, HOST, function(err, bytes) {
		if (err) throw err;
		console.log(dtstr() + 'Connecting!!!' + HOST + ':' + PORT);
	});
};

function startRegister(){
	var cMsg = registerInst();
	client.send(cMsg, 0, cMsg.length, PORT, HOST, function(err, bytes) {
		if (err) throw err;
		console.log(dtstr() + 'Registering!!!' + HOST + ':' + PORT);
	});
}

client.on('message', function (msg, remote) {
	var buffer = new Buffer(msg).toJSON(),		
		data = new Buffer(buffer);
		
	switch(data[0]){
	case 11:
		console.log(dtstr() + ' receive register reply...', msg,' buffer:',buffer);
		break;
	case 21:
		if(data[1] === 0x45 && data[2] === 0x41){
			console.log(dtstr() + ' controller not found!!!');
			return;
		}
		
		if(data[1] === 0x45 && data[2] === 0x42){
			console.log(dtstr() + ' verify code wrong!!!');
			return;
		}
		
		var sec_code = data.readUInt32BE(3);
			sec_code = String(getCnnCode(sec_code,'XUKE')),	
			setLid = data.readUInt8(11);
			console.log(dtstr() + ' receive connect reply...', sec_code, ' buffer:',msg,' lid:',setLid);
		
		//get instruction old version
		/*for(var i=0;i<5;i++){
			pMsg = getInst(sec_code,i);
			client.send(pMsg, 0, pMsg.length, PORT, HOST, function(err, bytes) {
				if (err) throw err;
				console.log(dtstr() + 'Getting!!!' + HOST + ':' + PORT);
			});
		}*/
		
		//get instruction
		if(setLid !== 255){
			gMsg = getInst(sec_code,setLid);
			client.send(gMsg, 0, gMsg.length, PORT, HOST, function(err, bytes) {
				if (err) throw err;
				console.log(dtstr() + 'Getting!!!' + HOST + ':' + PORT);
			});
		}
		
		//put instruction
		/*for(var i=0;i<5;i++){
			pMsg = putInst(sec_code,i);
			client.send(pMsg, 0, pMsg.length, PORT, HOST, function(err, bytes) {
				if (err) throw err;
				console.log(dtstr() + 'Putting!!!' + HOST + ':' + PORT);
			});
		}*/
		
		break;
	case 31:
		if(data[1] === 0x4e && data[2] === 0x41){
			console.log(dtstr() + ' light not found!!!',msg);
			return;
		}
		
		if(data[1] === 0x45 && data[2] === 0x52){
			console.log(dtstr() + ' controller not found!!!',msg);
			return;
		}
		
		if(data[1] === 0x4e && data[2] === 0x4f){
			console.log(dtstr() + ' light has no setting!!!',msg);
			return;
		}
		if(data[1] === 0x4f && data[2] === 0x4b){
			console.log(dtstr() + ' receive putting reply!!!',msg);
			return;
		}
		if(data[1] === 0x45 && data[2] === 0x52){
			console.log(dtstr() + ' receive putting reply!!!Controller not found:',msg);
			return;
		}
		if(data[1] === 0x43 && data[2] === 0x42){
			console.log(dtstr() + ' receive putting reply!!!Light has changed',msg);
			return;
		}
		console.log(dtstr() + ' receive getting reply...', ' msg:',msg);
		var sec_code = data.readUInt32BE(1);
			sec_code = String(getCnnCode(sec_code,'XUKE')),	
			nextLid = data.readUInt8(18);
		if(nextLid !== 255){
			gMsg = getInst(sec_code,nextLid);
			client.send(gMsg, 0, gMsg.length, PORT, HOST, function(err, bytes) {
				if (err) throw err;
				console.log(dtstr() + 'Getting!!!' + HOST + ':' + PORT);
			});
		}
		break;
	case 41:
		console.log(dtstr() + ' receive putting reply...', ' buffer:',buffer);
		break;
	default:
		console.log(dtstr() + ' unknown instruction...', ' buffer:',buffer);
		break;
	};
});

start();
//startRegister();