import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  icon: string;
  label: string;
  href: string;
  className?: string;
}

const QuickActionCard = ({ icon, label, href, className }: QuickActionCardProps) => {
  return (
    <Link href={href}>
      <a className={cn(
        "bg-white rounded-lg shadow-sm p-4 flex flex-col items-center text-center hover:bg-background transition-colors",
        className
      )}>
        <span className="material-icons text-primary text-2xl">{icon}</span>
        <span className="mt-2 text-sm font-medium">{label}</span>
      </a>
    </Link>
  );
};

export default QuickActionCard;
