module.exports = (User, Season, Application) => {
	const hash = '$2a$08$3geUw6aZPPTbTJP0vqIjLuvbkaWoadlqV8QOx7UMnR5.Zk3oluL/e';
	return Promise.all([
		User.findOrCreate({
			where: {
				email: 'admin@ucla.edu',
			},
			defaults: {
				email: 'admin@ucla.edu',
				accessType: 'ADMIN',
				state: 'ACTIVE',
				hash
			},
		}),
		User.findOrCreate({
			where: {
				email: 'normal@ucla.edu',
			},
			defaults: {
				email: 'normal@ucla.edu',
				state: 'ACTIVE',
				hash
			},
		}),
		Season.findOrCreate({
			where: {
				name: 'Test Season',
			},
			defaults: {
				name: 'Test Season',
				startDate: new Date(),
				endDate: (new Date(Date.now() + 2000000000))
			},
		}),
	]);
};