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
const addonAdd = require('./addon');
const changeAddon = require('./changeAddon');
const nrAddonAdd = require('./nrAddon');
const nrChangeAddon = require('./nrChangeAddon');
const common = require('./common');
const hostedPage = require('./hostedPage');
const Payment = require('./Payment');
const CollectNow = require('./CollectNow');


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
        /*db.each('SELECT * from Dreams', function (err, row) {return Customer.process(chargebee, res, customerId);
            if (row) {
                console.log('record:', row);
            }
        });*/
    }
});
// http://expressjs.com/en/starter/basic-routing.html
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
        return CustomerUtil.getCustomer(db, req.body, res);
        //return util.getInitialCanvas(db, req.body, res);
    }
});
app.post("/submit", function (req, res) {
    //console.log("Received submit: " + JSON.stringify(req.body)); 
    if (isSigned(req)) {
        let action = req.body['component_id'];
        if (action === undefined) {
            return res.json(errorCard);
        }
        if(action === 'REFRESH'){
            return CustomerUtil.refresh(db, req.body, res);
           }else if (action === 'SEARCH') {
            return CustomerUtil.search(db, req.body, res);
        }else if (action === 'COLLECT-NOW') {
            return CollectNow.process(db, req.body, res);
        }
       else  if (action.startsWith('c-list-')) {
            let customerId = action.substring(7);
            //console.log("Received submit: " + JSON.stringify(req.body));
            return CustomerUtil.getCustomer(db, req.body, res, customerId);

        } else if (action === 'MORE-SUBSCRIPTION') {
            return Subscriptions.process(db, req.body, res);
        } else if (action == 'GET-SUBSCRIPTION') {
            return CustomerUtil.getCustomer(db, req.body, res);
        } else if (action == 'GET-INVOICE') {
            return Invoices.process(db, req.body, res);
        } else if (action == 'CREATE-NEW-SUBSCRIPTION') {
            return CreateSubscription.process(db, req.body, res);
        } else if (action == 'INIT-PAGE') {
            return CustomerUtil.getCustomer(db, req.body, res);
          
        } else if (action == 'ADD_RECURRING_ADDDON') {
            return addonAdd.process(db, req.body, res);
        } else if (action == 'ADD-RECURRING-ADDON-CREATE') {
            return addonAdd.newAddon(db, req.body, res);
        } else if (action == 'ADD-RECURRING-ADDON-CANCEL') {
            return addonAdd.goBack(db, req.body, res);
        } else if (action.startsWith('REMOVE_ADDDON-')) {
            let addonID = action.substring(14);
            return changeAddon.process(db, req.body, res, addonID);
        } else if (action.startsWith('CHANGE-RECURRING-ADDON-')) {
            let addonID = action.substring(23);
            return changeAddon.change(db, req.body, res, addonID);
        } else if (action.startsWith('REMOVE-RECURRING-ADDON-')) {
            let addonID = action.substring(23);
            return changeAddon.remove(db, req.body, res, addonID);
        } else if (action == 'ADD_NON_RECURRING_ADDDON') {
            return nrAddonAdd.process(db, req.body, res);
        } else if (action == 'ADD-NON-RECURRING-ADDON-CREATE') {
            return nrAddonAdd.newAddon(db, req.body, res);
        } else if (action.startsWith('REMOVE_NRADDDON-')) {
            let addonID = action.substring(16);
            return nrChangeAddon.process(db, req.body, res, addonID);
        } else if (action.startsWith('CHANGE-NON-RECURRING-ADDON-')) {
            let addonID = action.substring(27);
            return nrChangeAddon.change(db, req.body, res, addonID);
        } else if (action.startsWith('REMOVE-NON-RECURRING-ADDON-')) {
            let addonID = action.substring(27);
            return nrChangeAddon.remove(db, req.body, res, addonID);
        }else if (action == 'SEND-HOSTED-PAGE'){
            return hostedPage.process(db, req.body, res);
        }else if (action == 'REQUEST-PAYMENT-METHOD') {
            return Payment.update(db, req.body, res);
        }else if (action == 'UPDATE-PAYMENT-METHOD') {
          return Payment.update(db, req.body, res);
        }
        else {
            return res.json(errorCard);
        }
    } else {
        return res.send("{}");
    }

});

app.get('/all', function (req, res) {
    db.get('SELECT * from Dreams where id = "3067695"', function (err, row) {
        if (row) {
            console.log('record:', row);
        }
    });
    return res.send("{}");


});

app.post("/msg/init", function (req, res) {
    if (isSigned(req)) {
        return hostedPage.getmessage(db,req.body, res);
        //return util.getInitialCanvas(db, req.body, res);
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

const errorCard = {
    canvas: {
        content: {
            components: [{
                type: "text",
                text: "Chargebee Submit Error",
                style: "error"
            }]
        }
    }
};