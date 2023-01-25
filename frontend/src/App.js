import React, { useEffect, useState } from 'react';
import { getWeb3, getWallet } from './interfaces.js';
import Informacion from './Informacion.js';
import FormularioTransferencia from './FormularioTransferencia.js';
import ListaTransferencias from './ListaTransferencias.js';

function App() {
  const [web3, setWeb3] = useState(undefined);
  const [cuentas, setCuentas] = useState(undefined);
  const [wallet, setWallet] = useState(undefined);
  const [direccionesValidadoras, setDireccionesValidadoras] = useState(undefined);
  const [minValidaciones, setMinValidaciones] = useState(undefined);
  const [transferencias, setTransferencias] = useState(undefined);

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3();
      setWeb3(web3);
        
      const cuentas = await web3.eth.getAccounts();
      setCuentas(cuentas);
        
      const wallet = await getWallet(web3);
      setWallet(wallet); 

      const direccionesValidadoras = await wallet.methods.getDireccionesValidadoras().call();
      setDireccionesValidadoras(direccionesValidadoras);
    
      const minValidaciones = await wallet.methods.minValidaciones().call();
      setMinValidaciones(minValidaciones);

      const transferencias = await wallet.methods.getTransferencias().call();
      setTransferencias(transferencias);
    };

    init();
  }, []);

  const crearTransferencia = (cantidad, destinatario) => {
    wallet.methods
      .crearTransferencia(cantidad, destinatario)
      .send({from: cuentas[0]});
  }

  const aprobarTransferencia = async transferenciaId => {
    wallet.methods
      .aprobarTransferencia(transferenciaId)
      .send({from: cuentas[0]});
  }

  if (typeof web3 == 'undefined'
    || typeof cuentas == 'undefined'
    || typeof wallet == 'undefined'
    || typeof direccionesValidadoras == 'undefined'
    || typeof minValidaciones == 'undefined'
    || typeof transferencias == 'undefined'
  ) {
    return (
      <div className="container">
        <header className="text-center">
          <h1>
              Cargando...
          </h1>
        </header>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="text-center">
        <h1 className="container mt-4">
          Wallet Multifirma
        </h1>
      </header>
      <div className="row">
        <div className="col-md-6">
          <Informacion direccionesValidadoras={direccionesValidadoras} minValidaciones={minValidaciones}/>
        </div>
        <div className="col-md-6">
          <FormularioTransferencia crearTransferencia={crearTransferencia}/>
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <ListaTransferencias transferencias={transferencias} aprobarTransferencia={aprobarTransferencia}/>
        </div>
      </div>
    </div>
  );
}

export default App;
