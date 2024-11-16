import { SignProtocolClient, SpMode, EvmChains } from "@ethsign/sp-sdk";
import { privateKeyToAccount } from "viem/accounts";
// import { SIGNER_PRIVATE_KEY } from "@/secrets";

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";

const client = new SignProtocolClient(SpMode.OnChain, {
  chain: EvmChains.scrollSepolia,
  account: privateKeyToAccount(`0x${SIGNER_PRIVATE_KEY}`),
});

export async function createNotaryAttestation(Contract: string, User: string, Hash: string, Score: number, Comment: string) {
  console.log(Contract, User, Hash, Score, Comment);
  try {
    const res = await client.createAttestation({
      schemaId: "0x59",
      data: {
        Contract,
        User,
        Hash,
        Score,
        Comment
      },
      indexingValue: User.toLowerCase()
    });
  }
  catch (error) {
    console.log(error);
  }
}