_und = require('underscore');

var ripple = require('ripple-lib');

console.log(_und);


var remote = new ripple.Remote(
  {
    trusted: true,
    local_signing: true,
    local_fee: true,
    fee_cushion: 1.5,
    trace: false,
    servers: [
      { host: 's_west.ripple.com', port: 443, secure: true },
      { host: 's_east.ripple.com', port: 443, secure: true }
    ]
  }
);

var rpamountFilter = function (input, opts) {
    if ("number" === typeof opts) {
      opts = {
        rel_min_precision: opts
      };
    } else if ("object" !== typeof opts) {
      opts = {};
    }

    if (!input) return "n/a";

    if (opts.xrp_human && input === ("" + parseInt(input, 10))) {
      input = input + ".0";
    }

    var amount = ripple.Amount.from_json(input);
    if (!amount.is_valid()) return "n/a";

    // Certain formatting options are relative to the currency default precision
    if ("number" === typeof opts.rel_precision) {
      opts.precision = 4 + opts.rel_precision;
    }
    if ("number" === typeof opts.rel_min_precision) {
      opts.min_precision = 4 + opts.rel_min_precision;
    }

    // If no precision is given, we'll default to max precision.
    if ("number" !== typeof opts.precision) {
      opts.precision = 16;
    }

    // But we will cut off after five significant decimals
    if ("number" !== typeof opts.max_sig_digits) {
      opts.max_sig_digits = 5;
    }

    var out = amount.to_human(opts);

    return out;
  };

function filterRedundantPrices(data, action, combine) {
    var max_rows = 100;

    var price;
    var lastprice;
    var current;
    var numerator;
    var demoninator;
    var newData = _und.extend({}, data);

    var rowCount = 0;
    newData = _und.values(_und.compact(_und.map(newData, function(d, i) {

      // This check is redundant, but saves the CPU some work
      if (rowCount > max_rows) return false;

      // prefer taker_pays_funded & taker_gets_funded
      if (d.hasOwnProperty('taker_gets_funded')) {
        d.TakerGets = d.taker_gets_funded;
        d.TakerPays = d.taker_pays_funded;
      }

      d.TakerGets = ripple.Amount.from_json(d.TakerGets);
      d.TakerPays = ripple.Amount.from_json(d.TakerPays);

      d.price = ripple.Amount.from_quality(d.BookDirectory, "1", "1");

      if (action !== "asks") d.price = ripple.Amount.from_json("1/1/1").divide(d.price);

      // Adjust for drops: The result would be a million times too large.
      if (d[action === "asks" ? "TakerPays" : "TakerGets"].is_native())
        d.price  = d.price.divide(ripple.Amount.from_json("1000000"));

      // Adjust for drops: The result would be a million times too small.
      if (d[action === "asks" ? "TakerGets" : "TakerPays"].is_native())
        d.price  = d.price.multiply(ripple.Amount.from_json("1000000"));

      var price = rpamountFilter(d.price, {
        rel_precision: 4,
        rel_min_precision: 2
      });

      if (lastprice === price) {
        if (combine) {
          newData[current].TakerPays = ripple.Amount.from_json(newData[current].TakerPays).add(d.TakerPays);
          newData[current].TakerGets = ripple.Amount.from_json(newData[current].TakerGets).add(d.TakerGets);
        }
        d = false;
      } else current = i;
      lastprice = price;

      if (d) rowCount++;

      if (rowCount > max_rows) return false;

      return d;
    })));

    var key = action === "asks" ? "TakerGets" : "TakerPays";
    var sum;
    _und.each(newData, function (order, i) {
      if (sum) sum = order.sum = sum.add(order[key]);
      else sum = order.sum = order[key];
    });

    return newData;
  }

var handleBook = function(orders,action) {
  orders = filterRedundantPrices(orders,action,true);

  // TODO fix
  orders = orders.splice(0,20);

  orderbookFilterOpts = {
    precision: 5,
    min_precision: 5,
    max_sig_digits: 20
  };

  orders.forEach(function(order,index){
    order.showSum = rpamountFilter(order.sum,orderbookFilterOpts);
    order.showPrice = rpamountFilter(order.price,orderbookFilterOpts);

    var showValue = action === 'bids' ? 'TakerPays' : 'TakerGets';
    order['show' + showValue] = rpamountFilter(order[showValue],orderbookFilterOpts);
  });

  return orders;
};


var getBooks = function() {
  var book = remote.book("USD", "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B", "XRP", null);

  book.on('trade', function(gets,pays) {
    // console.log("trade");
  });

  book.on('model', function(orders) {
    orders = handleBook(orders,"ask");

    price = orders[0].price;
    flipPrice = ripple.Amount.from_human(1).divide(orders[0].price);

    console.log(orders[0]);

    var pageTitlePriceOpts =  {
      precision: 2,
      min_precision: 2
    }
  });

};


remote.on('connected',function(){
  console.log('connected');
  getBooks();
});

remote.connect();