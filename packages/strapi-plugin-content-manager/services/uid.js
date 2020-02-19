'use strict';

const _ = require('lodash');
const slugify = require('@sindresorhus/slugify');

module.exports = {
  async generateUIDField({ contentTypeUID, field, data }) {
    const contentType = strapi.contentTypes[contentTypeUID];
    const { attributes } = contentType;

    const targetField = _.get(attributes, [field, 'targetField']);
    const targetValue = _.get(data, targetField);

    if (!_.isEmpty(targetValue)) {
      return this.findUniqueUID({
        contentTypeUID,
        field,
        value: slugify(targetValue),
      });
    }

    return this.findUniqueUID({
      contentTypeUID,
      field,
      value: slugify(contentType.modelName),
    });
  },

  async findUniqueUID({ contentTypeUID, field, value }) {
    const query = strapi.db.query(contentTypeUID);

    const possibleColisions = await query
      .find({
        [`${field}_contains`]: value,
        _limit: -1,
      })
      .then(results => results.map(result => result[field]));

    if (possibleColisions.length === 0) {
      return value;
    }

    let i = 1;
    let tmpUId = `${value}-${i}`;
    while (possibleColisions.includes(tmpUId)) {
      i += 1;
      tmpUId = `${value}-${i}`;
    }

    return tmpUId;
  },

  async checkUIDAvailability({ contentTypeUID, field, value }) {
    const query = strapi.db.query(contentTypeUID);

    const count = await query.count({
      [field]: value,
    });

    if (count > 0) return false;
    return true;
  },
};
