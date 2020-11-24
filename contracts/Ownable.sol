pragma solidity >0.4.99 <0.6.0;

contract Ownable {
	// state variable
	address payable owner;

	// modifiers
	modifier onlyOwner() {
		require(msg.sender == owner, "This function can only be called by the contract owner!");
		_; // rest of the calling function
	}

	constructor() public {
		owner = msg.sender;
	}
}