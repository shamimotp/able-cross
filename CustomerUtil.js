const common = require('./common');
const chargebee = require("chargebee");
const CustomerList = require("./CustomerList");
const Customer = require("./Customer");

module.exports = {
    process: (db, intercom, res) => {
        db.get('SELECT * from Dreams where id= "' + intercom.admin.id + '"', function (err, row) {
            if (row) {
                let email = intercom.customer.email;
              //email = 'ajai@keyvakllu.com';
              
                if (email === undefined || email === "") {
                    return common.getNoEmailCard(res);
                }

                let cbUser = row;
                chargebee.configure({
                    site: cbUser.sitename,
                    api_key: cbUser.apikey
                });
                chargebee.customer.list({
                    "email[is]": email
                }).request(function (error, result) {
                  
                    if (result.list.length === 0) {
                        return common.getNoCustomerCard(res, email);
                    }
                    if (result.list.length == 1) {
                        var entry = result.list[0]
                        var customerId = entry.customer.id;                   
                        return Customer.process(chargebee, res, customerId);
                    }
                  
                    if (result.list.length > 1) {
                      return CustomerList.process(result.list, email,res);
                    }
                    
                    
                });

            } else {
                return common.getNoAuthCard(res);
            }
        });

    },
    
  getCustomer:(db, intercom, res,cId)=> {
      db.get('SELECT * from Dreams where id= "' + intercom.admin.id + '"', function (err, row) {
            if (row) {
              let cbUser = row;
                  chargebee.configure({
                  site: cbUser.sitename,
                  api_key: cbUser.apikey});
              let customerId = cId;
              if(customerId === undefined) {
                 customerId = intercom.current_canvas.stored_data.customerId;
              }
              
              return Customer.process(chargebee, res, customerId);
            }else {
              return common.getNoAuthCard(res);
            }
      });
  }

}