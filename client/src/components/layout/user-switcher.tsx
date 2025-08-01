import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { productionUsers } from "@/lib/productionUsers";

const UserSwitcher = () => {
  const { user, setDemoUser } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentDemoUser = productionUsers.find(u => u.id === user.demoUserId);

  const handleUserSwitch = (userId: string) => {
    setDemoUser(userId);
    setIsOpen(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'employee': return 'bg-green-100 text-green-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'hr': return 'bg-purple-100 text-purple-800';
      case 'payroll': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'employee': return 'person';
      case 'manager': return 'supervisor_account';
      case 'hr': return 'people';
      case 'payroll': return 'account_balance_wallet';
      default: return 'person';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'employee': return 'Medarbetare';
      case 'manager': return 'Chef';
      case 'hr': return 'HR-specialist';
      case 'payroll': return 'Löneadministratör';
      default: return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 h-auto p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {currentDemoUser ? currentDemoUser.name.split(' ').map(n => n[0]).join('') : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium">
              {currentDemoUser?.name || 'Välj användare'}
            </span>
            <span className="text-xs text-muted-foreground">
              Demo · {getRoleLabel(user.currentRole)}
            </span>
          </div>
          <span className="material-icons text-sm">expand_more</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="material-icons">people</span>
            Välj demo-användare
          </DialogTitle>
          <DialogDescription>
            Växla mellan olika användare för att demonstrera systemets funktionalitet
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {productionUsers.map((demoUser) => (
            <Card 
              key={demoUser.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                user.demoUserId === demoUser.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleUserSwitch(demoUser.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {demoUser.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{demoUser.name}</h4>
                      {user.demoUserId === demoUser.id && (
                        <Badge variant="outline" className="text-xs">
                          Aktiv
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {demoUser.email} · {demoUser.department}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {demoUser.assignedRoles.map((role) => (
                        <Badge
                          key={role}
                          variant={role === demoUser.defaultRole ? "default" : "secondary"}
                          className={`text-xs ${getRoleColor(role)} ${
                            role === demoUser.defaultRole ? 'ring-1 ring-current' : ''
                          }`}
                        >
                          <span className="material-icons text-xs mr-1">
                            {getRoleIcon(role)}
                          </span>
                          {getRoleLabel(role)}
                          {role === demoUser.defaultRole && (
                            <span className="material-icons text-xs ml-1">star</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {demoUser.assignedRoles.length === 1 
                        ? "Fast roll" 
                        : `Kan växla mellan ${demoUser.assignedRoles.length} roller`
                      }
                      {demoUser.assignedRoles.length > 1 && (
                        <> · Standard: {getRoleLabel(demoUser.defaultRole)}</>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Separator />
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            💡 Varje användare har olika roller och behörigheter
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSwitcher;