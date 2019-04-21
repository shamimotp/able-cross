// server.js
// where your node app starts

// init project
const express = require('express');
var bodyParser = require("body-parser");
var chargebee = require("chargebee");
var crypto = require("crypto");
const app = express();
const request = require('request');
const CustomerUtil = require('./CustomerUtil.js');
const Subscriptions = require('./Subscriptions.js');
const Invoices = require('./Invoices.js');
const CreateSubscription = require('./CreateSubscription');
const common = require('./common');
const hostedPage = require('./hostedPage');
const Payment = require('./Payment');
const CollectNow = require('./CollectNow');
const SubscriptionUtil = require('./SubscriptionUtil');
const ExtraUtil = require('./ExtraUtil');
const ExtraUIUtil = require('./ExtraUIUtil');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

var fs = require('fs');
var dbFile = './.data/chargebee.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

db.serialize(function () {
    if (!exists) {
        db.run('CREATE TABLE Dreams (id TEXT , sitename TEXT, apikey TEXT, token TEXT)');
        console.log('New table Dreams created!');
        db.serialize(function () {
            db.run('INSERT INTO Dreams (id,sitename,apikey,token) VALUES ("1","sitename","apikey","token")');
        });
    } else {
        console.log('Database "Dreams" ready to go!');       
    }
});


app.get('/', function (request, response) {
    response.sendFile(__dirname + '/views/index.html');
});

app.get('/login', function (request, response) {
    response.redirect('https://app.intercom.io/a/oauth/connect?client_id=' + process.env.CLIENT_ID + '&state=chargebee');
});

app.get("/auth", function (req, res) {
    let code = req.query.code;
    let state = req.query.state;
    let siteName = req.query.sitename;
    let apikey = req.query.apikey;
    if (code === undefined) {
        code = '';
        state = '';
    }
    if (siteName === undefined || apikey === undefined) {
        let page = getLogin(code, state);
        res.set('Content-Type', 'text/html');
        res.send(new Buffer(page));
    } else {
        chargebee.configure({
            site: siteName,
            api_key: apikey
        })
        chargebee.subscription.list({
            limit: 1
        }).request(function (error, result) {
            if (error) {
                let page = getLogin(code, state);
                res.set('Content-Type', 'text/html');
                res.send(new Buffer(page));
            } else {
                request.post('https://api.intercom.io/auth/eagle/token', {
                    json: {
                        code: code,
                        client_id: process.env.CLIENT_ID,
                        client_secret: process.env.CLIENT_SECRET

                    }
                }, (error, res2, body) => {
                    if (error) {
                        res.redirect('https://app.intercom.io/appstore/redirect?error_message=Error Getting Eagle Token');

                    }
                    const options = {
                        url: 'https://api.intercom.io/me',
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': 'Bearer ' + body.token

                        }
                    };
                    request(options, function (err, res3, body2) {
                        if (err) {
                            res.redirect('https://app.intercom.io/appstore/redirect?error_message=Error Fetching Admin');
                        }

                        let admin = JSON.parse(body2);
                        db.get('SELECT * from Dreams where id= "' + admin.id + '"', function (err, row) {
                            if (row) {
                                db.run('UPDATE Dreams SET sitename= "' + siteName + '", apikey="' + apikey + '",token="' + body.token + '" WHERE id =  "' + admin.id + '"');
                                res.redirect('https://app.intercom.io/appstore/redirect?install_success=true');
                            } else {
                                db.run('INSERT INTO Dreams (id,sitename,apikey,token) VALUES ("' + admin.id + '", "' + siteName + '","' + apikey + '","' + body.token + '")');
                                res.redirect('https://app.intercom.io/appstore/redirect?install_success=true');
                            }
                        });




                    });


                });


            }
        });
    }
});

app.post("/init", function (req, res) {
    //console.log("Received init: " + JSON.stringify(req.body));    
    if (isSigned(req)) {
        db.get('SELECT * from Dreams where id= "' + req.body.admin.id + '"', function (err, row) {
            if (row) {
                let cbUser = row;
                chargebee.configure({
                    site: cbUser.sitename,
                    api_key: cbUser.apikey
                });
                return CustomerUtil.getCustomer(chargebee, req.body, res);
            }else {
                return common.getNoAuthCard(res);
            }
        });
    }else {
        return res.send("{}");
    }
});
app.post("/submit", function (req, res) {
    //console.log("Received submit: " + JSON.stringify(req.body)); 
    if (isSigned(req)) {
        db.get('SELECT * from Dreams where id= "' + req.body.admin.id + '"', function (err, row) {
            if (row) {
                let cbUser = row;
                chargebee.configure({
                    site: cbUser.sitename,
                    api_key: cbUser.apikey
                });
                return processRequest(chargebee,req, res);
            }else {
                return common.getNoAuthCard(res);
            }
        });
                
    } else {
        return res.send("{}");
    }

});


app.post("/msg/init", function (req, res) {
    if (isSigned(req)) {
        db.get('SELECT * from Dreams where id= "' + req.body.admin.id + '"', function (err, row) {
            if (row) {
                let cbUser = row;
                chargebee.configure({
                    site: cbUser.sitename,
                    api_key: cbUser.apikey
                });
                return hostedPage.getmessage(req.body, res);        
            }else {
                return common.getNoAuthCard(res);
            }
        });
                
    } else {
        return res.send("{}");
    }    
});

app.post("/msg/submit", function (req, res) {
    //console.log("Received init: " + JSON.stringify(req.body));    
    if (isSigned(req)) {
        let card = {
            canvas: {
                content: {
                    components: [{
                        type: "text",
                        text: " Bi from Chargebee ",

                    }]
                },
                stored_data: {} //optional
            }
        };
        return res.json(card);
        //return util.getInitialCanvas(db, req.body, res);
    }
});

app.post("/msg/config", function (req, res) {
    console.log("Received config: " + JSON.stringify(req.body));    
    if (isSigned(req)) {
        let card = {
            canvas: {
                content: {
                    components: [{
                        type: "text",
                        text: " config from Chargebee ",

                    }]
                },
                stored_data: {} //optional
            }
        };
        return res.json(card);
        //return util.getInitialCanvas(db, req.body, res);
    }
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
    console.log('Your app is listening on port ' + listener.address().port);
});

const isSigned = (req) => {

    let sharedSecret = process.env.CLIENT_SECRET;
    let query = JSON.stringify(req.body);
    let signature = crypto.createHmac("sha256", sharedSecret).update(query).digest("hex");
    let signature2 = req.get('X-Body-Signature');
    return (signature === signature2);

};

const getLogin = (code, state) => {
    let ft = fs.readFileSync(__dirname + '/views/login.html', 'utf8');
    let ft1 = ft.replace('{{code}}', code);
    let ft2 = ft1.replace('{{state}}', state);
    return ft2;
}




const processRequest = (chargebee,req, res) => {

    let action = req.body['component_id'];
    let id;

    if (action === undefined) {
        return common.getErrorCard(res);
    }

    if(action.startsWith('c-list-')) {
        id = action.substring(7);
        action = 'c-list-'
    }else  if (action.startsWith('REMOVE_ADDDON-')) {
        id = action.substring(14);
        action = 'REMOVE_ADDDON-';
    }else if (action.startsWith('CHANGE-RECURRING-ADDON-')) {
        id = action.substring(23);
        action = 'CHANGE-RECURRING-ADDON-';
    }else if (action.startsWith('REMOVE-RECURRING-ADDON-')) {
        id = action.substring(23);
        action = 'REMOVE-RECURRING-ADDON-';
    } else if (action.startsWith('REMOVE_NRADDDON-')) {
        id = action.substring(16);
        action = 'REMOVE_NRADDDON-';
    }else if (action.startsWith('CHANGE-NON-RECURRING-ADDON-')) {
        id = action.substring(27);
        action = 'CHANGE-NON-RECURRING-ADDON-';
    }else if (action.startsWith('REMOVE-NON-RECURRING-ADDON-')) {
        id = action.substring(27);
        action = 'REMOVE-NON-RECURRING-ADDON-';
    }else if (action.startsWith('EXTRA-')) {
        id = action.substring(6);
        action = 'EXTRA-';
      
    }else if (action.startsWith('EXTRAUI-')) {
        id = action.substring(8);
        action = 'EXTRAUI-';
      
    }

    switch(action) {
        case 'REFRESH'  : 
            return CustomerUtil.refresh(chargebee, req.body, res);
        case 'SEARCH'   : 
            return CustomerUtil.search(chargebee, req.body, res);
        case 'COLLECT-NOW':
            return CollectNow.process(chargebee, req.body, res);
        case 'c-list-' :
            return CustomerUtil.getCustomer(chargebee, req.body, res, id); 
        case 'MORE-SUBSCRIPTION' :
            return Subscriptions.process(chargebee, req.body, res);
        case 'GET-SUBSCRIPTION' :
            return CustomerUtil.refresh(chargebee, req.body, res);
        case 'GET-INVOICE' :
            return Invoices.process(chargebee, req.body, res);
        case 'CREATE-NEW-SUBSCRIPTION' :
            //return CreateSubscription.process(chargebee, req.body, res);
            return SubscriptionUtil.createUI(chargebee, req.body, res);
        case 'INIT-PAGE' :
            return CustomerUtil.getCustomer(chargebee, req.body, res);
        case 'EXTRA-' :              
            return ExtraUtil.extraUI(chargebee, req.body, res,id);
        case 'EXTRAUI-' :              
            return ExtraUIUtil.process(chargebee, req.body, res,id);
        case 'SEND-HOSTED-PAGE' :
            return hostedPage.process(chargebee, req.body, res);
        case 'REQUEST-PAYMENT-METHOD' :
            return Payment.update(chargebee, req.body, res);
        case 'UPDATE-PAYMENT-METHOD' :
            return Payment.update(chargebee, req.body, res);
        default :
            return common.getErrorCard(res,"Submit error");

    }


}