import ColorValue from "types/enums/ColorValue";
import CrossIcon from "components/icons/CrossIcon";
import PlainButton from "components/buttons/PlainButton";
import emptyFunction from "utils/emptyFunction";

type Props = {
  className?: string;
  colorValue: ColorValue;
  isShown?: boolean;
  onClick?: () => void;
};

export default function CloseButton({
  className,
  colorValue,
  isShown = true,
  onClick = emptyFunction,
}: Props): JSX.Element {
  return (
    <PlainButton
      className={className}
      onClick={onClick}
      style={{ fontSize: 0, visibility: isShown ? undefined : "hidden" }}
      type="button"
    >
      <CrossIcon colorValue={colorValue} />
    </PlainButton>
  );
}
