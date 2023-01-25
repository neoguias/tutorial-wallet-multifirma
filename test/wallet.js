const { assert } = require("console");
const { expectRevert } = require('@openzeppelin/test-helpers');
const Wallet =  artifacts.require('Wallet');

contract('Wallet', (cuentas) => {
  let wallet;
  beforeEach(async () => {
      wallet = await Wallet.new([cuentas[0], cuentas[1], cuentas[2]], 2);
      await web3.eth.sendTransaction({ from: cuentas[0], to: wallet.address, value: 10000});
  });

  it ('Debe tener valores correctos para las direcciones validadores y el número mínimo de validaciones', async () => {
    const direccionesValidadoras = await wallet.getDireccionesValidadoras();
    const minValidaciones = await wallet.minValidaciones();

    assert(direccionesValidadoras.length === 3);
    assert(direccionesValidadoras[0] === cuentas[0]);
    assert(direccionesValidadoras[1] === cuentas[1]);
    assert(direccionesValidadoras[2] === cuentas[2]);
    assert(minValidaciones.toNumber() === 2);
  });

  it ('Se debe crear una transferencia', async () => {
    await wallet.crearTransferencia(1000, cuentas[3], {from: cuentas[0]});
    const transferencias = await wallet.getTransferencias();

    assert(transferencias.length === 1);
    assert(transferencias[0].id === '0');
    assert(transferencias[0].cantidad === '1000');
    assert(transferencias[0].destinatario === cuentas[3]);
    assert(transferencias[0].numAprobaciones === '0');
    assert(transferencias[0].enviada === false);
  });

  it ('No se debe crear una transferencia si el sender no es una dirección validadora', async () => {
    await expectRevert(
      wallet.crearTransferencia(1000, cuentas[3], {from: cuentas[4]}),
      'Acceso denegado'
    );
  });

  it ('Se debe incrementar el número de aprobaciones', async () => {
    await wallet.crearTransferencia(1000, cuentas[3], {from: cuentas[0]});
    await wallet.aprobarTransferencia(0, {from: cuentas[0]});
    const transferencias = await wallet.getTransferencias();
    const balance = await web3.eth.getBalance(wallet.address);

    assert(transferencias[0].numAprobaciones === '1');
    assert(transferencias[0].enviada === false);
    assert(balance === '10000');
  });

  it ('Se debe enviar la transferencia cuando se alcanza el número mínimo de aprobaciones', async () => {
    const balanceInicialDestinatario =  web3.utils.toBN(await web3.eth.getBalance(cuentas[3]));

    await wallet.crearTransferencia(1000, cuentas[3], {from: cuentas[0]});
    await wallet.aprobarTransferencia(0, {from: cuentas[0]});
    await wallet.aprobarTransferencia(0, {from: cuentas[1]});

    const balanceFinalDestinatario =  web3.utils.toBN(await web3.eth.getBalance(cuentas[3]));
    assert(balanceFinalDestinatario.sub(balanceInicialDestinatario).toNumber() === 1000);

    const transferencias = await wallet.getTransferencias();
    const balance = await web3.eth.getBalance(wallet.address);

    assert(transferencias[0].numAprobaciones === '2');
    assert(transferencias[0].enviada === true);
    assert(balance === '9000');
  });

  it ('No se debe aprobar la transferencia si el sender no es una dirección validadora', async () => {
    await wallet.crearTransferencia(1000, cuentas[3], {from: cuentas[0]});

    await expectRevert(
        wallet.aprobarTransferencia(0, {from: cuentas[4]}),
        'Acceso denegado'
    );
  });

  it ('No se debe aprobar la transferencia si el sender ya la ha aprobado', async () => {
    await wallet.crearTransferencia(1000, cuentas[3], {from: cuentas[0]});
    await wallet.aprobarTransferencia(0, {from: cuentas[1]}),

    await expectRevert(
        wallet.aprobarTransferencia(0, {from: cuentas[1]}),
        'Ya has aprobado la transferencia'
    );
  });

  it ('No se debe enviar la transferencia si ya ha sido aprobada', async () => {
    await wallet.crearTransferencia(1000, cuentas[3], {from: cuentas[0]});
    await wallet.aprobarTransferencia(0, {from: cuentas[0]}),
    await wallet.aprobarTransferencia(0, {from: cuentas[1]}),

    await expectRevert(
        wallet.aprobarTransferencia(0, {from: cuentas[2]}),
        'La transferencia ya se ha enviado'
    );
  });
});
