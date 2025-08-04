import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ValidationResult, ValidationIssue } from '@/hooks/usePAXMLValidation';
import { Deviation } from '@shared/schema';

interface ValidationStatusImprovedProps {
  validation: ValidationResult;
  isLoading?: boolean;
  deviations?: Deviation[];
}

interface GroupedIssue {
  key: string;
  title: string;
  description: string;
  type: 'error' | 'warning' | 'info';
  count: number;
  issues: ValidationIssue[];
  actionLabel?: string;
  action?: () => void;
}

export function ValidationStatusImproved({ validation, isLoading = false, deviations = [] }: ValidationStatusImprovedProps) {
  const [expandedSections, setExpandedSections] = useState(new Set<string>());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Group similar issues together for better UX
  const groupedIssues = useMemo(() => {
    const groups: Record<string, GroupedIssue> = {};

    validation.issues.forEach(issue => {
      let groupKey: string;
      let groupTitle: string;
      let groupDescription: string;
      let actionLabel: string | undefined;

      // Group similar issues together
      if (issue.id.includes('future-date')) {
        groupKey = 'future-dates';
        groupTitle = 'Framtida datum';
        groupDescription = 'Avvikelser för datum som inte har inträffat än. Dessa filtreras automatiskt bort från exporten.';
      } else if (issue.id.includes('duplicate')) {
        groupKey = 'duplicates';
        groupTitle = 'Dubbletter';
        groupDescription = 'Samma avvikelse är registrerad flera gånger. Ta bort de överflödiga.';
        actionLabel = 'Ta bort dubbletter';
      } else if (issue.id.includes('missing-timecode')) {
        groupKey = 'missing-timecodes';
        groupTitle = 'Saknar tidkoder';
        groupDescription = 'Avvikelser utan PAXML-kompatibel tidkod kan inte exporteras.';
        actionLabel = 'Lägg till tidkoder';
      } else if (issue.id.includes('invalid-data')) {
        groupKey = 'invalid-data';
        groupTitle = 'Felaktig data';
        groupDescription = 'Avvikelser med ogiltiga värden som måste korrigeras.';
        actionLabel = 'Redigera data';
      } else {
        // Individual issues that don't group well
        groupKey = `individual-${issue.id}`;
        groupTitle = issue.title;
        groupDescription = issue.description;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          title: groupTitle,
          description: groupDescription,
          type: issue.type,
          count: 0,
          issues: [],
          actionLabel,
        };
      }

      groups[groupKey].count++;
      groups[groupKey].issues.push(issue);
      // Use highest severity for the group
      if (issue.type === 'error' || (issue.type === 'warning' && groups[groupKey].type === 'info')) {
        groups[groupKey].type = issue.type;
      }
    });

    return Object.values(groups).sort((a, b) => {
      // Sort by severity: errors first, then warnings, then info
      const severityOrder = { error: 0, warning: 1, info: 2 };
      return severityOrder[a.type] - severityOrder[b.type];
    });
  }, [validation.issues]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Mutation for removing duplicates
  const removeDuplicatesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/manager/deviations/remove-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviations: deviations.map(d => ({
            id: d.id,
            employeeId: d.employeeId,
            date: d.date,
            timeCode: d.timeCode,
            hours: d.hours
          }))
        }),
      });
      if (!response.ok) throw new Error('Failed to remove duplicates');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deviations'] });
      toast({
        title: "Dubbletter borttagna",
        description: "Alla dubblerade avvikelser har tagits bort framgångsrikt.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort dubbletter. Försök igen.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveDuplicates = () => {
    removeDuplicatesMutation.mutate();
  };

  const getOverallStatus = () => {
    const hasErrors = validation.hasErrors;
    const hasWarnings = validation.hasWarnings;
    const isValid = validation.isValid;

    if (hasErrors) {
      return {
        icon: '🚫',
        title: 'Export blockerad',
        subtitle: 'Kritiska fel måste åtgärdas först',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    } else if (hasWarnings) {
      return {
        icon: '⚠️',
        title: 'Granska före export',
        subtitle: 'Export möjlig men varningar bör ses över',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    } else if (isValid) {
      return {
        icon: '✅',
        title: 'Redo för export',
        subtitle: 'Alla kontroller godkända',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        icon: 'ℹ️',
        title: 'Kvalitetskontroll',
        subtitle: 'Kontrollerar data...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    }
  };

  const status = getOverallStatus();
  const completionPercentage = validation.stats.totalDeviations > 0 
    ? Math.round((validation.stats.validDeviations / validation.stats.totalDeviations) * 100)
    : 0;

  const errors = groupedIssues.filter(g => g.type === 'error');
  const warnings = groupedIssues.filter(g => g.type === 'warning');
  const infos = groupedIssues.filter(g => g.type === 'info');

  return (
    <Card className={`${status.borderColor} ${status.bgColor}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{status.icon}</span>
            <div>
              <div className={`text-lg font-semibold ${status.color}`}>
                {status.title}
              </div>
              <div className="text-sm text-muted-foreground">
                {status.subtitle}
              </div>
            </div>
          </div>

          {/* Quick status badges */}
          <div className="flex gap-2">
            {errors.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {errors.reduce((sum, e) => sum + e.count, 0)} fel
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                {warnings.reduce((sum, w) => sum + w.count, 0)} varningar
              </Badge>
            )}
            {validation.isValid && validation.issues.length === 0 && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                Godkänd
              </Badge>
            )}
          </div>
        </CardTitle>

        {/* Progress indicator */}
        {validation.stats.totalDeviations > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Validerade avvikelser</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress 
              value={completionPercentage} 
              className="h-2"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick stats - more visual and scannable */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-gray-900">
              {validation.stats.totalDeviations}
            </div>
            <div className="text-xs text-muted-foreground">
              Totalt
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {validation.stats.validDeviations}
            </div>
            <div className="text-xs text-muted-foreground">
              Giltiga
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-red-600">
              {validation.stats.invalidDeviations}
            </div>
            <div className="text-xs text-muted-foreground">
              Fel
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-yellow-600">
              {validation.stats.duplicates}
            </div>
            <div className="text-xs text-muted-foreground">
              Dubbletter
            </div>
          </div>
        </div>

        {/* Success state */}
        {groupedIssues.length === 0 && validation.stats.totalDeviations > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <span className="text-xl">🎉</span>
            <AlertDescription className="text-green-800">
              <strong>Perfekt!</strong> Alla {validation.stats.totalDeviations} avvikelser är validerade och redo för export.
            </AlertDescription>
          </Alert>
        )}

        {/* Action buttons - more prominent */}
        {(errors.length > 0 || warnings.length > 0) && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <span className="text-base">🔧</span>
              Snabba åtgärder
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {validation.stats.duplicates > 0 && (
                <Button 
                  variant="outline" 
                  className="h-auto p-4 justify-start"
                  onClick={handleRemoveDuplicates}
                  disabled={removeDuplicatesMutation.isPending}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🗑️</span>
                    <div className="text-left">
                      <div className="font-medium">Ta bort dubbletter</div>
                      <div className="text-xs text-muted-foreground">
                        {validation.stats.duplicates} dubbletter hittade
                      </div>
                    </div>
                  </div>
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="h-auto p-4 justify-start"
                onClick={() => {
                  // Export detailed report
                  alert('📊 Exporterar detaljerad problemrapport för Excel-analys');
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📊</span>
                  <div className="text-left">
                    <div className="font-medium">Exportera rapport</div>
                    <div className="text-xs text-muted-foreground">
                      Detaljerad analys i Excel
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        )}

        {/* Grouped issues - cleaner presentation */}
        {errors.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-red-600 flex items-center gap-2">
              <span className="text-base">🚫</span>
              Kritiska fel som blockerar export
            </h3>
            <div className="space-y-2">
              {errors.map((group) => (
                <GroupCard key={group.key} group={group} onAction={handleRemoveDuplicates} />
              ))}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-yellow-600 flex items-center gap-2">
              <span className="text-base">⚠️</span>
              Varningar att granska
            </h3>
            <div className="space-y-2">
              {warnings.map((group) => (
                <GroupCard key={group.key} group={group} onAction={handleRemoveDuplicates} />
              ))}
            </div>
          </div>
        )}

        {infos.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <span className="text-base">ℹ️</span>
              Information
            </h3>
            <div className="space-y-2">
              {infos.map((group) => (
                <GroupCard key={group.key} group={group} onAction={handleRemoveDuplicates} />
              ))}
            </div>
          </div>
        )}

        {/* Final status */}
        {validation.stats.totalDeviations > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {validation.isValid ? (
                  <>
                    <span className="text-green-600 text-xl">✅</span>
                    <span className="text-green-700 font-medium">
                      Redo för export till Kontek Lön
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-red-600 text-xl">🚫</span>
                    <span className="text-red-700 font-medium">
                      Export blockerad - åtgärda fel ovan
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Improved GroupCard component
function GroupCard({ group, onAction }: { group: GroupedIssue; onAction?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getGroupStyle = (type: GroupedIssue['type']) => {
    switch (type) {
      case 'error':
        return {
          icon: '🚫',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        };
    }
  };

  const style = getGroupStyle(group.type);

  return (
    <div className={`p-4 rounded-lg border ${style.bgColor} ${style.borderColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">{style.icon}</span>
            <div>
              <h4 className={`font-medium ${style.textColor}`}>
                {group.title}
                {group.count > 1 && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {group.count} st
                  </Badge>
                )}
              </h4>
              <p className={`text-sm ${style.textColor} opacity-80`}>
                {group.description}
              </p>
            </div>
          </div>

          {/* Action button */}
          {group.actionLabel && (
            <Button 
              size="sm" 
              variant="outline" 
              className="mb-2"
              onClick={onAction}
            >
              {group.actionLabel}
            </Button>
          )}

          {/* Expandable details */}
          {group.count > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs p-1 h-auto"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '🔼 Dölj detaljer' : '🔽 Visa detaljer'} ({group.count} poster)
            </Button>
          )}

          {isExpanded && (
            <div className="mt-3 space-y-1">
              {group.issues.slice(0, 5).map((issue, index) => (
                <div key={issue.id} className="text-xs p-2 bg-white/50 rounded">
                  <strong>#{index + 1}:</strong> {issue.description}
                  {issue.employeeId && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      {issue.employeeId}
                    </Badge>
                  )}
                </div>
              ))}
              {group.issues.length > 5 && (
                <div className="text-xs text-center p-2 text-muted-foreground">
                  ... och {group.issues.length - 5} till
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}