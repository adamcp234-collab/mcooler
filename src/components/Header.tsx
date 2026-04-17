import { Link } from "react-router-dom";
import { Snowflake } from "lucide-react";

interface HeaderProps {
  mitraName?: string;
}

export default function Header({ mitraName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-14 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg accare-gradient flex items-center justify-center">
            <Snowflake className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">ACcare</span>
        </Link>
        {mitraName && (
          <span className="text-sm text-muted-foreground font-medium">{mitraName}</span>
        )}
      </div>
    </header>
  );
}
