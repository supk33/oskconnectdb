const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Shop = sequelize.define('Shop', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  shopName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.GEOMETRY('POINT', 4326), // SRID 4326 for WGS84
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  images: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  promotions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  menu: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  openingHours: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'shops',
  timestamps: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['ownerId']
    },
    {
      fields: ['location'],
      using: 'GIST'
    }
  ]
});

// Instance method to get coordinates
Shop.prototype.getCoordinates = function() {
  if (this.location && this.location.coordinates) {
    return {
      longitude: this.location.coordinates[0],
      latitude: this.location.coordinates[1]
    };
  }
  return null;
};

// Instance method to set coordinates
Shop.prototype.setCoordinates = function(longitude, latitude) {
  this.location = {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
};

// Instance method to calculate distance from a point
Shop.prototype.distanceFrom = function(longitude, latitude) {
  if (!this.location) return null;
  
  const query = `
    SELECT ST_Distance(
      location::geography,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
    ) as distance
    FROM shops
    WHERE id = $3
  `;
  
  return sequelize.query(query, {
    replacements: [longitude, latitude, this.id],
    type: sequelize.QueryTypes.SELECT
  });
};

// Static method to find shops near a point
Shop.findNearby = function(longitude, latitude, radiusKm = 10, limit = 50) {
  const query = `
    SELECT *,
      ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      ) as distance
    FROM shops
    WHERE status = 'approved'
      AND ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3 * 1000
      )
    ORDER BY distance
    LIMIT $4
  `;
  
  return sequelize.query(query, {
    replacements: [longitude, latitude, radiusKm, limit],
    type: sequelize.QueryTypes.SELECT,
    model: Shop
  });
};

module.exports = Shop;
