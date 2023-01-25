// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

contract Wallet
{
    uint public minValidaciones;
    address[] public direccionesValidadoras;
    
    struct Transferencia
    {
        uint id;
        uint cantidad;
        address payable destinatario;
        uint numAprobaciones;
        bool enviada;
    }

    Transferencia[] public transferencias;
    mapping(address => mapping(uint => bool)) public aprobaciones;

    constructor(address[] memory _direccionesValidadoras, uint _minValidaciones)
    {
        minValidaciones = _minValidaciones;
        direccionesValidadoras = _direccionesValidadoras;
    }

    function getDireccionesValidadoras() external view returns(address[] memory)  
    {
        return direccionesValidadoras;
    }

    function crearTransferencia(uint cantidad, address payable destinatario) external puedeAprobar()
    {
        transferencias.push(Transferencia(
            transferencias.length,
            cantidad,
            destinatario,
            0,
            false
        ));
    }

    function getTransferencias() external view returns(Transferencia[] memory)  
    {
        return transferencias;
    }

    function aprobarTransferencia(uint id) external puedeAprobar()
    {
        require(transferencias[id].enviada == false, 'La transferencia ya se ha enviado');
        require(aprobaciones[msg.sender][id] == false, 'Ya has aprobado la transferencia');
        aprobaciones[msg.sender][id] = true;
        transferencias[id].numAprobaciones++;

        if (transferencias[id].numAprobaciones < minValidaciones) return;
        
        address payable destinatario = transferencias[id].destinatario;
        uint cantidad = transferencias[id].cantidad;
        destinatario.transfer(cantidad);
        transferencias[id].enviada = true;
    }

    receive() external payable {}

    modifier puedeAprobar()
    {
        bool accesoPermitido = false;
        for (uint i = 0; i < direccionesValidadoras.length; i++) {
            if (direccionesValidadoras[i] == msg.sender) {
                accesoPermitido = true;
                break;
            }
        }

        require(accesoPermitido == true, 'Acceso denegado');
        _;
    }
}