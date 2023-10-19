import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "@remix-run/react";
import { ComponentProps } from "react";

export function HeaderLink(
  { icon, label, ...rest }: ComponentProps<typeof Link> & {
    icon: IconProp;
    label: string;
  }
) {
  return (
    <Link
      {...rest}
      className="flex items-center gap-2 hover:bg-black/30 active:bg-black/70 transition-all px-1.5 py-0.5"
    >
      <FontAwesomeIcon className="h-4" icon={icon} />
      {label}
    </Link>
  );
}