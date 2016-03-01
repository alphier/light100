var collections = ["users", "controllers", "lights", "usefulData", "maxData"];
var db = require("mongojs").connect('light100', collections);
var moment = require('moment');

db.usefulData.findOne({},function(err, result){
	var date = moment(result.time).format('YYYY-MM-DD HH:mm:ss');
});