const { GoogleSpreadsheet } = require('google-spreadsheet')

module.exports = async function() {
	const doc = new GoogleSpreadsheet(process.env.SHEET_ID)
	await doc.useServiceAccountAuth({
		client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
		private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') /* giving error in .env file due to newlines */
	})
	await doc.loadInfo()
	const sheet = doc.sheetsByIndex[0]
	return sheet
}
