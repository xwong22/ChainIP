import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Add this to safely handle private key
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.27",

  networks: {
    hardhat: {
      chainId: 31337,
    },
    "linea-sepolia": {
      url: "https://rpc.sepolia.linea.build",
      accounts: [PRIVATE_KEY],
      chainId: 59141
    },
  },
};

export default config;
