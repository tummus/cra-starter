import * as web3 from "@solana/web3.js";
import { Connection } from "@metaplex/js";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import axios from "axios";

const MAGIC_EDEN_PROGRAM_ADDR = "MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8";
const MAGIC_EDEN_CANCEL_LISTING_INNER_INSTR_COUNT = 1;
const MAGIC_EDEN_LISTING_INNER_INSTR_COUNT = 2;
const MAGIC_EDEN_SALE_INNER_INSTR_COUNT = 6;
// const LAMPORTS_IN_SOL = 1000000000;

enum TransactionType {
  MINT = "mint",
  TRANSFER = "transfer",
  ME_SALE = "sale",
  ME_LISTING = "listing",
  ME_CANCEL_LISTING = "cancel_listing",
  OTHER = "other",
}

type TransactionInfo = {
  owner: string | null;
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

type TransactionOwnerDiff = {
  prevOwner: string | null;
  owner: string | null;
};

type ParsedConfirmedTransactionWithBlockTime = {
  /** The slot during which the transaction was processed */
  slot: number;
  /** The details of the transaction */
  transaction: web3.ParsedTransaction;
  /** Metadata produced from the transaction */
  meta: web3.ParsedConfirmedTransactionMeta | null;
  /** The unix timestamp of when the transaction was processed */
  blockTime: number;
};

function getOwnerChangeForTransaction(
  transaction: ParsedConfirmedTransactionWithBlockTime,
  mintAddress: string
): TransactionOwnerDiff {
  let newOwner = null;
  let prevOwner = null;
  transaction.meta?.postTokenBalances?.forEach((balance: web3.TokenBalance) => {
    const balanceWithOwner = balance as TokenBalanceWithOwner;
    if (balance.mint === mintAddress && balance.uiTokenAmount.amount === "1") {
      newOwner = balanceWithOwner.owner;
    }
  });
  transaction.meta?.preTokenBalances?.forEach((balance: web3.TokenBalance) => {
    const balanceWithOwner = balance as TokenBalanceWithOwner;
    if (balance.mint === mintAddress && balance.uiTokenAmount.amount === "1") {
      prevOwner = balanceWithOwner.owner;
    }
  });

  return { prevOwner, owner: newOwner };
}

function getPurchaseAmount(
  transaction: ParsedConfirmedTransactionWithBlockTime
): number | null {
  let purchaseAmount = null;
  if (!transaction.meta) {
    return null;
  }
  const { preBalances } = transaction.meta;
  const { postBalances } = transaction.meta;
  if (preBalances.length > 0 && postBalances.length > 0) {
    purchaseAmount = preBalances[0] - postBalances[0] - transaction.meta.fee;
  }

  if (purchaseAmount && purchaseAmount < 0) {
    // log error for transaction for further analysis
    return null;
  }
  return purchaseAmount;
}

function getTransactionInfoForMint(
  transaction: ParsedConfirmedTransactionWithBlockTime,
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
  transaction: ParsedConfirmedTransactionWithBlockTime,
  mintAddress: string
): TransactionInfo | null {
  const { owner, prevOwner } = getOwnerChangeForTransaction(
    transaction,
    mintAddress
  );
  if (!owner) {
    // log signature for analysis
    return null;
  }
  return {
    owner,
    previousOwner: prevOwner,
    signature: transaction.transaction.signatures[0],
    blockTime: transaction.blockTime,
    purchaseAmount: null,
    transactionType:
      owner && prevOwner ? TransactionType.TRANSFER : TransactionType.OTHER,
  };
}

function getTransactionInfoForMagicEdenEvents(
  transaction: ParsedConfirmedTransactionWithBlockTime,
  mintAddress: string
): TransactionInfo | null {
  let hasMagicEdenProgramID = false;
  transaction.transaction.message.instructions
    .filter(
      (instr): instr is web3.PartiallyDecodedInstruction => instr !== null
    )
    .forEach((instr: web3.PartiallyDecodedInstruction) => {
      if (instr.programId.toString() === MAGIC_EDEN_PROGRAM_ADDR) {
        hasMagicEdenProgramID = true;
      }
    });

  // not a magic eden transaction
  if (!hasMagicEdenProgramID) {
    return null;
  }

  if (!transaction?.meta?.innerInstructions) {
    // in a prod environment, log signature for analysis on what kind of magic eden transaction this was
    return null;
  }

  if (transaction?.meta?.innerInstructions) {
    const { owner, prevOwner } = getOwnerChangeForTransaction(
      transaction,
      mintAddress
    );
    const purchaseAmount = getPurchaseAmount(transaction);
    switch (transaction.meta.innerInstructions[0].instructions.length) {
      case MAGIC_EDEN_CANCEL_LISTING_INNER_INSTR_COUNT:
        if (!owner) {
          // log signature for analysis
          break;
        }
        return {
          owner, // this is the lister
          previousOwner: null,
          signature: transaction.transaction.signatures[0],
          blockTime: transaction.blockTime,
          purchaseAmount: null,
          transactionType: TransactionType.ME_CANCEL_LISTING,
        };
      case MAGIC_EDEN_LISTING_INNER_INSTR_COUNT:
        if (!prevOwner) {
          // log signature for analysis
          break;
        }
        return {
          owner: prevOwner, // this is the lister
          previousOwner: null,
          signature: transaction.transaction.signatures[0],
          blockTime: transaction.blockTime,
          purchaseAmount: null,
          transactionType: TransactionType.ME_LISTING,
        };
      case MAGIC_EDEN_SALE_INNER_INSTR_COUNT:
        if (!owner || !prevOwner) {
          // log signature for analysis
          break;
        }
        if (!purchaseAmount) {
          // don't need to log, done in getPurchaseAmount
          break;
        }
        return {
          owner, // this is the lister
          previousOwner: prevOwner,
          signature: transaction.transaction.signatures[0],
          blockTime: transaction.blockTime,
          purchaseAmount,
          transactionType: TransactionType.ME_SALE,
        };
      default:
        break;
    }
  }
  // log signature for analysis on what kind of magic eden transaction this was
  return null;
}

function convertTransaction(
  transaction: web3.ParsedConfirmedTransaction,
  mintAddress: string
): TransactionInfo | null {
  let tranWithBlockTime;
  try {
    tranWithBlockTime = transaction as ParsedConfirmedTransactionWithBlockTime;
  } catch (e) {
    // log no blockTime error for signature here
    return null;
  }
  const mintTransaction = getTransactionInfoForMint(
    tranWithBlockTime,
    mintAddress
  );
  if (mintTransaction) {
    return mintTransaction;
  }
  const magicEdenTransaction = getTransactionInfoForMagicEdenEvents(
    tranWithBlockTime,
    mintAddress
  );
  if (magicEdenTransaction) {
    return magicEdenTransaction;
  }
  return getTransactionInfoForTransfer(tranWithBlockTime, mintAddress);
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

  // combine list of transactions and convert to transaction types, then sort
  const allTransactions = tokenTransactions.concat(mintTransactions);
  return allTransactions
    .map((transaction: web3.ParsedConfirmedTransaction) =>
      convertTransaction(transaction, mintKey)
    )
    .filter(
      (transaction): transaction is TransactionInfo => transaction != null
    )
    .sort((a, b) =>
      // sort by time desc
      a.blockTime >= b.blockTime ? -1 : 1
    );
}

async function getMintAccountMetadataURI(): Promise<string> {
  const connection = new Connection("mainnet-beta");
  const tokenPublicKey = "CbcNE5YN4bT5LFgrrRQVAoBrtp15AbNkVuy9hsWteyxn";
  const pda = await Metadata.getPDA(tokenPublicKey);
  const ownedMetadata = await Metadata.load(connection, pda);
  return ownedMetadata.data.data.uri;
}

export async function getMintAccountImageURI(): Promise<string> {
  const metadataURI = await getMintAccountMetadataURI();
  const resp = await axios.get(metadataURI);
  return resp.data.image;
}
