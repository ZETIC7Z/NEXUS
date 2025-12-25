import classNames from "classnames";
import { useTranslation } from "react-i18next";

import { Icon, Icons } from "@/components/Icon";
import { UserIcon, UserIcons } from "@/components/UserIcon";
import { useAuthStore } from "@/stores/auth";

export interface AvatarProps {
  sizeClass?: string;
  bottom?: React.ReactNode;
  iconClass?: string;
  profile?: {
    colorA: string;
    colorB: string;
    icon: UserIcons;
  };
}

export function Avatar(props: AvatarProps) {
  const { sizeClass, bottom, iconClass, profile } = props;

  // Use user's selected icon and colors, or defaults
  const colorA = profile?.colorA ?? "#3B82F6";
  const colorB = profile?.colorB ?? "#EC4899";
  const userIcon = profile?.icon ?? UserIcons.CAT;

  return (
    <div className="relative inline-block">
      <div
        className={classNames(
          sizeClass ?? "w-8 h-8",
          "rounded-full overflow-hidden flex items-center justify-center",
        )}
        style={{
          background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
        }}
      >
        <UserIcon
          icon={userIcon}
          className={iconClass ?? "text-2xl text-white"}
        />
      </div>
      {bottom ? (
        <div className="absolute bottom-0 left-1/2 transform translate-y-1/2 -translate-x-1/2">
          {bottom}
        </div>
      ) : null}
    </div>
  );
}

export function UserAvatar(props: {
  sizeClass?: string;
  bottom?: React.ReactNode;
  withName?: boolean;
}) {
  const auth = useAuthStore();
  useTranslation();

  if (!auth.account || auth.account === null) return null;

  const displayName = auth.account.fullName || auth.account.nickname || "User";

  return (
    <>
      <Avatar
        sizeClass={
          props.sizeClass ?? "w-[1.5rem] h-[1.5rem] ssm:w-[2rem] ssm:h-[2rem]"
        }
        bottom={props.bottom}
        profile={{
          colorA: auth.account.profile?.colorA ?? "#3B82F6",
          colorB: auth.account.profile?.colorB ?? "#EC4899",
          icon: (auth.account.profile?.icon as UserIcons) ?? UserIcons.CAT,
        }}
      />

      {props.withName ? (
        <span className="hidden md:inline-block">
          {displayName.length >= 20
            ? `${displayName.slice(0, 20 - 1)}…`
            : displayName}
        </span>
      ) : null}
    </>
  );
}

export function NoUserAvatar(props: { iconClass?: string }) {
  return (
    <div className="relative inline-block p-1 text-type-dimmed">
      <Icon
        className={props.iconClass ?? "text-base ssm:text-xl"}
        icon={Icons.MENU}
      />
    </div>
  );
}
