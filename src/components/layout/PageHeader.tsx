import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  backButton?: ReactNode;
  backUrl?: string;
}

export function PageHeader({ title, description, actions, backButton, backUrl }: PageHeaderProps) {
  const navigate = useNavigate();
  
  const backElement = backButton || (backUrl && (
    <Button
      variant="ghost"
      size="icon"
      className="mr-4 h-9 w-9 rounded-full"
      onClick={() => navigate(backUrl)}
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  ));

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-8 py-6">
      <div className="flex items-center">
        {backElement}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
