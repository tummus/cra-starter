import { TransactionInfo, TransactionType } from "../../utils/queryUtils";
import styles from "../../css/pages/Transactions.module.css";
import Body2 from "../text/Body2";
import ColorClass from "../../types/enums/ColorClass";
import Body1 from "../text/Body1";
import Header2 from "../text/Header2";
import shortenAddress from "../../utils/shortenAddress";

type Props = {
  transaction: TransactionInfo;
  solPrice: number;
};
export default function TransactionsListItem({
  transaction,
  solPrice,
}: Props): JSX.Element {
  const blockTime = new Date(transaction.blockTime * 1000);
  const dateOptions = {
    weekday: undefined,
    year: "numeric",
    month: "short",
    day: "numeric",
  } as const;
  const timeOption = {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
  } as const;
  const transactionTime = blockTime
    .toLocaleDateString(undefined, dateOptions)
    .concat(" at ")
    .concat(blockTime.toLocaleTimeString(undefined, timeOption));
  let transactionText;
  switch (transaction.transactionType) {
    case TransactionType.ME_SALE:
      if (transaction.owner) {
        transactionText = "Bought by ".concat(
          shortenAddress(transaction.owner)
        );
      } else {
        transactionText = "Bought";
      }
      break;
    case TransactionType.ME_CANCEL_LISTING:
      if (transaction.owner) {
        transactionText = "Listing cancelled by ".concat(
          shortenAddress(transaction.owner ?? "")
        );
      } else {
        transactionText = "Listing cancelled";
      }
      break;
    case TransactionType.ME_LISTING:
      if (transaction.owner) {
        transactionText = "Listed by ".concat(
          shortenAddress(transaction.owner ?? "")
        );
      } else {
        transactionText = "Listed";
      }
      break;
    case TransactionType.MINT:
      if (transaction.owner) {
        transactionText = "Minted by ".concat(
          shortenAddress(transaction.owner)
        );
      } else {
        transactionText = "Minted";
      }
      break;
    case TransactionType.TRANSFER:
      if (transaction.owner) {
        transactionText = "Transferred to ".concat(
          shortenAddress(transaction.owner ?? "")
        );
      } else {
        transactionText = "Transferred";
      }
      break;
    default:
      transactionText = "Transacted at ".concat(transaction.signature);
      break;
  }
  return (
    <div className={styles.transactionText}>
      <div className={styles.transactionTextLeft}>
        <a
          className={styles.explorerLink}
          href={`https://explorer.solana.com/tx/${transaction.signature}`}
        >
          <Body1>{transactionText}</Body1>
          <Body2 colorClass={ColorClass.Dimmer}>{transactionTime}</Body2>
        </a>
      </div>
      {transaction.purchaseAmount && (
        <div className={styles.transactionTextRight}>
          <Header2>{transaction.purchaseAmount} ◎</Header2>
          <Body2 colorClass={ColorClass.Dimmer}>
            ${solPrice * transaction.purchaseAmount} USD
          </Body2>
        </div>
      )}
    </div>
  );
}
