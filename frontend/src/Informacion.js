import React from "react";

export default function Informacion({ direccionesValidadoras, minValidaciones })
{
  return (
    <div className="table-responsive mt-4">
      Min. Validaciones: {minValidaciones}
      <table className="table mt-4">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Dirección</th>
          </tr>
        </thead>
        <tbody>
          {direccionesValidadoras.map((direccion, index) => {
            return (
              <tr key={index}>
                <th scope="row">{index}</th>
                <td>{direccion}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
