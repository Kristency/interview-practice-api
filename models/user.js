const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
	{
		_id: String,
		name: String,
		column: String,
		starred: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Question'
			}
		]
	},
	{ toObject: { versionKey: false } }
)

module.exports = mongoose.model('User', userSchema)
