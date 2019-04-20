const chargebee = require("chargebee");
const common = require('./common');
const CreateSubscription = require('./CreateSubscription');

const getCard = (data, caddonId) => {
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
  if (data.currentAddons !== undefined) {
    card.canvas.stored_data.addons = data.currentAddons;

  }
  if (data.nrCurrentAddons !== undefined) {
    card.canvas.stored_data.nrAddons = data.nrCurrentAddons;

  }
  if (data.oldInputs !== undefined) {
    card.canvas.stored_data.oldInputs = data.oldInputs;

  }
  if (data.addons.length > 0) {

    var addonDrop = {
      type: "dropdown",
      id: "ADDON_ID",
      label: "SELECT RECURRING ADDON",
      save_state: "unsaved",
      value: caddonId,
      options: [],
    }
    for (var i = 0; i < data.addons.length; i++) {
      if (i == 0) {
        addonDrop.options.push({
          type: "option",
          id: 'SELECTADDON',
          text: 'SELECT'
        });
      }
      var ot = {
        type: "option",
        id: data.addons[i].id,
        text: data.addons[i].name
      }
      if (data.addons[i].price > 0) {
        ot.text = ot.text + " " + data.addons[i].currency + " " + data.addons[i].price;
      }
      addonDrop.options.push(ot);
    }

    card.canvas.content.components.push(addonDrop);
    card.canvas.content.components.push({
      type: "input",
      id: "CUSTOMER_ADDON_QTY",
      label: "QUANTITY",
      save_state: "unsaved",

    });
    card.canvas.content.components.push({
      type: "spacer",
      size: "m"
    });
    card.canvas.content.components.push({
      type: "button",
      id: "CHANGE-RECURRING-ADDON-" + caddonId,
      label: "CHANGE ADDON",
      action: {
        type: "submit"
      }
    });
    card.canvas.content.components.push({
      type: "button",
      id: "REMOVE-RECURRING-ADDON-" + caddonId,
      label: "REMOVE ADDON",
      action: {
        type: "submit"
      },
      style: 'secondary'

    });
    card.canvas.content.components.push({
      type: "spacer",
      size: "m"
    });
  } else {
    card.canvas.content.components.push({
      type: "text",
      text: "No Addons avaialable",
      align: "left",
      style: "error"

    });
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

module.exports = {
  process: (chargebee, intercom, res, addonId) => {
    let customerId = intercom.current_canvas.stored_data.customerId;
    var currentAddons = intercom.current_canvas.stored_data.addons;

    let email = intercom.customer.email;
    if (email === undefined || email === "") {
      return common.getNoEmailCard(res);
    }
    var data = {
      email: email,
      customerId: customerId,
      addons: [],
      oldInputs: intercom.input_values,
    };
    if (currentAddons !== undefined) {
      data.currentAddons = currentAddons;
    }
    if (intercom.current_canvas.stored_data.nrAddons !== undefined) {
      data.nrCurrentAddons = intercom.current_canvas.stored_data.nrAddons;
    }


    var planId = intercom.input_values.CUSTOMER_PLAN_ID;
    chargebee.plan.retrieve(planId).request(function (error, result) {
      var plan = result.plan;
      chargebee.addon.list({
        "status[is]": "active",
        "charge_type[is]": "recurring",
        "period[is]": plan.period,
        "period_unit[is]": plan.period_unit
      }).request(function (addonerror, addonresult) {

        for (var i = 0; i < addonresult.list.length; i++) {
          var addon = addonresult.list[i].addon;
          var ot = {
            id: addon.id,
            name: addon.name,
            currency: addon.currency_code,
            price: 0
          }
          if (parseInt(addon.price) > 0) {
            ot.price = parseFloat(parseInt(addon.price, 10) / 100).toFixed(2);
          }
          data.addons.push(ot);

        }
        return res.json(getCard(data, addonId));

      });

    });

  },
  change: (chargebee, intercom, res, curAddonId) => {

    let email = intercom.customer.email;
    if (email === undefined || email === "") {
      return common.getNoEmailCard(res);
    }
    var currentAddons = intercom.current_canvas.stored_data.addons;

    if (currentAddons === undefined) {
      currentAddons = [];
    }
    var addonId = intercom.input_values.ADDON_ID;
    var quantity = intercom.input_values.CUSTOMER_ADDON_QTY;
    if (addonId === undefined || addonId === 'SELECTADDON' || curAddonId === addonId) {
      return CreateSubscription.process(chargebee, intercom, res, currentAddons, intercom.current_canvas.stored_data.nrAddons, intercom.current_canvas.stored_data.oldInputs);
    }

    var flag = true;

    var newSetAddons = [];
    for (var j = 0; j < currentAddons.length; j++) {
      if (currentAddons[j]['id'] !== curAddonId) {
        newSetAddons.push(currentAddons[j]);
      }
    }
    currentAddons = newSetAddons;

    for (var j = 0; j < currentAddons.length; j++) {
      if (currentAddons[j]['id'] === addonId) {
        flag = false;
        break;
      }
    }
    if (flag) {
      chargebee.addon.retrieve(addonId).request(function (addonerror, addonresult) {
        var addon = addonresult.addon;
        var ot = {
          id: addon.id,
          name: addon.name,
          currency: addon.currency_code,
          price: 0,
          quantity: quantity
        }
        if (parseInt(addon.price) > 0) {
          ot.price = parseFloat(parseInt(addon.price, 10) / 100).toFixed(2);
        }
        currentAddons.push(ot);
        return CreateSubscription.process(chargebee, intercom, res, currentAddons, intercom.current_canvas.stored_data.nrAddons, intercom.current_canvas.stored_data.oldInputs);

      });
    } else {
      return CreateSubscription.process(chargebee, intercom, res, currentAddons, intercom.current_canvas.stored_data.nrAddons, intercom.current_canvas.stored_data.oldInputs);
    }



  },
  remove: (chargebee, intercom, res, curAddonId) => {
    let email = intercom.customer.email;
    if (email === undefined || email === "") {
      return common.getNoEmailCard(res);
    }
    var currentAddons = intercom.current_canvas.stored_data.addons;

    if (currentAddons === undefined) {
      currentAddons = [];
    }

    var newSetAddons = [];
    for (var j = 0; j < currentAddons.length; j++) {
      if (currentAddons[j]['id'] !== curAddonId) {
        newSetAddons.push(currentAddons[j]);
      }
    }
    currentAddons = newSetAddons;
    return CreateSubscription.process(chargebee, intercom, res, currentAddons, intercom.current_canvas.stored_data.nrAddons, intercom.current_canvas.stored_data.oldInputs);
  }

}