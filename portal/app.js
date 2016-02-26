var express = require('express'),
	routes = require('./routes'),
	path = require('path'),
	ejs = require('ejs'),
	SessionStore = require("session-mongoose")(express);

var store = new SessionStore({
    url: "mongodb://localhost/session",
    interval: 120000 // expiration check worker run interval in millisec (default: 60000)
});
  
var app = express();

app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.engine('.html', ejs.__express);
app.set('view engine', 'html');
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(express.session({
  	secret : 'blog.fens.me',
    store: store,
    cookie: { maxAge:24 * 60 * 60 * 1000 } // expire session in 15 min or 900 seconds
}));

app.use(function(req, res, next){
	res.locals.user = req.session.user;
	var err = req.session.error;
	delete req.session.error;
	res.locals.message = '';
	if (err) res.locals.message = err;
	next();
});

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//basic
app.get('/', routes.login);
app.post('/', routes.doLogin);

//app.get('/register', authentication);
app.get('/register', routes.register);
app.post('/register', routes.doRegister);

app.post('/addUser', routes.doAddUser);
app.post('/deleteUser', routes.doDeleteUser);
app.post('/clearHistory', routes.doClearHistory);
app.post('/sendMessage', routes.doSend);
app.post('/modifyPwd', routes.doModifyPwd);
app.post('/remoteDelete', routes.doRemoteDel);
app.get('/userid_datagrid.json', routes.getUserIds);
app.get('/history_datagrid.json', routes.getHistory);

app.get('/logout', authentication);
app.get('/logout', routes.logout);

app.get('/home', authentication);
app.get('/home', routes.home);
app.post('/getAllControllers', routes.getAllControllers);
app.post('/getControllerInfo', routes.getCtlerLightsInfo);
app.post('/updateCtlName', routes.doUpdateCtlName);
app.get('/getLights', routes.getLights1);

app.get('/light', authentication);
app.get('/light', routes.light);
app.post('/light_datagrid.json', routes.getLights);
app.post('/updateLight', routes.doUpdateLight);
app.post('/updateAllLights', routes.doUpdateAllLights);
app.post('/updateSingleLights', routes.doUpdateSingleLights);
app.post('/updateDoubleLights', routes.doUpdateDoubleLights);
app.post('/removeAllLights',routes.doRemoveAllLights);
app.post('/saveName',routes.doSaveName);

app.get('/getTime', routes.getCurrentTime);

app.get('/admin', authAdmin);
app.get('/admin', routes.admin);
app.post('/user_datagrid.json', routes.getAllUsers);

app.listen(app.get('port'));
console.log('Node listening on port %s', app.get('port'));

function authentication(req, res, next) {
  if (!req.session.user) {
    req.session.error = '请先登录！';
    return res.redirect('/');
  }
  next();
}

function authAdmin(req, res, next) {
	if (!req.session.user) {
		req.session.error = '请先登录！';
		return res.redirect('/');
	} else if(req.session.user.level !== 'super'){
		req.session.error = '请使用管理员身份登录！';
		return res.redirect('/');
	}
	next();
}

function notAuthentication(req, res, next) {
	if (req.session.user) {
    	req.session.error = '已登录';
    	return res.redirect('/');
  	}
  next();
}