pragma solidity ^0.5.16;

contract Ownable {
    // state variable
    address payable public owner;

    // modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner!");
        _; // rest of the calling function
    }

    constructor() public {
        owner = msg.sender;
    }
}
