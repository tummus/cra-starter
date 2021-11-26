import { DropEvent, useDropzone } from "react-dropzone";

import ColorClass from "types/enums/ColorClass";
import ColorValue from "types/enums/ColorValue";
import DropzoneBlankContent from "components/input/DropzoneBlankContent";
import { Maybe, MaybeUndef } from "types/UtilityTypes";
import PlusSquareIcon from "components/icons/PlusSquareIcon";
import joinClasses from "utils/joinClasses";
import styles from "css/input/GenericDropzone.module.css";
import { useState } from "react";
import emptyFunction from "utils/emptyFunction";
import Dimensions from "types/Dimensions";
import getImageDimensions from "utils/getImageDimensions";
import humanFileSize from "utils/humanFileSize";
import { message } from "components/toast/messages";

type Props = {
  Component?: (props: {
    acceptedFiles: Array<File>;
    imageDimensions?: MaybeUndef<Dimensions>;
  }) => Maybe<JSX.Element>;
  accept?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any;
  className?: string;
  disableHoverStyle?: boolean;
  disabled?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  maxFiles?: number;
  maxSize?: number;
  onDropAccepted?: <T extends File>(files: T[], event: DropEvent) => void;
  showBlankContentOnHover?: boolean;
};

export default function GenericDropzone({
  Component,
  accept = "image/jpeg, image/png",
  children,
  className,
  disableHoverStyle = false,
  disabled = false,
  maxFiles = 1,
  maxSize = 10e6,
  onDropAccepted = emptyFunction,
  showBlankContentOnHover = false,
}: Props): JSX.Element {
  const [dimensions, setDimensions] = useState<Maybe<Dimensions>>(null);

  const {
    acceptedFiles,
    getRootProps,
    getInputProps,
    // isDragAccept,
    isDragActive,
    // isDragReject,
  } = useDropzone({
    accept,
    disabled,
    maxFiles,
    maxSize,
    onDropAccepted: async (files, event) => {
      onDropAccepted(files, event);

      // TODO: may want to support multiple files
      if (files.length === 1) {
        const dataUri = URL.createObjectURL(files[0]);
        const imageDimensions = await getImageDimensions(dataUri);
        setDimensions(imageDimensions);
      }
    },
    onDropRejected: () => {
      message({
        duration: 5,
        content: `File is too big, max size is ${humanFileSize(maxSize)}`,
        type: "error",
      });
    },
  });

  return (
    <div
      {...getRootProps({
        className: joinClasses(
          styles.dropzone,
          !disableHoverStyle ? styles.dropzoneHover : null,
          isDragActive && !disableHoverStyle ? styles.dragActive : null,
          // TODO: this behavior is broken... waiting for fix.
          // See https://github.com/react-dropzone/react-dropzone/issues/888 for more
          // isDragAccept ? styles.dragAccept : null,
          // isDragReject ? styles.dragReject : null,
          className
        ),
      })}
    >
      <input {...getInputProps()} />
      {Component != null && (
        <Component acceptedFiles={acceptedFiles} imageDimensions={dimensions} />
      )}
      {children}
      <div className={styles.overlayAccept} />
      <div className={styles.overlayReject} />
      {showBlankContentOnHover === true && (
        <div className={styles.blankContent}>
          <DropzoneBlankContent
            colorClass={ColorClass.White}
            icon={<PlusSquareIcon colorValue={ColorValue.Secondary} />}
          />
        </div>
      )}
    </div>
  );
}
