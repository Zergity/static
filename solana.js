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
  if (account) {
    renderAccounts(account)
  }
  // wallet_getClusterBtn
  const wallet_getClusterBtn = document.getElementById('wallet_getClusterBtn');
  wallet_getClusterBtn.onclick = () => {wallet_getCluster()}
  wallet_getClusterBtn.disabled = false;
  // getBalance
  const getBalanceBtn = document.getElementById('getBalanceBtn');
  getBalanceBtn.onclick = () => {getBalance(account)}
  getBalanceBtn.disabled = false;
  // getAccountInfo
  const getAccountInfoBtn = document.getElementById('getAccountInfoBtn');
  getAccountInfoBtn.onclick = () => {getAccountInfo(account)}
  getAccountInfoBtn.disabled = false;
  // getAccountInfo
  const wallet_accountsBtn = document.getElementById('wallet_accountsBtn');
  wallet_accountsBtn.onclick = () => {wallet_accounts(account)}
  wallet_accountsBtn.disabled = false;
  // buildRawTxBtn
  const buildRawTxBtn = document.getElementById('buildRawTxBtn');
  buildRawTxBtn.onclick = () => {buildRawTx(account)}
  buildRawTxBtn.disabled = false;

}

function renderAccounts(account) {
  const accountsDiv = document.getElementById('accounts')
  const text = document.createTextNode(account)
  accountsDiv.appendChild(text)
}

async function wallet_getCluster() {
  await ethereum
    .request({
      method: 'wallet_getCluster',
    })
    .then(res => {
      console.log('cluste', res)
      const div = document.getElementById('wallet_getCluster')
      const text = document.createTextNode(JSON.stringify(res))
      div.appendChild(text)
    })
    .catch(err => console.error('cluster nodes', err))
}

async function getBalance(account) {
  await ethereum
    .request({
      method: 'getBalance',
      params: [account],
    })
    .then(res => {
      console.log('balance', res)
      const div = document.getElementById('getBalance')
      const text = document.createTextNode(`${JSON.stringify(res.value/Math.pow(10,9))} SOL`)
      div.appendChild(text)
    })
    .catch(err => console.error('balance', err))
}
async function getAccountInfo(account) {
  await ethereum
    .request({
      method: 'getAccountInfo',
      params: [account],
    })
    .then(res => {
      console.log('account', res)
      const div = document.getElementById('getAccountInfo')
      const textArea = document.createElement('textarea')
      textArea.setAttribute('rows', '13')
      textArea.setAttribute('cols', '60')
      textArea.setAttribute('disabled', true)
      textArea.value = JSON.stringify(res, undefined, 1)
      div.appendChild(textArea)

    })
    .catch(err => console.error('account', err))
}

async function wallet_accounts() {
  await ethereum
    .request({ method: 'wallet_accounts' })
    .then(res => {
      console.log('accounts', res)
      const div = document.getElementById('wallet_accounts')
      const text = document.createTextNode(JSON.stringify(res, null, '\t'))
      div.appendChild(text)
    })
    .catch(err => console.error('accounts', err))
}

async function buildRawTx(account) {
  const toPubkey = document.getElementById('to').value
  console.error('toPubkey', toPubkey);
  const lamports = document.getElementById('amount').value
  console.error('lamports', lamports);
  const fromPubkey = new PublicKey(account)
  console.error('fromPubkey', fromPubkey);
  const tx = new Transaction({recentBlockhash: '11111111111111111111111111111111'})
  .add(SystemProgram.transfer({
    fromPubkey,
    toPubkey: new PublicKey(toPubkey),
    lamports
  }))
  tx.setSigners(fromPubkey)
  console.error('tx', tx);

  const div = document.getElementById('rawTx')
  const title = document.createElement('div')
  const text = document.createTextNode('Raw transaction')
  title.appendChild(text)
  div.appendChild(title)

  const textArea = document.createElement('textarea')
  textArea.setAttribute('rows', '13')
  textArea.setAttribute('cols', '60')
  textArea.setAttribute('disabled', true)
  textArea.value = JSON.stringify(tx, undefined, 1)
  div.appendChild(textArea)

  // signTxBtn
  const signTxBtn = document.getElementById('signTxBtn');
  signTxBtn.onclick = () => {signTx(account)}
  signTxBtn.disabled = false;

}

async function signTx(account) {
  const recentBlockhash = await ethereum
  .request({ method: 'getRecentBlockhash' })
  .then(res => Promise.resolve(res.value.blockhash))
  .catch(err => console.error('getRecentBlockhash', err))
  console.log('recentBlockhash', recentBlockhash)
  const toPubkey = document.getElementById('to').value
  const lamports = document.getElementById('amount').value
  const txParams = {
    fromPubkey: account,
    toPubkey,
    lamports,
    recentBlockhash
  }

  await ethereum
  .request({ method: 'wallet_signTransaction', params: [txParams]})
  .then((res) => {
    console.error('signedTx', res);
    const signData = tx.serializeMessage();
    const wireTx = tx._serialize(signData);
    const encodedTx = bs58.encode(wireTx);
    console.log('encodedTx', encodedTx)

    const div = document.getElementById('encodedTx')
    const title = document.createElement('div')
    const text = document.createTextNode('Encoded Transaction')
    title.appendChild(text)
    div.appendChild(title)

    const textArea = document.createElement('textarea')
    textArea.setAttribute('rows', '13')
    textArea.setAttribute('cols', '60')
    textArea.setAttribute('disabled', true)
    textArea.value = JSON.stringify(encodedTx, undefined, 1)
    div.appendChild(textArea)

    // send
    const sendTxBtn = document.getElementById('sendTxBtn');
    sendTxBtn.onclick = () => {sendTx(encodedTx)}
    sendTxBtn.disabled = false;
  })
  .catch((err) => {
    console.error('error', err);
    const div = document.getElementById('encodedTx')
    const error = document.createElement('div')
    const text = document.createTextNode(err)
    error.appendChild(text)
    div.appendChild(error)
  })

}
async function sendTx(encodedTx) {
  console.error('sendTx', encodedTx);
  await ethereum
  .request({
    method: 'wallet_sendTransaction',
    params: [encodedTx],
  })
  .then(console.log)
  .catch(console.error)
}
