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
    getErrorCard: (res) => {
        let card = {
            canvas: {
                content: {
                    components: [{
                        type: "text",
                        text: "Chargebee API Error",
                        style: "error"
                    }]
                }
            }
        };
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

    }

}