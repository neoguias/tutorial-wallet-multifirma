import React, { useState } from 'react';

export default function FormularioTransferencia({crearTransferencia})
{
  const [cantidad, setCantidad] = useState(undefined);
  const [destinatario, setDestinatario] = useState(undefined);

  const submit = event => {
    event.preventDefault();
    crearTransferencia(cantidad, destinatario);
  }

  return (
    <div className="mt-4">
      <h2>Crear transferencia</h2>
      <form className="mt-4" onSubmit={(event) => submit(event)}>    
        <div className="form-group mt-2">
          <label htmlFor="cantidad">Cantidad</label>
          <input
            id="cantidad"
            step="any"
            className="form-control"
            type="number"
            onChange={event => setCantidad(event.target.value)}
          />
        </div>
        <div className="form-group mt-2">
          <label htmlFor="destinatario">Destinatario</label>
          <input
            id="destinatario"
            className="form-control"
            type="text"
            onChange={event => setDestinatario(event.target.value)}
          />
        </div>
        <button className="btn btn-primary mt-2">Enviar</button>
      </form>
    </div>
  );
}