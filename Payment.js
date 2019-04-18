const common = require('./common');
const chargebee = require("chargebee");
const getCard = (data) => {
    let card = {
        canvas: {
            content: {
                components: [{
                        type: "text",
                        text: " UPDATE PAYMENT METHOD",
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
                        text: "An URL to update the payment method has been generated.",
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
            url: data.url

        }
    };
    if (data.customerId !== undefined) {
        card.canvas.stored_data.customerId = data.customerId;
    }
    card.canvas.content.components.push({
        type: "button",
        id: "GET-SUBSCRIPTION",
        label: "HOME",
        action: {
            type: "submit"
        }
    });

    return card;
}

const getErrorCard = (data) => {
    let card = {
        canvas: {
            content: {
                components: [{
                        type: "text",
                        text: " UPDATE PAYMENT METHOD",
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

            }
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
module.exports = {
    update: (chargebee, intercom, res) => {
        let customerId = intercom.current_canvas.stored_data.customerId;

        let email = intercom.customer.email;
        //email = 'shamim@keyvalue.systems'
        if (email === undefined) {
            email = '';
        }
        var data = {
            email: email,
            customerId: customerId
        };


        chargebee.customer.retrieve(customerId).request(function (error, result) {
            var customer = result.customer;
            var inputData = {
                customer: {
                    id: customer.id,
                }
            }

            var card = result.card;

            if (card !== undefined && card.gateway_account_id !== undefined) {
                inputData.card = {};
                inputData.card.gateway_account_id = card.gateway_account_id;

            }

            chargebee.hosted_page.manage_payment_sources(inputData).request(function (hostedPageError, hostedPageResult) {
                if (hostedPageError) {
                    data.error = hostedPageError.message;
                    return res.json(getErrorCard(data));
                } else {

                    var hosted_page = hostedPageResult.hosted_page;
                    data.url = hosted_page.url;
                    return res.json(getCard(data));
                }
            });

        });

    }

}