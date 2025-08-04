import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ValidationResult, ValidationIssue } from '@/hooks/usePAXMLValidation';

interface ValidationStatusProps {
  validation: ValidationResult;
  isLoading?: boolean;
}

export function ValidationStatus({ validation, isLoading = false }: ValidationStatusProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['errors']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="material-icons animate-spin">refresh</span>
            Validerar data...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const errors = validation.issues.filter(i => i.type === 'error');
  const warnings = validation.issues.filter(i => i.type === 'warning');
  const infos = validation.issues.filter(i => i.type === 'info');

  const getStatusIcon = () => {
    if (validation.hasErrors) return { icon: 'error', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    if (validation.hasWarnings) return { icon: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    if (validation.isValid) return { icon: 'check_circle', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    return { icon: 'info', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
  };

  const status = getStatusIcon();

  return (
    <Card className={`${status.border} ${status.bg}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`material-icons ${status.color}`}>{status.icon}</span>
            PAXML Kvalitetskontroll
          </div>
          <div className="flex gap-1">
            {validation.hasErrors && (
              <Badge variant="destructive" className="text-xs">
                {errors.length} fel
              </Badge>
            )}
            {validation.hasWarnings && (
              <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                {warnings.length} varningar
              </Badge>
            )}
            {validation.isValid && validation.issues.length === 0 && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                ✅ Klar för export
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="text-center p-2 bg-white/50 rounded border">
            <div className="font-semibold text-lg">{validation.stats.totalDeviations}</div>
            <div className="text-muted-foreground">Totalt</div>
          </div>
          <div className="text-center p-2 bg-white/50 rounded border">
            <div className="font-semibold text-lg text-green-600">{validation.stats.validDeviations}</div>
            <div className="text-muted-foreground">Giltiga</div>
          </div>
          <div className="text-center p-2 bg-white/50 rounded border">
            <div className="font-semibold text-lg text-red-600">{validation.stats.invalidDeviations}</div>
            <div className="text-muted-foreground">Fel</div>
          </div>
          <div className="text-center p-2 bg-white/50 rounded border">
            <div className="font-semibold text-lg text-yellow-600">{validation.stats.duplicates}</div>
            <div className="text-muted-foreground">Dubbletter</div>
          </div>
        </div>

        {/* Quick Fix Actions */}
        {(errors.length > 0 || warnings.length > 0) && (
          <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2 w-full">
              <span className="material-icons text-sm">build</span>
              Snabbåtgärder:
            </div>
            
            {validation.stats.duplicates > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs bg-white"
                onClick={() => {
                  alert('🔧 Kommer snart: Ta bort alla dubbletter automatiskt');
                }}
              >
                <span className="material-icons text-xs mr-1">content_copy</span>
                Ta bort {validation.stats.duplicates} dubbletter
              </Button>
            )}
            
            {validation.stats.missingTimeCodes > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs bg-white"
                onClick={() => {
                  alert('🔧 Kommer snart: Massredigera avvikelser utan tidkoder');
                }}
              >
                <span className="material-icons text-xs mr-1">schedule</span>
                Lägg till tidkoder ({validation.stats.missingTimeCodes})
              </Button>
            )}
            
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs bg-white"
              onClick={() => {
                alert('🔍 Exporterar rapport med alla problem för Excel-redigering');
              }}
            >
              <span className="material-icons text-xs mr-1">download</span>
              Exportera problemrapport
            </Button>
          </div>
        )}

        {/* Issues */}
        {validation.issues.length === 0 && validation.stats.totalDeviations > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <span className="material-icons text-green-600">check_circle</span>
            <AlertDescription className="text-green-800">
              <strong>Perfekt!</strong> Alla {validation.stats.totalDeviations} avvikelser är validerade och redo för export till Kontek Lön.
            </AlertDescription>
          </Alert>
        )}

        {/* Critical Errors */}
        {errors.length > 0 && (
          <Collapsible 
            open={expandedSections.has('errors')} 
            onOpenChange={() => toggleSection('errors')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2 text-red-600">
                  <span className="material-icons">error</span>
                  <strong>Kritiska fel ({errors.length}) - Export blockerad</strong>
                </div>
                <span className="material-icons">
                  {expandedSections.has('errors') ? 'expand_less' : 'expand_more'}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {errors.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <Collapsible 
            open={expandedSections.has('warnings')} 
            onOpenChange={() => toggleSection('warnings')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2 text-yellow-600">
                  <span className="material-icons">warning</span>
                  <strong>Varningar ({warnings.length}) - Granska innan export</strong>
                </div>
                <span className="material-icons">
                  {expandedSections.has('warnings') ? 'expand_less' : 'expand_more'}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {warnings.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Info Messages */}
        {infos.length > 0 && (
          <div className="space-y-2">
            {infos.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}

        {/* Export Status */}
        {validation.stats.totalDeviations > 0 && (
          <div className="pt-2 border-t">
            {validation.isValid ? (
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <span className="material-icons text-sm">check_circle</span>
                <strong>Redo för export till Kontek Lön</strong>
                {validation.hasWarnings && (
                  <span className="text-yellow-600">- men granska varningar först</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <span className="material-icons text-sm">block</span>
                <strong>Export blockerad - fixa fel ovan</strong>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IssueCard({ issue }: { issue: ValidationIssue }) {
  const getIssueStyle = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error':
        return {
          icon: 'error',
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        };
      case 'info':
        return {
          icon: 'info',
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        };
    }
  };

  const style = getIssueStyle(issue.type);

  const getFixButton = () => {
    // Quick fix buttons for common issues
    if (issue.id.includes('duplicate')) {
      return (
        <Button 
          size="sm" 
          variant="outline" 
          className="ml-2 h-6 text-xs"
          onClick={() => {
            // TODO: Implement duplicate removal
            alert('🔧 Funktion kommer snart: Ta bort dubbletter automatiskt');
          }}
        >
          <span className="material-icons text-xs mr-1">auto_fix_high</span>
          Fixa automatiskt
        </Button>
      );
    }

    if (issue.id.includes('missing-timecode')) {
      return (
        <Button 
          size="sm" 
          variant="outline" 
          className="ml-2 h-6 text-xs"
          onClick={() => {
            // TODO: Navigate to deviation editing
            alert('🔧 Funktion kommer snart: Navigera till avvikelse för redigering');
          }}
        >
          <span className="material-icons text-xs mr-1">edit</span>
          Redigera
        </Button>
      );
    }

    if (issue.employeeId && issue.deviationId) {
      return (
        <Button 
          size="sm" 
          variant="outline" 
          className="ml-2 h-6 text-xs"
          onClick={() => {
            alert(`🔍 Visa avvikelse ${issue.deviationId} för ${issue.employeeId}`);
          }}
        >
          <span className="material-icons text-xs mr-1">visibility</span>
          Visa
        </Button>
      );
    }

    return null;
  };

  return (
    <div className={`p-3 rounded-md border ${style.bgColor} ${style.borderColor}`}>
      <div className="flex items-start gap-2">
        <span className={`material-icons text-sm ${style.iconColor} mt-0.5`}>
          {style.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${style.textColor} flex items-center justify-between`}>
            <div>
              {issue.title}
              {issue.employeeId && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {issue.employeeId}
                </Badge>
              )}
            </div>
            {getFixButton()}
          </div>
          <div className={`text-sm ${style.textColor} opacity-90 mt-1`}>
            {issue.description}
          </div>
          {issue.action && (
            <div className={`text-xs ${style.textColor} opacity-75 mt-2 font-medium`}>
              💡 {issue.action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}