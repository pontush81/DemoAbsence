import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: string;
  footer?: ReactNode;
  className?: string;
}

const StatusCard = ({ title, value, icon, footer, className }: StatusCardProps) => {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
            <p className="text-lg font-bold mt-1">{value}</p>
          </div>
          <span className="material-icons text-primary">{icon}</span>
        </div>
        {footer && (
          <div className="mt-3 pt-3 border-t">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusCard;
