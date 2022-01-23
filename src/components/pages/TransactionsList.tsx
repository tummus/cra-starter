import ColorClass from "../../types/enums/ColorClass";
import {
  NFTMetadataResult,
  TransactionsResult,
} from "../../utils/queryUtils";
import LoadingSpinner from "../loading/LoadingSpinner";
import Body2Bold from "../text/Body2Bold";
import styles from "../../css/pages/Transactions.module.css";
import Header1 from "../text/Header1";
import TransactionsListItem from "./TransactionsListItem";
import Body1 from "../text/Body1";

type Props = {
  metadataResult: NFTMetadataResult | null;
  transactionsResult: TransactionsResult | null;
};
export default function TransactionsList({
  metadataResult,
  transactionsResult,
}: Props): JSX.Element {
  // checks if there was an error with the queries
  const error =
    transactionsResult?.error === true || metadataResult?.error === true;

  // if transactions query results not in, show spinner, otherwise attempt to render list
  const transactionsList = !transactionsResult ? (
    <LoadingSpinner />
  ) : (
    transactionsResult?.transactions?.map((transaction) => (
      <TransactionsListItem
        transaction={transaction}
        solPrice={transactionsResult?.solPrice}
      />
    ))
  );

  // if metadata query results not in, show spinner, otherwise attempt to render list
  const header = !metadataResult ? (
    <LoadingSpinner />
  ) : (
    <div className={styles.metadataContainer}>
      <a
        className={styles.explorerLink}
        href={`https://explorer.solana.com/address/${metadataResult?.mintAddress}`}
      >
        <img className={styles.asset} src={metadataResult?.image} alt="Asset" />
        <Header1 className={styles.nftName}>
          {metadataResult?.name ?? ""}
        </Header1>
      </a>
    </div>
  );

  // if there's an error with the query results, show an error, otherwise present info
  return error ? (
    <Body1>Something went wrong :(</Body1>
  ) : (
    <>
      {header}
      <div className={styles.transactionList}>
        <Body2Bold
          className={styles.transactionListLabel}
          colorClass={ColorClass.Dimmer}
        >
          ACTIVITY
        </Body2Bold>
        {transactionsList}
      </div>
    </>
  );
}
