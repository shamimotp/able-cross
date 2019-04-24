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


    let profile = common.getCustomerProfile(data);

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

    let filedValue = {
        type: "data-table",
        items: [{
            type: "field-value",
            field: "Subscrption id:",
            value: data.subscription.id
        }]
    };

    for (var i = 0; i < data.subscription.fields.length; i++) {
        filedValue.items.push({
            type: "field-value",
            field: data.subscription.fields[i].key,
            value: data.subscription.fields[i].value

        });
    }

    card.canvas.content.components.push(filedValue);
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

        var addonItems = {
            type: "data-table",
            items: []
        };
        for (ai = 0; ai < data.subscription.addons.length; ai++) {
            addonItems.items.push({
                type: "field-value",
                field: data.subscription.addons[ai].name + ":",
                value: data.subscription.addons[ai].value
            });
        }
        card.canvas.content.components.push(addonItems);
    }
    if (data.hasCoupon) {
        card.canvas.content.components.push({
            type: "spacer",
            size: "xs"
        });
        card.canvas.content.components.push({
            type: "text",
            text: "Coupons",
            align: "left",
            style: "header"
        });

        var couponItems = {
            type: "data-table",
            items: []
        };
        for (var ai = 0; ai < data.subscription.coupons.length; ai++) {
            couponItems.items.push({
                type: "field-value",
                field: data.subscription.coupons[ai].name + ":",
                value: data.subscription.coupons[ai].value
            });
        }
        card.canvas.content.components.push(couponItems);
    }
    //--------------------


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
const updateCustomerData = (data, customer, card) => {
    data.customer = {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        company: customer.company,
        createdAt: moment.unix(customer.created_at).utc().format('ll'),
        currency_code: customer.preferred_currency_code,
        unbilled_charges: customer.unbilled_charges,
        totalDue: customer.preferred_currency_code + " ",

    }

    if (parseInt(data.customer.unbilled_charges) > 0) {
        data.customer.totalDue = data.customer.totalDue + parseFloat(parseInt(data.customer.unbilled_charges, 10) / 100).toFixed(2);
    } else {
        data.customer.totalDue = data.customer.totalDue + "0.00";
    }

    if (customer.auto_collection !== undefined) {
        data.customer.auto_collection = customer.auto_collection;
    }

    if (card !== undefined) {
        data.card = card.card_type + " ending " + card.last4;
        data.hasCard = true;
    }


    return data;
}


const updateSubscriptionData = (data, list, hasMore) => {
    data.subscription = {
        id: list[0].subscription.id,
        plan: '',
        plan_id: list[0].subscription.plan_id,
        plan_quantity : 1,
        imageURl: common.getSubscrpitionIcon(list[0].subscription.status),
        currency_code: list[0].subscription.currency_code,
        status: list[0].subscription.status,
        hasMore: hasMore,
        addons: [],
        addonIds: [],
        coupons: [],
        couponIds: [],

    }

    if( list[0].subscription.plan_quantity  != undefined && parseInt(list[0].subscription.plan_quantity) > 0){
        data.subscription.plan_quantity = parseInt(list[0].subscription.plan_quantity);
    }

    let sfields = common.getSubscriptionFieldData(list[0].subscription);
    data.subscription.imageURl = sfields.image;
    data.subscription.fields = sfields.fields;

    if (list[0].subscription['addons'] != undefined && list[0].subscription['addons'].length > 0) {
        data.hasAddon = true;
        for (var j = 0; j < list[0].subscription['addons'].length; j++) {
            var ad = {
                id: list[0].subscription['addons'][j]['id'],
                value: list[0].subscription.currency_code + ' ',
                quantity: 1

            }
            if (parseInt(list[0].subscription['addons'][j]['quantity']) > 0) {
                ad.quantity = list[0].subscription['addons'][j]['quantity'];
            }

            if (parseInt(list[0].subscription['addons'][j]['amount']) > 0) {
                ad.value = ad.value +
                    parseFloat(parseInt(list[0].subscription['addons'][j]['amount'], 10) / 100).toFixed(2) +
                    ' x' + ad.quantity;
            } else {
                ad.value = ad.value + '0.00';
            }

            data.subscription.addonIds.push(ad.id);
            data.subscription.addons.push(ad);

        }
    }
    /*if (list[0].subscription['event_based_addons'] != undefined && list[0].subscription['event_based_addons'].length > 0) {
        data.hasAddon = true;
        for (var j = 0; j < list[0].subscription['event_based_addons'].length; j++) {

            var ad = {
                id: list[0].subscription['event_based_addons'][j]['id'],
                value: list[0].subscription.currency_code + ' ',
                quantity: list[0].subscription['event_based_addons'][j]['quantity']
            }
            addonIds.push(ad.id);
            if (parseInt(list[0].subscription['event_based_addons'][j]['unit_price']) > 0) {
                ad.value = ad.value + parseFloat(parseInt(list[0].subscription['event_based_addons'][j]['unit_price'], 10) / 100).toFixed(2);
            } else {
                ad.value = ad.value + '0.00';
            }
            data.subscription.addons.push(ad);
        }
    }*/
    if (list[0].subscription['coupons'] != undefined && list[0].subscription['coupons'].length > 0) {
        data.hasCoupon = true;
        for (var j = 0; j < list[0].subscription['coupons'].length; j++) {
            //data.subscription.coupons.push(list[0].subscription['coupons'][j]['coupon_id']);
            var ad = {
                id: list[0].subscription['coupons'][j]['coupon_id'],
            }
            data.subscription.coupons.push(ad);
            data.subscription.couponIds.push(ad.id);
        }
    }


    return data;
}
const getRequestList = (chargebee, customer) => {
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

            data.subscription.plan = planresult.plan.name + " (" + planresult.plan.currency_code + " ";

            if (parseInt(planresult.plan.price) > 0) {
                data.subscription.plan = data.subscription.plan +
                    parseFloat(parseInt(planresult.plan.price, 10) / 100).toFixed(2) + ")";
            } else {
                data.subscription.plan = data.subscription.plan + '0.00 )';
            }
            data.subscription.plan = data.subscription.plan +" x" + data.subscription.plan_quantity;

           
        }
        if (data.hasAddon) {
            chargebee.addon.list({
                "id[in]": data.subscription.addonIds
            }).request(function (addonError, addonResult) {
                if (addonError) {
                    console.log(addonError);
                } else {
                    for (var i = 0; i < addonResult.list.length; i++) {
                        var aId = addonResult.list[i].addon.id;
                        for (var j = 0; j < data.subscription.addons.length; j++) {
                            if (data.subscription.addons[j].id === aId) {
                                data.subscription.addons[j].name = addonResult.list[i].addon.name;
                            }
                        }

                    }

                }
                if (data.hasCoupon) {
                    chargebee.coupon.list({
                        "id[in]": data.subscription.couponIds
                    }).request(function (couponError, couponResult) {
                        for (var i = 0; i < couponResult.list.length; i++) {
                            var aId = couponResult.list[i].coupon.id;
                            var cNAme = couponResult.list[i].coupon.name;
                            var cValue = couponResult.list[i].coupon.currency_code + " ";
                            if (couponResult.list[i].coupon.discount_amount !== undefined && parseInt(couponResult.list[i].coupon.discount_amount) > 0) {
                                cValue = cValue + parseFloat(parseInt(couponResult.list[i].coupon.discount_amount, 10) / 100).toFixed(2);
                            } else {
                                cValue = cValue + "0.00";
                            }

                            for (var j = 0; j < data.subscription.coupons.length; j++) {
                                if (data.subscription.coupons[j].id === aId) {
                                    data.subscription.coupons[j].name = cNAme;
                                    data.subscription.coupons[j].value = cValue


                                }
                            }

                        }
                        return res.json(getCard(data, intercom));

                    });

                } else {
                    return res.json(getCard(data, intercom));
                }

            });
        } else if (data.hasCoupon) {
            chargebee.coupon.list({
                "id[in]": data.subscription.couponIds
            }).request(function (couponError, couponResult) {

                for (var i = 0; i < couponResult.list.length; i++) {
                    var aId = couponResult.list[i].coupon.id;
                    var cNAme = couponResult.list[i].coupon.name;
                    var cValue = couponResult.list[i].coupon.currency_code + " ";
                    if (couponResult.list[i].coupon.discount_amount !== undefined && parseInt(couponResult.list[i].coupon.discount_amount) > 0) {
                        cValue = cValue + parseFloat(parseInt(couponResult.list[i].coupon.discount_amount, 10) / 100).toFixed(2);
                    } else {
                        cValue = cValue + "0.00";
                    }

                    for (var j = 0; j < data.subscription.coupons.length; j++) {
                        if (data.subscription.coupons[j].id === aId) {
                            data.subscription.coupons[j].name = cNAme;
                            data.subscription.coupons[j].value = cValue


                        }
                    }

                }
                return res.json(getCard(data, intercom));
            });


        } else {
            return res.json(getCard(data, intercom));
        }
    });
}


const getCustomerWithSubScription = (chargebee, res, list, customer, intercom, card) => {
    let data = {
        card: '',
        hasCard: false,
        hasAddon: false,
        hasCoupon: false,
    };

    data = updateCustomerData(data, customer, card);
    if (list) {
        data = updateSubscriptionData(data, list, false);

        return getCustomerCards(chargebee, data, res, intercom);
    } else {

        let sr = getRequestList(chargebee, customer);
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
                                                        data = updateSubscriptionData(data, r6.list, true);
                                                        return getCustomerCards(chargebee, data, res, intercom);
                                                    }
                                                });
                                            } else {
                                                data = updateSubscriptionData(data, r5.list, true);
                                                return getCustomerCards(chargebee, data, res, intercom);
                                            }
                                        });
                                    } else {
                                        data = updateSubscriptionData(data, r4.list, true);
                                        return getCustomerCards(chargebee, data, res, intercom);
                                    }
                                });
                            } else {
                                data = updateSubscriptionData(data, r3.list, true);
                                return getCustomerCards(chargebee, data, res, intercom);
                            }
                        });
                    } else {
                        data = updateSubscriptionData(data, r2.list, true);
                        return getCustomerCards(chargebee, data, res, intercom);
                    }
                });
            } else {
                data = updateSubscriptionData(data, r1.list, true);
                return getCustomerCards(chargebee, data, res, intercom);
            }
        });


    }

}

module.exports = {

    process: (chargebee, res, customerId) => {
        chargebee.customer.retrieve(customerId).request(function (error, result) {

            var customer = result.customer;
            let card;
            let intercom;
            if (result.card !== undefined) {
                card = result.card;
            }
            chargebee.subscription.list({
                limit: 100,
                "customer_id[is]": customerId
            }).request(function (error, subResult) {
                if (subResult.list.length === 0) {
                    return getCustomer(customer, res);
                } else {

                    return getCustomerWithSubScription(chargebee, res, subResult.list, customer, intercom, card);
                }
            });
        });
    },
    get: (chargebee, res, customer, intercom, card) => {
        chargebee.subscription.list({
            limit: 1,
            "customer_id[is]": customer.id
        }).request(
            function (error, subResult) {
                if (subResult.list.length === 0) {
                    return getCustomer(customer, res, intercom);
                } else {
                    if (subResult.next_offset === undefined) {
                        return getCustomerWithSubScription(chargebee, res, subResult.list, customer, intercom, card);
                    } else {
                        return getCustomerWithSubScription(chargebee, res, null, customer, intercom, card);
                    }

                }
            });

    },

}