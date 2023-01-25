import React from "react";

export default function ListaTransferencias({ transferencias, aprobarTransferencia })
{
  return (
    <div className="table-responsive mt-4">
    <h2 className="mt-4">Transferencias</h2>
      <table className="table mt-4">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Cantidad</th>
            <th scope="col">Destinatario</th>
            <th scope="col">Aprobaciones</th>
            <th scope="col">Enviada</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {transferencias.map((transferencia) => {
            return (
              <tr key={transferencia.id}>
                <th scope="row">{transferencia.id}</th>
                <td>{transferencia.cantidad}</td>
                <td>{transferencia.destinatario}</td>
                <td>{transferencia.numAprobaciones}</td>
                <td>{transferencia.enviada ? 'Si' : 'No'}</td>
                <td>
                    <button
                        onClick={() => aprobarTransferencia(transferencia.id)}
                    >
                        Aprobar
                    </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}