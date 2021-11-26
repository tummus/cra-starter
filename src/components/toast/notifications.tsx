/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-param-reassign */
import { notification } from "antd";
import type { ArgsProps, NotificationInstance } from "antd/lib/notification";
import { ReactNode } from "react";

interface INotifyArgs {
  description?: ReactNode;
  duration?: number;
  message?: string;
  placement?: ArgsProps["placement"];
  type?: keyof NotificationInstance;
}

// eslint-disable-next-line import/prefer-default-export
export function notify({
  duration = 7,
  message,
  description,
  type = "info",
  placement = "bottomLeft",
}: INotifyArgs): void {
  notification[type]({
    message,
    description,
    placement,
    duration,
  });
}
