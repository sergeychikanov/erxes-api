import { Companies, ActivityLogs } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions';

const companyMutations = {
  /**
   * Create new company also adds Company registration log
   * @return {Promise} company object
   */
  async companiesAdd(root, doc, { user }) {
    const company = await Companies.createCompany(doc);
    await ActivityLogs.createCompanyRegistrationLog(company, user);
    return company;
  },

  /**
   * Update company
   * @return {Promise} company object
   */
  async companiesEdit(root, { _id, ...doc }) {
    return Companies.updateCompany(_id, doc);
  },

  /**
   * Add new companyId to company's companyIds list also adds Customer registration log
   * @param {Object} args - Graphql input data
   * @param {String} args._id - Company id
   * @param {String} args.name - Customer name
   * @param {String} args.email - Customer email
   * @return {Promise} newly created customer
   */
  async companiesAddCustomer(root, args, { user }) {
    const customer = Companies.addCustomer(args);
    await ActivityLogs.createCustomerRegistrationLog(customer, user);
    return customer;
  },
};

moduleRequireLogin(companyMutations);

export default companyMutations;