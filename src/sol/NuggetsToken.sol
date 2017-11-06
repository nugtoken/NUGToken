/*
 * Nuggets Token Smart Contract.
 */
pragma solidity ^0.4.16;

import "./AbstractToken.sol";

/**
 * Nuggets Token Smart Contract: EIP-20 compatible token smart contract with
 * fixed supply, token burning and transfer freezing.
 */
contract NuggetsToken is AbstractToken {
  /**
   * Initial supply of Nuggets Tokens.
   */
  uint constant INITIAL_SUPPLY = 10000000000e18;

  /**
   * Create new Nuggets Token contract.
   */
  function NuggetsToken () {
    owner = msg.sender;
    accounts [owner] = INITIAL_SUPPLY;
    tokensCount = INITIAL_SUPPLY;
  }

  /**
   * Get name of this token.
   *
   * @return name of this token
   */
  function name () constant returns (string result) {
    return "Nuggets";
  }

  /**
   * Get symbol of this token.
   *
   * @return symbol of this token
   */
  function symbol () constant returns (string result) {
    return "NUG";
  }

  /**
   * Get number of decimals for this token.
   *
   * @return number of decimals for this token
   */
  function decimals () constant returns (uint8 result) {
    return 18;
  }

  /**
   * Get total number of tokens in circulation.
   *
   * @return total number of tokens in circulation
   */
  function totalSupply () constant returns (uint256 supply) {
    return tokensCount;
  }

  /**
   * Transfer given number of tokens from message sender to given recipient.
   *
   * @param _to address to transfer tokens to the owner of
   * @param _value number of tokens to transfer to the owner of given address
   * @return true if tokens were transferred successfully, false otherwise
   */
  function transfer (address _to, uint256 _value) returns (bool success) {
    return frozen ? false : AbstractToken.transfer (_to, _value);
  }

  /**
   * Transfer given number of tokens from given owner to given recipient.
   *
   * @param _from address to transfer tokens from the owner of
   * @param _to address to transfer tokens to the owner of
   * @param _value number of tokens to transfer from given owner to given
   *        recipient
   * @return true if tokens were transferred successfully, false otherwise
   */
  function transferFrom (address _from, address _to, uint256 _value)
  returns (bool success) {
    return frozen ? false : AbstractToken.transferFrom (_from, _to, _value);
  }

  /**
   * Burn given number of tokens belonging to message sender.
   *
   * @param _value number of tokens to burn
   * @return true on success, false on error
   */
  function burnTokens (uint256 _value) returns (bool success) {
    uint256 ownerBalance = accounts [msg.sender];
    if (_value > ownerBalance) return false;
    else if (_value > 0) {
      accounts [msg.sender] = safeSub (ownerBalance, _value);
      tokensCount = safeSub (tokensCount, _value);
      return true;
    } else return true;
  }

  /**
   * Set new owner for the smart contract.
   * May only be called by smart contract owner.
   *
   * @param _newOwner address of new owner of the smart contract
   */
  function setOwner (address _newOwner) {
    require (msg.sender == owner);

    owner = _newOwner;
  }

  /**
   * Freeze token transfers.
   * May only be called by smart contract owner.
   */
  function freezeTransfers () {
    require (msg.sender == owner);

    if (!frozen) {
      frozen = true;
      Freeze ();
    }
  }

  /**
   * Unfreeze token transfers.
   * May only be called by smart contract owner.
   */
  function unfreezeTransfers () {
    require (msg.sender == owner);

    if (frozen) {
      frozen = false;
      Unfreeze ();
    }
  }

  /**
   * Logged when token transfers were frozen.
   */
  event Freeze ();

  /**
   * Logged when token transfers were unfrozen.
   */
  event Unfreeze ();

  /**
   * Number of tokens in circulation.
   */
  uint256 tokensCount;

  /**
   * Owner of the smart contract.
   */
  address owner;

  /**
   * Whether token transfers are currently frozen.
   */
  bool frozen;
}
