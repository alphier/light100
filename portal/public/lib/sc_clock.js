/*! 
* File: sc_clock.js 
* Version: 1.0.0 
* Author: LuLihong 
* Date: 2014-06-06 
* Desc: 自动运行的时钟 
* 
* 版权：开源，随便使用，请保持头部。 
*/ 

/** 
* 格式化输出 
* @returns 
*/ 
String.prototype.format = function() { 
	var args = arguments; 
	return this.replace(/\{(\d+)\}/g, function(m, i){return args[i];}); 
}; 

/** 
* 转化为数字 
* @returns 
*/ 
String.prototype.toInt = function(defaultV) { 
	if (this === "" || !(/^\d+$/.test(this))) return defaultV; 
	return parseInt(this); 
}; 

window.scClock = 
{ 
	year : 2014, 
	month : 1, 
	day : 1, 
	hour : 0, 
	minute : 0, 
	second : 0, 

	isRunning : false, 
	/** 
	* 显示时间的函数，调用者在调用startup函数时传入。 
	*/ 
	showFunc : function(){}, 

	/** 
	* 初始化 
	*/ 
	init : function(y, mon, d, h, min, s){ 
		this.year = y; 
		this.month = mon; 
		this.day = d; 
		this.hour = h; 
		this.minute = min; 
		this.second = s; 
	}, 

	/** 
	* 初始化时间：时间格式：2014-06-09 11:30:30 
	*/ 
	updateTime : function(time) { 
		var arr = time.split(/[\-\ \:]/); 
		if (arr.length != 6) return; 

		this.year = arr[0].toInt(2014); 
		this.month = arr[1].toInt(1); 
		this.day = arr[2].toInt(1); 
		this.hour = arr[3].toInt(0); 
		this.minute = arr[4].toInt(0); 
		this.second = arr[5].toInt(0); 
	}, 

	/** 
	* 更新时间：时间格式：2014-06-09 11:30:30 
	*/ 
	updateTime : function(time) { 
		var arr = time.split(/[\-\ \:]/); 
		if (arr.length != 6) return; 

		this.year = arr[0].toInt(2014); 
		this.month = arr[1].toInt(1); 
		this.day = arr[2].toInt(1); 
		this.hour = arr[3].toInt(0); 
		this.minute = arr[4].toInt(0); 
		this.second = arr[5].toInt(0); 
	}, 

	/** 
	* 开始 
	*/ 
	startup : function(func) { 
		if (this.isRunning) return; 
		this.isRunning = true; 
		this.showFunc = func; 
		window.setTimeout("scClock.addOneSec()", 1000); 
	}, 

	/** 
	* 结束 
	*/ 
	shutdown : function() { 
		if (!this.isRunning) return; 
		this.isRunning = false; 
	}, 

	/** 
	* 获取时间 
	*/ 
	getDateTime : function() { 
		var fmtString = "{0}-{1}-{2} {3}:{4}:{5}"; 
		var sMonth = (this.month < 10) ? ("0" + this.month) : this.month; 
		var sDay = (this.day < 10) ? ("0" + this.day) : this.day; 
		var sHour = (this.hour < 10) ? ("0" + this.hour) : this.hour; 
		var sMinute = (this.minute < 10) ? ("0" + this.minute) : this.minute; 
		var sSecond = (this.second < 10) ? ("0" + this.second) : this.second; 
		return fmtString.format(this.year, sMonth, sDay, sHour, sMinute, sSecond); 
	}, 

	/** 
	* 增加一秒 
	*/ 
	addOneSec : function() { 
		this.second++; 
		if (this.second >= 60) { 
			this.second = 0; 
			this.minute++; 
		} 
		if (this.minute >= 60) { 
			this.minute = 0; 
			this.hour++; 
		} 
		if (this.hour >= 24) { 
			this.hour = 0; 
			this.day++; 
		} 
		switch(this.month) { 
		case 1: 
		case 3: 
		case 5: 
		case 7: 
		case 8: 
		case 10: 
		case 12: { 
			if (this.day > 31) { 
				this.day = 1; 
				this.month++; 
			} 
			break; 
		} 
		case 4: 
		case 6: 
		case 9: 
		case 11: { 
			if (this.day > 30) { 
				this.day = 1; 
				this.month++; 
			} 
			break; 
		} 
		case 2: { 
			if (this.isLeapYear()) {
				if (this.day > 29) {
					this.day = 1; 
					this.month++; 
				} 
			} else if (this.day > 28) {
				this.day = 1; 
				this.month++; 
			} 
			break; 
		} 
		} 
		if (this.month > 12) { 
			this.month = 1; 
			this.year++; 
		} 

		this.showFunc(this.getDateTime()); 

		if (this.isRunning) 
			window.setTimeout("scClock.addOneSec()", 1000); 
	}, 

	/** 
	* 检测是否为闰年: 判断闰年的规则是，能被4整除，但能被100整除的不是闰年，能被400整除为闰年. 
	*/ 
	isLeapYear : function() {
		if (this.year % 4 == 0) {
			if (this.year % 100 != 0) return true; 
			if (this.year % 400 == 400) return true; 
		} 
		return false; 
	} 

}; 