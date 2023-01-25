const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const Wallet =  artifacts.require('Wallet');

module.exports = async (deployer, _network, cuentas) => {
    await deployer.deploy(Wallet, [cuentas[0], cuentas[1], cuentas[2]], 2)
    const wallet = await Wallet.deployed();

    web3.eth.sendTransaction({from: cuentas[0], to: wallet.address, value: 10000});
} 