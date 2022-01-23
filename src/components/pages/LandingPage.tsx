import { useEffect, useState } from "react";
import getAccountData, {
  // getTestTransactions,
  NFTMetadataResult,
  getMintAccountMetadata,
  isValidMintAddress,
  TransactionsResult,
} from "../../utils/queryUtils";

import styles from "../../css/pages/Transactions.module.css";
import TextInput from "../input/TextInput";
import { useDebounce } from "use-debounce";
import Body1 from "../text/Body1";
import TransactionsList from "./TransactionsList";

export default function LandingPage(): JSX.Element {
  const [metadataResult, setMetadataResult] =
    useState<NFTMetadataResult | null>(null); // null represents initial state
  const [transactionsResult, setTransactionsResult] =
    useState<TransactionsResult | null>(null); // null represents initial state
  const [mintAddress, setMintAddress] = useState(""); // empty str represents initial state
  const [mintAddressDebounced] = useDebounce(mintAddress, 500);
  const [validAddress, setValidAddress] = useState<string | null>(""); // empty str represents initial state

  // user input effects
  useEffect(() => {
    // if user changes input, reset the data for the NFT
    setTransactionsResult(null);
    setMetadataResult(null);

    // if user resets input, then reset address back to initial state
    if (mintAddressDebounced.length === 0) {
      setValidAddress("");
      // if user's input is pre-validated, set as valid address to query
    } else if (isValidMintAddress(mintAddressDebounced)) {
      setValidAddress(mintAddressDebounced);
      // if user enter invalid input, mark as invalid e.g. null
    } else if (mintAddressDebounced.length > 0) {
      setValidAddress(null);
    }
  }, [mintAddressDebounced]);

  // user input validated, query and set transaction result state with results
  useEffect(() => {
    if (validAddress && validAddress.length > 0) {
      getAccountData(validAddress).then((transactions) => {
        setTransactionsResult(transactions);
      });
    }
  }, [validAddress]);

  // user input validated, query and set metadata result state with results
  useEffect(() => {
    if (validAddress && validAddress.length > 0) {
      getMintAccountMetadata(validAddress).then((info) => {
        setMetadataResult(info);
      });
    }
  }, [validAddress]);

  let transactionList;
  // if user inputs valid address, attempt to show transaction list
  if (validAddress && validAddress.length > 0) {
    transactionList = (
      <TransactionsList
        metadataResult={metadataResult}
        transactionsResult={transactionsResult}
      />
    );
    // if user reset input, then display null transaction list
  } else if (validAddress?.length === 0) {
    transactionList = null;
    // if users input is invalid during validation step - isMintAddressValid, show error
  } else {
    transactionList = <Body1>Something went wrong :(</Body1>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchBarContainer}>
        <TextInput
          onChange={setMintAddress}
          value={mintAddress}
          placeholder="Input an NFT's mint account"
        />
      </div>
      {transactionList}
    </div>
  );
}
