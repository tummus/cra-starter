import * as web3 from "@solana/web3.js";
import { Connection } from "@metaplex/js";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import axios from "axios";

const MAGIC_EDEN_PROGRAM_ADDR = "MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8";
const MAGIC_EDEN_CANCEL_LISTING_INNER_INSTR_COUNT = 1;
const MAGIC_EDEN_LISTING_INNER_INSTR_COUNT = 2;
const MAGIC_EDEN_SALE_INNER_INSTR_COUNT = 6;

export enum TransactionType {
  MINT = "mint",
  TRANSFER = "transfer",
  ME_SALE = "sale",
  ME_LISTING = "listing",
  ME_CANCEL_LISTING = "cancel_listing",
  OTHER = "other",
}

export type TransactionInfo = {
  owner: string | null;
  previousOwner: string | null;
  purchaseAmount: number | null;
  signature: string;
  transactionType: TransactionType;
  blockTime: number;
  isFailedCoercion?: boolean;
  failedCoercionStep?: string;
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

export type TransactionsResult = {
  transactions: TransactionInfo[];
  solPrice: number;
  error: boolean;
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

export type NFTMetadataResult = {
  image: string;
  name: string;
  mintAddress: string;
  error: boolean;
};

const FAILED_COERCION = {
  owner: null, // this is the lister
  previousOwner: null,
  signature: "",
  blockTime: 0,
  purchaseAmount: null,
  transactionType: TransactionType.OTHER,
  isFailedCoercion: true,
};
const TEST_TRANSACTIONS =
  '[{"owner":"CA2Hkm5Tx1Wj5WB2ukb67bzDiq2y5MJvMSCvVDC7dSbp","previousOwner":"9jTweGfBbz9CH9QUQf4EnzPUgro3zXKVsyPtVdXunjmV","signature":"2husZi7Vs8Z7Aj1daN7FZFAP3m8Bm2p7CcyqNFSD9hnuzJSBy1a4AqjJg2VB7wCqJdeknqMvtu7oGFJmauKmQcgo","blockTime":1640841989,"purchaseAmount":1,"transactionType":"sale"},{"owner":"9jTweGfBbz9CH9QUQf4EnzPUgro3zXKVsyPtVdXunjmV","previousOwner":null,"signature":"8AE7rzZDB398GUh1H37DvuP6G18x5yTntt5JRkgPgd472kSniVFvqsHHezmM9cheLkXBS6Lc3uibejJy2cL3xy2","blockTime":1640839859,"purchaseAmount":null,"transactionType":"listing"},{"owner":"9jTweGfBbz9CH9QUQf4EnzPUgro3zXKVsyPtVdXunjmV","previousOwner":null,"signature":"2dW2jPSE5NEtXwuaKFL1b1ZzGvzP13WZCLsWQGE61yf974Un9HHmGnSfkhGurk7w3tDxC4KTvK7C6xaztDPurbce","blockTime":1640839824,"purchaseAmount":null,"transactionType":"cancel_listing"},{"owner":"9jTweGfBbz9CH9QUQf4EnzPUgro3zXKVsyPtVdXunjmV","previousOwner":null,"signature":"5tHsgVpucXHg8Wb8rQFBZiN96rrbiNobBgi2x3YFKyCuWtFPsNksq8ZXMVBk4Fpmxwip3yQ9zmCcmfzDAsjeUAXr","blockTime":1640839644,"purchaseAmount":null,"transactionType":"listing"},{"owner":"9jTweGfBbz9CH9QUQf4EnzPUgro3zXKVsyPtVdXunjmV","previousOwner":null,"signature":"baKHuq1DCjuzsQXzVjw39KM1sxKXt8mbipqvkgRbPtKSQpcJ6ZfW9TRAMk2pDv5ipPFXrxd34sEQXY6TnQqLgzJ","blockTime":1640839607,"purchaseAmount":null,"transactionType":"cancel_listing"},{"owner":"9jTweGfBbz9CH9QUQf4EnzPUgro3zXKVsyPtVdXunjmV","previousOwner":null,"signature":"4FFzc6spegby7yDVkgL4dBbGtMnBQSfABdJqygaTrMz5zhaikhpBBmyV5HYs2VrPbMUFMrZ82d1qBQBNYXSGdkSc","blockTime":1640839581,"purchaseAmount":null,"transactionType":"listing"},{"owner":"9jTweGfBbz9CH9QUQf4EnzPUgro3zXKVsyPtVdXunjmV","previousOwner":"EoTbt857oar8JLU5NwduEHVqmFWgc5yiBt1g43YWJCN2","signature":"5KSpPazKeay8nWukmXgBPK2TwJBpNvqjvjxZb83Jq3ZoJBHJh9ZC2hXEh59MERCVdaaFWWFFe8UDC14xHuSFaA5t","blockTime":1640801250,"purchaseAmount":null,"transactionType":"transfer"},{"owner":"EoTbt857oar8JLU5NwduEHVqmFWgc5yiBt1g43YWJCN2","previousOwner":"6oBFaRiMZTe2sHwVUcEa86rxsYkrQC1ytU9pJciQkKcQ","signature":"XVf7tST5vrBUhYj7QNAiv5Ab8oG5NA26a2wbm3PBkQi8T2faDfnn561WUs4WjeDdgFp48WER4jzUiVskaW5GGo9","blockTime":1640794889,"purchaseAmount":null,"transactionType":"transfer"},{"owner":"6oBFaRiMZTe2sHwVUcEa86rxsYkrQC1ytU9pJciQkKcQ","prevOwner":null,"purchaseAmount":null,"signature":"3CpmxgAJvuvQuvDGmTtL6RCwWajZPJJL672h4oFmjG9LrcDEYTNkkS7YJABHLmNcGvfeCKa5n6dZ1shpWqc6vyAg","transactionType":"mint","blockTime":1640793696}]';

async function getSolanaPrice(): Promise<number> {
  const resp = await axios({
    method: "get",
    url: "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
    params: {
      symbol: "SOL",
      CMC_PRO_API_KEY: "fakeAPIkey lol",
    },
  });
  return resp.data.data.SOL.quote.USD.price;
}

/**
 * @param transaction a transaction for the NFT or NFT Token Acct
 * @param mintAddress mintAddr for the NFT
 * @returns new and prev owner for a transfer.
 *
 * Scans the pre and post token balances for who owns the token w/
 * associated mint address before and after transaction. Previous owner has
 * a token account w/ 1 of the NFT in the pre token balance and new owner
 * has a token account w/ 1 of the NFT in the post token balance.
 */
function getOwnerChangeForTransfer(
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

/**
 * @param transaction a transaction for the NFT or NFT Token Acct
 * @param mintAddress mintAddr for the NFT
 * @returns new and prev owner for a ME Sale.
 *
 * Scans the post token balances for who owns the token w/
 * associated mint address after transaction. Previous owner is the
 * 3rd account in account keys.
 */
function getOwnerChangeForMESale(
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
  const acctKeys = transaction.transaction.message.accountKeys;
  if (acctKeys.length > 3) {
    prevOwner = acctKeys[2].pubkey.toString();
  }
  return { prevOwner, owner: newOwner };
}

/**
 * @param transaction a transaction for the NFT or NFT Token Acct
 * @returns subtracts the first account's post balance from it's
 * pre balance minus transaction fees to get the purchase amount.
 */
function getPurchasePriceForTransaction(
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
    return null;
  }
  return purchaseAmount;
}

/**
 * @param transaction a transaction for the NFT or NFT Token Acct
 * @param mintAddress mintAddr for the NFT
 * @returns formatted transaction info if valid mint
 */
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
          owner: instr.parsed.info.mintAuthority,
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

/**
 * @param transaction a transaction for the NFT or NFT Token Acct
 * @param mintAddress mintAddr for the NFT
 * @returns formatted transaction info if valid transfer. If
 * previous owner and owner are not both present return Other transaction type.
 */
function getTransactionInfoForTransfer(
  transaction: ParsedConfirmedTransactionWithBlockTime,
  mintAddress: string
): TransactionInfo | null {
  const { owner, prevOwner } = getOwnerChangeForTransfer(
    transaction,
    mintAddress
  );
  if (!owner || !prevOwner) {
    return {
      ...FAILED_COERCION,
      failedCoercionStep: "Transfer has no owner or prev owner",
    };
  }
  return {
    owner,
    previousOwner: prevOwner,
    signature: transaction.transaction.signatures[0],
    blockTime: transaction.blockTime,
    purchaseAmount: null,
    transactionType: TransactionType.TRANSFER,
  };
}

/**
 * @param transaction a transaction for the NFT or NFT Token Acct
 * @param mintAddress mintAddr for the NFT
 * @returns formatted transaction info if valid Magic Eden Transaction
 * for consumption by the frontend.
 *
 * Checks program instructions for
 * the Magic Eden program address, then checks the inner instruction count
 * to understand the type of transaction occuring.
 */
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

  const innerInstructions = transaction?.meta?.innerInstructions;

  if (!innerInstructions || innerInstructions.length < 1) {
    return {
      ...FAILED_COERCION,
      failedCoercionStep:
        "Inner instructions for Magic Eden transaction don't exist",
    };
  }
  const { owner, prevOwner } = getOwnerChangeForTransfer(
    transaction,
    mintAddress
  );
  const innerInstrLength = innerInstructions[0].instructions.length;
  if (innerInstrLength === MAGIC_EDEN_CANCEL_LISTING_INNER_INSTR_COUNT) {
    if (!owner) {
      return {
        ...FAILED_COERCION,
        failedCoercionStep: "Owner for ME cancel listing doesn't exist",
      };
    }
    return {
      owner, // this is the lister
      previousOwner: null,
      signature: transaction.transaction.signatures[0],
      blockTime: transaction.blockTime,
      purchaseAmount: null,
      transactionType: TransactionType.ME_CANCEL_LISTING,
    };
  }
  if (innerInstrLength === MAGIC_EDEN_LISTING_INNER_INSTR_COUNT) {
    if (!prevOwner) {
      return {
        ...FAILED_COERCION,
        failedCoercionStep: "Owner for ME listing doesn't exist",
      };
    }
    return {
      owner: prevOwner, // this is the lister
      previousOwner: null,
      signature: transaction.transaction.signatures[0],
      blockTime: transaction.blockTime,
      purchaseAmount: null,
      transactionType: TransactionType.ME_LISTING,
    };
  }
  if (innerInstrLength === MAGIC_EDEN_SALE_INNER_INSTR_COUNT) {
    const ownerChange = getOwnerChangeForMESale(transaction, mintAddress);
    if (!ownerChange.prevOwner || !ownerChange.owner) {
      return {
        ...FAILED_COERCION,
        failedCoercionStep: "Owner/prevOwner for ME listing doesn't exist",
      };
    }
    const purchaseAmount = getPurchasePriceForTransaction(transaction);
    if (!purchaseAmount) {
      return {
        ...FAILED_COERCION,
        failedCoercionStep: "Purchase for ME listing is negative or DNE",
      };
    }
    return {
      owner: ownerChange.owner,
      previousOwner: ownerChange.prevOwner, // this is the lister
      signature: transaction.transaction.signatures[0],
      blockTime: transaction.blockTime,
      purchaseAmount: purchaseAmount / web3.LAMPORTS_PER_SOL,
      transactionType: TransactionType.ME_SALE,
    };
  }

  return {
    ...FAILED_COERCION,
    failedCoercionStep: "Fell through Magic Eden coercion flow",
  };
}

/**
 * @param transaction a transaction for the NFT or NFT Token Acct
 * @param mintAddress mintAddr for the NFT
 * @returns formatted transaction infomation for consumption by the frontend.
 * If transaction doesn't match one of the transaction types,
 * we return null or Other transaction type.
 */
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
    if (mintTransaction?.isFailedCoercion) {
      // log issue w/ mintTransaction?.failedCoercionStep
      return null;
    }
    return mintTransaction;
  }
  const magicEdenTransaction = getTransactionInfoForMagicEdenEvents(
    tranWithBlockTime,
    mintAddress
  );
  if (magicEdenTransaction) {
    if (magicEdenTransaction?.isFailedCoercion) {
      // log issue w/ magicEdenTransaction?.failedCoercionStep
      return null;
    }
    return magicEdenTransaction;
  }
  const transferTransaction = getTransactionInfoForTransfer(
    tranWithBlockTime,
    mintAddress
  );

  if (transferTransaction) {
    if (transferTransaction?.isFailedCoercion) {
      // log issue w/ magicEdenTransaction?.failedCoercionStep
      return null;
    }
    return transferTransaction;
  }

  // log why the coercion fell through
  return null;
}

/**
 * @param transactions list of transactions
 * @returns list of token accounts that owned this NFT
 * Checks each transactions post token balances to find
 * all the token accounts that have owned the NFT.
 */
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
/**
 * @returns List of transactions for a mint account
 */
export default async function getAccountData(
  mintKey: string
): Promise<TransactionsResult> {
  try {
    // connect to solana mainnet
    const connection = new web3.Connection(
      web3.clusterApiUrl("mainnet-beta"),
      "confirmed"
    );

    // get the mint key object
    const mintPublicKey = new web3.PublicKey(mintKey);

    // get the transaction signatures for the mint key
    const mintTransactionSigs = await connection.getSignaturesForAddress(
      mintPublicKey
    );
    const solPrice = await getSolanaPrice();
    const mintTransactionSigKeys = new Set<string>();
    mintTransactionSigs.forEach((info: web3.ConfirmedSignatureInfo) => {
      mintTransactionSigKeys.add(info.signature);
    });

    // get actual transaction objects for mint key and filter nulls
    const mintTransactions = (
      await connection.getParsedConfirmedTransactions([
        ...mintTransactionSigKeys,
      ])
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
    const allTransactions = tokenTransactions
      .concat(mintTransactions)
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
    return { solPrice, transactions: allTransactions, error: false };
  } catch {
    return { solPrice: -1, transactions: [], error: true };
  }
}

async function getMintAccountMetadataURI(mintAddress: string): Promise<string> {
  const connection = new Connection("mainnet-beta");
  const pda = await Metadata.getPDA(mintAddress);
  const ownedMetadata = await Metadata.load(connection, pda);
  return ownedMetadata.data.data.uri;
}

export async function getMintAccountMetadata(
  mintAddress: string
): Promise<NFTMetadataResult | null> {
  try {
    const metadataURI = await getMintAccountMetadataURI(mintAddress);
    const resp = await axios.get(metadataURI);
    return { ...resp.data, mintAddress, error: false } as NFTMetadataResult;
  } catch {
    return {
      image: "",
      error: true,
      name: "",
      mintAddress,
    } as NFTMetadataResult;
  }
}

export async function getTestTransactions(
  mintAddress: string
): Promise<TransactionsResult> {
  try {
    const mintPublicKey = new web3.PublicKey(mintAddress);
    if (
      mintPublicKey.toString() ===
      "AwxYN9K7ThQEKvKLgdneNSk1fJTn2raCriGDVWooxnh9"
    ) {
      return {
        transactions: JSON.parse(TEST_TRANSACTIONS) as TransactionInfo[],
        solPrice: 95.7,
        error: false,
      };
    }
    return { transactions: [], solPrice: -1, error: true };
  } catch {
    return { transactions: [], solPrice: -1, error: true };
  }
}

export function isValidMintAddress(mintAddress: string): boolean {
  try {
    return !!new web3.PublicKey(mintAddress);
  } catch {
    return false;
  }
}
