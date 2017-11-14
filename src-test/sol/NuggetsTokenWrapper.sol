/*
 * Wrapper for Nuggets Token Smart Contract.
 */

pragma solidity ^0.4.11;

import "./../../src/sol/NuggetsToken.sol";

/**
 * Wrapper for Nuggets Token Smart Contract to be used for testing.
 */
contract NuggetsTokenWrapper is NuggetsToken {
  /**
   * Create new Nuggets Token Wrapper smart contract, issue given number of
   * tokens and give them to message sender.
   */
  function NuggetsTokenWrapper ()
    NuggetsToken () {
    // Do nothing
  }

  /**
   * Transfer given number of tokens from message sender to given recipient.
   *
   * @param _to address to transfer tokens to the owner of
   * @param _value number of tokens to transfer to the owner of given address
   * @return true if tokens were transferred successfully, false otherwise
   */
  function transfer (address _to, uint256 _value) returns (bool success) {
    Result (success = NuggetsToken.transfer (_to, _value));
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
    Result (success = NuggetsToken.transferFrom (_from, _to, _value));
  }

  /**
   * Change how many tokens given spender is allowed to transfer from message
   * spender.  In order to prevent double spending of allowance, this method
   * receives assumed current allowance value as an argument.  If actual
   * allowance differs from an assumed one, this method just returns false.
   *
   * @param _spender address to allow the owner of to transfer tokens from
   *        message sender
   * @param _currentValue assumed number of tokens currently allowed to be
   *        transferred
   * @param _newValue number of tokens to allow to transfer
   * @return true if token transfer was successfully approved, false otherwise
   */
  function approve (address _spender, uint256 _currentValue, uint256 _newValue)
  returns (bool success) {
    Result (success = NuggetsToken.approve (_spender, _currentValue, _newValue));
  }

  /**
   * Burn given number of tokens belonging to message sender.
   *
   * @param _value number of tokens to burn
   * @return true on success, false on error
   */
  function burnTokens (uint256 _value) returns (bool success) {
    Result (success = NuggetsToken.burnTokens (_value));
  }

  /**
   * Get current owner of the smart contract.
   *
   * @return address of current owner of smart contract
   */
  function getOwner () constant returns (address result) {
    return owner;
  }

  /**
   * Used to log result of operation.
   *
   * @param _value result of operation
   */
  event Result (bool _value);
}
