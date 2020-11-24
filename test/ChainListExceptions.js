// contract to be tested
const ChainList = artifacts.require("./ChainList.sol");

// test suite
contract("ChainList", accounts => {
	let chainListInstance;
	const seller = accounts[1];
	const buyer = accounts[3];
	const articleName = "article 1";
	const articleDescription = "Description for article 1";
	const articlePrice = web3.utils.toBN(10);
	const articlePrice2 = web3.utils.toBN(5);

	before("set uo contract instance for each test", async () => {
		chainListInstance = await ChainList.deployed();
	});

	// no article for sale yet
	it("should throw an exception if you try to buy an article when there is no article for sale yet", async () => {
		try {
			await chainListInstance.buyArticle(1, {
				from: buyer,
				value: web3.utils.toWei(articlePrice, "ether")
			});
			assert.fail();
		} catch(error) {
			assert.equal(error.reason, "There should be at least one article!");
		}
		const numberOfArticles = await chainListInstance.getNumberOfArticles();
		assert.equal(numberOfArticles.toNumber(), 0, "Number of articles must be 0!");
	});

	// buy an article that does not exist
	it("should throw an exception if you try to buy an article that does not exist", async () => {
		await chainListInstance.sellArticle(
			articleName,
			articleDescription,
			web3.utils.toWei(articlePrice, "ether"),
			{ from: seller }
		);
		try {
			await chainListInstance.buyArticle(2, {
				from: buyer, value: web3.utils.toWei(articlePrice, "ether")
			});
			assert.fail();
		} catch (error) {
			assert.equal(error.reason, "Article with this id does not exist!");
		}
		const article = await chainListInstance.articles(1);
		assert.equal(article[0].toNumber(), 1, "Article ID must be 1");
		assert.equal(article[1], seller, "Seller must be " + seller);
		assert.equal(article[2], 0x0, "Buyer must be empty!");
		assert.equal(article[3], articleName, "Article name must be " + articleName);
		assert.equal(article[4], articleDescription, "Article description must be " + articleDescription);
		assert.equal(article[5].toString(), web3.utils.toWei(articlePrice, "ether").toString(), "Article price must be " + web3.utils.toWei(articlePrice, "ether").toString());

	});

	it("should throw exception if you try to buy your own article", async () => {
		try {
			await chainListInstance.buyArticle(1, { 
				from: seller, value: web3.utils.toWei(articlePrice, "ether") 
			});
			assert.fail();
		} catch(error) {
			assert.equal(error.reason, "Seller cannot buy his own article!");
		}
		const article = await chainListInstance.articles(1);
		assert.equal(article[0].toNumber(), 1, "Article ID must be 1");
		assert.equal(article[1], seller, "Seller must be " + seller);
		assert.equal(article[2], 0x0, "Buyer must be empty!");
		assert.equal(article[3], articleName, "Article name must be " + articleName);
		assert.equal(article[4], articleDescription, "Article description must be " + articleDescription);
		assert.equal(article[5].toString(), web3.utils.toWei(articlePrice, "ether").toString(), "Article price must be " + web3.utils.toWei(articlePrice, "ether").toString());
	});

	it("should throw exception if you try to buy an article with less price", async () => {
		try {
			await chainListInstance.buyArticle(1, { 
				from: buyer, value: web3.utils.toWei(articlePrice2, "ether") 
			});
			assert.fail();
		} catch(error) {
			assert.equal(error.reason, "Value provided does not match the price of the articel!");
		}
		const article = await chainListInstance.articles(1);
		assert.equal(article[0].toNumber(), 1, "Article ID must be 1");
		assert.equal(article[1], seller, "Seller must be " + seller);
		assert.equal(article[2], 0x0, "Buyer must be empty!");
		assert.equal(article[3], articleName, "Article name must be " + articleName);
		assert.equal(article[4], articleDescription, "Article description must be " + articleDescription);
		assert.equal(article[5].toString(), web3.utils.toWei(articlePrice, "ether").toString(), "Article price must be " + web3.utils.toWei(articlePrice, "ether").toString());
	});

	it("should throw an exception if the article that has already been sold", async () => {
		await chainListInstance.buyArticle(1, { 
			from: buyer, value: web3.utils.toWei(articlePrice, "ether")
		});
		try {
			await chainListInstance.buyArticle(1, { 
				from: accounts[0], value: web3.utils.toWei(articlePrice, "ether") 
			});
			assert.fail();
		} catch(error) {
			assert.equal(error.reason, "Articel was already sold!");
		}
		const article = await chainListInstance.articles(1);
		assert.equal(article[0].toNumber(), 1, "Article ID must be 1");
		assert.equal(article[1], seller, "Seller must be " + seller);
		assert.equal(article[2], buyer, "Buyer must be " + buyer);
		assert.equal(article[3], articleName, "Article name must be " + articleName);
		assert.equal(article[4], articleDescription, "Article description must be " + articleDescription);
		assert.equal(article[5].toString(), web3.utils.toWei(articlePrice, "ether").toString(), "Article price must be " + web3.utils.toWei(articlePrice, "ether").toString());
	})
});