import { BrowserProvider, Contract, JsonRpcProvider, formatEther, getAddress, parseEther } from 'ethers';
import abi from './abi/Wallet.json';

export async function loadWallet(account = '') {
  const response = await fetch('/deployment.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Ejecuta npm run deploy para crear la configuración del contrato.');
  const deployment = await response.json();
  const provider = deployment.rpcUrl ? new JsonRpcProvider(deployment.rpcUrl) : window.ethereum ? new BrowserProvider(window.ethereum) : null;
  if (!provider) throw new Error('Conecta MetaMask para consultar esta red.');
  try {
    if ((await provider.getNetwork()).chainId !== BigInt(deployment.chainId)) throw new Error(`Selecciona la red ${deployment.chainId} en MetaMask.`);
    if (await provider.getCode(deployment.address) === '0x') throw new Error('El contrato no existe en esta red. Vuelve a ejecutar npm run deploy si has reiniciado el nodo local.');
    const contract = new Contract(deployment.address, abi, provider);
    const [owners, threshold, transfers, balance] = await Promise.all([contract.getOwners(), contract.minApprovals(), contract.getTransfers(), provider.getBalance(deployment.address)]);
    const proposals = await Promise.all(transfers.map(async transfer => ({ id: transfer.id.toString(), amount: formatEther(transfer.amount), recipient: transfer.recipient, approvals: transfer.approvals.toString(), executed: transfer.executed, approvedByMe: account ? await contract.approved(account, transfer.id) : false })));
    return { deployment, owners: [...owners], threshold: threshold.toString(), transfers: proposals, balance: formatEther(balance) };
  } finally { provider.destroy(); }
}

export async function connectWallet(deployment) {
  if (!window.ethereum) throw new Error('Instala MetaMask para aprobar transferencias.');
  const provider = new BrowserProvider(window.ethereum);
  try {
    await provider.send('eth_requestAccounts', []);
    if ((await provider.getNetwork()).chainId !== BigInt(deployment.chainId)) throw new Error(`Selecciona la red ${deployment.chainId} en MetaMask y vuelve a conectar.`);
    return await (await provider.getSigner()).getAddress();
  } finally { provider.destroy(); }
}

export async function sendAction(deployment, action, values = []) {
  if (!window.ethereum) throw new Error('Conecta MetaMask para continuar.');
  const provider = new BrowserProvider(window.ethereum);
  try {
    if ((await provider.getNetwork()).chainId !== BigInt(deployment.chainId)) throw new Error(`Selecciona la red ${deployment.chainId} en MetaMask.`);
    const signer = await provider.getSigner();
    const contract = new Contract(deployment.address, abi, signer);
    let transaction;
    if (action === 'create') {
      const [amount, recipient] = values;
      const wei = parseEther(amount);
      if (wei <= 0n) throw new Error('Introduce un importe mayor que cero.');
      transaction = await contract.createTransfer(wei, getAddress(recipient));
    } else if (action === 'approve') transaction = await contract.approveTransfer(values[0]);
    else if (action === 'deposit') {
      const wei = parseEther(values[0]);
      if (wei <= 0n) throw new Error('Introduce un importe mayor que cero.');
      transaction = await signer.sendTransaction({ to: deployment.address, value: wei });
    } else throw new Error('Acción desconocida.');
    await transaction.wait();
    return transaction.hash;
  } finally { provider.destroy(); }
}

export function errorMessage(error) {
  const code = error?.code;
  if (code === 'ACTION_REJECTED' || code === 4001) return 'Has cancelado la operación en MetaMask.';
  return error?.reason || error?.shortMessage || error?.message || 'No se pudo completar la operación.';
}
