import "dotenv/config";
import { configVariable, defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers";

export default defineConfig({
  plugins: [hardhatEthers, hardhatMocha, hardhatMatchers],
  solidity: { version: "0.8.38", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    localhost: { type: "http", chainType: "l1", url: process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545" },
    sepolia: {
      type: "http", chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
});
