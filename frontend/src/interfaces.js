import Web3 from 'web3';
import Wallet from './contracts/Wallet.json';
import detectEthereumProvider from '@metamask/detect-provider';


const getWeb3 = () => {
  
  return new Promise( async (resolve, reject) => {

    let provider = await detectEthereumProvider();

    if (provider) {
      await provider.request({ method: 'eth_requestAccounts' });

      try {
        resolve(new Web3(window.ethereum));
      } catch(error) {
        reject(error);
      }
    }

    if (process.env.REACT_APP_WEB3_PROVIDER !== 'undefined') {
      resolve(new Web3(process.env.REACT_APP_WEB3_PROVIDER));
    }

    reject('Debes instalar Metamask');
  });
}

const getWallet = async web3 => {
  const networkId = await web3.eth.net.getId();

  return new web3.eth.Contract(
    Wallet.abi,
    Wallet.networks[networkId].address
  );
}

export {getWeb3, getWallet};