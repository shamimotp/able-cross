const common = require('./common');
const chargebee = require("chargebee");
const CustomerList = require("./CustomerList");
const Customer = require("./Customer");
const validator = require('validator');

const getByMail = (chargebee, intercom, res) => {
    let email = intercom.customer.email;
    if (email === undefined || email === "") {
        return common.getNoEmailCard(res);
    }
    chargebee.customer.list({
        "email[is]": email
    }).request(
        function (error, result) {
            if (result.list.length === 0) {
                return common.getNoCustomerCard(res, email);
            }
            if (result.list.length == 1) {
                var entry = result.list[0]
                return Customer.get(chargebee, res, entry.customer, intercom);
            }
            if (result.list.length > 1) {
                return CustomerList.process(result.list, email, res);
            }
        }
    );
};

const searchByMail = (chargebee, intercom, res, email) => {
    chargebee.customer.list({
        "email[is]": email
    }).request(
        function (error, result) {
            if (result.list.length === 0) {
                return common.getNoCustomerCard(res, email);
            } else {
                return CustomerList.searchResult(result.list, res, email);
            }
        }
    );
};

const searchByCompany = (chargebee, intercom, res, company) => {
    chargebee.customer.list({
        "company[is]": company
    }).request(
        function (error, result) {
            if (result.list.length === 0) {
                return common.getNoEmailCard(res);
            } else {
                return CustomerList.searchResult(result.list, res, company);
            }
        }
    );
};

const process = (chargebee, intercom, res, cId) => {
    if (cId !== undefined && cId !== '') {
        chargebee.customer.retrieve(cId).request(function (error, result) {
            if (error) {
                return getByMail(chargebee, intercom, res);
            } else {
                return Customer.get(chargebee, res, result.customer, intercom);
            }
        });
    } else {
        return getByMail(chargebee, intercom, res);
    }

};
module.exports = {
    getCustomer: (chargebee, intercom, res, cId) => {
        return process(chargebee, intercom, res, cId);
    },
    refresh: (chargebee, intercom, res) => {
        let customerId = common.getCustomerId(intercom);
        return process(chargebee, intercom, res, customerId);
    },

    search(chargebee, intercom, res) {
        let searchText = '';
        if (intercom.input_values && intercom.input_values.SEARCH) {
            searchText = intercom.input_values.SEARCH;
        }

        if (intercom.current_canvas.stored_data !== undefined && intercom.current_canvas.stored_data.cSavedSearch2 !== undefined) {
            searchText = intercom.current_canvas.stored_data.cSavedSearch2;
        }
        if (searchText !== undefined && searchText.trim() !=='') {
            searchText = searchText.trim();
            if (validator.isEmail(searchText)) {
                return searchByMail(chargebee, intercom, res, searchText);
            } else {
                return searchByCompany(chargebee, intercom, res, searchText);
            }
        } else {
            return process(chargebee, intercom, res);
        }


    }
}