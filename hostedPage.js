const common = require('./common');
const chargebee = require("chargebee");
const getCard = (data) => {
    let card = {
        canvas: {
            content: {
                components: [
                    {
                        type: "text",
                        text: "  CREATE NEW SUBSCRIPTION",
                        align: "left",
                        style: "header"
                    },
                    {
                        type: "spacer",
                        size: "s"
                    },
                    {
                        type: "divider"
                    },
                    {
                        type: "spacer",
                        size: "m"
                    },
                    {
                        type: "text",
                        text: "Checkout link created successfully and an email is sent to " + data.email,
                        align: "left",
                        style: "muted"
                    },
                  {
                        type: "spacer",
                        size: "m"
                    },
                    {
                        type: "text",
                        text: "CHECKOUT URL",
                        align: "left",
                        style: "header"
                    },
                    {
                        type: "text",
                        text: "["+data.url+"]("+data.url+")",
                        align: "left"
                    },{
                        type: "spacer",
                        size: "m"
                    },
                  
                  

                ]
            },
            stored_data : {         
            }
        },
      
      card_creation_options: {
                  email: data.email,
                  url : data.url
     
              }
    };
    if(data.customerId !== undefined ) {
        card.canvas.stored_data.customerId = data.customerId;        
    }
    card.canvas.content.components.push({
        type: "button",
        id: "GET-SUBSCRIPTION",
        label: "<- Go Back",
        action: {
            type: "submit"
        },
        style:"link"
    });
    
  return card;
}

const getErrorCard = (data) => {
    let card = {
        canvas: {
            content: {
                components: [
                    {
                        type: "text",
                        text: "  CREATE NEW SUBSCRIPTION",
                        align: "left",
                        style: "header"
                    },
                    {
                        type: "spacer",
                        size: "s"
                    },
                    {
                        type: "divider"
                    },
                    {
                        type: "spacer",
                        size: "m"
                    },
                    {
                        type: "text",
                        text: data.error,
                        align: "left",
                        style: "error"
                    },
                  {
                        type: "spacer",
                        size: "m"
                    }
                ]
            },
            stored_data : {     
                nrAddons :data.nrAddons,
                addons :data.addons,
                oldInputs: data.oldInputs
            }
        }
    };
    if(data.customerId !== undefined ) {
        card.canvas.stored_data.customerId = data.customerId;        
    }
    card.canvas.content.components.push({
        type: "button",
        id: "ADD-RECURRING-ADDON-CANCEL",
        label: "<- Go Back",
        action: {
            type: "submit"
        },
        style:"link"
    });
    return card;
    
}
module.exports = {
    process: (db, intercom, res) => {

      let customerId = intercom.current_canvas.stored_data.customerId;
        db.get('SELECT * from Dreams where id= "' + intercom.admin.id + '"', function (err, row) {
            if (row) {

                let email = intercom.customer.email;
                //email = 'shamim@keyvalue.systems'
                if (email === undefined || email === "") {
                    return common.getNoEmailCard(res);
                }
                var data = {
                    email: email,
                    customerId : customerId
                };

                var inputData = {
                    subscription : {
                        plan_id : intercom.input_values.CUSTOMER_PLAN_ID,
                    },
                    customer : {
                        email : email,
                    }

                };
                if(parseInt( intercom.input_values.CUSTOMER_PLAN_QTY) > 0 ) {
                    inputData.subscription.plan_quantity = parseInt( intercom.input_values.CUSTOMER_PLAN_QTY);
                }
                if( intercom.input_values.CUSTOMER_COUPON_ID !== undefined ) {
                    inputData.subscription.coupon = intercom.input_values.CUSTOMER_COUPON_ID;
                }
                if(customerId !== undefined) {
                    inputData.customer.id = customerId;
                }

                if( intercom.current_canvas.stored_data.addons !== undefined) {
                    var addons = [];
                    for(var i=0;i<intercom.current_canvas.stored_data.addons.length;i++){
                        addons.push({
                            id : intercom.current_canvas.stored_data.addons[i].id,   
                            quantity : intercom.current_canvas.stored_data.addons[i].quantity, 
                        });
                    }
                    inputData.addons = addons;
                }

                if( intercom.current_canvas.stored_data.nrAddons !== undefined) {
                    var addons = [];
                    for(var i=0;i<intercom.current_canvas.stored_data.nrAddons.length;i++){
                        addons.push({
                            id : intercom.current_canvas.stored_data.nrAddons[i].id,   
                            charge_on:'immediately'
                        });
                    }
                    inputData.event_based_addons = addons;
                }
                
                let cbUser = row;
                chargebee.configure({
                    site: cbUser.sitename,
                    api_key: cbUser.apikey
                });
              

                chargebee.hosted_page.checkout_new(inputData).request(function(hostedPageError,hostedPageResult) {
                    if(hostedPageError){
                        data.error = hostedPageError.message;
                        data.nrAddons = intercom.current_canvas.stored_data.nrAddons;
                        data.addons = intercom.current_canvas.stored_data.addons;
                        data.oldInputs =  intercom.input_values;
                        return res.json(getErrorCard(data));
                    }else{
                     
                      var hosted_page = hostedPageResult.hosted_page;
                      data.url = hosted_page.url;
                      return res.json(getCard(data));
                    }
                  }); 


                
               
            } else {
                return common.getNoAuthCard(res);
            }
        });

    },
   getmessage:(db, intercom, res) => {
      db.get('SELECT * from Dreams where id= "' + intercom.admin.id + '"', function (err, row) {
            if (row) {
               var data  = intercom.card_creation_options;
               if(data.email === undefined || data.url === undefined) {
                 let card = {
                  canvas: {
                      content: {
                          components: [
                              {
                                  type: "text",
                                  text: "Email and/or url not avaialable",
                                  align: "left",
                                  style: "error"
                              },
                            {
                                  type: "spacer",
                                  size: "m"
                              },
                                     

                          ]
                      }
                  }
            };
              return res.json(card);
                 
               }else {
                  let card = {
                  canvas: {
                      content: {
                          components: [
                              {
                                  type: "text",
                                  text: "Checkout link created successfully and an email is sent to " + data.email,
                                  align: "left",
                                  style: "muted"
                              },
                            {
                                  type: "spacer",
                                  size: "m"
                              },
                              {
                                  type: "text",
                                  text: "CHECKOUT URL",
                                  align: "left",
                                  style: "header"
                              },
                              {
                                  type: "text",
                                  text: "["+data.url+"]("+data.url+")",
                                  align: "left"
                              },{
                                  type: "spacer",
                                  size: "m"
                              },                  

                          ]
                      }
                  }
            };
              return res.json(card);
               }
              
                
            }else {
              return common.getNoAuthCard(res);
            }
      }
      );
   }
}