import BackgroundOverlay from "components/loading/BackgroundOverlay";
import CloseButton from "components/buttons/CloseButton";
import ColorValue from "types/enums/ColorValue";
import FontClass from "types/enums/FontClass";
import ResponsiveContainer from "components/containers/ResponsiveContainer";
import TextButton from "components/buttons/TextButton";
import TextButtonTheme from "types/enums/TextButtonTheme";
import joinClasses from "utils/joinClasses";
import styles from "css/header/MenuMobile.module.css";
import { useState } from "react";
import OutsideClickHideModal from "components/modal/OutsideClickHideModal";

function Button({
  children,
  href,
}: {
  children: string;
  href: string;
}): JSX.Element {
  return (
    <TextButton
      buttonTheme={TextButtonTheme.Navy}
      fontClass={FontClass.Body1}
      href={href}
      type="link_internal"
    >
      {children}
    </TextButton>
  );
}

type Props = {
  onHide: () => void;
};

export default function MenuMobile({ onHide }: Props): JSX.Element {
  const [slideOutClassName, setSlideOutClassName] = useState<string>("");
  const [backgroundOverlayClassName, setBackgroundOverlayClassName] =
    useState<string>(styles.backgroundOverlayFadeIn);

  const onHideWithSlide = () => {
    setBackgroundOverlayClassName(styles.backgroundOverlayFadeOut);
    setSlideOutClassName(styles.slideOut);
    setTimeout(onHide, 600);
  };

  return (
    <OutsideClickHideModal hideModal={onHideWithSlide}>
      <div className={styles.containerOuter}>
        <BackgroundOverlay className={backgroundOverlayClassName} />
        <ResponsiveContainer
          className={joinClasses(styles.container, slideOutClassName)}
        >
          <div className={styles.textButtons}>
            <div className={styles.firstRow}>
              <CloseButton
                className={styles.closeButton}
                colorValue={ColorValue.Navy}
                isShown={false}
              />
              <Button href="/generate">Get started</Button>
              <CloseButton
                className={styles.closeButton}
                colorValue={ColorValue.Navy}
                onClick={onHideWithSlide}
              />
            </div>
            <Button href="/how-it-works">How it works</Button>
          </div>
        </ResponsiveContainer>
      </div>
    </OutsideClickHideModal>
  );
}
