const chargebee = require("chargebee");
const common = require('./common');
const CreateSubscription = require('./CreateSubscription');

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
  if (data.currentNrAddons !== undefined) {
    card.canvas.stored_data.nrAddons = data.currentNrAddons;

  }
  if (data.oldInputs !== undefined) {
    card.canvas.stored_data.oldInputs = data.oldInputs;

  }
  if (data.addons.length > 0) {
    var addonDrop = {
      type: "dropdown",
      id: "ADDON_ID",
      label: "SELECT NON RECURRING ADDON",
      save_state: "unsaved",
      options: [],
    }
    for (var i = 0; i < data.addons.length; i++) {
      if (i == 0) {
        addonDrop.value = data.addons[i].id;
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
      type: "spacer",
      size: "m"
    });
    card.canvas.content.components.push({
      type: "button",
      id: "ADD-NON-RECURRING-ADDON-CREATE",
      label: "ADD ADDON",
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
  process: (chargebee, intercom, res) => {
    let customerId = intercom.current_canvas.stored_data.customerId;
    var currentAddons = intercom.current_canvas.stored_data.nrAddons;
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
      data.currentNrAddons = currentAddons;
    }
    if (intercom.current_canvas.stored_data.addons) {
      data.currentAddons = intercom.current_canvas.stored_data.addons;
    }
    chargebee.addon.list({
      "status[is]": "active",
      "charge_type[is]": "non_recurring"
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
      return res.json(getCard(data));

    });
  },

  newAddon: (chargebee, intercom, res) => {

    let email = intercom.customer.email;
    if (email === undefined || email === "") {
      return common.getNoEmailCard(res);
    }
    var currentAddons = intercom.current_canvas.stored_data.nrAddons;

    if (currentAddons === undefined) {
      currentAddons = [];
    }
    var addonId = intercom.input_values.ADDON_ID;
    if (addonId === undefined) {
      return CreateSubscription.process(chargebee, intercom, res, intercom.current_canvas.stored_data.addons, currentAddons, intercom.current_canvas.stored_data.oldInputs);
    }
    if (addonId === 'SELECTADDON') {
      return CreateSubscription.process(chargebee, intercom, res, intercom.current_canvas.stored_data.addons, currentAddons, intercom.current_canvas.stored_data.oldInputs);
    }

    var flag = true;
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
          price: 0
        }
        if (parseInt(addon.price) > 0) {
          ot.price = parseFloat(parseInt(addon.price, 10) / 100).toFixed(2);
        }
        currentAddons.push(ot);
        return CreateSubscription.process(chargebee, intercom, res, intercom.current_canvas.stored_data.addons, currentAddons, intercom.current_canvas.stored_data.oldInputs);

      });
    } else {
      return CreateSubscription.process(chargebee, intercom, res, intercom.current_canvas.stored_data.addons, currentAddons, intercom.current_canvas.stored_data.oldInputs);
    }
  }


}