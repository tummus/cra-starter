import ColorValue from "types/enums/ColorValue";
import HamburgerButton from "components/buttons/HamburgerButton";
import MenuMobile from "components/header/MenuMobile";
import ResponsiveContainer from "components/containers/ResponsiveContainer";
import styles from "css/header/HeaderMobile.module.css";
import { useState } from "react";
import GlobalClass from "types/enums/GlobalClass";

export default function HeaderMobile(): JSX.Element {
  const [isMenuShown, setIsMenuShown] = useState<boolean>(false);

  return (
    <>
      {isMenuShown && <MenuMobile onHide={() => setIsMenuShown(false)} />}
      <div className={styles.containerOuter}>
        <ResponsiveContainer className={styles.containerResponsive}>
          <div className={styles.containerInner}>
            <HamburgerButton colorValue={ColorValue.White} isShown={false} />
            <a className={GlobalClass.HideText} href="/">
              <img className={styles.logo} src="/images/logo.svg" />
            </a>
            <HamburgerButton
              colorValue={ColorValue.White}
              onClick={() => setIsMenuShown(true)}
            />
          </div>
        </ResponsiveContainer>
      </div>
    </>
  );
}
