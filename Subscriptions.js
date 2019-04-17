const moment = require('moment');
const chargebee = require("chargebee");
const common = require('./common');

const getCard = (data) => {
    let card = {
        canvas: {
            content: {
                components: [{
                        type: "list",
                        items: [{
                            type: "item",
                            id: data.customerId,
                            title: data.customerName,
                            subtitle: data.customerEmail,
                            tertiary_text: data.customerCompany
                        }]
                    },
                    {
                        type: "spacer",
                        size: "s"
                    },
                    {
                        type: "text",
                        text: "SUBSCRIPTIONS",
                        align: "left",
                        style: "header"
                    }
                ]
            },
          stored_data: {
              customerId : data.customerId
            } 
        }
    };
    for (var i = 0; i < data.subscriptions.length; i++) {
        card.canvas.content.components.push({
            type: "text",
            text: "Plan: " + data.subscriptions[i].plan,
            align: "left",
            style: "header"
        });
        card.canvas.content.components.push({
            type: "image",
            url: data.subscriptions[i].imageURl,
            align: "left",
            width: 63,
            height: 21
        });

        card.canvas.content.components.push({
            type: "data-table",
            items: [{
                    type: "field-value",
                    field: "Subscrption id:",
                    value: data.subscriptions[i].subscriptionId
                },
                {
                    type: "field-value",
                    field: "Subscrption value:",
                    value: data.subscriptions[i].subscriptionValue
                }, {
                    type: "field-value",
                    field: "Started on:",
                    value: data.subscriptions[i].startedOn
                },
                {
                    type: "field-value",
                    field: "Billling period:",
                    value: data.subscriptions[i].billingPeriod
                }
            ]
        });
        
        if(data.subscriptions[i].hasAddon) {
            card.canvas.content.components.push(
                {
                    type: "spacer",
                    size: "xs"
                }
            );
            card.canvas.content.components.push(
                {
                    type: "text",
                    text: "Recurring Addons",
                    align: "left",
                    style: "header"
                }
            );
            card.canvas.content.components.push(
                {
                    type: "data-table",
                    items: [{
                        type: "field-value",
                        field: data.subscriptions[i].addonName +":",
                        value: data.subscriptions[i].addonValue
                    }]
                }
            );
        }
      card.canvas.content.components.push(
                {
  type: "divider"
}
            );
    }
    card.canvas.content.components.push(
        {
            type: "button",
            id: "GET-SUBSCRIPTION",
            label: "<- Go Back",
            style:"link",

            action: {
                type: "submit"
            }
        }
    );
    return card;
}


module.exports = {
    process: (db, intercom, res) => {
        let customerId = intercom.current_canvas.stored_data.customerId;
        db.get('SELECT * from Dreams where id= "' + intercom.admin.id + '"', function (err, row) {
            if (row) {
                let cbUser = row;
                chargebee.configure({
                    site: cbUser.sitename,
                    api_key: cbUser.apikey
                });
                chargebee.customer.retrieve(customerId).request(function (error, result) {
                    if (error) {
                        console.log(error);
                    } else {
                        var customer = result.customer;
                        let data = {
                            customerId: customer.id,
                            customerName: customer.first_name + " " + customer.last_name,
                            customerEmail: customer.email,
                            customerCompany: customer.company,
                            subscriptions: []
                        };
                        chargebee.subscription.list({
                            limit: 100,
                            "customer_id[is]": customerId
                        }).request(function (subscriptionError, subscriptionResult) {
                            for (var i = 0; i < subscriptionResult.list.length; i++) {
                                var subscription = subscriptionResult.list[i].subscription;

                                var sdata = {
                                    plan: '',
                                    planId: subscription.plan_id,
                                    imageURl: "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Factive.png?1554737072188",

                                }

                                if (subscription.status === 'cancelled') {
                                    sdata.imageURl = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fcancelled.png?1554817238700";
                                }
                                if (subscription.status === 'future') {
                                    sdata.imageURl = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Ffuture.png?1554817240361";
                                }
                                if (subscription.status === 'in_trial') {
                                    sdata.imageURl = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fintrail.png?1554817242486";
                                }
                                if (subscription.status === 'non_renewing') {
                                    sdata.imageURl = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fnonrenewing.png?1554817244248";
                                }
                                if (subscription.status === 'paused') {
                                    sdata.imageURl = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fpaused.png?1554817245989";
                                }

                                sdata.subscriptionId = subscription.id;
                                sdata.subscriptionValue = subscription.currency_code + ' ';
                                sdata.startedOn = moment.unix(subscription.started_at).utc().format('ll');
                                sdata.billingPeriod = subscription.billing_period + ' ' + subscription.billing_period_unit;
                                sdata.hasAddon = false;
                                sdata.addonId = '';
                                sdata.addonName = '';
                                sdata.addonValue = '';
                                sdata.currencyCode = subscription.currency_code;

                                if (subscription['addons'] != undefined) {
                                    sdata.hasAddon = true;
                                    sdata.addonId = subscription['addons'][0]['id'];
                                    sdata.addonValue = subscription.currency_code + ' ';
                                    if (parseInt(subscription['addons'][0]['amount']) > 0) {
                                        sdata.addonValue = sdata.addonValue + parseFloat(parseInt(subscription['addons'][0]['amount'], 10) / 100).toFixed(2);
                                    }
                                }
                                sdata.plan = sdata.planId;
                                sdata.addonName = sdata.addonId;
                                data.subscriptions.push(sdata);

                            }
                            return res.json(getCard(data));
                        });
                    }
                });

            } else {
                return common.getNoAuthCard(res);
            }
        });
        //End
    }
}