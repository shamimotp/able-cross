const chargebee = require("chargebee");
const common = require('./common');
const SubscriptionUtil = require('./SubscriptionUtil');
const moment = require('moment');
const getPlan = (planId, plans) => {
    for (var i = 0; i < plans.length; i++) {
        if (plans[i].id === planId) {
            return plans[i];
        }
    }
}
const sendCreatePage = (data, chargebee, intercom, res,qtyError) => {
    let savedData = {};
    if (data.addons !== undefined) {
        savedData.addons = data.addons;
    }
    if (data.eventAddons !== undefined) {
        savedData.eventAddons = data.eventAddons;
    }
    if (data.coupons !== undefined) {
        savedData.coupons = data.coupons;
    }
    if (data.oldInputs !== undefined) {
        savedData.oldInputs = data.oldInputs;
    }
  if(qtyError !== undefined ) {
    savedData.qtyError = qtyError;
  }
    return SubscriptionUtil.createUI(chargebee, intercom, res, savedData);
}
const getCard = (data, list, type, id) => {
    let dropLabel = "SELECT RECURRING ADDON";
    let hasQty = true;
    let createLabel = "ADD ADDON";
    let createId = "EXTRAUI-ADN-CREATE";
    let cancelId = "EXTRAUI-ADN-CANCEL";
    let removeLabel = "REMOVE ADDON";
    let removeId = "EXTRAUI-ADN-REM-";
    let changeLabel = "CHANGE ADDON";
    let changeId = "EXTRAUI-ADN-CHG-";

    let remove = false;
    let rId = '';
    if (id !== undefined) {
        rId = id;
    }
    if (type === "COUPON") {
        hasQty = false;
        createLabel = "ADD COUPON";
         dropLabel = "SELECT COUPON";
        createId = "EXTRAUI-COUPON-CREATE";
        cancelId = "EXTRAUI-COUPON-CANCEL";
        removeId = "EXTRAUI-COUPON-REM-";
        changeId = "EXTRAUI-COUPON-CHG-";

    } else if (type === "EADN") {
      hasQty = false;
       dropLabel = "SELECT NON-RECURRING ADDON";
        createLabel = "ADD ADDON";
        createId = "EXTRAUI-EADN-CREATE";
        cancelId = "EXTRAUI-EADN-CANCEL";
        removeId = "EXTRAUI-EADN-REM-";
        changeId = "EXTRAUI-EADN-CHG-";
    }

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
                        size: "xl"
                    }
                ]
            },
            stored_data: {

            }
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
    if (data.coupons !== undefined) {
        card.canvas.stored_data.coupons = data.coupons;

    }
    if (data.oldInputs !== undefined) {
        card.canvas.stored_data.oldInputs = data.oldInputs;

    }

    var addonDrop = {
        type: "dropdown",
        id: "EXTRA_ID",
        label: dropLabel,
        save_state: "unsaved",
        options: [],
    }
    for (var i = 0; i < list.length; i++) {
        if (i == 0) {
            addonDrop.value = 'NOEXTRA';
            addonDrop.options.push({
                type: "option",
                id: 'NOEXTRA',
                text: 'SELECT'
            });
        }
        if (remove == false && rId === list[i].id) {
            remove = true;
        }
        var ot = {
            type: "option",
            id: list[i].id,
            text: list[i].name + " (" + list[i].currency + " ",
        }
        if (parseInt(list[i].price) > 0) {
            ot.text = ot.text + parseFloat(parseInt(list[i].price, 10) / 100).toFixed(2) + ")";
        } else {
            ot.text = ot.text + " 0.00)";
        }
        addonDrop.options.push(ot);
    }
    if (remove) {
        addonDrop.value = rId;
    }

    card.canvas.content.components.push(addonDrop);
    if (hasQty) {
        card.canvas.content.components.push({
            type: "input",
            id: "CUSTOMER_ADDON_QTY",
            label: "QUANTITY",
            save_state: "unsaved",

        });
    }

    card.canvas.content.components.push({
        type: "spacer",
        size: "m"
    });
    if (remove) {
        card.canvas.content.components.push({
            type: "button",
            id: changeId + rId,
            label: changeLabel,
            action: {
                type: "submit"
            }
        });
        card.canvas.content.components.push({
            type: "button",
            id: removeId + rId,
            label: removeLabel,
            action: {
                type: "submit"
            },
            style: 'secondary'

        });

    } else {
        card.canvas.content.components.push({
            type: "button",
            id: createId,
            label: createLabel,
            action: {
                type: "submit"
            }
        });
    }


    card.canvas.content.components.push({
        type: "spacer",
        size: "m"
    });
    card.canvas.content.components.push({
        type: "button",
        id: cancelId,
        label: "<- Go Back",
        action: {
            type: "submit"
        },
        style: "link"
    });


    return card;
}

const getAddon = (data, chargebee, intercom, res, plan, id) => {

    chargebee.addon.list({
        "status[is]": "active",
        "charge_type[is]": "recurring",
        "period[is]": plan.period,
        "period_unit[is]": plan.period_unit
    }).request(function (addonerror, addonresult) {
        if (addonerror) {
          let qtyError = {
                    error_msg: 'Sorry, No recurring addons available '
                }
            return sendCreatePage(data, chargebee, intercom, res,qtyError);
        } else {
            if (addonresult.list.length == 0) {
              let qtyError = {
                    error_msg: 'Sorry, No recurring addons available '
                }
                return sendCreatePage(data, chargebee, intercom, res,qtyError);
            } else {
                let addonsList = [];
                for (var i = 0; i < addonresult.list.length; i++) {
                    var addon = addonresult.list[i].addon;
                    var ot = {
                        id: addon.id,
                        name: addon.name,
                        currency: addon.currency_code,
                        price: addon.price
                    }
                    addonsList.push(ot);
                }
                return res.json(getCard(data, addonsList, "ADN", id));
            }
        }
    });

}
const getEventAddon = (data, chargebee, intercom, res,id) => {
    chargebee.addon.list({
        "status[is]": "active",
        "charge_type[is]": "non_recurring",
    }).request(function (addonerror, addonresult) {
        if (addonerror) {
          let qtyError = {
                    error_msg: 'Sorry, No non_recurring addons available.'
                }
            return sendCreatePage(data, chargebee, intercom, res,qtyError);
        } else {
            if (addonresult.list.length == 0) {
              let qtyError = {
                    error_msg: 'Sorry, No non_recurring addons available.'
                }
                return sendCreatePage(data, chargebee, intercom, res,qtyError);
            } else {
                let addonsList = [];
                for (var i = 0; i < addonresult.list.length; i++) {
                    var addon = addonresult.list[i].addon;
                    var ot = {
                        id: addon.id,
                        name: addon.name,
                        currency: addon.currency_code,
                        price: addon.price
                    }
                    addonsList.push(ot);
                }
                return res.json(getCard(data, addonsList, "EADN", id));
            }
        }
    });

}
const getCoupons = (data, chargebee, intercom, res,plan,id) => {
    chargebee.coupon.list({
        "status[is]": "active"
    }).request(function (couponerror, couponresult) {
        if (couponerror) {
          let qtyError = {
                    error_msg: 'Sorry, No Coupons available.'
                }
            return sendCreatePage(data, chargebee, intercom, res,qtyError);
        } else {
            if (couponresult.list.length == 0) {
              let qtyError = {
                    error_msg: 'Sorry, No Coupons available.'
                }
                return sendCreatePage(data, chargebee, intercom, res,qtyError);
            } else {
                let couponList = [];
                for (var i = 0; i < couponresult.list.length; i++) {
                    var coupon = couponresult.list[i].coupon;
                    var dCoupons = {
                        id: coupon.id,
                        name: coupon.name,
                        currency: coupon.currency_code,
                        price: 0
                    };
                    var  max_redemptions = true;
                    if(coupon.max_redemptions !== undefined && coupon.redemptions !== undefined) {
                        if(parseInt(coupon.max_redemptions) <= parseInt(coupon.redemptions) ) {
                            max_redemptions = false;
                        }

                    }
                  var planSupport = false;
                  
                  if(coupon.plan_constraint == "all" || coupon.plan_constraint === "specific") {
                    planSupport = true;
                    if(coupon.plan_constraint === "specific" ){
                       if(coupon.plan_ids !== undefined && coupon.plan_ids.length > 0) {
                         var inPlans = false;
                         for(var j=0;j<coupon.plan_ids.length;j++) {
                           if(coupon.plan_ids[j] === plan.id) {
                             inPlans = true;
                             break;
                              }
                           
                         }
                         planSupport = inPlans;
                    
                     }
                    }
                  }
                  
                  var validDate = true;
                  if(coupon.valid_till !== undefined) {
                     validDate = moment.unix(coupon.valid_till).utc().isAfter();
                  }
                  
                   
                   

                    if (coupon.discount_amount !== undefined && parseInt(coupon.discount_amount) > 0) {
                        dCoupons.price = coupon.discount_amount;
                    }
                    if(dCoupons.currency === plan.currency  && max_redemptions && planSupport && validDate) {
                        couponList.push(dCoupons);
                    }
                  
                    

                }
                if(couponList.length > 0 ) {
                    return res.json(getCard(data,couponList,"COUPON",id));
                }else {
                  let qtyError = {
                    error_msg: 'Sorry, No Coupons available.'
                }
                  
                    return sendCreatePage(data, chargebee, intercom, res,qtyError);
                }
                
            }
        }

        
    });


}
module.exports = {
    extraUI: (chargebee, intercom, res, action) => {
        let customerId = common.getCustomerId(intercom);

        var data = {
            oldInputs :intercom.input_values,
            addons: [],
            eventAddons: [],
            coupons: []

        };
        if (customerId !== undefined) {
            data.customerId = customerId;
        }


        if (intercom.current_canvas.stored_data.addons !== undefined) {
            data.addons = intercom.current_canvas.stored_data.addons;
        }
        if (intercom.current_canvas.stored_data.eventAddons !== undefined) {
            data.eventAddons = intercom.current_canvas.stored_data.eventAddons;
        }
        if (intercom.current_canvas.stored_data.coupons !== undefined) {
            data.coupons = intercom.current_canvas.stored_data.coupons;
        }
        var planId = intercom.input_values.CUSTOMER_PLAN_ID;
        var plan = getPlan(planId, intercom.current_canvas.stored_data.plans);

        let type = "";
        let remove = false;
        let id;
        if (action.startsWith('ADN-')) {
            type = "ADN";
            remove = action.startsWith('ADN-REM-');
            if (remove) {
                id = action.substring(8);
                return getAddon(data, chargebee, intercom, res, plan, id);
            } else {
                return getAddon(data, chargebee, intercom, res, plan);
            }

        } else if (action.startsWith('EADN-')) {
            type = "EADN";
            remove = action.startsWith('EADN-REM-');
            if (remove) {
                id = action.substring(9);
                return getEventAddon(data, chargebee, intercom, res, id);
            } else {
                return getEventAddon(data, chargebee, intercom, res);
            }
        } else if (action.startsWith('COUPON-')) {
            type = "COUPON";
            remove = action.startsWith('COUPON-REM-');
            if (remove) {
                id = action.substring(11);
                return getCoupons(data, chargebee, intercom, res, plan, id);
            } else {
                return getCoupons(data, chargebee, intercom, res, plan);
            }
        } else {
            return res.json({});
        }
    }
}