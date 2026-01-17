import classNames from "classnames";
import { forwardRef } from "react";

interface MediaGridProps {
  children?: React.ReactNode;
  smallCards?: boolean;
}

export const MediaGrid = forwardRef<HTMLDivElement, MediaGridProps>(
  (props, ref) => {
    return (
      <div
        className={classNames(
          "grid gap-5",
          props.smallCards
            ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 3xl:grid-cols-10 4xl:grid-cols-12"
            : "grid-cols-2 gap-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 3xl:grid-cols-8 4xl:grid-cols-10",
        )}
        ref={ref}
      >
        {props.children}
      </div>
    );
  },
);
