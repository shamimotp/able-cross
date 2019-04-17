module.exports = {
    process: (clist, email, res) => {
        let mCards = {
            canvas: {
                content: {
                    components: [{
                            type: "spacer",
                            size: "xl"
                        },
                        {
                            type: "text",
                            text: "Multiple customers exist in Chargebee for the email id, \"" + email + "\"",
                            style: "header",
                            align: "center"
                        },
                        {
                            type: "spacer",
                            size: "xl"
                        }
                    ]
                }
            }
        };
        let list = {
            type: "list",
            items: []
        }
        for (var i = 0; i < clist.length; i++) {
            var customer = clist[i].customer;

            var eItems = {
                type: "item",
                id: "c-list-" + customer.id,
                title: customer.first_name + " " + customer.last_name,
                subtitle: customer.email,
                tertiary_text: customer.company,
                action: {
                    type: "submit"
                }
            };
            list.items.push(eItems);
        }
        mCards.canvas.content.components.push(list);
        return res.json(mCards);

    },
  searchResult: (clist, res,searchText) => {
        let mCards = {
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
                            value:searchText,
                            action: {
                                type: "submit"
                            }
                        },
                        {
                            type: "spacer",
                            size: "m"
                        }
                    ]
                }
            }
        };
        let list = {
            type: "list",
            items: []
        }
        for (var i = 0; i < clist.length; i++) {
            var customer = clist[i].customer;

            var eItems = {
                type: "item",
                id: "c-list-" + customer.id,
                title: customer.first_name + " " + customer.last_name,
                subtitle: customer.email,
                tertiary_text: customer.company,
                action: {
                    type: "submit"
                }
            };
            list.items.push(eItems);
        }
        mCards.canvas.content.components.push(list);
    mCards.canvas.content.components.push(
                {
  type: "spacer",
                  size: "m"
});
    
        return res.json(mCards);

    }
}