import * as web3 from "@solana/web3.js";
import { Connection } from "@metaplex/js";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import * as axios from "axios";

enum TransactionType {
  MINT = "mint",
  TRANSFER = "transfer",
  ME_SALE = "sale",
  ME_LISTED = "listed",
  ME_CANCEL_LISTING = "cancel_listing",
  OTHER = "other",
}

type TransactionInfo = {
  newOwner: string | null;
  previousOwner: string | null;
  purchaseAmount: number | null;
  signature: string;
  transactionType: TransactionType;
  blockTime: number;
};

type TokenBalanceWithOwner = {
  accountIndex: number;
  mint: string;
  uiTokenAmount: web3.TokenAmount;
  owner: string;
};

function getTransactionInfoForMint(
  transaction: web3.ParsedConfirmedTransaction,
  mintAddress: string
): TransactionInfo | null {
  let transactionInfo = null;
  transaction.transaction.message.instructions
    .filter((instr): instr is web3.ParsedInstruction => instr != null)
    .forEach((instr: web3.ParsedInstruction) => {
      if (
        instr.program === "spl-token" &&
        instr.parsed.type === "mintTo" &&
        instr.parsed.info.mint === mintAddress
      ) {
        transactionInfo = {
          newOwner: instr.parsed.info.mintAuthority,
          prevOwner: null,
          purchaseAmount: null,
          signature: transaction.transaction.signatures[0],
          transactionType: TransactionType.MINT,
          blockTime: transaction.blockTime,
        };
      }
    });

  return transactionInfo;
}

function getTransactionInfoForTransfer(
  transaction: web3.ParsedConfirmedTransaction,
  mintAddress: string
): TransactionInfo | null {
  let newOwner = null;
  let prevOwner = null;
  transaction.meta?.postTokenBalances?.forEach((balance: web3.TokenBalance) => {
    const balanceWithOwner = balance as TokenBalanceWithOwner;
    if (balance.mint === mintAddress && balance.uiTokenAmount.amount === "1") {
      newOwner = balanceWithOwner.owner;
    } else if (
      balance.mint === mintAddress &&
      balance.uiTokenAmount.amount === "0"
    ) {
      prevOwner = balanceWithOwner.owner;
    }
  });
  if (!transaction.blockTime) {
    return null;
  }
  return {
    newOwner,
    previousOwner: prevOwner,
    signature: transaction.transaction.signatures[0],
    blockTime: transaction.blockTime,
    purchaseAmount: null,
    transactionType: newOwner
      ? TransactionType.TRANSFER
      : TransactionType.OTHER,
  };
}

function convertTransaction(
  transaction: web3.ParsedConfirmedTransaction,
  mintAddress: string
): TransactionInfo | null {
  const mintTransaction = getTransactionInfoForMint(transaction, mintAddress);
  if (mintTransaction) {
    return mintTransaction;
  }
  return getTransactionInfoForTransfer(transaction, mintAddress);
}

function getTokenAccountsForTransactions(
  transactions: web3.ParsedConfirmedTransaction[]
): Set<string> {
  const tokenAddrs = new Set<string>();
  transactions.forEach((transaction: web3.ParsedConfirmedTransaction) => {
    const { accountKeys } = transaction.transaction.message;
    const postTokenBalances = transaction.meta?.postTokenBalances;
    if (postTokenBalances) {
      postTokenBalances.forEach((balance) => {
        const tokenAccountKey =
          accountKeys[balance.accountIndex].pubkey.toString();
        tokenAddrs.add(tokenAccountKey);
      });
    }
  });

  return tokenAddrs;
}

export default async function getAccountData(): Promise<
  TransactionInfo[] | null
> {
  // connect to solana mainnet
  const connection = new web3.Connection(
    web3.clusterApiUrl("mainnet-beta"),
    "confirmed"
  );

  // get the mint key object
  const mintKey = "AwxYN9K7ThQEKvKLgdneNSk1fJTn2raCriGDVWooxnh9";
  const mintPublicKey = new web3.PublicKey(mintKey);

  // get the transaction signatures for the mint key
  const mintTransactionSigs = await connection.getSignaturesForAddress(
    mintPublicKey
  );
  const mintTransactionSigKeys = new Set<string>();
  mintTransactionSigs.forEach((info: web3.ConfirmedSignatureInfo) => {
    mintTransactionSigKeys.add(info.signature);
  });

  // get actual transaction objects for mint key and filter nulls
  const mintTransactions = (
    await connection.getParsedConfirmedTransactions([...mintTransactionSigKeys])
  ).filter(
    (transaction): transaction is web3.ParsedConfirmedTransaction =>
      transaction != null
  );

  // get token accounts that had ownership of the NFT, we'll need this to fetch the transactions
  // done against the token account and merge with transactions done against the mint account
  const tokenAccts = getTokenAccountsForTransactions(mintTransactions);

  // get all transaction signatures associated with the token acct addresses
  const tokenAcctTransactionSigKeys = new Set<string>();
  await Promise.all(
    [...tokenAccts].map(async (tokenAcct: string) => {
      const signatures = await connection.getSignaturesForAddress(
        new web3.PublicKey(tokenAcct)
      );
      signatures.forEach((info: web3.ConfirmedSignatureInfo) => {
        const sigKey = info.signature;
        if (!mintTransactionSigKeys.has(sigKey)) {
          tokenAcctTransactionSigKeys.add(sigKey);
        }
      });
    })
  );

  // get actual transaction objects for token account signatures and filter nulls
  const tokenTransactions = (
    await connection.getParsedConfirmedTransactions([
      ...tokenAcctTransactionSigKeys,
    ])
  ).filter(
    (transaction): transaction is web3.ParsedConfirmedTransaction =>
      transaction != null
  );

  const allTransactions = tokenTransactions.concat(mintTransactions);

  return allTransactions
    .map((transaction: web3.ParsedConfirmedTransaction) =>
      convertTransaction(transaction, mintKey)
    )
    .filter(
      (transaction): transaction is TransactionInfo => transaction != null
    );
}

async function getMintAccountMetadataURI(): Promise<string> {
  const connection = new Connection("mainnet-beta");
  const tokenPublicKey = "CbcNE5YN4bT5LFgrrRQVAoBrtp15AbNkVuy9hsWteyxn";
  const pda = await Metadata.getPDA(tokenPublicKey);
  const ownedMetadata = await Metadata.load(connection, pda);
  return ownedMetadata.data.data.uri;
}

async function getMintAccountImageURI(): Promise<string> {
  const metadataURI = await getMintAccountMetadataURI();
  const resp = await axios.get(metadataURI);
  return resp.data.image;
}
