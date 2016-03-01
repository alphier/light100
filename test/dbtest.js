var collections = ["users", "controllers", "lights", "usefulData", "maxData"];
var db = require("mongojs").connect('light100', collections);
var moment = require('moment');

var updates = {password:'123'};
db.users.update({username:'CHCZJ'},{$set:updates},function(err,result){
	console.log('result is ', result);
});

db.usefulData.findOne({},function(err, result){
	//var date = moment(result.time).format('YYYY-MM-DD HH:mm:ss');
});

db.lights.find({cid:"5000"}).sort({"cpower":-1}).limit(1).toArray(function(err, lts){
	if(err || !lts || lts.length === 0){
		console.log('faild');
	}else{
		var cpower = lts[0].cpower;
		console.log('success ', cpower);
	}
});