/*
 * Test for Nuggets Token Smart Contract.
 */

tests.push ({
  name: "NuggetsToken",
  steps: [
    { name: "Ensure there is at least one account: Alice",
      body: function (test) {
        while (!web3.eth.accounts || web3.eth.accounts.length < 1)
          personal.newAccount ("");

        test.alice = web3.eth.accounts [0];
      }},
    { name: "Ensure Alice has at least 5 ETH",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getBalance (test.alice).gte (web3.toWei ("5", "ether"));
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Alice deploys three Wallet contracts: Bob, Carol and Dave",
      body: function (test) {
        test.walletContract = loadContract ("Wallet");
        var walletCode = loadContractCode ("Wallet");

        personal.unlockAccount (test.alice, "");
        test.tx1 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
        test.tx2 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
        test.tx3 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
      }},
    { name: "Make sure contracts were deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx1) &&
          web3.eth.getTransactionReceipt (test.tx2) &&
         web3.eth.getTransactionReceipt (test.tx3);;
      },
      body: function (test) {
        miner.stop ();

        test.bob = getDeployedContract ("Bob", test.walletContract, test.tx1);
        test.carol = getDeployedContract ("Carol", test.walletContract, test.tx2);
        test.dave = getDeployedContract ("Dave", test.walletContract, test.tx3);
      }},
    { name: "Alice deploys NuggetsTokenWrapper",
      body: function (test) {
        test.nuggetsTokenWrapperContract = loadContract ("NuggetsTokenWrapper");
        var nuggetsTokenWrapperCode = loadContractCode ("NuggetsTokenWrapper");

        personal.unlockAccount (test.alice, "");
        test.tx = test.nuggetsTokenWrapperContract.new (
          {from: test.alice, data: nuggetsTokenWrapperCode, gas:1000000}).
          transactionHash;
      }},
    { name: "Make sure contract was deployed and Alice now has 200e12 tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.nuggetsTokenWrapper = getDeployedContract (
          "NuggetsTokenWrapper", test.nuggetsTokenWrapperContract, test.tx)

        assertBNEquals (
            'test.nuggetsTokenWrapper.totalSupply ()',
            "10000000000000000000000000000",
            test.nuggetsTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.alice)',
            "10000000000000000000000000000",
            test.nuggetsTokenWrapper.balanceOf (test.alice));

        assertEquals (
            'test.nuggetsTokenWrapper.name ()',
            "Nuggets",
            test.nuggetsTokenWrapper.name ());

        assertEquals (
            'test.nuggetsTokenWrapper.symbol ()',
            "NUG",
            test.nuggetsTokenWrapper.symbol ());

        assertBNEquals (
            'test.nuggetsTokenWrapper.decimals ()',
            18,
            test.nuggetsTokenWrapper.decimals ());

        assertEquals (
          "test.nuggetsTokenWrapper.getOwner ()",
          test.alice,
          test.nuggetsTokenWrapper.getOwner ());
      }},
    { name: "Alice transfers 100 tokens to Bob",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.alice)',
            "10000000000000000000000000000",
            test.nuggetsTokenWrapper.balanceOf (test.alice));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            0,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.nuggetsTokenWrapper.transfer (
          test.bob.address,
          100,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded and Bob got 100 tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.nuggetsTokenWrapper.Result",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Transfer",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Transfer,
          test.tx,
          { _from: test.alice, _to: test.bob.address, _value: 100 });

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.alice)',
            "9999999999999999999999999900",
            test.nuggetsTokenWrapper.balanceOf (test.alice));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob tries to burn 101 token but he does not have such many tokens",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.totalSupply ()',
            "10000000000000000000000000000",
            test.nuggetsTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.burnTokens.getData (101),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded but no tokens were burned",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Result",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Result,
          test.tx,
          { _value: false });

        assertBNEquals (
            'test.nuggetsTokenWrapper.totalSupply ()',
            "10000000000000000000000000000",
            test.nuggetsTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns zero tokens",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.totalSupply ()',
            "10000000000000000000000000000",
            test.nuggetsTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.burnTokens.getData (0),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded but no tokens were burned",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Result",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
            'test.nuggetsTokenWrapper.totalSupply ()',
            "10000000000000000000000000000",
            test.nuggetsTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns 30 tokens",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.totalSupply ()',
            "10000000000000000000000000000",
            test.nuggetsTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.burnTokens.getData (30),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded and 30 tokens were burned",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Result",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
            'test.nuggetsTokenWrapper.totalSupply ()',
            "9999999999999999999999999970",
            test.nuggetsTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            70,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns 70 tokens",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.totalSupply ()',
            "9999999999999999999999999970",
            test.nuggetsTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            70,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.burnTokens.getData (70),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded and 70 tokens were burned",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Result",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
            'test.nuggetsTokenWrapper.totalSupply ()',
            "9999999999999999999999999900",
            test.nuggetsTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            0,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob tries to make Carol the owner of smart contract, but he is not the owner of smart contract",
      body: function (test) {
        assertEquals (
            'test.nuggetsTokenWrapper.getOwner ()',
            test.alice,
            test.nuggetsTokenWrapper.getOwner ());

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.setOwner.getData (test.carol.address),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: false });

        assertEquals (
            'test.nuggetsTokenWrapper.getOwner ()',
            test.alice,
            test.nuggetsTokenWrapper.getOwner ());
      }},
    { name: "Alice makes Bob the owner of the smart contract",
      body: function (test) {
        assertEquals (
            'test.nuggetsTokenWrapper.getOwner ()',
            test.alice,
            test.nuggetsTokenWrapper.getOwner ());

        personal.unlockAccount (test.alice, "");
        test.tx = test.nuggetsTokenWrapper.setOwner (
          test.bob.address,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEquals (
            'test.nuggetsTokenWrapper.getOwner ()',
            test.bob.address,
            test.nuggetsTokenWrapper.getOwner ());
      }},
    { name: "Bob makes Carol the owner of smart contract",
      body: function (test) {
        assertEquals (
            'test.nuggetsTokenWrapper.getOwner ()',
            test.bob.address,
            test.nuggetsTokenWrapper.getOwner ());

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.setOwner.getData (test.carol.address),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEquals (
            'test.nuggetsTokenWrapper.getOwner ()',
            test.carol.address,
            test.nuggetsTokenWrapper.getOwner ());
      }},
    { name: "Alice transfers 100 tokens to Bob",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.alice)',
            "9999999999999999999999999900",
            test.nuggetsTokenWrapper.balanceOf (test.alice));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            0,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.nuggetsTokenWrapper.transfer (
          test.bob.address,
          100,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded and Bob got 100 tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.nuggetsTokenWrapper.Transfer",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Transfer,
          test.tx,
          { _from: test.alice, _to: test.bob.address, _value: 100 });

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.alice)',
            "9999999999999999999999999800",
            test.nuggetsTokenWrapper.balanceOf (test.alice));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob allows Dave to transfer 50 of his tokens",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address)',
            0,
            test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.approve['address,uint256'].getData (
            test.dave.address, 50),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Approval",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Approval,
          test.tx,
          { _owner: test.bob.address, _spender: test.dave.address, _value: 50 });

        assertBNEquals (
            'test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address)',
            50,
            test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address));
      }},
    { name: "Bob allows Dave to transfer 70 of his tokens",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address)',
            50,
            test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.approve['address,uint256'].getData (
            test.dave.address, 70),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Approval",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Approval,
          test.tx,
          { _owner: test.bob.address, _spender: test.dave.address, _value: 70 });

        assertBNEquals (
            'test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address)',
            70,
            test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address));
      }},
    { name: "Bob transfers one token to Carol",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.carol.address)',
            0,
            test.nuggetsTokenWrapper.balanceOf (test.carol.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.transfer.getData (
            test.carol.address, 1),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Result",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Transfer",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Transfer,
          test.tx,
          { _from: test.bob.address, _to: test.carol.address, _value: 1 });

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            99,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.carol.address)',
            1,
            test.nuggetsTokenWrapper.balanceOf (test.carol.address));
      }},
    { name: "Dave transfers one Bob's token to Carol",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            99,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.carol.address)',
            1,
            test.nuggetsTokenWrapper.balanceOf (test.carol.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address)',
            70,
            test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.transferFrom.getData (
            test.bob.address, test.carol.address, 1),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.dave.Result",
          test.dave,
          test.dave.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Result",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Transfer",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Transfer,
          test.tx,
          { _from: test.bob.address, _to: test.carol.address, _value: 1 });

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            98,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.carol.address)',
            2,
            test.nuggetsTokenWrapper.balanceOf (test.carol.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address)',
            69,
            test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address));
      }},
    { name: "Bob tries to freeze transfers but he is not the owner of smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.freezeTransfers.getData (),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.nuggetsTokenWrapper.Freeze",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Freeze,
          test.tx);
      }},
    { name: "Carol freezes transfers",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.freezeTransfers.getData (),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.carol.Result",
          test.carol,
          test.carol.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Freeze",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Freeze,
          test.tx,
          {});
      }},
    { name: "Carol tries to freezes transfers but they are already frozen",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.freezeTransfers.getData (),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded, but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.carol.Result",
          test.carol,
          test.carol.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Freeze",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Freeze,
          test.tx);
      }},
    { name: "Bob tries to transfer one token to Carol but transfers are frozen",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            98,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.carol.address)',
            2,
            test.nuggetsTokenWrapper.balanceOf (test.carol.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.transfer.getData (
            test.carol.address, 1),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded but no tokens were transferred",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Result",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.nuggetsTokenWrapper.Transfer",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Transfer,
          test.tx);

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            98,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.carol.address)',
            2,
            test.nuggetsTokenWrapper.balanceOf (test.carol.address));
      }},
    { name: "Dave tries to transfer one Bob's token to Carol but token transfers are frozen",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            98,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.carol.address)',
            2,
            test.nuggetsTokenWrapper.balanceOf (test.carol.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address)',
            69,
            test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.transferFrom.getData (
            test.bob.address, test.carol.address, 1),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded but no tokens were transferred",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.dave.Result",
          test.dave,
          test.dave.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Result",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.nuggetsTokenWrapper.Transfer",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Transfer,
          test.tx);

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            98,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.carol.address)',
            2,
            test.nuggetsTokenWrapper.balanceOf (test.carol.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address)',
            69,
            test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address));
      }},
    { name: "Bob tries to unfreeze transfers but he is not the owner of smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.unfreezeTransfers.getData (),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.nuggetsTokenWrapper.Unfreeze",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Unfreeze,
          test.tx);
      }},
    { name: "Carol unfreezes transfers",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.unfreezeTransfers.getData (),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.carol.Result",
          test.carol,
          test.carol.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Unfreeze",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Unfreeze,
          test.tx,
          {});
      }},
    { name: "Carol tries to unfreezes transfers but they are already unfrozen",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.unfreezeTransfers.getData (),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded, but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.carol.Result",
          test.carol,
          test.carol.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Unfreeze",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Unfreeze,
          test.tx);
      }},
    { name: "Bob transfers one token to Carol",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            98,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.carol.address)',
            2,
            test.nuggetsTokenWrapper.balanceOf (test.carol.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.transfer.getData (
            test.carol.address, 1),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Result",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Transfer",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Transfer,
          test.tx,
          { _from: test.bob.address, _to: test.carol.address, _value: 1 });

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            97,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.carol.address)',
            3,
            test.nuggetsTokenWrapper.balanceOf (test.carol.address));
      }},
    { name: "Dave transfers one Bob's token to Carol",
      body: function (test) {
        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            97,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.carol.address)',
            3,
            test.nuggetsTokenWrapper.balanceOf (test.carol.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address)',
            69,
            test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.nuggetsTokenWrapper.address,
          test.nuggetsTokenWrapper.transferFrom.getData (
            test.bob.address, test.carol.address, 1),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.dave.Result",
          test.dave,
          test.dave.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Result",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.nuggetsTokenWrapper.Transfer",
          test.nuggetsTokenWrapper,
          test.nuggetsTokenWrapper.Transfer,
          test.tx,
          { _from: test.bob.address, _to: test.carol.address, _value: 1 });

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.bob.address)',
            96,
            test.nuggetsTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.balanceOf (test.carol.address)',
            4,
            test.nuggetsTokenWrapper.balanceOf (test.carol.address));

        assertBNEquals (
            'test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address)',
            68,
            test.nuggetsTokenWrapper.allowance (test.bob.address, test.dave.address));
      }}
  ]});
