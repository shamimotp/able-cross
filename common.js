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
                            size: "xl"
                        }, {
                            type: "text",
                            text: "Customer dosen't  have email id.",
                            style: "error",
                            align: "center"
                        },
                        {
                            type: "spacer",
                            size: "xl"
                        },
                        {
                            type: "divider"
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
                            size: "xl"
                        }, {
                            type: "text",
                            text: "Customer with this email id '" + email + "' dosen't exist in Chargebee",
                            style: "header",
                            align: "center"
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
                        }
                    ]
                },
                stored_data: {

                }
            }
        };
        return res.json(card);
    }

}