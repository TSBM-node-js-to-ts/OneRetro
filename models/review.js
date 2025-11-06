module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'reviews',
    timestamps: true,
    underscored: true
  });

  return Review;
};
