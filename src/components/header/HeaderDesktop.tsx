import styles from "css/header/HeaderDesktop.module.css";
// import ConnectWalletButton from "components/buttons/ConnectWalletButton";
import TextButton from "components/buttons/TextButton";
import ResponsiveContainer from "components/containers/ResponsiveContainer";
import Header1 from "components/text/Header1";
import Header2 from "components/text/Header2";
import ColorClass from "types/enums/ColorClass";
import FontClass from "types/enums/FontClass";
import GlobalClass from "types/enums/GlobalClass";

export default function HeaderDesktop(): JSX.Element {
  return (
    <ResponsiveContainer>
      <Header1 className={styles.header} textAlign="center">
        <TextButton
          className={styles.left}
          fontClass={FontClass.Body1}
          href="/generate"
          type="link_internal"
        >
          Placeholder 1
        </TextButton>
        <a className={GlobalClass.HideText} href="/">
          <Header2 colorClass={ColorClass.Navy}>Nifty Minter</Header2>
        </a>
        {/* <div className={styles.right}>
          <ConnectWalletButton />
        </div> */}
      </Header1>
    </ResponsiveContainer>
  );
}
