var dp = {};

function MathRand(n){ 
	var Num=""; 
	for(var i=0;i<n;i++) { 
		Num+=Math.floor(Math.random()*10); 
	}	
	return Num;
}

function rand(min,max){
	var c = max - min;
	return (Math.floor(Math.random() * c + min)).toString();
}

dp.key1 = new Buffer('1NEW').readUInt32BE(0);
dp.key2 = new Buffer('HARO').readUInt32BE(0);
dp.key3 = new Buffer('INTO').readUInt32BE(0);

dp.verifyReg = function (data, verify){
	return (data ^ dp.key1) === verify;
};

dp.verifyCnt = function (data, verify){
	return (data ^ dp.key2) === verify;
};

dp.verifyOth = function (data, verify){
	return (data ^ dp.key3) === verify;
};

dp.getCnnCode = function (data){
	var sec_code = new Buffer(4);
	var key = 'INTO';
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

dp.replyReg = function (conn, state, ip, port, callback){
	var ab = new Buffer(3);
	ab.writeUInt8(0x0b,0);
	if(state === 0)
		ab.write('OK',1);
	if(state === 1)
		ab.write('EA',1);
	if(state === 2)
		ab.write('EB',1);
	if(state === 3)
		ab.write('EC',1);
	conn.send(ab, 0, 3, port, ip, function (err, bytes){	
		if(err) {
			if(callback) callback(-1);
		}else {
			if(callback) callback(bytes);
		}
	});
};

dp.newCnnCode = function(){
	var num = rand(1000,10000);
	return num;
};

dp.replyCnn = function (conn, state, num, ip, port, hasSet, callback){
	var ab = {},
		size = 3;
	if(state === 0){
		size = 11;
		ab = new Buffer(11);
		ab.writeUInt8(0x15,0);
		ab.write('OK',1);
		//var num = rand(1000,10000);
		var key = 'XUKE',
			a = num.charCodeAt(0) ^ key.charCodeAt(0),
			b = num.charCodeAt(1) ^ key.charCodeAt(1),
			c = num.charCodeAt(2) ^ key.charCodeAt(2),
			d = num.charCodeAt(3) ^ key.charCodeAt(3);
		ab.writeUInt8(a,3);
		ab.writeUInt8(b,4);
		ab.writeUInt8(c,5);
		ab.writeUInt8(d,6);
		
		if(hasSet)
			ab.write('Y',7);
		else
			ab.write('N',7);
		
		var t = new Date();
		ab.writeUInt8(t.getHours(),8);
		ab.writeUInt8(t.getMinutes(),9);
		ab.writeUInt8(t.getSeconds(),10);
	}
	if(state === 1){
		ab = new Buffer(3);
		ab.writeUInt8(0x15,0);
		ab.write('EA',1);
	}
	if(state === 2){
		ab = new Buffer(3);
		ab.writeUInt8(0x15,0);
		ab.write('EB',1);
	}
	conn.send(ab, 0, size, port, ip, function (err, bytes){	
		if(err) {
			if(callback) callback(-1);
		}else {
			if(callback) callback(0);
		}
	});
};

dp.replyGet = function (conn, state, ip, port, cnncode, light, callback){
	var ab = {},
		size = 3;
	if(state === 0){
		size = 18;
		ab = new Buffer(18);
		ab.writeUInt8(0x1f,0);
		cnncode = String(cnncode);
		var key = 'XUKE',
			a = cnncode.charCodeAt(0) ^ key.charCodeAt(0),
			b = cnncode.charCodeAt(1) ^ key.charCodeAt(1),
			c = cnncode.charCodeAt(2) ^ key.charCodeAt(2),
			d = cnncode.charCodeAt(3) ^ key.charCodeAt(3);
		//临时码异或XUKE
		ab.writeUInt8(a,1);
		ab.writeUInt8(b,2);
		ab.writeUInt8(c,3);
		ab.writeUInt8(d,4);
		//灯编号
		ab.writeUInt8(parseInt(light.index),5);
		//灯值&自动方式
		var s = 0;
		s ^= parseInt(light.ctltype);
		s <<= 1;		
		s ^= parseInt(light.autotype);
		ab.writeUInt8(s,6);
		//光控时间
		s = light.ontime;
		s = s.split(':');
		var a1 = parseInt(s[0]),
			a2 = parseInt(s[1]);
		ab.writeUInt8(a1,7);
		ab.writeUInt8(a2,8);
		//电压
		ab.writeUInt8(parseInt(light.lcvoltage*10),9);
		//1亮
		ab.writeUInt8(parseInt(light.abright),10);
		//1时
		ab.writeUInt8(parseInt(light.atime*10),11);
		//2亮
		ab.writeUInt8(parseInt(light.bbright),12);
		//2时
		ab.writeUInt8(parseInt(light.btime*10),13);
		//3亮
		ab.writeUInt8(parseInt(light.cbright),14);
		//3时
		ab.writeUInt8(parseInt(light.ctime*10),15);
		//4亮
		ab.writeUInt8(parseInt(light.dbright),16);
		//4时
		ab.writeUInt8(parseInt(light.dtime*10),17);
	}
	if(state === 1){
		ab = new Buffer(4);
		ab.writeUInt8(0x1f,0);
		ab.write('NA',1);
		ab.writeUInt8(light,3);
		size = 4;
	}
	if(state === 2){
		ab = new Buffer(3);
		ab.writeUInt8(0x1f,0);
		ab.write('ER',1);
	}
	if(state === 3){
		ab = new Buffer(4);
		ab.writeUInt8(0x1f,0);
		ab.write('NO',1);
		ab.writeUInt8(light,3);
		size = 4;
	}
	conn.send(ab, 0, size, port, ip, function (err, bytes){	
		if(err) {
			if(callback) callback(-1);
		}else {
			if(callback) callback(bytes);
		}
	});
};

dp.replyPut = function (conn, state, ip, port, ltid, callback){
	var ab = {},
		size = 3;	
	if(state === 0){
		ab = new Buffer(4);
		ab.writeUInt8(0x1f,0);
		ab.write('OK',1);
		ab.writeUInt8(ltid,3);
		size = 4;
	}
	if(state === 1){
		ab = new Buffer(3);
		ab.writeUInt8(0x1f,0);
		ab.write('ER',1);
	}
	conn.send(ab, 0, size, port, ip, function (err, bytes){	
		if(err) {
			if(callback) callback(-1);
		}else {
			if(callback) callback(bytes);
		}
	});
};

dp.getLightData = function (data){
	var lt = {};
	//编号
	lt.index = data.readUInt8(5);
	//状态字
	var state = data.readUInt8(6);
	lt.ctltype = (state >> 6);		//控制方式
	lt.batype = (state >> 4) & 3;	//电池类型
	lt.autotype = (state >> 3) & 1;	//自动方式
	lt.charging = (state >> 2) & 1; //充放电
	lt.onoff = (state >> 1) & 1;	//开关状态
	lt.state = state & 1;			//是否故障
	var nZeroNum = 0;
	//光控时间
	var h = String(data.readUInt8(7)),
		m = String(data.readUInt8(8));
	if(h.length === 1) h = '0' + h;
	if(m.length === 1) m = '0' + m;
	lt.ontime = h + ':' + m;
	if(data.readUInt8(7) === 0)
		nZeroNum ++;
	if(data.readUInt8(8) === 0)
		nZeroNum ++;
	//光控电压
	lt.lcvoltage = data.readUInt8(9)/10;
	if(data.readUInt8(9) === 0)
		nZeroNum ++;
	//1亮度
	lt.abright = data.readUInt8(10);
	if(data.readUInt8(10) === 0)
		nZeroNum ++;
	//1时间
	lt.atime = data.readUInt8(11)/10;
	if(data.readUInt8(11) === 0)
		nZeroNum ++;
	//2亮度
	lt.bbright = data.readUInt8(12);
	if(data.readUInt8(12) === 0)
		nZeroNum ++;
	//2时间
	lt.btime = data.readUInt8(13)/10;
	if(data.readUInt8(13) === 0)
		nZeroNum ++;
	//3亮度
	lt.cbright = data.readUInt8(14);
	if(data.readUInt8(14) === 0)
		nZeroNum ++;
	//3时间
	lt.ctime = data.readUInt8(15)/10;
	if(data.readUInt8(15) === 0)
		nZeroNum ++;
	//4亮度
	lt.dbright = data.readUInt8(16);
	if(data.readUInt8(16) === 0)
		nZeroNum ++;
	//4时间
	lt.dtime = data.readUInt8(17)/10;
	if(data.readUInt8(17) === 0)
		nZeroNum ++;
	//电量
	lt.battery = data.readUInt8(18);
	if(data.readUInt8(18) === 0)
		nZeroNum ++;
	//温度
	lt.temp = data.readUInt8(19);
	if(data.readUInt8(19) === 0)
		nZeroNum ++;
	//容量
	lt.capacity = data.readUInt8(20);
	if(data.readUInt8(20) === 0)
		nZeroNum ++;
	//充电功率
	lt.cpower = data.readUInt16BE(21)/10;
	if(data.readUInt16BE(21) === 0)
		nZeroNum ++;
	//放电功率
	lt.lpower = data.readUInt16BE(23)/10;
	if(data.readUInt16BE(23) === 0)
		nZeroNum ++;
	//生产日期
	var year = String(data.readUInt8(25)),
		month = String(data.readUInt8(26)),
		pid = String(data.readUInt16BE(27));
	if(year.length === 1) year = '0' + year;
	if(month.length === 1) month = '0' + month;
	if(pid.length == 1) pid = '000' + pid;
	if(pid.length == 2) pid = '00' + pid;
	if(pid.length == 3) pid = '0' + pid;
	lt.pdate = year + '/' + month + '/' + pid;
	if(data.readUInt8(25) === 0)
		nZeroNum ++;
	if(data.readUInt8(26) === 0)
		nZeroNum ++;
	if(data.readUInt8(27) === 0)
		nZeroNum ++;
	
	//补充字段
	lt.voltage = 0;
	lt.bSet = 0;
	if(nZeroNum === 19)
		lt.state = -1;
	
	return lt;
};

module.exports = dp;
