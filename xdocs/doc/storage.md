# Nuggets Token Smart Contract: Storage #

This document describes structure of the storage of Nuggets Token smart contract.

## 1. State Variables ##

### 1.1. owner ###

#### Declaration: ####

    address owner

#### Description: ####

Address of an owner of the contract.

#### Used in Use Cases: ####

* Token:Create
* Admin:Freeze
* Admin:Unfreeze
* Admin:SetOwner

#### Modified in Use Cases: ####

* Admin:SetOwner

### 1.2. tokensCount ###

#### Declaration: ####

    uint256 tokensCount

#### Description: ####

Total number of tokens in circulation.

#### Used in Use Cases: ####

* EIP20:TotalSupply
* Token:Burn

#### Modified in Use Cases: ####

* Admin:Deploy
* Token:Burn

### 1.3. frozen ###

#### Declaration: ####

    bool frozen

#### Description: ####

Whether token transfers are currently frozen.

#### Used in Use Cases: ####

* EIP20:Transfer
* EIP20:TransferFrom
* Admin:Freeze
* Admin:Unfreeze

#### Modified in Use Cases: ####

* Admin:Freeze
* Admin:Unfreeze

### 1.4. accounts ###

#### Declaration: ####

    mapping (address => uint256) accounts

#### Description: ####

Accounts of token holders.  Value of ``accounts [x]`` is the number of tokens currently belonging to the owner of address ``x``.

#### Used in Use Cases: ####

* EIP20:Transfer
* EIP20:TransferFrom
* Token:Create

#### Modified in Use Cases: ####

* EIP20:Transfer
* EIP20:TransferFrom
* Token:Create

### 1.5. allowances ###

#### Declaration: ####

    mapping (address => mapping (address => uint256)) allowances

#### Description: ####

Approved transfers.  Value of ``allowances [x][y]`` is how many of tokens belonging to the owner of address ``x``, owner of address ``y`` is allowed to transfer.

#### Used in Use Cases: ####

* EIP20:TransferFrom
* EIP20:Allowance

#### Modified in Use Cases: ####

* EIP20:Approve
