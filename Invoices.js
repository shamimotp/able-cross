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
                    },
                  {
                        type: "text",
                        text: "Customer ID:  " + "[" + data.customer.id  + "](" +  data.customer.url + ")",
                        align: "left",        
                        
                    }
                ]
            },
            stored_data: {
                customerId: data.customer.id
            }
        }
    };
    let profile = common.getCustomerProfile(data);
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
                text: "Subscriptions ",

            },
            {
                type: "option",
                id: "Invoices",
                text: "Invoices ",
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
      if(data.invoice[i].subscription_id !== undefined ) {
            card.canvas.content.components.push({
            type: "text",
            text: data.invoice[i].subscription_id,
            align: "left",
            style: "muted"
        });
          
      }

        let oneInvoice = {
            type: "data-table",
            items: []
        };
        for(var j=0;j<data.invoice[i].fields.length; j++) {
            oneInvoice.items.push({
                type: "field-value",
                field: data.invoice[i].fields[j].key,
                value: data.invoice[i].fields[j].value,
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
                        url: intercom.chargebee.cbURL+"admin-console/customers/"+customer.id,
                        first_name: customer.first_name,
                        last_name: customer.last_name,
                        email: customer.email,
                        company: customer.company,
                        createdAt: moment.unix(customer.created_at).utc().format('ll'),
                        currency_code: customer.preferred_currency_code,
                        unbilled_charges: customer.unbilled_charges,
                        totalDue: customer.preferred_currency_code + " ",
                    },
                    subscriptionCount: 0,
                    card: '',
                    hasCard: false,
                    invoice: []
                };
                if (result.card !== undefined) {
                    data.card = result.card.card_type + " ending " + result.card.last4;
                    data.hasCard = true;
                }
                if (parseInt(data.customer.unbilled_charges) > 0) {
                    data.customer.totalDue = data.customer.totalDue + parseFloat(parseInt(data.customer.unbilled_charges, 10) / 100).toFixed(2);
                } else {
                    data.customer.totalDue = data.customer.totalDue + "0.00";
                }

                if (customer.auto_collection !== undefined) {
                    data.customer.auto_collection = customer.auto_collection;
                }

                chargebee.invoice.list({
                    limit: 5,
                    "customer_id[is]": customerId,
                    "sort_by[desc]": "date"
                }).request(function (invoiceError, invoiceResult) {
                    if (error) {
                        console.log(invoiceError);
                    } else {
                        for (var i = 0; i < invoiceResult.list.length; i++) {
                          
                          var invoice = invoiceResult.list[i].invoice;
                          var invoiceUrl = intercom.chargebee.cbURL+"admin-console/invoices/"+invoice.id;

                            var variObject = {
                                title: "[" +  invoice.id  + "](" +  invoiceUrl + "), " + invoice.currency_code,
                                status: invoice.status,
                                fields: [{
                                    key: "Invoice date:",
                                    value: moment.unix(invoice.date).utc().format('ll'),
                                }],
                                

                            }
                            if (invoice.subscription_id !== undefined) {
                              var subUrl = intercom.chargebee.cbURL+"admin-console/subscriptions/"+invoice.subscription_id;
                               variObject.subscription_id = "Subscription ID: " + "[" +  invoice.subscription_id  + "](" +  subUrl + ")";
                                
                            } else {
                                if (invoice.line_items !== undefined && invoice.line_items.length > 0) {
                                  var subUrl = intercom.chargebee.cbURL+"admin-console/subscriptions/"+invoice.line_items[0].subscription_id;
                                  variObject.subscription_id = "Subscription ID: " + "[" +  invoice.line_items[0].subscription_id  + "](" +  subUrl + ")";                                   
                                }
                            }
                            if (invoice.recurring !== undefined && invoice.recurring) {
                                variObject.fields.push({
                                    key: "Recurring:",
                                    value: "Recurring"
                                });

                            } else {
                                variObject.fields.push({
                                    key: "Recurring:",
                                    value: "One time"
                                });
                            }
                            if (invoice.status === "paid") {
                                variObject.imageURL = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fpaid.png?1554824815739";
                                if (invoice.total !== undefined && parseInt(invoice.total) > 0) {
                                    variObject.title = variObject.title + ' ' + parseFloat(parseInt(invoice.total, 10) / 100).toFixed(2);
                                } else {
                                    variObject.title = variObject.title + ' 0.00';
                                }
                                if (invoice.paid_at !== undefined) {
                                    variObject.fields.push({
                                        key: "Paid on:",
                                        value: moment.unix(invoice.paid_at).utc().format('ll')
                                    });
                                }
                            } else {
                                variObject.imageURL = "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fdue.png?1554824815540";

                                if (invoice.due_date !== undefined) {
                                    variObject.fields.push({
                                        key: "Due date:",
                                        value: moment.unix(invoice.due_date).utc().format('ll')
                                    });

                                }
                                if (invoice.amount_due !== undefined && parseInt(invoice.amount_due) > 0)
                                    variObject.fields.push({
                                        key: "Due Amount:",
                                        value: invoice.currency_code + " " + parseFloat(parseInt(invoice.amount_due, 10) / 100).toFixed(2),
                                    });

                            }
                            data.invoice.push(variObject);
                        }
                    }
                    return res.json(getCard(data));
                });
            }
        });
        //End
    }
}