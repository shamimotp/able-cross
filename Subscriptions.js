const moment = require('moment');
const chargebee = require("chargebee");
const common = require('./common');

const getCard = (data) => {
    let card = {
        canvas: {
            content: {
                components: [common.getCustomerList(data.customer),
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
                customerId: data.customer.id
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

        let filedValue = {
            type: "data-table",
            items: [{
                type: "field-value",
                field: "Subscrption id:",
                value: data.subscriptions[i].id
            }]
        };
    
        for (var j = 0; j< data.subscriptions[i].fields.length; j++) {
            filedValue.items.push({
                type: "field-value",
                field: data.subscriptions[i].fields[j].key,
                value: data.subscriptions[i].fields[j].value
    
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
            for (ai = 0; ai < data.subscription[i].addons.length; ai++) {
                addonItems.items.push({
                    type: "field-value",
                    field: data.subscriptions[i].addons[ai].name + ":",
                    value: data.subscriptions[i].addons[ai].value
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
            for (var ai = 0; ai < data.subscription[i].coupons.length; ai++) {
                couponItems.items.push({
                    type: "field-value",
                    field: data.subscriptions[i].coupons[ai].name + ":",
                    value: data.subscriptions[i].coupons[ai].value
                });
            }
            card.canvas.content.components.push(couponItems);
        }
       
        card.canvas.content.components.push({
            type: "divider"
        });
    }
    card.canvas.content.components.push({
        type: "button",
        id: "GET-SUBSCRIPTION",
        label: "<- Go Back",
        style: "link",

        action: {
            type: "submit"
        }
    });
    return card;
}
const getRequestList = (chargebee, customer) => {
    return {
        ac: chargebee.subscription.list({
            limit: 5,
            "customer_id[is]": customer.id,
            "status[is]": "active",
            "sort_by[desc]": "updated_at"
        }),
        nr: chargebee.subscription.list({
            limit: 5,
            "customer_id[is]": customer.id,
            "status[is]": "non_renewing",
            "sort_by[desc]": "updated_at"
        }),
        in_trial: chargebee.subscription.list({
            limit: 5,
            "customer_id[is]": customer.id,
            "status[is]": "in_trial",
            "sort_by[desc]": "updated_at"
        }),
        future: chargebee.subscription.list({
            limit: 5,
            "customer_id[is]": customer.id,
            "status[is]": "future",
            "sort_by[desc]": "updated_at"
        }),
        paused: chargebee.subscription.list({
            limit: 5,
            "customer_id[is]": customer.id,
            "status[is]": "paused",
            "sort_by[desc]": "updated_at"
        }),
        cancelled: chargebee.subscription.list({
            limit: 5,
            "customer_id[is]": customer.id,
            "status[is]": "cancelled",
            "sort_by[desc]": "updated_at"
        })

    };
}
const updateArray = (error, result, sub) => {
    if (error) {
        sub.flag = true;
        return sub;
    } else if (result.list.length == 0) {
        sub.flag = true;
        return sub;
    } else {
        for (var i = 0; i < result.list.length; i++) {
            if (sub.list.length < 5) {
                sub.list.push(result.list[i]);
            } else {
                break;
            }
        }
        if (sub.list.length < 5) {
            sub.flag = true;
            return sub;
        } else {
            sub.flag = false;
            return sub;
        }

    }
}
const getListOfSubscriptions = (chargebee, intercom, res, list, data) => {
    data.pArrays = [];
    data.addonIds = [];
    data.couponIds = [];
    for (var i = 0; i < list.length; i++) {
        var subscription = list[i].subscription;
        data.pArrays.push(subscription.plan_id);
        var sdata = {
            plan: '',
            plan_id: subscription.plan_id,
            imageURl: common.getSubscrpitionIcon(),
            id: subscription.id,
            value: subscription.currency_code + ' ',            
            hasAddon: false,
            addons: [],
            coupons: [],
            currency_code: subscription.currency_code,
            hasCoupon: false,
        }
        if (subscription.plan_quantity != undefined && parseInt(subscription.plan_quantity) > 0) {
            sdata.plan_quantity = parseInt(subscription.plan_quantity);
        }

        let sfields = common.getSubscriptionFieldData(subscription);
        sdata.imageURl = sfields.image;
        sdata.fields = sfields.fields;

        if (parseInt(subscription.plan_amount) > 0) {
            sdata.value = sdata.value + parseFloat(parseInt(subscription.plan_amount, 10) / 100).toFixed(2);
        } else {
            sdata.value = sdata.value + ' 0.00';
        }
        if (subscription['addons'] != undefined && subscription['addons'].length > 0) {
            sdata.hasAddon = true;
            for (var j = 0; j < subscription['addons'].length; j++) {
                var ad = {
                    id: subscription['addons'][j]['id'],
                    value: subscription.currency_code + ' ',
                    quantity: 1

                }
                if (parseInt(subscription['addons'][j]['quantity']) > 0) {
                    ad.quantity = subscription['addons'][j]['quantity'];
                }

                if (parseInt(subscription['addons'][j]['amount']) > 0) {
                    ad.value = ad.value +
                        parseFloat(parseInt(subscription['addons'][j]['amount'], 10) / 100).toFixed(2) +
                        ' x' + ad.quantity;
                } else {
                    ad.value = ad.value + '0.00';
                }

                data.addonIds.push(ad.id);
                sdata.addons.push(ad);

            }
        }
        if (subscription['coupons'] != undefined && subscription['coupons'].length > 0) {
            sdata.hasCoupon = true;
            for (var j = 0; j < subscription['coupons'].length; j++) {
                //data.subscription.coupons.push(list[0].subscription['coupons'][j]['coupon_id']);
                var ad = {
                    id: subscription['coupons'][j]['coupon_id'],
                }
                sdata.coupons.push(ad);
                data.couponIds.push(ad.id);
            }
        }
        //sdata.plan = sdata.planId;
        data.subscriptions.push(sdata);
    }
    chargebee.plan.list({
        "id[in]": data.pArrays
    }).request(function (planerror, planresult) {
        if (planerror) {
            console.log(planerror);
        } else {

            for (var i = 0; i < data.subscriptions.length; i++) {
                var planC = getPlanById(data.subscriptions[i].plan_id, planresult);

                if (planC) {
                    planC = planC.plan;
                    data.subscriptions[i].plan = planC.name + " (" + planC.currency_code + " ";
                    if (parseInt(planC.price) > 0) {
                        data.subscriptions[i].plan = data.subscriptions[i].plan + parseFloat(parseInt(planC.price, 10) / 100).toFixed(2) + ")";
                    } else {
                        data.subscriptions[i].plan = data.subscriptions[i].plan + '0.00 )';
                    }
                    data.subscriptions[i].plan + " x" + data.subscriptions[i].plan_quantity;

                }
            }
        }

        if (data.addonIds.length > 0) {
            chargebee.addon.list({
                "id[in]": data.addonIds
            }).request(function (addonError, addonResult) {
                if (addonError) {
                    console.log(addonError);
                } else {
                    for (var i = 0; i < data.subscriptions.length; i++) {
                        if (data.subscriptions[i].hasAddon) {
                            for (var ai = 0; ai < data.subscriptions[i].addons; ai++) {
                                var addonC = getAddonById(data.subscriptions[i].addons[ai].id, addonResult);
                                if (addonC) {
                                    addonC = addonC.addon;
                                    data.subscriptions[i].addons[ai].name = addonC.name
                                    data.subscriptions[i].addons[ai].value =   " (" +
                                        data.subscriptions[i].addons[ai].value + ") x" + data.subscriptions[i].addons[ai].quantity;

                                }

                            }


                        }
                    }

                }
                if (data.couponIds.length > 0) {
                    chargebee.coupon.list({
                        "id[in]": data.couponIds
                    }).request(function (couponError, couponResult) {
                        for (var i = 0; i < data.subscriptions.length; i++) {
                            for (var ai = 0; ai < data.subscriptions[i].coupons; ai++) {
                                var couponC = getCouponById(data.subscriptions[i].coupons[ai].id, couponResult);
                                if (couponC) {
                                    couponC = couponC.coupon;
                                    var cValue =    couponC.currency_code + " ";
                                    if (couponC.discount_amount !== undefined && parseInt(couponC.discount_amount) > 0) {
                                        cValue = cValue + parseFloat(parseInt(couponC.discount_amount, 10) / 100).toFixed(2);
                                    } else {
                                        cValue = cValue + "0.00";
                                    }
                                    data.subscriptions[i].coupons[ai].name = couponC.name;
                                    data.subscriptions[i].coupons[ai].value = cValue;
                                    
                                }
                            }
                        }                        
                        return res.json(getCard(data, intercom));

                    });

                } else {
                    if (data.couponIds.length > 0) {
                        chargebee.coupon.list({
                            "id[in]": data.couponIds
                        }).request(function (couponError, couponResult) {
                            for (var i = 0; i < data.subscriptions.length; i++) {
                                for (var ai = 0; ai < data.subscriptions[i].coupons; ai++) {
                                    var couponC = getCouponById(data.subscriptions[i].coupons[ai].id, couponResult);
                                    if (couponC) {
                                        couponC = couponC.coupon;
                                        var cValue = couponC.name + " (" + couponC.currency_code + " ";
                                        if (couponC.discount_amount !== undefined && parseInt(couponC.discount_amount) > 0) {
                                            cValue = cValue + parseFloat(parseInt(couponC.discount_amount, 10) / 100).toFixed(2);
                                        } else {
                                            cValue = cValue + "0.00";
                                        }
    
                                        data.subscriptions[i].coupons[ai].value = cValue;
                                        
                                    }
                                }
                            }                        
                            return res.json(getCard(data, intercom));
    
                        });
    
                    }else {
                        return res.json(getCard(data, intercom));
                    }

                   
                }




            });
        } else {
            return res.json(getCard(data, intercom));
        }
    });


}

const getPlanById = (planId, planList) => {
    for (var i = 0; i < planList.list.length; i++) {
        if (planList.list[i].plan.id === planId) {
            return planList.list[i];
        }
    }
    return null;
}

const getAddonById = (id, alist) => {
    for (var i = 0; i < alist.list.length; i++) {
        if (alist.list[i].addon.id === id) {
            return alist.list[i];
        }
    }
    return null;
}

const getCouponById = (id, alist) => {
    for (var i = 0; i < alist.list.length; i++) {
        if (alist.list[i].coupon.id === id) {
            return alist.list[i];
        }
    }
    return null;
}

module.exports = {
    process: (chargebee, intercom, res) => {
        let customerId = intercom.current_canvas.stored_data.customerId;
        chargebee.customer.retrieve(customerId).request(function (error, result) {
            if (error) {
                console.log(error);
            } else {
                var customer = result.customer;
                let data = {
                    customer: {
                        id: customer.id,
                        first_name: customer.first_name,
                        last_name: customer.last_name,
                        email: customer.email,
                        company: customer.company,
                    },

                    subscriptions: []
                };

                let sr = getRequestList(chargebee, customer);
                var sub = {
                    list: []
                }

                sr.ac.request(function (e1, r1) {
                    sub = updateArray(e1, r1, sub);
                    if (sub.flag) {
                        sr.nr.request(function (e2, r2) {
                            sub = updateArray(e2, r2, sub);
                            if (sub.flag) {
                                sr.in_trial.request(function (e3, r3) {
                                    sub = updateArray(e3, r3, sub);
                                    if (sub.flag) {
                                        sr.future.request(function (e4, r4) {
                                            sub = updateArray(e4, r4, sub);
                                            if (sub.flag) {
                                                sr.paused.request(function (e5, r5) {
                                                    sub = updateArray(e5, r5, sub);
                                                    if (sub.flag) {
                                                        sr.cancelled.request(function (e6, r6) {
                                                            sub = updateArray(e6, r6, sub);
                                                            return getListOfSubscriptions(chargebee, intercom, res, sub.list, data);
                                                        });
                                                    } else {
                                                        return getListOfSubscriptions(chargebee, intercom, res, sub.list, data);
                                                    }
                                                });
                                            } else {
                                                return getListOfSubscriptions(chargebee, intercom, res, sub.list, data);
                                            }
                                        });
                                    } else {
                                        return getListOfSubscriptions(chargebee, intercom, res, sub.list, data);
                                    }
                                });
                            } else {
                                return getListOfSubscriptions(chargebee, intercom, res, sub.list, data);
                            }
                        });
                    } else {
                        return getListOfSubscriptions(chargebee, intercom, res, sub.list, data);
                    }
                });

            }
        });
    }
}