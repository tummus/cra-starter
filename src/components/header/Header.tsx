import styles from "css/header/Header.module.css";
import HeaderDesktop from "components/header/HeaderDesktop";

export default function Header(): JSX.Element {
  return (
    <div className={styles.desktopContainer}>
      <HeaderDesktop />
    </div>
  );
}
