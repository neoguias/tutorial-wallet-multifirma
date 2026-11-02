import { useCallback, useEffect, useRef, useState } from 'react';
import { connectWallet, errorMessage, loadWallet, sendAction } from './wallet.js';

export default function App() {
  const [data, setData] = useState(null);
  const [account, setAccount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [deposit, setDeposit] = useState('');
  const requestId = useRef(0);
  const refresh = useCallback(async (currentAccount = account) => {
    const id = ++requestId.current;
    try { const next = await loadWallet(currentAccount); if (id === requestId.current) { setData(next); setError(''); } }
    catch (cause) { if (id === requestId.current) setError(errorMessage(cause)); }
  }, [account]);

  useEffect(() => { void refresh(); return () => { requestId.current++; }; }, [refresh]);
  useEffect(() => {
    if (!window.ethereum) return;
    const accountsChanged = accounts => { setAccount(accounts[0] || ''); setNotice(''); };
    const chainChanged = () => { setAccount(''); setNotice('Red cambiada. Comprueba la red del contrato y vuelve a conectar.'); };
    window.ethereum.on?.('accountsChanged', accountsChanged);
    window.ethereum.on?.('chainChanged', chainChanged);
    return () => { window.ethereum.removeListener?.('accountsChanged', accountsChanged); window.ethereum.removeListener?.('chainChanged', chainChanged); };
  }, []);

  const isOwner = Boolean(account && data?.owners.some(owner => owner.toLowerCase() === account.toLowerCase()));
  async function connect() {
    setBusy(true); setError('');
    try { const selected = await connectWallet(data.deployment); setAccount(selected); setNotice('Cuenta conectada.'); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  async function transact(action, values) {
    setBusy(true); setError(''); setNotice('Confirma la operación en MetaMask.');
    try {
      await sendAction(data.deployment, action, values);
      await refresh();
      setNotice('Operación confirmada.');
      if (action === 'create') { setAmount(''); setRecipient(''); }
      if (action === 'deposit') setDeposit('');
    } catch (cause) { setNotice(''); setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }

  return <main className="container">
    <header><div><p className="eyebrow">SOLIDITY · HARDHAT · REACT</p><h1>Wallet multifirma</h1><p>Propón transferencias y reúne las firmas de los propietarios.</p></div><button onClick={connect} disabled={busy || !data}>{account ? 'Cambiar cuenta' : 'Conectar MetaMask'}</button></header>
    {error && <div className="alert" role="alert">{error}<button onClick={() => refresh()}>Reintentar</button></div>}
    {notice && <p className="notice" role="status">{notice}</p>}
    {!data ? <p>Cargando la configuración de la wallet…</p> : <>
      <section className="summary"><div><span>Saldo del contrato</span><strong>{data.balance} ETH</strong></div><div><span>Firmas necesarias</span><strong>{data.threshold} de {data.owners.length}</strong></div><div><span>Red del contrato</span><strong>{data.deployment.chainId}</strong></div></section>
      <section className="panel"><h2>Contrato y propietarios</h2><p className="address">{data.deployment.address}</p><ul>{data.owners.map(owner => <li className="address" key={owner}>{owner}</li>)}</ul><p>Cuenta conectada: <span className="address">{account || 'Sin conectar'}</span></p>{account && <p>{isOwner ? 'Esta cuenta puede proponer y aprobar transferencias.' : 'Esta cuenta puede consultar la wallet y depositar ETH.'}</p>}</section>
      <div className="columns"><section className="panel"><h2>Nueva transferencia</h2><form onSubmit={event => { event.preventDefault(); void transact('create', [amount, recipient]); }}><label>Destinatario<input required value={recipient} onChange={event => setRecipient(event.target.value)} placeholder="0x…" /></label><label>Importe en ETH<input required inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.01" /></label><button disabled={busy || !isOwner}>Crear propuesta</button></form></section>
      <section className="panel"><h2>Depositar ETH</h2><form onSubmit={event => { event.preventDefault(); void transact('deposit', [deposit]); }}><label>Depósito en ETH<input required inputMode="decimal" value={deposit} onChange={event => setDeposit(event.target.value)} placeholder="0.1" /></label><button disabled={busy || !account}>Depositar</button></form></section></div>
      <section className="panel"><div className="section-heading"><h2>Transferencias</h2><button className="secondary" disabled={busy} onClick={() => refresh()}>Actualizar</button></div>{data.transfers.length === 0 ? <p>Todavía no hay propuestas.</p> : <div className="table-wrap"><table><thead><tr><th>ID</th><th>Destinatario</th><th>ETH</th><th>Firmas</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{data.transfers.map(transfer => <tr key={transfer.id}><td>{transfer.id}</td><td className="address">{transfer.recipient}</td><td>{transfer.amount}</td><td>{transfer.approvals} / {data.threshold}</td><td>{transfer.executed ? 'Enviada' : 'Pendiente'}</td><td><button disabled={busy || !isOwner || transfer.executed || transfer.approvedByMe} onClick={() => transact('approve', [transfer.id])}>{transfer.approvedByMe ? 'Aprobada por ti' : 'Aprobar'}</button></td></tr>)}</tbody></table></div>}</section>
    </>}
  </main>;
}
