import { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef } from "react";

import GlobalClass from "types/enums/GlobalClass";
import deleteProperty from "utils/deleteProperty";
import joinClasses from "utils/joinClasses";

type Props = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & { hideText?: boolean; transparent?: boolean };

const PlainButton = forwardRef<HTMLButtonElement, Props>(
  (props: Props, ref) => (
    // eslint-disable-next-line react/button-has-type
    <button
      {...deleteProperty(props, "hideText")}
      className={joinClasses(
        GlobalClass.ButtonPlain,
        props.className,
        props.hideText === true ? GlobalClass.HideText : null
      )}
      ref={ref}
      style={{
        ...(props.transparent == null || props.transparent
          ? { backgroundColor: "transparent" }
          : {}),
        ...props.style,
      }}
    >
      {props.children}
    </button>
  )
);

export default PlainButton;
