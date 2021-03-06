import { Fields, Users } from '../../db/models';
import { IFieldDocument, IFieldGroupDocument } from '../../db/models/definitions/fields';

export const field = {
  lastUpdatedUser(root: IFieldDocument) {
    const { lastUpdatedUserId } = root;

    // Returning user who updated the field last
    return Users.findOne({ _id: lastUpdatedUserId });
  },
};

export const fieldsGroup = {
  fields(root: IFieldGroupDocument) {
    // Returning all fields that are related to the group
    return Fields.find({ groupId: root._id });
  },

  lastUpdatedUser(fieldGroup: IFieldGroupDocument) {
    const { lastUpdatedUserId } = fieldGroup;

    // Returning user who updated the group last
    return Users.findOne({ _id: lastUpdatedUserId });
  },
};
