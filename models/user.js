const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
	{
		_id: String,
		email: String,
		name: String
	},
	{ toObject: { versionKey: false } }
)

module.exports = mongoose.model('User', userSchema)
