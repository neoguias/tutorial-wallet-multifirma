import { mkdir, readFile, writeFile } from "node:fs/promises";
const artifact = JSON.parse(await readFile(new URL("../artifacts/contracts/Wallet.sol/Wallet.json", import.meta.url), "utf8"));
const directory = new URL("../frontend/src/abi/", import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL("Wallet.json", directory), JSON.stringify(artifact.abi, null, 2) + "\n");
