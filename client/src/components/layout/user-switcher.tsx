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
import { demoPersonas, getRoleLabel, getRoleIcon, getRoleColor } from "@/lib/demoPersonas";

const UserSwitcher = () => {
  const { user, setDemoPersona } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentPersona = demoPersonas.find(p => p.id === user.demoPersonaId);

  const handlePersonaSwitch = (personaId: string) => {
    setDemoPersona(personaId);
    setIsOpen(false);
  };

  // Helper functions moved to demoPersonas.ts

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 h-auto p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {currentPersona && currentPersona.name ? currentPersona.name.split(' ').map(n => n[0]).join('') : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium">
              {currentPersona?.name || 'Välj persona'}
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
            Välj demo-persona
          </DialogTitle>
          <DialogDescription>
            Växla mellan olika användare och roller för att demonstrera systemets funktionalitet
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {demoPersonas.map((persona) => (
            <Card 
              key={persona.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                user.demoPersonaId === persona.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handlePersonaSwitch(persona.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {persona.name ? persona.name.split(' ').map(n => n[0]).join('') : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{persona.name}</h4>
                      <Badge
                        variant={persona.isPrimary ? "default" : "secondary"}
                        className={`text-xs ${getRoleColor(persona.role)}`}
                      >
                        <span className="material-icons text-xs mr-1">
                          {getRoleIcon(persona.role)}
                        </span>
                        {getRoleLabel(persona.role)}
                        {persona.isPrimary && (
                          <span className="material-icons text-xs ml-1">star</span>
                        )}
                      </Badge>
                      {user.demoPersonaId === persona.id && (
                        <Badge variant="outline" className="text-xs">
                          Aktiv
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {persona.email} · {persona.department}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {persona.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Separator />
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            ⭐ Stjärna = Huvudroll · 🔄 En klick växlar både användare och roll
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSwitcher;