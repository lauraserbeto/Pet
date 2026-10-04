import logo from "../../assets/pet+/logo-horizontal.png";

interface AuthBrandLogoProps {
  className?: string;
}

export function AuthBrandLogo({ className }: AuthBrandLogoProps) {
  return <img src={logo} alt="Pet+" width={2172} height={724} className={className} />;
}
