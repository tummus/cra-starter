import styles from "css/header/HeaderDesktop.module.css";
// import ConnectWalletButton from "components/buttons/ConnectWalletButton";
import ResponsiveContainer from "components/containers/ResponsiveContainer";
import ColorClass from "../../types/enums/ColorClass";
import Header2 from "../text/Header2";

export default function HeaderDesktop(): JSX.Element {
  return (
    <ResponsiveContainer>
      <Header2
        className={styles.header}
        textAlign="center"
        colorClass={ColorClass.White}
      >
        nifty information
      </Header2>
    </ResponsiveContainer>
  );
}
