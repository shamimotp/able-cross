const common = require('./common');
const chargebee = require("chargebee");
const SubscriptionUtil = require('./SubscriptionUtil');
const validator = require('validator');
const getCard = (data) => {
    let card = {
        canvas: {
            content: {
                components: [{
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
                        text: "Checkout link created successfully and has been added to the conversation.",
                        align: "left",
                        style: "muted"
                    },
                    {
                        type: "spacer",
                        size: "m"
                    },
                    {
                        type: "text",
                        text: "[" + data.url + "](" + data.url + ")",
                        align: "left"
                    }, {
                        type: "spacer",
                        size: "m"
                    },



                ]
            },
            stored_data: {}
        },

        card_creation_options: {
            email: data.email,
            url: data.url,
            type: 'CHECK-OUT'

        }
    };
    if (data.customerId !== undefined) {
        card.canvas.stored_data.customerId = data.customerId;
    }
    card.canvas.content.components.push({
        type: "button",
        id: "GET-SUBSCRIPTION",
        label: "<- Go Back",
        action: {
            type: "submit"
        },
        style: "link"
    });

    return card;
}

const getErrorCard = (data) => {
    let card = {
        canvas: {
            content: {
                components: [{
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
            stored_data: {
                nrAddons: data.nrAddons,
                addons: data.addons,
                oldInputs: data.oldInputs
            }
        }
    };
    if (data.customerId !== undefined) {
        card.canvas.stored_data.customerId = data.customerId;
    }
    card.canvas.content.components.push({
        type: "button",
        id: "ADD-RECURRING-ADDON-CANCEL",
        label: "<- Go Back",
        action: {
            type: "submit"
        },
        style: "link"
    });
    return card;

}

const updatePayment = (data, res) => {
    let card = {
        canvas: {
            content: {
                components: [{
                        type: "text",
                        text: "Please click this link to update your payment method.",
                        align: "left",
                        style: "muted"
                    },
                    {
                        type: "spacer",
                        size: "m"
                    },                    
                    {
                        type: "button",
                        id: "updatePayment",
                        label: "Update Payment Method",
                        action: {
                            type: "url",
                            url: data.url
                        }
                    }

                ]
            }
        }
    };
    return res.json(card);

}
const addPayment = (data, res) => {
    let card = {
        canvas: {
            content: {
                components: [{
                        type: "text",
                        text: "Please click this link to add a payment method to your profile.",
                        align: "left",
                        style: "muted"
                    },
                    {
                        type: "spacer",
                        size: "m"
                    },                    
                    {
                        type: "button",
                        id: "addPayment",
                        label: "Add Payment Method ",
                        action: {
                            type: "url",
                            url: data.url
                        }
                    }

                ]
            }
        }
    };
    return res.json(card);

}

const collectNow = (data, res) => {
    let card = {
        canvas: {
            content: {
                components: [{
                        type: "text",
                        text: "Please click this link to view the list of invoices that are due and make payment.",
                        align: "left",
                        style: "muted"
                    },
                    {
                        type: "spacer",
                        size: "m"
                    },
                     {
                        type: "button",
                        id: "collectNow",
                        label: "View Pending Invoices",
                        action: {
                            type: "url",
                            url: data.url
                        }
                    }

                ]
            }
        }
    };
    return res.json(card);

}

const checkOut = (data, res) => {
    let card = {
        canvas: {
            content: {
                components: [{
                        type: "text",
                        text: "Please click this link to purchase the subscription.",
                        align: "left",
                        style: "muted"
                    },
                    {
                        type: "spacer",
                        size: "m"
                    },
                    {
                        type: "text",
                        text: "[" + data.url + "](" + data.url + ")",
                        align: "left"
                    }, {
                        type: "spacer",
                        size: "m"
                    }, {
                        type: "button",
                        id: "checkOut",
                        label: "Checkout Subscription",

                        action: {
                            type: "url",
                            url: data.url
                        }
                    }


                ]
            }
        }
    };
    return res.json(card);

}

module.exports = {
    process: (chargebee, intercom, res) => {
        let savedData = {};
        if (intercom.current_canvas.stored_data.addons !== undefined) {
            savedData.addons = intercom.current_canvas.stored_data.addons;
        }
        if (intercom.current_canvas.stored_data.eventAddons !== undefined) {
            savedData.eventAddons = intercom.current_canvas.stored_data.eventAddons;
        }
        if (intercom.current_canvas.stored_data.coupons !== undefined) {
            savedData.coupons = intercom.current_canvas.stored_data.coupons;
        }
        if (intercom.input_values !== undefined) {
            savedData.oldInputs = intercom.input_values;
        }

        let customerId = common.getCustomerId(intercom);

        let email = intercom.customer.email;
        //email = 'shamim@keyvalue.systems'
        if (email === undefined) {
            email = '';
        }
        var data = {
            email: email,
            customerId: customerId
        };

        let planId = intercom.input_values.CUSTOMER_PLAN_ID;
        if(planId === undefined || planId==='NOPLAN' ) {
            savedData.planError = {
                error_msg:'Please select a valid plan.'
            }
            return SubscriptionUtil.createUI(chargebee, intercom, res, savedData);
        }

        var inputData = {
            subscription: {
                plan_id: intercom.input_values.CUSTOMER_PLAN_ID,
            },
            customer: {
                email: intercom.input_values.CUSTOMER_EMAIL_ID,
            }

        };
        let planQuantity = intercom.input_values.CUSTOMER_PLAN_QTY.trim();
        if(validator.isEmpty(planQuantity)) {
            planQuantity = 1;
        }else {
            planQuantity = parseInt(planQuantity);            
            if(planQuantity >=0){
                if(planQuantity == 0){
                    planQuantity = 1;
                }
            }else {
                savedData.qtyError = {
                    error_msg:'Please provide a valid quantity for the Plan.'
                }
                return SubscriptionUtil.createUI(chargebee, intercom, res, savedData);
            }
        }
      inputData.subscription.plan_quantity = planQuantity;       

        if (customerId !== undefined) {
            inputData.customer.id = customerId;
        }

        if (intercom.current_canvas.stored_data.addons !== undefined) {
            var addons = [];
            for (var i = 0; i < intercom.current_canvas.stored_data.addons.length; i++) {
                addons.push({
                    id: intercom.current_canvas.stored_data.addons[i].id,
                    quantity: intercom.current_canvas.stored_data.addons[i].quantity,
                });
            }
            inputData.addons = addons;
        }

        if (intercom.current_canvas.stored_data.eventAddons !== undefined) {
            var addons = [];
            for (var i = 0; i < intercom.current_canvas.stored_data.eventAddons.length; i++) {
                addons.push({
                    id: intercom.current_canvas.stored_data.eventAddons[i].id,
                    charge_on: 'immediately'
                });
            }
            inputData.event_based_addons = addons;
        }
        if (intercom.current_canvas.stored_data.coupons !== undefined) {
            if (intercom.current_canvas.stored_data.coupons.length > 0) {
                inputData.subscription.coupon = intercom.current_canvas.stored_data.coupons[0].id;
            }

        }



        chargebee.hosted_page.checkout_new(inputData).request(function (hostedPageError, hostedPageResult) {
            if (hostedPageError) {

                savedData.qtyError = hostedPageError;
                return SubscriptionUtil.createUI(chargebee, intercom, res, savedData);
            } else {

                var hosted_page = hostedPageResult.hosted_page;
                data.url = hosted_page.url;
                return res.json(getCard(data));
            }
        });

    },
    getmessage: (intercom, res) => {
        var data = intercom.card_creation_options;
        if (data.url === undefined) {
            let card = {
                canvas: {
                    content: {
                        components: [{
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

        } else {
            switch (data.type) {
                case 'UPDATE-PAYMENT':
                    return updatePayment(data, res);
                case 'ADD-PAYMENT':
                    return addPayment(data, res);
                case 'CHECK-OUT':
                    return checkOut(data, res);
                case 'COLLECT-NOW':
                    return collectNow(data, res);
            }
        }
    }
}