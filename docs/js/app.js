App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  loading: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // initialize web3
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      console.log('loaded from metamask!');
    } else {
      // create new provider and plug it directly into our local node
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    App.displayAccountInfo();

    return App.initContract();
  },

  displayAccountInfo: function() {
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $('#account').text(account);
        web3.eth.getBalance(account, function(err, balance) {
          if (err === null) {
            $('#accountBalance').text(web3.fromWei(balance, 'ether') + ' ETH');
          }
        });
      } else {
        console.error(err);
      }
    });
  },

  initContract: function() {
    $.getJSON('ChainList.json', function(chainListArtifact) {
      // get the contract artifact file and use it to insantiate truffle contract abstraction
      App.contracts.ChainList = TruffleContract(chainListArtifact);
      // set the provider for out contract
      App.contracts.ChainList.setProvider(App.web3Provider);
      // listen to events
      App.listenToEvents();
      // retrieve the article from the contract
      return App.reloadArticles();
    });
  },

  reloadArticles: function() {
    // avoid reentry
    if (App.loadig) {
      return;
    }
    App.loading = true;

    // refresh account information because the balance might have changed
    App.displayAccountInfo();

    var chainListInstance;

    App.contracts.ChainList.deployed().then(function(instance) {
      chainListInstance = instance;
      return chainListInstance.getArticlesForSale();
    }).then(function(articleIds) {
      // retrieve article placeholder and clear it
      $('#articlesRow').empty();

      for(var i = 0; i < articleIds.length; i++) {
        var articleId = articleIds[i];
        chainListInstance.articles(articleId.toNumber()).then(article => {
          App.displayArticle(article[0], article[1], article[3], article[4], article[5]);
        });
      }

      App.loading = false;
    }).catch(function(err) {
      console.error(err);
      App.loading = false;
    });
  },

  displayArticle: function(id, seller, name, description, price) {
      const articleRow = $('#articlesRow')

      var etherPrice = web3.fromWei(price, "ether");

      // retrieve the article template and fill it with data
      const articleTemplate = $('#articleTemplate');
      articleTemplate.find('.panel-title').text(name);
      articleTemplate.find('.article-description').text(description);
      articleTemplate.find('.article-price').text(etherPrice + " ETH");
      articleTemplate.find('.btn-buy').attr('data-id', id);
      articleTemplate.find('.btn-buy').attr('data-value', etherPrice);

      if (seller == App.account) {
        articleTemplate.find('.article-seller').text("You");
        articleTemplate.find('.btn-buy').hide();
      } else {
        articleTemplate.find('.article-seller').text(seller);
        articleTemplate.find('.btn-buy').show();
      }

      // add this article
      articleRow.append(articleTemplate.html());
  },

  sellArticle: function() {
    // retrieve the defatils of the article
    var articleName = $('#article_name').val();
    var description = $('#article_description').val();
    var price = web3.toWei(parseFloat($('#article_price').val()) || 0, "ether");

    if (articleName.trim() === '' || price === 0) {
      // nothing to sell
      return false;
    }

    App.contracts.ChainList.deployed().then(function(instance) {
      return instance.sellArticle(articleName, description, price, {
        from: App.account,
        gas: 500000
      });
    }).then(result => {
      
    }).catch(function(err) {
      console.error(err);
    });
  },

  // listen to events triggered by the contract
  listenToEvents: function() {
    App.contracts.ChainList.deployed().then(instance => {
      instance.LogSellArticle({}, {}).watch((err, event) => {
        if (!err) {
          $('#events').append('<li class="list-group-item">' + event.args._name + '  is now for sale</li>');
        } else {
          console.error(error);
        }
        App.reloadArticles();
      });

      instance.LogBuyArticle({}, {}).watch((err, event) => {
        if (!err) {
          $('#events').append('<li class="list-group-item">' + event.args._buyer + ' bought ' + event.args._name + '</li>');
        } else {
          console.error(error);
        }
        App.reloadArticles();
      })
    });
  },

  buyArticle: function() {
    event.preventDefault();

    console.log($('#btn-buy'));

    // retrieve article price from the button
    console.log($(event.target).data('value'));
    var _articleId = $(event.target).data('id');
    var _price = parseFloat($(event.target).data('value'));
    console.log('Price is: ' + _price);


    App.contracts.ChainList.deployed().then(instance => {
      return instance.buyArticle(_articleId, {
        from: App.account,
        value: web3.toWei(_price, "ether"),
        gas: 500000
      })
      .catch(error => {
        console.error(error);
      });
    })
  },
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
