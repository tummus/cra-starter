import styles from "css/header/HeaderDesktop.module.css";
// import ConnectWalletButton from "components/buttons/ConnectWalletButton";
import ResponsiveContainer from "components/containers/ResponsiveContainer";
import Body1 from "../text/Body1";
import ColorClass from "../../types/enums/ColorClass";

export default function HeaderDesktop(): JSX.Element {
  return (
    <ResponsiveContainer>
      <Body1
        className={styles.header}
        textAlign="center"
        colorClass={ColorClass.White}
      >
        nifty information
      </Body1>
    </ResponsiveContainer>
  );
}
