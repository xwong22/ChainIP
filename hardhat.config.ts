import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Add this to safely handle private key
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.27",

  networks: {
    hardhat: {
      chainId: 1337,
    },
    // "linea-sepolia": {
    //   url: "https://rpc.sepolia.linea.build",
    //   accounts: [PRIVATE_KEY],
    //   chainId: 59141
    // },
    "scroll-sepolia": {
      url: process.env.SCROLL_SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 534351
    }
  },
};

export default config;
