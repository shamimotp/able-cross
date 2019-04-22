module.exports = {
    getNoAuthCard: (res) => {
        let card = {
            canvas: {
                content: {
                    components: [{
                        type: "text",
                        text: "Chargebee Authentication Failed",
                        style: "error"
                    }]
                },
                stored_data: {} //optional
            }
        };
        return res.json(card);
    },
    getNoEmailCard: (res) => {
        let card = {
            canvas: {
                content: {
                    components: [{
                            type: "spacer",
                            size: "m"
                        }, {
                            type: "text",
                            text: "Customer with this email id dosen't  exist in Chargebee.",
                            align: "center"
                        },
                        {
                            type: "input",
                            id: "SEARCH",
                            placeholder: "SEARCH BY EMAIL,COMPANY NAME",
                            save_state: "unsaved",
                            action: {
                                type: "submit"
                            }
                        },
                        {
                            type: "spacer",
                            size: "xl"
                        },
                        {
                            type: "spacer",
                            size: "xl"
                        },
                        {
                            type: "divider"
                        },
                        {
                            type: "button",
                            id: "REFRESH",
                            label: "REFRESH",

                            action: {
                                type: "submit"
                            }
                        }
                    ]
                }
            }
        };
        return res.json(card);
    },
    getErrorCard: (res, msg) => {
        let card = {
            canvas: {
                content: {
                    components: [{
                        type: "text",
                        text: "Error",
                        style: "error"
                    }]
                }
            }
        };
        if (msg !== undefined && msg.trim() !== '') {
            card.canvas.content.components.push({
                type: "text",
                text: msg,
                style: "error"
            });
        }
        return res.json(card);
    },
    getNoCustomerCard: (res, email) => {
        let card = {
            canvas: {
                content: {
                    components: [{
                            type: "spacer",
                            size: "m"
                        }, {
                            type: "text",
                            text: "Customer with this email id dosen't  exist in Chargebee.",
                            style: "header",
                            align: "center"
                        },
                        {
                            type: "input",
                            id: "SEARCH",
                            placeholder: "SEARCH BY EMAIL,COMPANY NAME",
                            save_state: "unsaved",
                            action: {
                                type: "submit"
                            }
                        },
                        {
                            type: "spacer",
                            size: "xl"
                        },
                        {
                            type: "spacer",
                            size: "xl"
                        },
                        {
                            type: "divider"
                        },
                        {
                            type: "button",
                            id: "CREATE-NEW-SUBSCRIPTION",
                            label: "CREATE NEW SUBSCRIPTION",
                            action: {
                                type: "submit"
                            }
                        },
                        {
                            type: "button",
                            id: "REFRESH",
                            label: "REFRESH",

                            action: {
                                type: "submit"
                            }
                        }
                    ]
                },
                stored_data: {

                }
            }
        };
        return res.json(card);
    },
    getCustomerId: (intercom) => {
        let customerId;
        if (intercom.current_canvas.stored_data !== undefined) {
            customerId = intercom.current_canvas.stored_data.customerId;
        }
        return customerId;

    },
    getCustomerList: (customer, preText) => {
        let name = '';
        if (customer.first_name !== undefined) {
            name = customer.first_name;
        }
        if (customer.last_name !== undefined) {
            name = name + ' ' + customer.last_name;
        }
        name = name.trim();
        let email = '';
        if (customer.email !== undefined) {
            email = customer.email;
        }
        email = email.trim();

        let company = '';
        if (customer.company !== undefined) {
            company = customer.company;
        }
        company = company.trim();



        if (name === '') {
            name = email;
            email = company;
            company = '';
        }
        if (name === '') {
            name = email;
            email = '';
        }
        if (name === '') {
            name = customer.id;
        }

        let items = {
            type: "item",
            id: customer.id,
            title: name
        };
        if (preText !== undefined) {
            items.id = preText + customer.id;
            items.action = {
                type: "submit"
            }
        }
        if (email !== '') {
            items.subtitle = email;
        }
        if (company !== '') {
            items.tertiary_text = company;
        }

        let list = {
            type: "list",
            items: [items]
        }
        return list;
    },
    isEmpty: (error, result) => {
        if (error) {
            return true;
        } else if (result.list.length == 0) {
            return true;
        } else {
            return false;
        }
    },
    getSubscrpitionIcon : (status) => {
        if(status === undefined) {
            return "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Factive.png?1554737072188";
        }     
        if (status === 'cancelled') {
            return "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fcancelled.png?1554817238700";
        }
        if (status === 'future') {
            return "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Ffuture.png?1554817240361";
        }
        if (status === 'in_trial') {
            return "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fintrail.png?1554817242486";
        }
        if (status === 'non_renewing') {
            return "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fnonrenewing.png?1554817244248";
        }
        if (status === 'paused') {
            return "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Fpaused.png?1554817245989";
        }
      return "https://cdn.glitch.com/ec44948e-b454-4bba-87ed-fa87202a04d1%2Factive.png?1554737072188";
    }


}