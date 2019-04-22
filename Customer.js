const moment = require('moment');
const common = require('./common');

const getCustomer = (customer, res, intercom) => {
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
                customerId: customer.id

            } //optional
        }
    };


    if (intercom !== undefined) {
        let fromList = intercom.current_canvas.stored_data.fromList;
        if (fromList !== undefined) {
            if (fromList === 'email') {
                ocard.canvas.content.components.push({
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
                ocard.canvas.content.components.push({
                    type: "button",
                    id: "SEARCH",
                    label: "<- Go Back",
                    action: {
                        type: "submit"
                    },
                    style: "link"
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
            value: data.customer.createdAt
        }]
    };
    if (data.customer.promotional_credits > 0) {
        profile.items.push({
            type: "field-value",
            field: "Promotional credits:",
            value: data.customer.promotional_credits
        });
    }
    if (data.customer.unbilled_charges > 0) {
        profile.items.push({
            type: "field-value",
            field: "Unbilled charges:",
            value: data.customer.unbilled_charges
        });
    }
    if (data.customer.refundable_credits > 0) {
        profile.items.push({
            type: "field-value",
            field: "Refundable credits:",
            value: data.customer.refundable_credits
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
                text: "Subscriptions ",
                disabled: true
            },
            {
                type: "option",
                id: "Invoices",
                text: "Invoices ",
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
        text: "Plan: " + data.subscription.plan,
        align: "left",
        style: "header"
    });
    card.canvas.content.components.push({
        type: "image",
        url: data.subscription.imageURl,
        align: "left",
        width: 63,
        height: 21
    });
    card.canvas.content.components.push({
        type: "data-table",
        items: [{
                type: "field-value",
                field: "Subscrption id:",
                value: data.subscription.id
            },
            {
                type: "field-value",
                field: "Subscrption value:",
                value: data.subscription.value
            }, {
                type: "field-value",
                field: "Started on:",
                value: data.subscription.started_at
            },
            {
                type: "field-value",
                field: "Billling period:",
                value: data.subscription.billing_period
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
                field: data.subscription.addonName + ":",
                value: data.subscription.addonValue
            }]
        });
    }
    if (data.subscription.hasMore) {
        card.canvas.content.components.push({
            type: "button",
            id: "MORE-SUBSCRIPTION",
            label: " more subscriptions",
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
const updateCustomerData = (data, customer) => {
    data.customer = {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        company: customer.company,
        createdAt: moment.unix(customer.created_at).utc().format('ll'),
        promotional_credits: customer.promotional_credits,
        unbilled_charges: customer.unbilled_charges,
        refundable_credits: customer.refundable_credits,
    }

    return data;
}

const updateSubscriptionData = (data, list,hasMore) => {
    data.subscription = {
        id: list[0].subscription.id,
        plan: '',
        plan_id: list[0].subscription.plan_id,
        imageURl: common.getSubscrpitionIcon(),
        value: list[0].subscription.currency_code + ' ',
        started_at: moment.unix(list[0].subscription.started_at).utc().format('ll'),
        billing_period: list[0].subscription.billing_period + ' ' + list[0].subscription.billing_period_unit,
        currency_code: list[0].subscription.currency_code,
        hasMore : hasMore
    }
    if (list[0].card !== undefined) {
        data.card = list[0].card.card_type + " ending " + list[0].card.last4;
        data.hasCard = true;
    }
    if (parseInt(list[0].subscription.plan_amount) > 0) {
        data.subscription.value = data.subscription.value + parseFloat(parseInt(list[0].subscription.plan_amount, 10) / 100).toFixed(2);
    } else {
        data.subscription.value = data.subscription.value + ' 0.00';
    }
    if (parseInt(data.customer.promotional_credits) > 0) {
        data.customer.promotional_credits = data.subscription.currency_code + ' ' + parseFloat(parseInt(data.customer.promotional_credits, 10) / 100).toFixed(2);
    }
    if (parseInt(data.customer.unbilled_charges) > 0) {
        data.customer.unbilled_charges = data.subscription.currency_code + ' ' + parseFloat(parseInt(data.customer.unbilled_charges, 10) / 100).toFixed(2);
    }
    if (parseInt(data.customer.refundable_credits) > 0) {
        data.customer.refundable_credits = data.subscription.currencyCode + ' ' + parseFloat(parseInt(data.customer.refundable_credits, 10) / 100).toFixed(2);
    }

    if (list[0].subscription['addons'] != undefined) {
        data.hasAddon = true;
        data.subscription.addonId = list[0].subscription['addons'][0]['id'];
        data.subscription.addonValue = list[0].subscription.currency_code + ' ';
        if (parseInt(list[0].subscription['addons'][0]['amount']) > 0) {
            data.subscription.addonValue = data.subscription.addonValue + parseFloat(parseInt(list[0].subscription['addons'][0]['amount'], 10) / 100).toFixed(2);
        }
    }

    return data;
}
const getRequestList = (chargebee,customer) => {
    return {
        ac: chargebee.subscription.list({
            limit: 1,
            "customer_id[is]": customer.id,
            "status[is]": "active",
            "sort_by[desc]": "updated_at"
        }),
        nr: chargebee.subscription.list({
            limit: 1,
            "customer_id[is]": customer.id,
            "status[is]": "non_renewing",
            "sort_by[desc]": "updated_at"
        }),
        in_trial: chargebee.subscription.list({
            limit: 1,
            "customer_id[is]": customer.id,
            "status[is]": "in_trial",
            "sort_by[desc]": "updated_at"
        }),
        future: chargebee.subscription.list({
            limit: 1,
            "customer_id[is]": customer.id,
            "status[is]": "future",
            "sort_by[desc]": "updated_at"
        }),
        paused: chargebee.subscription.list({
            limit: 1,
            "customer_id[is]": customer.id,
            "status[is]": "paused",
            "sort_by[desc]": "updated_at"
        }),
        cancelled: chargebee.subscription.list({
            limit: 1,
            "customer_id[is]": customer.id,
            "status[is]": "cancelled",
            "sort_by[desc]": "updated_at"
        })

    };

}
const getCustomerCards = (chargebee, data, res, intercom) => {
    chargebee.plan.retrieve(data.subscription.plan_id).request(function (planerror, planresult) {
        if (planerror) {
            console.log(planerror);
        } else {

            data.subscription.plan = planresult.plan.name + " ("+ planresult.plan.currency_code+ " ";
          if (parseInt(planresult.plan.price) > 0) {
        data.subscription.plan = data.subscription.plan + parseFloat(parseInt(planresult.plan.price, 10) / 100).toFixed(2) +")";
    } else {
        data.subscription.plan = data.subscription.plan + '0.00 )';
    }

            
        }
        if (data.hasAddon) {
            chargebee.addon.retrieve(data.subscription.addonId).request(function (addonError, addonResult) {
                if (addonError) {
                    console.log(addonError);
                } else {
                    data.subscription.addonName = addonResult.addon.name;
                }
                return res.json(getCard(data, intercom));
            });
        } else {
            return res.json(getCard(data, intercom));
        }
    });
}


const getCustomerWithSubScription = (chargebee, res, list, customer, intercom) => {
    let data = {
        card: '',
        hasCard: false,
        hasAddon: false,
    };

    data = updateCustomerData(data, customer);
    if (list) {
        data = updateSubscriptionData(data, list,false);
        
        return getCustomerCards(chargebee, data, res, intercom);
    } else {
       
        let sr = getRequestList(chargebee,customer);
        sr.ac.request(function (e1, r1) {
            if (common.isEmpty(e1, r1)) {
                sr.nr.request(function (e2, r2) {
                    if (common.isEmpty(e2, r2)) {
                        sr.in_trial.request(function (e3, r3) {
                            if (common.isEmpty(e3, r3)) {
                                sr.future.request(function (e4, r4) {
                                    if (common.isEmpty(e4, r4)) {
                                        sr.paused.request(function (e5, r5) {
                                            if (common.isEmpty(e5, r5)) {
                                                sr.cancelled.request(function (e6, r6) {
                                                    if (common.isEmpty(e6, r6)) {
                                                        console.log("NO subscription");
                                                    } else {
                                                        data = updateSubscriptionData(data, r6.list,true);
                                                        return getCustomerCards(chargebee, data, res, intercom);
                                                    }
                                                });
                                            } else {
                                                data = updateSubscriptionData(data, r5.list,true);
                                                return getCustomerCards(chargebee, data, res, intercom);
                                            }
                                        });
                                    } else {
                                        data = updateSubscriptionData(data, r4.list,true);
                                        return getCustomerCards(chargebee, data, res, intercom);
                                    }
                                });
                            } else {
                                data = updateSubscriptionData(data, r3.list,true);
                                return getCustomerCards(chargebee, data, res, intercom);
                            }
                        });
                    } else {
                        data = updateSubscriptionData(data, r2.list,true);
                        return getCustomerCards(chargebee, data, res, intercom);
                    }
                });
            } else {
                data = updateSubscriptionData(data, r1.list,true);
                return getCustomerCards(chargebee, data, res, intercom);
            }
        });


    }

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
    get: (chargebee, res, customer, intercom) => {
        chargebee.subscription.list({
            limit: 1,
            "customer_id[is]": customer.id
        }).request(
            function (error, subResult) {
                if (subResult.list.length === 0) {
                    return getCustomer(customer, res, intercom);
                } else {
                    if (subResult.next_offset === undefined) {
                        return getCustomerWithSubScription(chargebee, res, subResult.list, customer, intercom);
                    } else {
                        return getCustomerWithSubScription(chargebee, res, null, customer, intercom);
                    }

                }
            });

    },

}