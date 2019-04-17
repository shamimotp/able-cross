const moment = require('moment');
const chargebee = require("chargebee");
const common = require('./common');

const getCard = (data) => {
    let card = {
        canvas: {
            content: {
                components: [{
                        type: "list",
                        items: [{
                            type: "item",
                            id: data.customerId,
                            title: data.customerName,
                            subtitle: data.customerEmail,
                            tertiary_text: data.customerCompany
                        }]
                    },
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
                    {
                        type: "data-table",
                        items: [{
                                type: "field-value",
                                field: "Customer since:",
                                value: data.createdAt
                            },
                            {
                                type: "field-value",
                                field: "Promotional credits:",
                                value: data.promotionalCredits
                            }, {
                                type: "field-value",
                                field: "Unbilled charges:",
                                value: data.unbilledCharges
                            },
                            {
                                type: "field-value",
                                field: "Refundable credits:",
                                value: data.refundableCredits
                            },
                            {
                                type: "field-value",
                                field: "Payament Card:",
                                value: data.card
                            }
                        ]
                    },
                    {
                        type: "divider"
                    },
                    {
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
                    },
                    {
                        type: "text",
                        text: "INVOICES",
                        align: "left",
                        style: "header"
                    },
                ]
            },
          stored_data: {
              customerId : data.customerId
            } 
        }
    };
    for (var i = 0; i < data.invoice.length; i++) {
        card.canvas.content.components.push({
            type: "text",
            text: data.invoice[i].title,
            align: "left",
            style: "header"
        });
        card.canvas.content.components.push({
            type: "image",
            url: data.invoice[i].imageURL,
            align: "left",
            width: 65,
            height: 19
        });
        card.canvas.content.components.push({
            type: "data-table",
            items: [{
                type: "field-value",
                field: "Invoice date:",
                value: data.invoice[i].iDate
            }, 
            {
                type: "field-value",
                field: "Billing period:",
                value: data.invoice[i].billingPeriod
            },
            {
                type: "field-value",
                field: "Paid on:",
                value: data.invoice[i].paidOn
            }]
        });
        card.canvas.content.components.push({
                        type: "divider"
                    });
       
    }
  
    return card;
}


module.exports = {
    process: (db, intercom, res) => {
      let customerId = intercom.current_canvas.stored_data.customerId;
      
        db.get('SELECT * from Dreams where id= "' + intercom.admin.id + '"', function (err, row) {
            if (row) {
                let cbUser = row;
                chargebee.configure({
                    site: cbUser.sitename,
                    api_key: cbUser.apikey
                });
                chargebee.customer.retrieve(customerId).request(function (error, result) {
                    if (error) {
                        console.log(error);
                    } else {
                        var customer = result.customer;
                        let data = {
                            customerId: customer.id,
                            customerName: customer.first_name + " " + customer.last_name,
                            customerEmail: customer.email,
                            customerCompany: customer.company,
                            createdAt: moment.unix(customer.created_at).utc().format('ll'),
                            promotionalCredits: customer.promotional_credits,
                            unbilledCharges: customer.unbilled_charges,
                            refundableCredits: customer.refundable_credits,
                            subscriptionCount: 0,
                            card:'',
                             hasCard:false,
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
                                            paidOn: '',
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
                                        }
                                        
                                        data.invoice.push(variObject);

                                    }
                                }
                                return res.json(getCard(data));

                            });
                        });
                    }
                });

            } else {
                 return common.getNoAuthCard(res);
            }
        });
        //End
    }
}