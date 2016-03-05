var b = new Buffer(2);
b.write('NO',0);
console.log('buffer:',b);

//mongod --repair --dbpath /var/root/mongo
//mongod --journal --dbpath /var/root/mongo -logpath /var/root/mongo/mongo.log --logappends

/*var message = new Buffer(12);
message.writeUInt8(0x0a, 0);
message.writeUInt8(0x01, 1);
message.writeUInt8(0x02, 2);
message.writeUInt8(0x88, 3);
message.writeUInt8(0x38, 4);
message.writeUInt8(0x30, 5);
message.writeUInt8(0x30, 6);
message.writeUInt8(0x31, 7);
message.writeUInt8(0x09, 8);
message.writeUInt8(0x7e, 9);
message.writeUInt8(0x75, 10);
message.writeUInt8(0x66, 11);

console.log('type:',message[0],' index:',message[1],' code:',message.readUInt16BE(2),
			' cid:',message.readUInt32BE(4),' secure:',message.readUInt32BE(8));

var key1 = new Buffer('1NEW').readUInt32BE(0),
	key2 = new Buffer('HARO').readUInt32BE(0),
	key3 = new Buffer('XUKE').readUInt32BE(0),
	key4 = new Buffer('INTO').readUInt32BE(0);

if(message.readUInt32BE(4) ^ key1 === message.readUInt32BE(8))
	console.log('Haliluya!!!!');

var cid = new Buffer(4);
cid.writeUInt32BE(message.readUInt32BE(4),0);
console.log('cid is ', cid.toString('ascii'));*/

/*var a = 200;
var c = parseInt(a);
console.log(c);
function MathRand(n){ 
	var Num=""; 
	for(var i=0;i<n;i++) { 
		Num+=Math.floor(Math.random()*10); 
	}
	console.log('Num:',Num);
	//callback(Num.toString());
}

for(var i=0;i<100;i++)
	MathRand(4);

var a = '0781';
console.log(parseFloat('3.78'));

function chooseChangeFileds(Old, New){
	var na = {};
	for(var a in Old){
		if(New.hasOwnProperty(a)){
			if(New[a] !== Old[a]){
				na[a] = New[a];
			}
		}
	}
	return na;
};

var collections = ["users", "controllers", "lights"],
databaseUrl = "light100",
BSON = require('mongodb').BSONPure,
db = require("mongojs").connect(databaseUrl, collections);

var query = {uindex:"001",ucode:"58d0",cid:"8001"},
	upfields = {ctltype:1,autotype:1,bSet:1};
db.lights.update(query, 
		{$set:upfields}, 
		{multi:true},
	function(err, result){
	if(err) 
		console.log('!!!!failed');
	else
		console.log("!!!!success");
});
*/