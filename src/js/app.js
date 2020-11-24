App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  loading: false,

  init: async() => {
    return App.initWeb3();
  },

  initWeb3: async () => {
    if (window.ethereum) {
      // Metamask is installed with the privacy feature enabled
      window.web3 = new Web3(window.ethereum);
      try {
        // displays a dialog that the user can accept/reject
        await window.ethereum.enable();
        App.displayAccountInfo();
        return App.initContract();
      } catch (error) {
        // user denied access
        console.error("Unable to retrieve your accounts! You have to approve this applciation on Metamask");
      }
    } else if (window.web3) {
      // don't know the version of web3
      window.web3 = new Web3(web3.currentProvider || "ws://localhost:8545");
      App.displayAccountInfo();
      return App.initContract();
    } else {
      // no Dapp browser at all
      console.log("Non-ethereum browser detected! You should consider trying Metamask");
    }
  },

  displayAccountInfo: async () => {
    const accounts = await window.web3.eth.getAccounts();
    App.account = accounts[0];
    $("#account").text(App.account);
    const balance = await window.web3.eth.getBalance(App.account);
    $("#accountBalance").text(window.web3.utils.fromWei(balance, "ether") + " ETH");
  },

  initContract: async() => {
    $.getJSON('ChainList.json', chainListArtifact => {
      // initialize ChainList contract abstraction
      App.contracts.ChainList = TruffleContract(chainListArtifact);
      App.contracts.ChainList.setProvider(window.web3.currentProvider);
      App.listenToEvents();
      return App.reloadArticles();
    });
  },

  // listen to events triggered by the contract
  listenToEvents: async() => {
    const chainListInstance = await App.contracts.ChainList.deployed();
    if (App.logSellArticleEventListener == null) {
      App.logSellArticleEventListener = chainListInstance.LogSellArticle({
        fromBlock: '0'
      }).on("data", event => {
        // remove already existing event & replace with a new one
        $("#" + event.id).remove();
        $("#events").append('<li class="list-group-item" id=">' + event.id + '">' + event.returnValues._seller + ' selled ' + event.returnValues._name + '</li>');
        App.reloadArticles();
      })
      .on("error", error => {
        console.error(error);
      })
    }

    if (App.logBuyArticleEventListener == null) {
      App.logBuyArticleEventListener = chainListInstance.LogBuyArticle({
        fromBlock: '0'
      }).on("data", event => {
        // remove already existing event & replace with a new one
        $("#" + event.id).remove();
        $("#events").append('<li class="list-group-item" id=">' + event.id + '">' + event.returnValues._buyer + ' bought ' + event.returnValues._name + '</li>');
        App.reloadArticles();
      })
      .on("error", error => {
        console.error(error);
      })
    }

    $('.btn-subscribe').show();
    $('.btn-unsubscribe').show();
    $('.btn-show-events').show();
  },

  stopListeningToEvents: async() => {
    if (App.logSellArticleEventListener != null) {
      console.log("unsubscribe from sell events");
      await App.logSellArticleEventListener.removeAllListeners();
      App.logSellArticleEventListener = null;
    }

    if (App.logBuyArticleEventListener != null) {
      console.log("unsubscribe from buy events");
      await App.logBuyArticleEventListener.removeAllListeners();
      App.logBuyArticleEventListener = null;
    }

    $("#events")[0].className = "list-group-collapse";

    $('.btn-subscribe').show();
    $('.btn-unsubscribe').hide();
    $('.btn-show-events').hide();
  },

  sellArticle: async() => {
    // retrieve the defatils of the article
    const articlePriceValue = parseFloat($('#article_price').val());
    const articlePrice = isNaN(articlePriceValue) ? 0 : articlePriceValue.toString();
    
    const name = $('#article_name').val();
    const description = $('#article_description').val();
    const price = window.web3.utils.toWei(articlePrice, "ether");

    if (name.trim() === '' || price === 0) {
      // nothing to sell
      return false;
    }

    try {
      const chainListInstance = await App.contracts.ChainList.deployed();
      const transactionReceipt = await chainListInstance.sellArticle(
        name, description, price, { from: App.account, gas: 500000 }
      ).on("transactionHash", hash => {
        // When the tx gets broadcased to the network
        console.log("Transaction hash", hash);
      });
      console.log('transaction receipt', transactionReceipt);
    } catch (error) {
      console.error(error);
    }
  },

  buyArticle: async() => {
    event.preventDefault();
    
    // retrieve article price from the button
    const articlePriceValue = parseFloat($(event.target).data('value'));
    const articlePrice = isNaN(articlePriceValue) ? 0 : articlePriceValue.toString();
    
    const _articleId = $(event.target).data('id');
    const _price = window.web3.utils.toWei(articlePrice, "ether");
    try {
      const chainListInstance = await App.contracts.ChainList.deployed();
      const transactionReceipt = await chainListInstance.buyArticle(
        _articleId, {
          from: App.account,
          value: _price,
          gas: 500000
        }
      ).on("transactionHash", hash => {
        console.log("Transaction hash", hash);
      });
      console.log('transaction receipt', transactionReceipt);
    } catch (error) {
      console.error(error);
    }
  },

  reloadArticles: async () => {
    // avoid reentry
    if (App.loadig) {
      return;
    }
    App.loading = true;

    // refresh account information because the balance might have changed
    App.displayAccountInfo();

    try {
      const chainListInstance = await App.contracts.ChainList.deployed();
      const articleIds = await chainListInstance.getArticlesForSale();
      $('#articlesRow').empty();
      for (let i = 0; i < articleIds.length; ++i) {
        const article = await chainListInstance.articles(articleIds[i]);
        App.displayArticle(article[0], article[1], article[3], article[4], article[5]);
      }
      App.loading = false;
    } catch (error) {
      console.log(error);
      App.loading = false;
    }
  },

  displayArticle: (id, seller, name, description, price) => {
      const articleRow = $('#articlesRow')

      const etherPrice = window.web3.utils.fromWei(price.toString(), "ether");

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
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
