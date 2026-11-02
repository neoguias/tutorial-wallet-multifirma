import "dotenv/config";
import { network } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";

const { ethers } = await network.create();
const { chainId } = await ethers.provider.getNetwork();
const signers = await ethers.getSigners();
let owners = process.env.WALLET_OWNERS?.split(",").map(value => value.trim()).filter(Boolean);
if (!owners?.length) {
  if (chainId !== 31337n) throw new Error("Configura WALLET_OWNERS con las direcciones de los propietarios.");
  owners = await Promise.all(signers.slice(0, 3).map(signer => signer.getAddress()));
}
const threshold = Number(process.env.MIN_APPROVALS || "2");
if (!Number.isInteger(threshold) || threshold < 1 || threshold > owners.length) {
  throw new Error("MIN_APPROVALS debe estar entre 1 y el número de propietarios.");
}
const wallet = await ethers.deployContract("Wallet", [owners, threshold]);
await wallet.waitForDeployment();
const address = await wallet.getAddress();
if (chainId === 31337n) {
  await (await signers[0].sendTransaction({ to: address, value: ethers.parseEther("1") })).wait();
}
const deployment = {
  address, chainId: Number(chainId),
  rpcUrl: process.env.PUBLIC_RPC_URL || (chainId === 31337n ? "http://127.0.0.1:8545" : ""),
};
await mkdir(new URL("../frontend/public/", import.meta.url), { recursive: true });
await writeFile(new URL("../frontend/public/deployment.json", import.meta.url), JSON.stringify(deployment, null, 2) + "\n");
console.log(`Wallet desplegada en ${address}, red ${chainId}.`);
console.log("Configuración pública guardada en frontend/public/deployment.json.");
