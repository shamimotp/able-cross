const chargebee = require("chargebee");
const common = require('./common');
const validator = require('validator');


const getCard = (data) => {
    let card = {
        canvas: {
            content: {
                components: [{
                        type: "spacer",
                        size: "xs"
                    },
                    {
                        type: "text",
                        text: "  CREATE NEW SUBSCRIPTION",
                        align: "left",
                        style: "header"
                    },
                    {
                        type: "spacer",
                        size: "m"
                    },
                    {
                        type: "input",
                        id: "CUSTOMER_EMAIL_ID",
                        label: "CUSTOMER EMAIL ID",
                        value: data.email,
                        save_state: "unsaved",
                        disabled: true,
                    },
                ]
            },
            stored_data: {} //optional
        }
    };
    if (data.customerId !== undefined) {
        card.canvas.stored_data.customerId = data.customerId;

    }
    if (data.addons !== undefined) {
        card.canvas.stored_data.addons = data.addons;
    }

    if (data.nrAddons !== undefined) {
        card.canvas.stored_data.nrAddons = data.nrAddons;
    }
    var planDrop = {
        type: "dropdown",
        id: "CUSTOMER_PLAN_ID",
        label: "PLAN",
        save_state: "unsaved",
        options: [],
    }
    if (data.oldInputs !== undefined && data.oldInputs.CUSTOMER_PLAN_ID !== undefined) {
        planDrop.value = data.oldInputs.CUSTOMER_PLAN_ID;
    }

    for (var i = 0; i < data.plans.length; i++) {
        if (i == 0) {
            planDrop.value = data.plans[i].id;
        }
        var ot = {
            type: "option",
            id: data.plans[i].id,
            text: data.plans[i].name
        }
        if (data.plans[i].price > 0) {
            ot.text = ot.text + " " + data.plans[i].currency + " " + data.plans[i].price;
        }
        planDrop.options.push(ot);
    }
    if (data.oldInputs !== undefined && data.oldInputs.CUSTOMER_PLAN_ID !== undefined) {
        planDrop.value = data.oldInputs.CUSTOMER_PLAN_ID;
    }
    card.canvas.content.components.push(planDrop);
    card.canvas.content.components.push({
        type: "spacer",
        size: "m"
    });

    if (data.oldInputs !== undefined && data.oldInputs.CUSTOMER_PLAN_QTY !== undefined) {
        card.canvas.content.components.push({
            type: "input",
            id: "CUSTOMER_PLAN_QTY",
            label: "QUANTITY",
            save_state: "unsaved",
            value: data.oldInputs.CUSTOMER_PLAN_QTY,

        });
    } else {
        card.canvas.content.components.push({
            type: "input",
            id: "CUSTOMER_PLAN_QTY",
            label: "QUANTITY",
            save_state: "unsaved",

        });
    }



    if (data.addons !== undefined) {

        for (var i = 0; i < data.addons.length; i++) {
            if (i == 0) {
                card.canvas.content.components.push({
                    type: "spacer",
                    size: "m"
                });
                card.canvas.content.components.push({
                    type: "text",
                    text: "RECURRING ADDONS SELECTED",
                    align: "left",
                    style: "muted"
                });
            }
            card.canvas.content.components.push({
                type: "button",
                id: "REMOVE_ADDDON-" + data.addons[i].id,
                label: data.addons[i].name + " " + data.addons[i].currency + " " + data.addons[i].price,
                style: "secondary",
                action: {
                    type: "submit"
                }
            });
        }
    }
    card.canvas.content.components.push({
        type: "button",
        id: "ADD_RECURRING_ADDDON",
        label: "ADD RECURRING ADDON",
        style: "link",
        action: {
            type: "submit"
        }
    });


    if (data.nrAddons !== undefined) {

        for (var i = 0; i < data.nrAddons.length; i++) {
            if (i == 0) {
                card.canvas.content.components.push({
                    type: "spacer",
                    size: "m"
                });
                card.canvas.content.components.push({
                    type: "text",
                    text: "NON RECURRING ADDONS SELECTED",
                    align: "left",
                    style: "muted"
                });
            }
            card.canvas.content.components.push({
                type: "button",
                id: "REMOVE_NRADDDON-" + data.nrAddons[i].id,
                label: data.nrAddons[i].name + " " + data.nrAddons[i].currency + " " + data.nrAddons[i].price,
                style: "secondary",
                action: {
                    type: "submit"
                }
            });
        }
    }

    card.canvas.content.components.push({
        type: "button",
        id: "ADD_NON_RECURRING_ADDDON",
        label: "ADD NON-RECURRING ADDON",
        style: "link",

        action: {
            type: "submit"
        }
    });
    card.canvas.content.components.push({
        type: "spacer",
        size: "m"
    });

    var couponDrop = {
        type: "dropdown",
        id: "CUSTOMER_COUPON_ID",
        label: "SELECT COUPON",
        value: "tech",
        save_state: "unsaved",
        options: [],
    }
    for (var i = 0; i < data.coupons.length; i++) {
        if (i == 0) {
            couponDrop.value = data.coupons[i].id;
        }
        var ot = {
            type: "option",
            id: data.coupons[i].id,
            text: data.coupons[i].name
        }
        if (data.coupons[i].amount > 0) {
            ot.text = ot.text + " " + data.coupons[i].currency + " " + data.coupons[i].amount;
        }
        couponDrop.options.push(ot);
    }
    if (data.oldInputs !== undefined && data.oldInputs.CUSTOMER_COUPON_ID !== undefined) {
        couponDrop.value = data.oldInputs.CUSTOMER_COUPON_ID;
    }
    card.canvas.content.components.push(couponDrop);
    card.canvas.content.components.push({
        type: "spacer",
        size: "m"
    });

    card.canvas.content.components.push({
        type: "button",
        id: "SEND-HOSTED-PAGE",
        label: "SEND HOSTED PAGE LINK",
        action: {
            type: "submit"
        }
    });

    if (data.customerId !== undefined) {
        card.canvas.content.components.push({
            type: "button",
            id: "GET-SUBSCRIPTION",
            label: "CANCEL",
            style: "secondary",
            action: {
                type: "submit"
            }
        });
    } else {
        card.canvas.content.components.push({
            type: "button",
            id: "INIT-PAGE",
            label: "CANCEL",
            style: "secondary",
            action: {
                type: "submit"
            }
        });
    }




    card.canvas.content.components.push({
        type: "spacer",
        size: "m"
    });


    return card;
}

module.exports = {
    process: (chargebee, intercom, res, currentAddons, currentNrAddons) => {
        let customerId = intercom.current_canvas.stored_data.customerId;

        let email = intercom.customer.email;
        if (email === undefined || email === "") {
            return common.getNoEmailCard(res);
        }
        var data = {
            email: email,
            plans: [],
            coupons: []
        };
        if (currentAddons !== undefined) {
            data.addons = currentAddons;
        }
        if (currentNrAddons !== undefined) {
            data.nrAddons = currentNrAddons;
        }
        if (intercom.current_canvas.stored_data.oldInputs) {
            data.oldInputs = intercom.current_canvas.stored_data.oldInputs;
        }
        if (customerId !== undefined) {
            chargebee.customer.retrieve(customerId).request(function (customerError, customerResult) {
                var customer = customerResult.customer;
                data.customerId = customer.id;
                if (customer.email !== undefined && validator.isEmail(customer.email)) {
                    data.email = customer.email;

                }
                chargebee.plan.list({
                    "status[is]": "active"
                }).request(function (planError, planResult) {
                    for (var i = 0; i < planResult.list.length; i++) {
                        var plan = planResult.list[i].plan;
                        var dPlan = {
                            id: plan.id,
                            name: plan.name,
                            currency: plan.currency_code,
                            price: 0
                        };
                        if (parseInt(plan.price) > 0) {
                            dPlan.price = parseFloat(parseInt(plan.price, 10) / 100).toFixed(2);
                        }
                        data.plans.push(dPlan);
                    }

                    chargebee.coupon.list({
                        "status[is]": "active"
                    }).request(function (couponerror, couponresult) {
                        for (var i = 0; i < couponresult.list.length; i++) {
                            var coupon = couponresult.list[i].coupon;
                            var dCoupons = {
                                id: coupon.id,
                                name: coupon.name,
                                currency: coupon.currency_code,
                                amount: 0
                            };

                            if (parseInt(coupon.discount_amount) > 0) {
                                dCoupons.amount = parseFloat(parseInt(coupon.discount_amount, 10) / 100).toFixed(2);
                            }
                            data.coupons.push(dCoupons);

                        }
                        return res.json(getCard(data));
                    });

                });
            });
        } else {
            chargebee.plan.list({
                "status[is]": "active"
            }).request(function (planError, planResult) {
                for (var i = 0; i < planResult.list.length; i++) {
                    var plan = planResult.list[i].plan;
                    var dPlan = {
                        id: plan.id,
                        name: plan.name,
                        currency: plan.currency_code,
                        price: 0
                    };
                    if (parseInt(plan.price) > 0) {
                        dPlan.price = parseFloat(parseInt(plan.price, 10) / 100).toFixed(2);
                    }
                    data.plans.push(dPlan);
                }
                chargebee.coupon.list({
                    "status[is]": "active"
                }).request(function (couponerror, couponresult) {
                    //console.log(JSON.stringify(couponresult)); 
                    for (var i = 0; i < couponresult.list.length; i++) {
                        var coupon = couponresult.list[i].coupon;
                        var dCoupons = {
                            id: coupon.id,
                            name: coupon.name,
                            currency: coupon.currency_code,
                            amount: 0
                        };

                        if (parseInt(coupon.discount_amount) > 0) {
                            dCoupons.amount = parseFloat(parseInt(coupon.discount_amount, 10) / 100).toFixed(2);
                        }
                        data.coupons.push(dCoupons);

                    }
                    return res.json(getCard(data));
                });
            });
        }


    }
}