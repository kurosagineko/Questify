export default (sequelize, DataTypes) => {
	return sequelize.define(
		'User',
		{
			id: {
				type: DataTypes.INTEGER.UNSIGNED,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true,
			},
			username: {
				type: DataTypes.STRING(50),
				unique: true,
				allowNull: false,
			},
			email: {
				type: DataTypes.STRING(150),
				unique: true,
				allowNull: false,
			},
			password_hash: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
			level: {
				type: DataTypes.INTEGER.UNSIGNED,
				defaultValue: 1,
				allowNull: false,
			},
			total_xp: {
				type: DataTypes.INTEGER.UNSIGNED,
				defaultValue: 0,
				allowNull: false,
			},
			current_xp: {
				type: DataTypes.INTEGER.UNSIGNED,
				defaultValue: 0,
				allowNull: false,
			},
			theme: {
				type: DataTypes.STRING(50),
				defaultValue: 'navy',
				allowNull: false,
			},
			avatar_url: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
		},
		{
			tableName: 'Users',
			timestamps: false,
			paranoid: true,
			underscored: true,
		}
	);
};
