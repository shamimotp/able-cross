const moment = require('moment');
const chargebee = require("chargebee");
const common = require('./common');

const getCard = (data) => {
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
                    }
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
            value: data.createdAt
        }]
    };
    if (data.promotionalCredits > 0) {
        profile.items.push({
            type: "field-value",
            field: "Promotional credits:",
            value: data.promotionalCredits
        });
    }
    if (data.unbilledCharges > 0) {
        profile.items.push({
            type: "field-value",
            field: "Unbilled charges:",
            value: data.unbilledCharges
        });
    }
    if (data.refundableCredits > 0) {
        profile.items.push({
            type: "field-value",
            field: "Refundable credits:",
            value: data.refundableCredits
        });
    }

    if (data.hasCard) {
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
        id: "GET-SUBSCRIPTION",
        value: "Subscriptions",
        save_state: "unsaved",
        options: [{
                type: "option",
                id: "Subscriptions",
                text: "Subscriptions (" + data.subscriptionCount + ")",

            },
            {
                type: "option",
                id: "Invoices",
                text: "Invoices (" + data.invoiceCount + ")",
                disabled: true
            }
        ],
        action: {
            type: "submit"
        },
    });
    card.canvas.content.components.push({
        type: "text",
        text: "INVOICES",
        align: "left",
        style: "header"
    });

    if (data.invoice.length < 1) {
        card.canvas.content.components.push({
            type: "spacer",
            size: "m"
        });
        card.canvas.content.components.push({
            type: "text",
            text: "Invoices aren’t created for this customer yet",
            align: "center",
            style: "header"
        });
        card.canvas.content.components.push({
            type: "spacer",
            size: "xl"
        });
        card.canvas.content.components.push({
            type: "divider"
        });

    }
    for (var i = 0; i < data.invoice.length; i++) {
        card.canvas.content.components.push({
            type: "text",
            text: data.invoice[i].title,
            align: "left",
            style: "header"
        });
        if (data.invoice[i].imageURL !== undefined) {
            card.canvas.content.components.push({
                type: "image",
                url: data.invoice[i].imageURL,
                align: "left",
                width: 65,
                height: 19
            });
        }

        let oneInvoice = {
            type: "data-table",
            items: [{
                type: "field-value",
                field: "Invoice date:",
                value: data.invoice[i].iDate
            }]
        };
        if (data.invoice[i].billingPeriod !== undefined) {
            oneInvoice.items.push({
                type: "field-value",
                field: "Billing period:",
                value: data.invoice[i].billingPeriod
            });
        }
        if (data.invoice[i].paidOn !== undefined) {
            oneInvoice.items.push({
                type: "field-value",
                field: "Paid on:",
                value: data.invoice[i].paidOn
            });
        }
        card.canvas.content.components.push(oneInvoice);
        card.canvas.content.components.push({
            type: "divider"
        });

    }



    return card;
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
                        company: customer.company
                    },
                    createdAt: moment.unix(customer.created_at).utc().format('ll'),
                    promotionalCredits: customer.promotional_credits,
                    unbilledCharges: customer.unbilled_charges,
                    refundableCredits: customer.refundable_credits,
                    subscriptionCount: 0,
                    card: '',
                    hasCard: false,
                    invoiceCount: 0,
                    invoice: []
                };
                if (result.card !== undefined) {
                    data.card = result.card.card_type + " ending " + result.card.last4;
                    data.hasCard = true;
                }
                chargebee.subscription.list({
                    limit: 100,
                    "customer_id[is]": customerId
                }).request(function (subscriptionError, subscriptionResult) {
                    data.subscriptionCount = subscriptionResult.list.length;
                    chargebee.invoice.list({
                        limit: 100,
                        "customer_id[is]": customerId
                    }).request(function (invoiceError, invoiceResult) {
                        if (error) {
                            console.log(invoiceError);
                        } else {
                            data.invoiceCount = invoiceResult.list.length;

                            for (var i = 0; i < invoiceResult.list.length; i++) {
                                var invoice = invoiceResult.list[i].invoice;

                                var variObject = {
                                    title: invoice.id + ", " + invoice.currency_code,
                                    iDate: moment.unix(invoice.date).utc().format('ll'),
                                    status: invoice.status

                                }
                                if (parseInt(invoice.total) > 0) {
                                    variObject.title = variObject.title + ' ' + parseFloat(parseInt(invoice.total, 10) / 100).toFixed(2);
                                    variObject.billingPeriod = moment.unix(invoice.line_items[0].date_from).utc().format('ll') + ' to ' + moment.unix(invoice.line_items[0].date_to).utc().format('ll');
                                    if (invoice.paid_at !== undefined) {
                                        variObject.paidOn = moment.unix(invoice.paid_at).utc().format('ll');
                                        variObject.imageURL = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fpaid.png?1554824815739";
                                    } else {
                                        variObject.imageURL = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fdue.png?1554824815540";
                                    }
                                } else {
                                    variObject.title = variObject.title + ' 0';
                                }

                                data.invoice.push(variObject);

                            }
                        }
                        return res.json(getCard(data));

                    });
                });
            }
        });
        //End
    }
}