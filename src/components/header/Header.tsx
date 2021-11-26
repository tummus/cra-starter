import styles from "css/header/Header.module.css";
import HeaderDesktop from "components/header/HeaderDesktop";
import HeaderMobile from "components/header/HeaderMobile";

export default function Header(): JSX.Element {
  return (
    <>
      <div className={styles.mobileContainer}>
        <HeaderMobile />
      </div>
      <div className={styles.desktopContainer}>
        <HeaderDesktop />
      </div>
    </>
  );
}
