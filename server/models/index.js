const User = require('./User');
const Shop = require('./Shop');

// Define associations
User.hasMany(Shop, {
  foreignKey: 'ownerId',
  as: 'shops',
  onDelete: 'CASCADE'
});

Shop.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});

module.exports = {
  User,
  Shop
};
