ripple = require 'ripple-lib'

remote = new ripple.Remote(
	{
		trusted:        true
		local_signing:  true
		local_fee:      true
		fee_cushion:     1.5
		trace:		  false
		servers: [
			{
				host:    's_west.ripple.com'
				port:    443
				secure:  true
			}
		]
	}
)

transactionListener = (transaction_data) ->
	console.log transaction_data

ledgerListener = (ledger_data) ->
	console.log ledger_data

getBook = () ->
	request = remote.requestBookOffers(
		{
			gets: {
				'currency' : 'XRP'
			},
			pays: {
				'currency':'USD'				
				'issuer': 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
			}
		},
		(error, success) ->
			if error
				console.error error
			else
				# console.log success
				if success?.offers

					trades = []

					for offer in success.offers
						# offer = success.offers[0]
						usdAmount = offer.TakerPays.value
						xrpAmount = offer.TakerGets

						xrpvalue = usdAmount/xrpAmount

						if not trades[xrpvalue]
							trades[xrpvalue] = {}
							trades[xrpvalue]['USD'] = 0
							trades[xrpvalue]['XRP'] = 0

						ratio = usdAmount.ratio_human xrpAmount
						console.log ratio

						trades[xrpvalue]['USD'] += usdAmount
						trades[xrpvalue]['XRP'] += xrpAmount

					
					# console.log trades
	)

	console.log "request"
	request = request.request()

watchOrderBooks = () ->
	book = remote.book "USD", "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B", "XRP", null

	book.on 'trade', (gets, pays) ->
		# console.log "trade: #{gets}, #{pays}"

	book.on 'model', (orders) ->
		console.log "model: #{orders.length}"

		console.log orders[0]


remote.on 'connected', () ->
	console.log "connected"
	# remote.on 'transaction_all', transactionListener
	# remote.on 'ledger_closed', ledgerListener

	# getBook()

	watchOrderBooks()

remote.connect()