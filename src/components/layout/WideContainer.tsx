import { ReactNode } from "react";

interface WideContainerProps {
  classNames?: string;
  children?: ReactNode;
  ultraWide?: boolean;
}

export function WideContainer(props: WideContainerProps) {
  return (
    <div
      className={`mx-auto w-full px-4 md:px-8 ${
        props.ultraWide ? "max-w-[2800px]" : "max-w-[1850px]"
      } ${props.classNames || ""}`}
    >
      {props.children}
    </div>
  );
}
