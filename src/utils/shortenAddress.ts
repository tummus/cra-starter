// stole this from u matt: https://github.com/arcticmatt/nifty-airdrop/blob/main/src/utils/shortenAddress.ts
export default function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(
    address.length - 4
  )}`.toLowerCase();
}
