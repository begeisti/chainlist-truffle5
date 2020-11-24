const ChainList = artifacts.require("./ChainList.sol");

// test suite
contract('ChainList', accounts => {

	let chainListInstance;
	const seller = accounts[1];
	const buyer = accounts[3];
	const articleName1 = "article 1";
	const articleDescription1 = "Description for article 1";
	const articlePrice1 = web3.utils.toBN(10);
	const articleName2= "article 2";
	const articleDescription2 = "Description for article 2";
	const articlePrice2 = web3.utils.toBN(20);
	let sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
	let buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

	before("set uo contract instance for each test", async () => {
		chainListInstance = await ChainList.deployed();
	});

	it('should be initialized with empty values', async () => {
		const numberOfArticles = await chainListInstance.getNumberOfArticles();
		assert.equal(numberOfArticles.toNumber(), 0, "Number of articles must be zero!");
		const articlesForSale = await chainListInstance.getArticlesForSale();
		assert.equal(articlesForSale.length, 0, "There should not be any article for sale");
	});

	// sell a first article
	it("should let us sell a first article", async () => {
		const receipt = await chainListInstance.sellArticle(
			articleName1,
			articleDescription1,
			web3.utils.toWei(articlePrice1, "ether"),
			{ from: seller }
		);
		// check event
		assert.equal(receipt.logs.length, 1, "one event should have been triggered");
		assert.equal(receipt.logs[0].event, "LogSellArticle", "event should be LogSellArticle");
		assert.equal(receipt.logs[0].args._id.toNumber(), 1, "id must be 1!");
		assert.equal(receipt.logs[0].args._seller, seller, "event seller must be " + seller);
		assert.equal(receipt.logs[0].args._name, articleName1, "event article name must be " + articleName1);
		assert.equal(receipt.logs[0].args._price.toString(), web3.utils.toWei(articlePrice1, "ether").toString(), "article value must be " + web3.utils.toWei(articlePrice1, "ether").toString());

		const numberOfArticles = await chainListInstance.getNumberOfArticles();
		assert.equal(numberOfArticles.toNumber(), 1, "Number of articles must be 1!");
		
		const articlesForSale = await chainListInstance.getArticlesForSale();
		assert.equal(articlesForSale.length, 1, "There must be 1 article for sale!");
		assert.equal(articlesForSale[0].toNumber(), 1, "Article id must be 1");
		
		const article = await chainListInstance.articles(articlesForSale[0]);
		assert.equal(article[0].toNumber(), 1, "Article ID must be 1");
		assert.equal(article[1], seller, "Seller must be " + seller);
		assert.equal(article[2], 0x0, "Buyer must be empty!");
		assert.equal(article[3], articleName1, "Article name must be " + articleName1);
		assert.equal(article[4], articleDescription1, "Article description must be " + articleDescription1);
		assert.equal(article[5].toString(), web3.utils.toWei(articlePrice1, "ether").toString(), "Article price must be " + web3.utils.toWei(articlePrice1, "ether").toString());
	});

	it("should let us sell a second article", async () => {
		const receipt = await chainListInstance.sellArticle(
			articleName2,
			articleDescription2,
			web3.utils.toWei(articlePrice2, "ether"),
			{ from: seller }
		);
		// check event
		assert.equal(receipt.logs.length, 1, "one event should have been triggered");
		assert.equal(receipt.logs[0].event, "LogSellArticle", "event should be LogSellArticle");
		assert.equal(receipt.logs[0].args._id.toNumber(), 2, "id must be 2!");
		assert.equal(receipt.logs[0].args._seller, seller, "event seller must be " + seller);
		assert.equal(receipt.logs[0].args._name, articleName2, "event article name must be " + articleName2);
		assert.equal(receipt.logs[0].args._price.toString(), web3.utils.toWei(articlePrice2, "ether").toString(), "article value must be " + web3.utils.toWei(articlePrice2, "ether").toString());

		const numberOfArticles = await chainListInstance.getNumberOfArticles();
		assert.equal(numberOfArticles.toNumber(), 2, "Number of articles must be 2!");

		const articlesForSale = await chainListInstance.getArticlesForSale();
		assert.equal(articlesForSale.length, 2, "There must be 2 articles for sale!");
		assert.equal(articlesForSale[0].toNumber(), 1, "Article id for the first article must be 1");
		assert.equal(articlesForSale[1].toNumber(), 2, "Article id for the second article must be 2");
		
		const article = await chainListInstance.articles(articlesForSale[1]);
		assert.equal(article[0].toNumber(), 2, "Article ID must be 2");
		assert.equal(article[1], seller, "Seller must be " + seller);
		assert.equal(article[2], 0x0, "Buyer must be empty!");
		assert.equal(article[3], articleName2, "Article name must be " + articleName2);
		assert.equal(article[4], articleDescription2, "Article description must be " + articleDescription2);
		assert.equal(article[5].toString(), web3.utils.toWei(articlePrice2, "ether").toString(), "Article price must be " + web3.utils.toWei(articlePrice2, "ether").toString());
	});

	// buy the first article
	it('should let us buy the first article', async () => {
		// record balances of seller & buyer before the buy
		sellerBalanceBeforeBuy = parseFloat(web3.utils.fromWei(await web3.eth.getBalance(seller), "ether"));
		buyerBalanceBeforeBuy = parseFloat(web3.utils.fromWei(await web3.eth.getBalance(buyer), "ether"));
		const receipt = await chainListInstance.buyArticle(1, {
			from: buyer,
			value: web3.utils.toWei(articlePrice1, "ether")
		});
		assert.equal(receipt.logs.length, 1, "one event should have been triggered");
		assert.equal(receipt.logs[0].event, "LogBuyArticle", "event should be LogBuyArticle");
		assert.equal(receipt.logs[0].args._id.toNumber(), 1, "Article id must be 1");
		assert.equal(receipt.logs[0].args._seller, seller, "event seller must be " + seller);
		assert.equal(receipt.logs[0].args._buyer, buyer, "event buyer must be " + buyer);
		assert.equal(receipt.logs[0].args._name, articleName1, "event article name must be " + articleName1);
		assert.equal(receipt.logs[0].args._price.toString(), web3.utils.toWei(articlePrice1, "ether").toString(), "article value must be " + web3.utils.toWei(articlePrice1, "ether"));

		// record balances of buyer & seller after the buy
		sellerBalanceAfterBuy = parseFloat(web3.utils.fromWei(await web3.eth.getBalance(seller), "ether"));
		buyerBalanceAfterBuy = parseFloat(web3.utils.fromWei(await web3.eth.getBalance(buyer), "ether"));

		// check the effect of buy on the balances of buyer & seller, accounting for gas
		assert(sellerBalanceAfterBuy == sellerBalanceBeforeBuy + articlePrice1.toNumber(), "seller should have earned " + articlePrice1 + " ETH");
		// not will be the same because of gas price paid for calling the buy function
		assert(buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - articlePrice1.toNumber(), "buyer should have spent " + articlePrice1 + " ETH");

		const article = await chainListInstance.articles(1);
		assert.equal(article[0].toNumber(), 1, "Article ID must be 1");
		assert.equal(article[1], seller, "Seller must be " + seller);
		assert.equal(article[2], buyer, "Buyer must be " + buyer);
		assert.equal(article[3], articleName1, "Article name must be " + articleName1);
		assert.equal(article[4], articleDescription1, "Article description must be " + articleDescription1);
		assert.equal(article[5].toString(), web3.utils.toWei(articlePrice1, "ether").toString(), "Article price must be " + web3.utils.toWei(articlePrice1, "ether").toString());

		const articlesForSale = await chainListInstance.getArticlesForSale();
		assert.equal(articlesForSale.length, 1, "There should now be 1 article left for sale!");
		assert.equal(articlesForSale[0].toNumber(), 2, "Article 2 should be the only article for sale!");
		
		const numberOfArticles = await chainListInstance.getNumberOfArticles();
		assert.equal(numberOfArticles.toNumber(), 2, "There should be still 2 articles in total");
	});
});