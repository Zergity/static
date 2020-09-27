const bs58 = require('bs58');
const detectEthereumProvider = require('@metamask/detect-provider');
const { PublicKey, SystemProgram, Transaction } = require('@solana/web3.js')

// this returns the provider, or null if it wasn't detected
detectEthereumProvider().then(setupProvider)

function setupProvider(provider) {
  if (!provider) {
    console.log('Please install MetaMask or EzDeFi!');
    doLogout()
    return;
  }

  // If the provider returned by detectEthereumProvider is not the same as
  // window.ethereum, something is overwriting it, perhaps another wallet.
  if (provider !== window.ethereum) {
    console.error('Do you have multiple wallets installed?', provider, window.ethereum);
  }
  // Access the decentralized web!

  /**********************************************************/
  /* Handle chain (network) and chainChanged (per EIP-1193) */
  /**********************************************************/

  // Normally, we would recommend the 'eth_chainId' RPC method, but it currently
  // returns incorrectly formatted chain ID values.
  // let currentChainId = ethereum.chainId;

  ethereum.on('chainChanged', handleChainChanged);

  function handleChainChanged(_chainId) {
    // We recommend reloading the page, unless you must do otherwise
    console.log('Chain ID:', _chainId)
    // window.location.reload();
  }

  /***********************************************************/
  /* Handle user accounts and accountsChanged (per EIP-1193) */
  /***********************************************************/

  var currentAccount

  // ethereum
  //   .request({ method: 'eth_accounts' })
  //   .then(handleAccountsChanged)
  //   .catch((err) => {
  //     // Some unexpected error.
  //     // For backwards compatibility reasons, if no accounts are available,
  //     // eth_accounts will return an empty array.
  //     console.error(err);
  //   });

  // Note that this event is emitted on page load.
  // If the array of accounts is non-empty, you're already
  // connected.
  ethereum.on('accountsChanged', handleAccountsChanged);

  // For now, 'eth_accounts' will continue to always return an array
  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
      doLogout()
    } else if (accounts[0] !== currentAccount) {
      currentAccount = accounts[0]
      doLogin(accounts[0])
    }
  }

  /*********************************************/
  /* Access the user's accounts (per EIP-1102) */
  /*********************************************/

  // You should only attempt to request the user's accounts in response to user
  // interaction, such as a button click.
  // Otherwise, you popup-spam the user like it's 1999.
  // If you fail to retrieve the user's account(s), you should encourage the user
  // to initiate the attempt.

  if (document.readyState !== 'loading') {
    showButton(handleAccountsChanged)
  } else {
    window.addEventListener('DOMContentLoaded',
      () => showButton(handleAccountsChanged),
      { once: true })
  }
}

function showButton(handleAccountsChanged) {
  const button = document.getElementById('connectButton');
  if (!button) {
    console.error('!button')
    return
  }
  button.onclick = async () => {
    await ethereum.request({ method: 'wallet_requestAccounts' })
      .then(handleAccountsChanged)
      .catch((err) => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          console.log('Please connect to EzDeFi or MetaMask');
        } else {
          console.error(err);
        }
      });
  }
  button.disabled = false;
}

function doLogout() {
  console.log('Logged out')
}

function doLogin(account) {
  console.log('Account: ', account)
  doSomething(account)
}

async function doSomething(account) {
  await ethereum
    .request({
      method: 'getBalance',
      params: [account],
    })
    .then(res => console.log('balance', res))
    .catch(err => console.error('balance', err))
  await ethereum
    .request({
      method: 'getAccountInfo',
      params: [account],
    })
    .then(res => console.log('account', res))
    .catch(err => console.error('account', err))
  await ethereum
    .request({
      method: 'getClusterNodes',
    })
    .then(res => console.log('cluster nodes', res))
    .catch(err => console.error('cluster nodes', err))
  await ethereum
    .request({ method: 'wallet_accounts' })
    .then(res => console.log('accounts', res))
    .catch(err => console.error('accounts', err))

  const recentBlockhash = await ethereum
    .request({ method: 'getRecentBlockhash' })
    .then(res => Promise.resolve(res.value.blockhash))
    .catch(err => console.error('getRecentBlockhash', err))
  console.log('recentBlockhash', recentBlockhash)

  const fromPubkey = new PublicKey(account)
  const tx = new Transaction({recentBlockhash: '11111111111111111111111111111111'})
    .add(SystemProgram.transfer({
      fromPubkey,
      toPubkey: new PublicKey('G7awRVj7GNQzKZEVaJ1nJt2kiTTc1Z55gGcG6Ywf9ecS'),
      lamports: 123,
    }))

  tx.setSigners(fromPubkey)
  
  const signData = tx.serializeMessage();
  const wireTx = tx._serialize(signData);
  const encodedTx = bs58.encode(wireTx);
  console.log('encodedTx', encodedTx)
  // const decoded = bs58.decode(encodedTx)
  // const t = Transaction.from(decoded)
  // console.log('decoded', t)

  await ethereum
    .request({
      method: 'wallet_sendTransaction',
      params: [encodedTx],
    })
    .then(console.log)
    .catch(console.error)
}
