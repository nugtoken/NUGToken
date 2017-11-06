/*
 * Deployment script for Nuggets Token Smart Contract.
 */

if (!web3.eth.contract (@ABI@).new (
  {from: web3.eth.accounts[0], data: "0x@BIN@", gas: 1000000},
  function (e, r) {
    if (e) throw e;
    if (typeof r.address !== "undefined") {
      console.log (
        "Deployed at " + r.address + " (tx: " + r.transactionHash + ")");
    }
  }).transactionHash) {
  console.log ("Deployment failed.  Probably web3.eth.accounts[0] is locked.");
}
