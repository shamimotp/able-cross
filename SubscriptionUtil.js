const chargebee = require("chargebee");
const common = require('./common');
const validator = require('validator');


const getPlanDropDown = (data) => {
    var planarray = [];
    if (data.hasPlans) {
        var planDrop = {
            type: "dropdown",
            id: "CUSTOMER_PLAN_ID",
            label: "PLAN",
            save_state: "unsaved",
            options: [],
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
            planDrop.options.push(ot);
        }

        if (data.oldInputs !== undefined && data.oldInputs.CUSTOMER_PLAN_ID !== undefined) {
            planDrop.value = data.oldInputs.CUSTOMER_PLAN_ID;
        }
        planarray.push(planDrop);
        planarray.push({
            type: "spacer",
            size: "m"
        });
        var planQuantity = {
            type: "input",
            id: "CUSTOMER_PLAN_QTY",
            label: "QUANTITY",
            save_state: "unsaved",
        };
        if (data.oldInputs !== undefined && data.oldInputs.CUSTOMER_PLAN_QTY !== undefined) {
            planQuantity.value = data.oldInputs.CUSTOMER_PLAN_QTY;
        }
        planarray.push(planQuantity);

    } else {
        planarray.push({
            type: "text",
            text: "No plans Found",
            align: "left",
            style: "error"
        });

    }
    return planarray;
}
const getExtras = (list, label, key) => {
    var tArray = [];
    if (list !== undefined) {
        for (var i = 0; i < list.length; i++) {
            if (i == 0) {
                tArray.push({
                    type: "spacer",
                    size: "m"
                });
                tArray.push({
                    type: "text",
                    text: label,
                    align: "left",
                    style: "muted"
                });
            }
            var adButton = {
                type: "button",
                id: key + list[i].id,
                label: list[i].name + " (" + list[i].currency + " ",
                style: "secondary",
                action: {
                    type: "submit"
                }
            }
            if (parseInt(list[i].price) > 0) {
                adButton.label = adButton.label + parseFloat(parseInt(list[i].price, 10) / 100).toFixed(2) + ")";
            } else {
                adButton.label = adButton.label + "0.00)";
            }
            tArray.push(adButton);
        }
    }
    return tArray;
}

const getBasicCard = (data) => {
    return [{
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
    ];
}

const getCard = (data) => {
    let card = {
        canvas: {
            content: {
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

    if (data.eventAddons !== undefined) {
        card.canvas.stored_data.eventAddons = data.eventAddons;
    }
    if (data.hasPlans) {
        card.canvas.stored_data.plans = data.plans;
    }
    let components = getBasicCard(data);
    components = components.concat(        
        getPlanDropDown(data)
    );
    if(data.error !== undefined){
       components.push({
            type: "spacer",
            size: "xs"
        });
      components.push(
        {
            type: "text",
            text: data.error.error_msg,
            align: "left",
            style: "error"
        });
    }
    
    components = components.concat(
        getExtras(data.addons, "RECURRING ADDONS SELECTED", "EXTRA-ADN-REM-")
    );
    components.push({
        type: "button",
        id: "EXTRA-ADN-ADD",
        label: "ADD RECURRING ADDON",
        style: "link",
        action: {
            type: "submit"
        }
    });
    components = components.concat(
        getExtras(data.eventAddons, "NON RECURRING ADDONS SELECTED", "EXTRA-EADN-REM-")
    );
    components.push({
        type: "button",
        id: "EXTRA-EADN-ADD",
        label: "ADD NON-RECURRING ADDON",
        style: "link",

        action: {
            type: "submit"
        }
    });

    components = components.concat(
        getExtras(data.coupons, "COUPONS SELECTED", "EXTRA-COUPON-REM-")
    );
    components.push({
        type: "button",
        id: "EXTRA-COUPON-ADD",
        label: "ADD COUPON",
        style: "link",

        action: {
            type: "submit"
        }
    });
    components.push({
        type: "spacer",
        size: "m"
    });
    components.push({
        type: "button",
        id: "SEND-HOSTED-PAGE",
        label: "SEND HOSTED PAGE LINK",
        action: {
            type: "submit"
        }
    });

    if (data.customerId !== undefined) {
        components.push({
            type: "button",
            id: "GET-SUBSCRIPTION",
            label: "CANCEL",
            style: "secondary",
            action: {
                type: "submit"
            }
        });
    } else {
        components.push({
            type: "button",
            id: "INIT-PAGE",
            label: "CANCEL",
            style: "secondary",
            action: {
                type: "submit"
            }
        });
    }
    components.push({
        type: "spacer",
        size: "m"
    });
    card.canvas.content.components = components;
    return card;
}

const getCreateUI = (chargebee, intercom, res, savedData, customer) => {
    var data = {
        plans: [],
        hasPlans: false,

    };
    if (savedData !== undefined) {
        if (savedData.addons != undefined) {
            data.addons = savedData.addons;
        }
        if (savedData.eventAddons != undefined) {
            data.eventAddons = savedData.eventAddons;
        }
        if (savedData.coupons != undefined) {
            data.coupons = savedData.coupons;
        }
        if (savedData.error != undefined) {
            data.error = savedData.error;
        }
        if (savedData.oldInputs != undefined) {
            data.oldInputs = savedData.oldInputs;
        }
    }


    let cemail = intercom.customer.email;
    if (customer !== undefined) {
        data.customerId = customer.id;
        if (customer.email !== undefined && validator.isEmail(customer.email)) {
            data.email = customer.email;
        } else if (cemail !== undefined && validator.isEmail(cemail)) {
            data.email = cemail;
        } else {
            data.email = '';
        }
    }else {
     
        if (cemail !== undefined && validator.isEmail(cemail)) {
            data.email = cemail;
        } else {
            data.email = '';
        }
    }
    chargebee.plan.list({
        "status[is]": "active"
    }).request(function (planError, planResult) {
        if (planError) {
            data.hasPlans = false;
        } else {
            for (var i = 0; i < planResult.list.length; i++) {
                data.hasPlans = true;
                var plan = planResult.list[i].plan;
                var dPlan = {
                    id: plan.id,
                    name: plan.name,
                    currency: plan.currency_code,
                    price: 0,
                    pricing_model: plan.pricing_model,
                    period : plan.period,
                    period_unit : plan.period_unit
                };
                if (parseInt(plan.price) > 0) {
                    dPlan.price = parseFloat(parseInt(plan.price, 10) / 100).toFixed(2);
                    dPlan.name = dPlan.name + " (" + dPlan.currency + " " + dPlan.price + ")";
                } else {
                    dPlan.name = dPlan.name + " (" + dPlan.currency + " 0.00)";
                }
                data.plans.push(dPlan);
            }
        }


        return res.json(getCard(data));
    });
}

module.exports = {
    createUI: (chargebee, intercom, res, savedData) => {
        let customerId = common.getCustomerId(intercom);

        if (customerId !== undefined) {
            chargebee.customer.retrieve(customerId).request(function (customerError, customerResult) {
                if (customerError) {
                    return getCreateUI(chargebee, intercom, res, savedData);
                } else {
                    var customer = customerResult.customer;
                    return getCreateUI(chargebee, intercom, res, savedData, customer);

                }
            });
        } else {
            return getCreateUI(chargebee, intercom, res, savedData);
        }

    }
}