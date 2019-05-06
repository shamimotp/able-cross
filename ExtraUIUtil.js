const chargebee = require("chargebee");
const common = require('./common');
const SubscriptionUtil = require('./SubscriptionUtil');
const ExtraUtil = require('./ExtraUtil');
const validator = require('validator');

const removeAction = (data, chargebee, intercom, res, type, id) => {
    let list;
    let newList1 = [];
    let newList2;
    if (type === 'ADN') {
        list = data.addons;
    } else if (type === 'EADN') {
        list = data.eventAddons;
    } else if (type === 'COUPON') {
        list = data.coupons;
    }
    if (list !== undefined && list.length > 0) {

        for (var j = 0; j < list.length; j++) {
            if (list[j]['id'] !== id) {
                newList1.push(list[j]);
            }
        }
        if (newList1.length > 0) {
            newList2 = newList1;
        }
        if (type === 'ADN') {
            data.addons = newList2;
        } else if (type === 'EADN') {
            data.eventAddons = newList2;
        } else if (type === 'COUPON') {
            data.coupons = newList2;
        }

    }
    return cancelAction(data, chargebee, intercom, res);



}
const changeAction = (data, chargebee, intercom, res, type, id) => {
    let list;
    let newList1 = [];
    let newList2;
    if (type === 'ADN') {
        list = data.addons;
    } else if (type === 'EADN') {
        list = data.eventAddons;
    } else if (type === 'COUPON') {
        list = data.coupons;
    }
    if (list !== undefined && list.length > 0) {

        for (var j = 0; j < list.length; j++) {
            if (list[j]['id'] !== id) {
                newList1.push(list[j]);
            }
        }
        if (newList1.length > 0) {
            newList2 = newList1;
        }
        if (type === 'ADN') {
            data.addons = newList2;
        } else if (type === 'EADN') {
            data.eventAddons = newList2;
        } else if (type === 'COUPON') {
            data.coupons = newList2;
        }
    }
    return createAction(data, chargebee, intercom, res, type);


}
const createAction = (data, chargebee, intercom, res, type) => {
    var extraId = intercom.input_values.EXTRA_ID;
    if (extraId === "NOEXTRA") {
        return cancelAction(data, chargebee, intercom, res);
    } else {
        let list = data.addons;
        if (type === 'EADN') {
            list = data.eventAddons;
        } else if (type === 'COUPON') {
            list = data.coupons;
        }
        if (list === undefined) {
            list = [];
        }
        var flag = true;
        for (var j = 0; j < list.length; j++) {
            if (list[j]['id'] === extraId) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            return cancelAction(data, chargebee, intercom, res);
        } else {
            if (type === 'ADN') {
                return createAddon(data, chargebee, intercom, res, extraId);
            } else if (type === 'EADN') {
                return createEventAddon(data, chargebee, intercom, res, extraId);
            } else if (type === 'COUPON') {
                return createCoupon(data, chargebee, intercom, res, extraId);
            } else {
                return cancelAction(data, chargebee, intercom, res);
            }
        }

    }






}

const createAddon = (data, chargebee, intercom, res, id) => {
    let quantity = 1;
    if (intercom.input_values.CUSTOMER_ADDON_QTY !== undefined && validator.isInt(intercom.input_values.CUSTOMER_ADDON_QTY)) {
        quantity = parseInt(intercom.input_values.CUSTOMER_ADDON_QTY);
    }
    let list = data.addons;
    if (list === undefined) {
        list = [];
    }
    chargebee.addon.retrieve(id).request(function (addonerror, addonresult) {
        if (addonerror) {
            return cancelAction(data, chargebee, intercom, res);
        } else {
            var addon = addonresult.addon;
            var ot = {
                id: addon.id,
                name: addon.name,
                currency: addon.currency_code,
                price: addon.price,
                quantity: quantity
            }
            list.push(ot);
            data.addons = list;
            return cancelAction(data, chargebee, intercom, res);
        }


    });



}
const createEventAddon = (data, chargebee, intercom, res, id) => {

    let list = data.eventAddons;
    if (list === undefined) {
        list = [];
    }
    chargebee.addon.retrieve(id).request(function (addonerror, addonresult) {
        if (addonerror) {
            return cancelAction(data, chargebee, intercom, res);
        } else {
            var addon = addonresult.addon;
            var ot = {
                id: addon.id,
                name: addon.name,
                currency: addon.currency_code,
                price: addon.price
            }
            list.push(ot);
            data.eventAddons = list;
            return cancelAction(data, chargebee, intercom, res);
        }


    });
}
const createCoupon = (data, chargebee, intercom, res, id) => {
    // let list = data.coupons;
    let list = [];
    if (list === undefined) {
        list = [];
    }
    chargebee.coupon.retrieve(id).request(function (error, result) {
        if (error) {
            return cancelAction(data, chargebee, intercom, res);
        } else {
            var coupon = result.coupon;
            var ot = {
                id: coupon.id,
                name: coupon.name,
                currency: coupon.currency_code,
                price: 0
            }
            if (coupon.discount_amount !== undefined && parseInt(coupon.discount_amount) > 0) {
                ot.price = coupon.discount_amount;
            }
            list.push(ot);
            data.coupons = list;
            return cancelAction(data, chargebee, intercom, res);
        }

    });
}

const cancelAction = (data, chargebee, intercom, res) => {
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
    return SubscriptionUtil.createUI(chargebee, intercom, res, savedData);

};

const processAddons = (chargebee, intercom, res, action, data) => {
    let id;
    if (action.startsWith('ADN-')) {
        if (action.startsWith('ADN-REM-')) {
            id = action.substring(8);
            if (data.addonError !== undefined) {
                data.addonRemove = true;
                data.addonRemoveId = id;
                return ExtraUtil.reRenderextraUI(chargebee, intercom, res, data);
            } else {
                return removeAction(data, chargebee, intercom, res, "ADN", id);
            }

        } else if (action.startsWith('ADN-CHG-')) {
            id = action.substring(8);
            if (data.addonError !== undefined) {
                data.addonRemove = true;
                data.addonRemoveId = id;
                return ExtraUtil.reRenderextraUI(chargebee, intercom, res, data);
            } else {
                return changeAction(data, chargebee, intercom, res, "ADN", id);
            }
        } else if (action === "ADN-CREATE") {

            if (data.addonError !== undefined) {
                data.addonRemove = false;
                return ExtraUtil.reRenderextraUI(chargebee, intercom, res, data);
            } else {
                return createAction(data, chargebee, intercom, res, "ADN");
            }
        } else {
            return cancelAction(data, chargebee, intercom, res);
        }

    } else if (action.startsWith('EADN-')) {
        if (action.startsWith('EADN-REM-')) {
            id = action.substring(9);
            return removeAction(data, chargebee, intercom, res, "EADN", id);
        } else if (action.startsWith('EADN-CHG-')) {
            id = action.substring(9);
            return changeAction(data, chargebee, intercom, res, "EADN", id);
        } else if (action === "EADN-CREATE") {
            return createAction(data, chargebee, intercom, res, "EADN");
        } else {
            return cancelAction(data, chargebee, intercom, res);
        }
    } else if (action.startsWith('COUPON-')) {
        if (action.startsWith('COUPON-REM-')) {
            id = action.substring(11);
            return removeAction(data, chargebee, intercom, res, "COUPON", id);
        } else if (action.startsWith('COUPON-CHG-')) {
            id = action.substring(11);
            return changeAction(data, chargebee, intercom, res, "COUPON", id);
        } else if (action === "COUPON-CREATE") {
            return createAction(data, chargebee, intercom, res, "COUPON");
        } else {
            return cancelAction(data, chargebee, intercom, res);
        }
    } else {
        return res.json({});
    }
}
module.exports = {
    process: (chargebee, intercom, res, action) => {

        let customerId = common.getCustomerId(intercom);
        var data = {
            oldInputs: intercom.current_canvas.stored_data.oldInputs,
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
        if (action.startsWith('ADN-')) {
            var extraId = intercom.input_values.EXTRA_ID;
            if (extraId !== "NOEXTRA") {
                chargebee.addon.retrieve(extraId).request(function (addonerror, addonresult) {
                    if (addonerror) {
                        return processAddons(chargebee, intercom, res, action, data);
                    } else {
                        let addonQuantity = intercom.input_values.CUSTOMER_ADDON_QTY.trim();
                        if (validator.isEmpty(addonQuantity)) {
                            addonQuantity = 1;
                        } else {
                            addonQuantity = parseInt(addonQuantity);
                            if (addonQuantity >= 0) {
                                if (addonQuantity == 0) {
                                    addonQuantity = 1;
                                }
                            } else {
                                data.addonError = {
                                    error_msg: 'Please provide a valid quantity for the addon.'
                                };
                                data.extraInputs = intercom.input_values;
                            }
                        }
                        //intercom.input_values.CUSTOMER_ADDON_QTY = "'" + addonQuantity + "'";

                        var addon = addonresult.addon;
                        if(addon.pricing_model ==='flat_fee') {
                            if(addonQuantity > 1) {
                                data.addonError = {
                                    error_msg: 'Cannot pass quantity as the addon -'+addon.name+' does not allow quantity more than 1.'
                                };
                                data.extraInputs = intercom.input_values;
                            }
                        }


                        return processAddons(chargebee, intercom, res, action, data);

                    }
                });
            } else {
                return processAddons(chargebee, intercom, res, action, data);
            }
        } else {
            return processAddons(chargebee, intercom, res, action, data);
        }

    }
}