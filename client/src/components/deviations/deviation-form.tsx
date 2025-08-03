import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeInput } from "@/components/ui/time-input";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { insertDeviationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { apiService } from "@/lib/apiService";
import { useStore } from "@/lib/store";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { getWorkflowInfo } from "@/lib/approvalWorkflows";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Create the schema with custom validation using translations
const createDeviationFormSchema = (t: (key: string) => string) => insertDeviationSchema.extend({
  date: z.string().min(1, t('validation.dateRequired')),
  startTime: z.string().min(1, t('validation.startTimeRequired')),
  endTime: z.string().min(1, t('validation.endTimeRequired')),
  timeCode: z.string().min(1, t('validation.timeCodeRequired')),
}).refine((data) => {
  const start = new Date(`${data.date}T${data.startTime}`);
  const end = new Date(`${data.date}T${data.endTime}`);
  return end > start;
}, {
  message: t('validation.endTimeAfterStartTime'),
  path: ["endTime"],
});

type DeviationFormValues = z.infer<ReturnType<typeof createDeviationFormSchema>>;

interface DeviationFormProps {
  deviationId?: number;
  onCancel?: () => void;
}

// Helper function to calculate duration between two times, accounting for breaks
const createCalculateDuration = (t: (key: string) => string, schedule?: any) => (startTime: string, endTime: string): string => {
  try {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    if (end <= start) {
      return t('validation.invalidTimePeriod');
    }
    
    // Calculate total time
    const diffMs = end.getTime() - start.getTime();
    let totalMinutes = Math.floor(diffMs / (1000 * 60));
    
    // Subtract break time if schedule has breaks and work period overlaps with break
    if (schedule?.breakStart && schedule?.breakEnd) {
      const breakStart = new Date(`2000-01-01T${schedule.breakStart}`);
      const breakEnd = new Date(`2000-01-01T${schedule.breakEnd}`);
      
      // Check if work period overlaps with break period
      if (start < breakEnd && end > breakStart) {
        const overlapStart = new Date(Math.max(start.getTime(), breakStart.getTime()));
        const overlapEnd = new Date(Math.min(end.getTime(), breakEnd.getTime()));
        const breakMinutes = Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60));
        totalMinutes = Math.max(0, totalMinutes - breakMinutes);
      }
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} tim`;
    } else {
      return `${hours} tim ${minutes} min`;
    }
  } catch {
    return t('validation.invalidTime');
  }
};

const DeviationForm = ({ deviationId, onCancel }: DeviationFormProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useStore();
  const [status, setStatus] = useState<"draft" | "pending">("pending");
  const [showQuickActions, setShowQuickActions] = useState(!deviationId); // Show for new deviations only
  const [showDateConfirmDialog, setShowDateConfirmDialog] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [pendingAction, setPendingAction] = useState<typeof quickActions[0] | null>(null);

  // Get URL parameters to pre-fill form based on button clicked
  const urlParams = new URLSearchParams(window.location.search);
  const formType = urlParams.get('type'); // 'sick', 'overtime', etc.

  // Quick Actions - Pre-configured common deviations (8h arbetstid för tjänstemän)
  const getQuickActions = () => {
    if (formType === 'sick') {
      return [
        {
          icon: "🤒",
          label: "Sjuk hela dagen",
          timeCode: "300",
          startTime: "08:00",
          endTime: "16:00",
          comment: ""
        },
        {
          icon: "👶",
          label: "VAB hela dagen", 
          timeCode: "400",
          startTime: "08:00",
          endTime: "16:00",
          comment: ""
        },
        {
          icon: "🤒",
          label: "Sjuk halvdag",
          timeCode: "300", 
          startTime: "08:00",
          endTime: "12:00",
          comment: ""
        }
      ];
    } else if (formType === 'overtime') {
      return [
        {
          icon: "⏰",
          label: "2h övertid",
          timeCode: "200",
          startTime: "17:00",
          endTime: "19:00",
          comment: ""
        },
        {
          icon: "⏰",
          label: "4h övertid",
          timeCode: "200",
          startTime: "17:00",
          endTime: "21:00",
          comment: ""
        },
        {
          icon: "⏰",
          label: "Morgon övertid",
          timeCode: "200",
          startTime: "06:00",
          endTime: "08:00",
          comment: ""
        }
      ];
    } else {
      // Default quick actions for general form
      return [
        {
          icon: "🤒",
          label: "Sjuk hela dagen",
          timeCode: "300",
          startTime: "08:00",
          endTime: "16:00",
          comment: ""
        },
        {
          icon: "👶",
          label: "VAB hela dagen", 
          timeCode: "400",
          startTime: "08:00",
          endTime: "16:00",
          comment: ""
        }
      ];
    }
  };

  const quickActions = getQuickActions();

  // Handle quick action selection - show date confirmation first
  const handleQuickAction = (action: typeof quickActions[0]) => {
    setPendingAction(action);
    setShowDateConfirmDialog(true);
  };

  // Execute the quick action after date confirmation
  const executeQuickAction = async (confirmedDate: string) => {
    if (!pendingAction) return;
    
    // Set form values
    form.setValue('date', confirmedDate);
    form.setValue('startTime', pendingAction.startTime);
    form.setValue('endTime', pendingAction.endTime);
    form.setValue('timeCode', pendingAction.timeCode);
    form.setValue('comment', pendingAction.comment);
    
    // Hide quick actions and dialog
    setShowQuickActions(false);
    setShowDateConfirmDialog(false);
    
    // Show success toast immediately with correct message based on approval requirement
    const isSickOrVAB = pendingAction.timeCode === '300' || pendingAction.timeCode === '400';
    toast({
      title: `${pendingAction.icon} ${pendingAction.label} registrerad!`,
      description: isSickOrVAB 
        ? `För ${format(new Date(confirmedDate), 'dd MMMM', { locale: sv })} - Automatiskt godkänd enligt svensk lag`
        : `För ${format(new Date(confirmedDate), 'dd MMMM', { locale: sv })} - Skickas för godkännande...`,
    });
    
    // Auto-submit after a short delay to let user see the filled form
    setTimeout(() => {
      // Don't set status here - let API determine based on timeCode
      const formData = form.getValues();
      const submitData = {
        ...formData,
        // Don't set status - API will determine based on Swedish HR praxis
        submitted: new Date().toISOString(),
      };
      createMutation.mutate(submitData as any);
    }, 800);
  };

  // Smart date suggestions based on time of day and action type
  const getDateSuggestions = (action: typeof quickActions[0]) => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const yesterday = format(new Date(now.getTime() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    const currentHour = now.getHours();
    
    // If it's before 9 AM and it's a sick/VAB action, suggest yesterday as primary option
    if (currentHour < 9 && (action.timeCode === '300' || action.timeCode === '400')) {
      return [
        { date: yesterday, label: `Igår (${format(new Date(yesterday), 'dd MMM', { locale: sv })})`, primary: true, type: 'quick' },
        { date: today, label: `Idag (${format(new Date(today), 'dd MMM', { locale: sv })})`, primary: false, type: 'quick' },
        { date: '', label: 'Annat datum...', primary: false, type: 'custom' }
      ];
    }
    
    // Default: today first, yesterday second
    return [
      { date: today, label: `Idag (${format(new Date(today), 'dd MMM', { locale: sv })})`, primary: true, type: 'quick' },
      { date: yesterday, label: `Igår (${format(new Date(yesterday), 'dd MMM', { locale: sv })})`, primary: false, type: 'quick' },
      { date: '', label: 'Annat datum...', primary: false, type: 'custom' }
    ];
  };
  
  // Fetch time codes
  const { data: timeCodes, isLoading: isLoadingTimeCodes } = useQuery({
    queryKey: ['/api/timecodes'],
    queryFn: () => apiService.getTimeCodes(),
  });
  
  // Helper function to get default values based on form type
  const getDefaultValues = () => {
    const baseDefaults = {
      employeeId: user.currentUser?.employeeId || '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '08:00',
      endTime: '16:00', // 8 timmar arbetstid (exklusive lunch) - konsistent med Quick Actions
      timeCode: '',
      comment: '',
      status: 'pending' as const,
    };

    // Pre-fill based on URL parameter
    switch (formType) {
      case 'sick':
        return {
          ...baseDefaults,
          timeCode: '300', // Sjukdom
          endTime: '16:00', // Hela dagen
        };
      case 'overtime':
        return {
          ...baseDefaults,
          timeCode: '200', // Övertid 1 (vardagar)
          startTime: '17:00', // Efter ordinarie arbetstid
          endTime: '19:00', // 2 timmars övertid som exempel
        };
      default:
        return baseDefaults;
    }
  };

  // Form setup with default values FIRST
  const deviationFormSchema = createDeviationFormSchema(t);
  const form = useForm<DeviationFormValues>({
    resolver: zodResolver(deviationFormSchema),
    defaultValues: getDefaultValues(),
  });

  // Fetch deviation if editing
  const { data: deviation, isLoading: isLoadingDeviation } = useQuery({
    queryKey: ['/api/deviations', deviationId],
    queryFn: () => deviationId ? apiService.getDeviation(deviationId) : null,
    enabled: !!deviationId,
  });

  // Fetch schedule for the selected date to calculate duration correctly
  const selectedDate = form.watch('date');
  const { data: scheduleForDate } = useQuery({
    queryKey: ['/api/schedules', user.currentUser?.employeeId, selectedDate],
    queryFn: async () => {
      if (!user.currentUser?.employeeId || !selectedDate) return null;
      try {
        // Use apiService to get proper snake_case→camelCase mapping
        const schedule = await apiService.getEmployeeSchedule(user.currentUser.employeeId, selectedDate);
        return schedule;
      } catch {
        return null;
      }
    },
    enabled: !!user.currentUser?.employeeId && !!selectedDate,
  });
  
  // Calculate duration function with schedule data
  const calculateDuration = createCalculateDuration(t, scheduleForDate);

  // Get workflow info for selected time code
  const selectedTimeCode = timeCodes?.find(tc => tc.code === form.watch('timeCode'));
  const workflowInfo = selectedTimeCode ? getWorkflowInfo(selectedTimeCode) : null;
  
  // Update form when deviation data loads
  useState(() => {
    if (deviation) {
      form.reset({
        employeeId: deviation.employeeId,
        date: deviation.date,
        startTime: deviation.startTime.slice(0, 5), // Remove seconds
        endTime: deviation.endTime.slice(0, 5), // Remove seconds
        timeCode: deviation.timeCode,
        comment: deviation.comment || '',
        status: deviation.status,
      });
    }
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: DeviationFormValues) => 
      apiRequest('POST', '/api/deviations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deviations'] });
      toast({
        title: status === "pending" ? t('deviations.submitSuccess') : t('deviations.draftSaved'),
        description: status === "pending" 
          ? t('deviations.submitSuccessDescription') 
          : t('deviations.draftSavedDescription'),
      });
      setLocation('/deviations');
    },
    onError: (error) => {
      toast({
        title: t('deviations.submitError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: DeviationFormValues) => 
      apiRequest('PATCH', `/api/deviations/${deviationId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deviations'] });
      toast({
        title: status === "pending" ? t('deviations.updateSuccess') : t('deviations.draftSaved'),
        description: status === "pending" 
          ? t('deviations.updateSuccessDescription') 
          : t('deviations.draftSavedDescription'),
      });
      setLocation('/deviations');
    },
    onError: (error) => {
      toast({
        title: t('deviations.updateError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (data: DeviationFormValues) => {
    // Add status to the data
    const submitData = {
      ...data,
      status,
      // Add current timestamp if submitting (not for draft)
      ...(status === "pending" && { submitted: new Date().toISOString() }),
    };
    
    if (deviationId) {
      updateMutation.mutate(submitData as any);
    } else {
      createMutation.mutate(submitData as any);
    }
  };
  
  // Handlers for different submission types
  const handleSubmit = form.handleSubmit((data) => {
    setStatus("pending");
    onSubmit(data);
  });
  
  const handleSaveDraft = () => {
    setStatus("draft");
    form.handleSubmit(onSubmit)();
  };
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      setLocation('/deviations');
    }
  };
  
  const isLoading = isLoadingTimeCodes || isLoadingDeviation;
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('deviations.registerTitle')}</h1>
        <p className="text-muted-foreground">{t('deviations.registerDescription')}</p>
      </div>
      
      {/* Quick Actions - Mobile First UX */}
      {showQuickActions && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="mb-3">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="material-icons text-accent mr-2">flash_on</span>
                Snabbregistrering
              </h2>
              <p className="text-sm text-muted-foreground">Klicka för att registrera vanliga avvikelser direkt</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {quickActions.map((action, index) => {
                // Match styling with Deviation Type Selector for consistency
                const isSickOrVAB = action.timeCode === '300' || action.timeCode === '400';
                const isOvertime = action.timeCode === '200';
                
                return (
                  <Button
                    key={index}
                    variant={isSickOrVAB ? "default" : "outline"}
                    size="lg"
                    onClick={() => handleQuickAction(action)}
                    className={`w-full py-6 sm:py-8 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 min-h-[80px] sm:min-h-[100px] ${
                      isSickOrVAB 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : isOvertime
                        ? 'border-2 border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400'
                        : 'border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                    }`}
                    disabled={isLoading || isPending}
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-xl sm:text-2xl">
                        {/* Use consistent icons matching Deviation Type Selector */}
                        {action.timeCode === '300' ? '🏥' :  // Sjuk - Hospital icon
                         action.timeCode === '400' ? '🏥' :  // VAB - Same hospital icon for consistency  
                         action.timeCode === '200' ? '⏰' :  // Övertid - Clock icon
                         action.icon}                        // Fallback to original
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-sm sm:text-base leading-tight">
                          {action.label}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
            
            <div className="mt-4 flex justify-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowQuickActions(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Eller fyll i manuellt nedan ↓
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Toggle Quick Actions link */}
        {!showQuickActions && !deviationId && (
          <div className="mb-4 text-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowQuickActions(true)}
              className="text-accent hover:text-accent-dark"
            >
              <span className="material-icons text-sm mr-1">flash_on</span>
              Använd snabbregistrering istället
            </Button>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('deviations.date')} *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={isLoading || isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('deviations.startTime')} *</FormLabel>
                      <FormControl>
                        <TimeInput 
                          {...field} 
                          disabled={isLoading || isPending}
                          placeholder="08:00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('deviations.endTime')} *</FormLabel>
                      <FormControl>
                        <TimeInput 
                          {...field} 
                          disabled={isLoading || isPending}
                          placeholder="16:00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Duration display */}
              {form.watch('startTime') && form.watch('endTime') && (
                <div className="bg-muted/50 p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-sm text-muted-foreground">schedule</span>
                    <span className="text-sm font-medium">
                      Total tid: {calculateDuration(form.watch('startTime'), form.watch('endTime'))}
                    </span>
                  </div>
                  {scheduleForDate && scheduleForDate.breakStart && scheduleForDate.breakEnd && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Rast {scheduleForDate.breakStart.slice(0, 5)}-{scheduleForDate.breakEnd.slice(0, 5)} är avdragen från arbetstiden
                    </div>
                  )}
                  {!scheduleForDate && (
                    <div className="text-xs text-orange-600 mt-1">
                      ⚠️ Inget schema hittat för detta datum - beräknar utan raster
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="timeCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('deviations.timeCode')} *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading || isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('deviations.selectTimeCode')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeCodes?.map((code) => {
                        const workflow = getWorkflowInfo(code);
                        return (
                          <SelectItem key={code.code} value={code.code}>
                            <div className="flex items-center gap-2">
                              <span className="material-icons text-sm">
                                {workflow.icon}
                              </span>
                              <div>
                                <div className="font-medium">{code.code} - {code.name}</div>
                                <div className="text-xs text-muted-foreground">{workflow.title}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Workflow Information */}
            {workflowInfo && (
              <div className={`p-4 rounded-lg border ${workflowInfo.color.replace('text-', 'border-').replace('bg-', 'border-').replace('-100', '-300')} ${workflowInfo.color.replace('-800', '-50')}`}>
                <div className="flex items-start gap-3">
                  <span className="material-icons text-lg">
                    {workflowInfo.icon}
                  </span>
                  <div>
                    <h4 className="font-medium text-sm">{workflowInfo.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{workflowInfo.description}</p>
                    {workflowInfo.type === 'post_approval' && (
                      <p className="text-xs text-orange-600 mt-2 font-medium">
                        💡 Detta kan registreras i efterhand men måste godkännas innan månadsstäng
                      </p>
                    )}
                    {workflowInfo.type === 'pre_approval' && (
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        ⚠️ Detta kräver godkännande innan ledigheten tas
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('deviations.comment')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('deviations.commentPlaceholder')} 
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                      disabled={isLoading || isPending} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col-reverse md:flex-row md:justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isPending}
                className="mt-3 md:mt-0"
              >
                {t('action.cancel')}
              </Button>
              <div className="flex flex-col md:flex-row">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary/10 md:mr-3"
                  onClick={handleSaveDraft}
                  disabled={isPending}
                >
                  {t('action.saveDraft')}
                </Button>
                <Button 
                  type="submit" 
                  variant="default" 
                  className="mt-3 md:mt-0 bg-accent hover:bg-accent text-white"
                  disabled={isPending}
                >
                  {t('action.submit')}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Date Confirmation Dialog */}
      <AlertDialog open={showDateConfirmDialog} onOpenChange={setShowDateConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              {pendingAction?.icon} {pendingAction?.label}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                if (pendingAction?.timeCode === '300') return 'Vilken dag är du sjuk? Välj nedan:';
                if (pendingAction?.timeCode === '400') return 'Vilken dag är du VAB? Välj nedan:';
                if (pendingAction?.timeCode === '200' || formType === 'overtime') return 'Vilken dag arbetar du övertid? Välj nedan:';
                return 'Vilken dag gäller avvikelsen? Välj nedan:';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3 py-4">
            {pendingAction && getDateSuggestions(pendingAction).map((suggestion, index) => (
              <Button
                key={suggestion.date || index}
                variant={suggestion.primary ? "default" : "outline"}
                size="lg"
                onClick={() => {
                  if (suggestion.type === 'custom') {
                    setShowCustomDatePicker(true);
                  } else {
                    executeQuickAction(suggestion.date);
                  }
                }}
                className="w-full justify-start h-12 text-left" // 48px höjd för 44px+ tillgänglighet
              >
                <span className="material-icons mr-3 text-lg">
                  {suggestion.type === 'custom' ? 'calendar_month' : 
                   suggestion.primary ? 'today' : 'yesterday'}
                </span>
                <span className="text-base">{suggestion.label}</span>
              </Button>
            ))}
          </div>
          
          {/* Custom Date Selection */}
          {showCustomDatePicker && (
            <div className="space-y-3 border-t pt-4">
              <div className="text-sm font-medium text-muted-foreground">Ange specifikt datum:</div>
              <Input
                type="date"
                onChange={(e) => {
                  if (e.target.value) {
                    executeQuickAction(e.target.value);
                  }
                }}
                className="w-full"
                max={format(new Date(), 'yyyy-MM-dd')} // Kan inte välja framtida datum
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDateConfirmDialog(false);
              setShowCustomDatePicker(false);
              setPendingAction(null);
            }}>
              Avbryt
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeviationForm;
