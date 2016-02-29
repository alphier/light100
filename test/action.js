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

function connectInst(){
	message = new Buffer(12);
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
	
	return message;
};

function putInst(s,lid){
	var message = new Buffer(30),
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
	message.writeUInt8(58, 18);
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
	
	return message;
};

function putInst0(s,lid){
	var message = new Buffer(29),
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
	//状态字 1011 0101 自动 铅24V 光控 充电 关灯 故障
	message.writeUInt8(0, 6);
	//光控时间 18:35
	message.writeUInt8(0, 7);
	message.writeUInt8(0, 8);
	//光控电压 3.5V
	message.writeUInt8(0, 9);
	//1亮度 100%
	message.writeUInt8(0, 10);
	//1时间 2.5h
	message.writeUInt8(0, 11);
	//2亮度 90%
	message.writeUInt8(0, 12);
	//2时间 2.7h
	message.writeUInt8(0, 13);
	//3亮度 80%
	message.writeUInt8(0, 14);
	//3时间 2.9h
	message.writeUInt8(0, 15);
	//4亮度 70%
	message.writeUInt8(0, 16);
	//4时间 3.5h
	message.writeUInt8(0, 17);
	//电量 78%
	message.writeUInt8(0, 18);
	//温度 62C°
	message.writeUInt8(0, 19);
	//容量 89A
	message.writeUInt8(0, 20);
	//充电功率 350W
	message.writeUInt16BE(0, 21);
	//放电功率 260W
	message.writeUInt16BE(0, 23);
	//生产日期 15/04/0322
	message.writeUInt8(0, 25);
	message.writeUInt8(0, 26);
	message.writeUInt16BE(0, 27);
	
	return message;
};

function getInst(s,lid) {

	message = new Buffer(6);

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
			console.log(dtstr() + ' receive connect reply...', sec_code);
		
		for(var i=0;i<5;i++){
			pMsg = putInst(sec_code,i);
			client.send(pMsg, 0, pMsg.length, PORT, HOST, function(err, bytes) {
				if (err) throw err;
				console.log(dtstr() + 'Putting!!!' + HOST + ':' + PORT);
			});
		}
		
		for(var i=0;i<60;i++){
			gMsg = getInst(sec_code,i);
			client.send(gMsg, 0, gMsg.length, PORT, HOST, function(err, bytes) {
				if (err) throw err;
				console.log(dtstr() + 'Getting!!!' + HOST + ':' + PORT);
			});
		}
		break;
	case 31:
		if(data[1] === 0x4e && data[2] === 0x41){
			console.log(dtstr() + ' light not found!!!');
			return;
		}
		
		if(data[1] === 0x45 && data[2] === 0x52){
			console.log(dtstr() + ' controller not found!!!');
			return;
		}
		
		if(data[1] === 0x4e && data[2] === 0x4f){
			console.log(dtstr() + ' light has no setting!!!');
			return;
		}
		console.log(dtstr() + ' receive getting reply...', ' buffer:',buffer);
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
