module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'reviews',
    timestamps: true,
    underscored: true, //기본적으로 sequelize는 camelCase => underscored로 바꿔 저장하게 해줌
    paranoid: true,
    //한국어 content 저장을 위한 
    charset: 'utf8',
    collate: 'utf8_general_ci'
  });

  return Review;
};
