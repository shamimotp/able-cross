const moment = require('moment');
const common = require('./common');

const getCustomer = (customer, res,intercom) => {
    let ocard = {
        canvas: {
            content: {
                components: [
                    common.getCustomerList(customer),
                    {
                        type: "spacer",
                        size: "xl"
                    },
                    {
                        type: "button",
                        id: "CREATE-NEW-SUBSCRIPTION",
                        label: "CREATE NEW SUBSCRIPTION",

                        action: {
                            type: "submit"
                        }
                    }
                ]
            },
            stored_data: {
              customerId :customer.id
               
            } //optional
        }
    };
  
    
  if(intercom !== undefined){
      let fromList = intercom.current_canvas.stored_data.fromList;
      if(fromList!== undefined ) {
          if(fromList === 'email'){
            ocard.canvas.content.components.push({
                type: "button",
                id: "INIT-PAGE",
                label: "<- Go Back",
                action: {
                    type: "submit"
                },
                style:"link"
            });

            
          }else if(fromList === 'search') {
            let cSavedSearch = intercom.current_canvas.stored_data.cSavedSearch;
             ocard.canvas.content.components.push({
                type: "button",
                id: "SEARCH",
                label: "<- Go Back",
                action: {
                    type: "submit"
                },
                style:"link"
            });
            ocard.canvas.stored_data.cSavedSearch2 = cSavedSearch;

            
          }
      }
  }


    return res.json(ocard);
}

const getCard = (data, intercom) => {
    let card = {
        canvas: {
            content: {
                components: [
                    common.getCustomerList(data.customer),
                    {
                        type: "spacer",
                        size: "s"
                    },
                    {
                        type: "text",
                        text: "CUSTOMER PROFILE",
                        align: "left",
                        style: "header"
                    },
                ]
            },
            stored_data: {
                customerId: data.customer.id
            }
        }
    };


    let profile = {
        type: "data-table",
        items: [{
            type: "field-value",
            field: "Customer since:",
            value: data.createdAt
        }]
    };
    if (data.promotionalCredits > 0) {
        profile.items.push({
            type: "field-value",
            field: "Promotional credits:",
            value: data.promotionalCredits
        });
    }
    if (data.unbilledCharges > 0) {
        profile.items.push({
            type: "field-value",
            field: "Unbilled charges:",
            value: data.unbilledCharges
        });
    }
    if (data.refundableCredits > 0) {
        profile.items.push({
            type: "field-value",
            field: "Refundable credits:",
            value: data.refundableCredits
        });
    }

    if (data.card !== '') {
        profile.items.push({
            type: "field-value",
            field: "Payament Card:",
            value: data.card
        });
    }

    card.canvas.content.components.push(profile);
    card.canvas.content.components.push({
        type: "divider"
    });
    card.canvas.content.components.push({
        type: "single-select",
        id: "GET-INVOICE",
        value: "Invoices",
        save_state: "unsaved",
        options: [{
                type: "option",
                id: "Subscriptions",
                text: "Subscriptions (" + data.subscriptionCount + ")",
                disabled: true
            },
            {
                type: "option",
                id: "Invoices",
                text: "Invoices (" + data.invoiceCount + ")",
            }
        ],
        action: {
            type: "submit"
        },
    });
    card.canvas.content.components.push({
        type: "text",
        text: "SUBSCRIPTIONS",
        align: "left",
        style: "header"
    });
    card.canvas.content.components.push({
        type: "text",
        text: "Plan: " + data.plan,
        align: "left",
        style: "header"
    });
    card.canvas.content.components.push({
        type: "image",
        url: data.imageURl,
        align: "left",
        width: 63,
        height: 21
    });
    card.canvas.content.components.push({
        type: "data-table",
        items: [{
                type: "field-value",
                field: "Subscrption id:",
                value: data.subscriptionId
            },
            {
                type: "field-value",
                field: "Subscrption value:",
                value: data.subscriptionValue
            }, {
                type: "field-value",
                field: "Started on:",
                value: data.startedOn
            },
            {
                type: "field-value",
                field: "Billling period:",
                value: data.billingPeriod
            }
        ]
    }); 
    //--------------------

    if (data.hasAddon) {
        card.canvas.content.components.push({
            type: "spacer",
            size: "xs"
        });
        card.canvas.content.components.push({
            type: "text",
            text: "Recurring Addons",
            align: "left",
            style: "header"
        });
        card.canvas.content.components.push({
            type: "data-table",
            items: [{
                type: "field-value",
                field: data.addonName + ":",
                value: data.addonValue
            }]
        });
    }
    if ((data.subscriptionCount - 1) > 0) {
        card.canvas.content.components.push({
            type: "button",
            id: "MORE-SUBSCRIPTION",
            label: "+" + (data.subscriptionCount - 1) + " more subscriptions",
            style: "link",

            action: {
                type: "submit"
            }
        });
    }

    card.canvas.content.components.push({
        type: "divider"
    });
    card.canvas.content.components.push({
        type: "spacer",
        size: "xs"
    });
    card.canvas.content.components.push({
        type: "button",
        id: "CREATE-NEW-SUBSCRIPTION",
        label: "CREATE NEW SUBSCRIPTION",

        action: {
            type: "submit"
        }
    });
    if (data.hasCard) {
        card.canvas.content.components.push({
            type: "button",
            id: "UPDATE-PAYMENT-METHOD",
            label: "UPDATE PAYMENT METHOD",

            action: {
                type: "submit"
            }
        });

    } else {
        card.canvas.content.components.push({
            type: "button",
            id: "REQUEST-PAYMENT-METHOD",
            label: "REQUEST PAYMENT METHOD",

            action: {
                type: "submit"
            }
        });
    }
    card.canvas.content.components.push({
        type: "button",
        id: "COLLECT-NOW",
        label: "COLLECT NOW",

        action: {
            type: "submit"
        }
    });
    card.canvas.content.components.push({
        type: "button",
        id: "REFRESH",
        label: "REFRESH",

        action: {
            type: "submit"
        }
    });



    if (intercom !== undefined) {
        let fromList;
        if (intercom.current_canvas !== undefined && intercom.current_canvas.stored_data !== undefined) {
            fromList = intercom.current_canvas.stored_data.fromList;
        }
        if (fromList !== undefined) {
            if (fromList === 'email') {
                card.canvas.content.components.push({
                    type: "button",
                    id: "INIT-PAGE",
                    label: "<- Go Back",
                    action: {
                        type: "submit"
                    },
                    style: "link"
                });


            } else if (fromList === 'search') {
                let cSavedSearch = intercom.current_canvas.stored_data.cSavedSearch;
                card.canvas.content.components.push({
                    type: "button",
                    id: "SEARCH",
                    label: "<- Go Back",
                    action: {
                        type: "submit"
                    },
                    style: "link"
                });
                card.canvas.stored_data.cSavedSearch2 = cSavedSearch;


            }
        }
    }
    return card;
}
const getCustomerWithSubScription = (chargebee, res, list, customer,intercom) => {
    let data = {
        customer: {
            id: customer.id,
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: customer.email,
            company: customer.company,
        },
        createdAt: moment.unix(customer.created_at).utc().format('ll'),
        promotionalCredits: customer.promotional_credits,
        unbilledCharges: customer.unbilled_charges,
        refundableCredits: customer.refundable_credits,
        card: '',
        hasCard: false,
        subscriptionCount: list.length,
        invoiceCount: 0,
        plan: '',
        planId: list[0].subscription.plan_id,
        imageURl: "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Factive.png?1554737072188",
        subscriptionId: list[0].subscription.id,
        subscriptionValue: list[0].subscription.currency_code + ' ',
        startedOn: moment.unix(list[0].subscription.started_at).utc().format('ll'),
        billingPeriod: list[0].subscription.billing_period + ' ' + list[0].subscription.billing_period_unit,
        hasAddon: false,
        addonId: '',
        addonName: '',
        addonValue: '',
        currencyCode: list[0].subscription.currency_code
    };

    if (list[0].subscription.status === 'cancelled') {
        data.imageURl = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fcancelled.png?1554817238700";
    }
    if (list[0].subscription.status === 'future') {
        data.imageURl = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Ffuture.png?1554817240361";
    }
    if (list[0].subscription.status === 'in_trial') {
        data.imageURl = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fintrail.png?1554817242486";
    }
    if (list[0].subscription.status === 'non_renewing') {
        data.imageURl = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fnonrenewing.png?1554817244248";
    }
    if (list[0].subscription.status === 'paused') {
        data.imageURl = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fpaused.png?1554817245989";
    }



    if (list[0].card !== undefined) {
        data.card = list[0].card.card_type + " ending " + list[0].card.last4;
        data.hasCard = true;
    }
    if (parseInt(list[0].subscription.plan_amount) > 0) {
        data.subscriptionValue = data.subscriptionValue + parseFloat(parseInt(list[0].subscription.plan_amount, 10) / 100).toFixed(2);
    }
    if (parseInt(data.promotionalCredits) > 0) {
        data.promotionalCredits = data.currencyCode + ' ' + parseFloat(parseInt(data.promotionalCredits, 10) / 100).toFixed(2);
    }
    if (parseInt(data.unbilledCharges) > 0) {
        data.unbilledCharges = data.currencyCode + ' ' + parseFloat(parseInt(data.unbilledCharges, 10) / 100).toFixed(2);
    }
    if (parseInt(data.refundableCredits) > 0) {
        data.refundableCredits = data.currencyCode + ' ' + parseFloat(parseInt(data.refundableCredits, 10) / 100).toFixed(2);
    }

    if (list[0].subscription['addons'] != undefined) {
        data.hasAddon = true;
        data.addonId = list[0].subscription['addons'][0]['id'];
        data.addonValue = list[0].subscription.currency_code + ' ';
        if (parseInt(list[0].subscription['addons'][0]['amount']) > 0) {
            data.addonValue = data.addonValue + parseFloat(parseInt(list[0].subscription['addons'][0]['amount'], 10) / 100).toFixed(2);
        }
    }
    chargebee.invoice.list({
        limit: 100,
        "customer_id[is]": customer.id
    }).request(function (invoiceError, invoiceResult) {
        if (invoiceError) {
            console.log(invoiceError);
        } else {
            data.invoiceCount = invoiceResult.list.length;
            chargebee.plan.retrieve(data.planId).request(function (planerror, planresult) {
                if (planerror) {
                    console.log(planerror);
                } else {
                    data.plan = planresult.plan.name;
                }
                if (data.hasAddon) {
                    chargebee.addon.retrieve(data.addonId).request(function (addonError, addonResult) {
                        if (addonError) {
                            console.log(addonError);
                        } else {
                            data.addonName = addonResult.addon.name;
                        }
                        return res.json(getCard(data,intercom));
                    });
                } else {
                    return res.json(getCard(data,intercom));
                }
            });
        }
    });

}
module.exports = {

    process: (chargebee, res, customerId) => {
        chargebee.customer.retrieve(customerId).request(function (error, result) {

            var customer = result.customer;
            chargebee.subscription.list({
                limit: 100,
                "customer_id[is]": customerId
            }).request(function (error, subResult) {
                if (subResult.list.length === 0) {
                    return getCustomer(customer, res);
                } else {

                    return getCustomerWithSubScription(chargebee, res, subResult.list, customer);
                }
            });
        });
    },
    get: (chargebee, res, customer,intercom) => {
        chargebee.subscription.list({
            limit: 100,
            "customer_id[is]": customer.id
        }).request(
            function (error, subResult) {
                if (subResult.list.length === 0) {
                    return getCustomer(customer, res,intercom);
                } else {

                    return getCustomerWithSubScription(chargebee, res, subResult.list, customer,intercom);
                }
            });

    },

}