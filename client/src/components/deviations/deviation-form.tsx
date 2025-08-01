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
import { getWorkflowInfo } from "@/lib/approvalWorkflows";

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
  
  // Fetch time codes
  const { data: timeCodes, isLoading: isLoadingTimeCodes } = useQuery({
    queryKey: ['/api/timecodes'],
    queryFn: () => apiService.getTimeCodes(),
  });
  
  // Form setup with default values FIRST
  const deviationFormSchema = createDeviationFormSchema(t);
  const form = useForm<DeviationFormValues>({
    resolver: zodResolver(deviationFormSchema),
    defaultValues: {
      employeeId: user.currentUser?.employeeId || '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '08:00',
      endTime: '17:00',
      timeCode: '',
      comment: '',
      status: 'pending',
    },
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
        // Try to get the specific schedule for this date
        const response = await fetch(`/api/schedules/${user.currentUser.employeeId}?date=${selectedDate}`);
        if (response.ok) {
          const schedules = await response.json();
          return schedules.find((s: any) => s.date === selectedDate) || null;
        }
        return null;
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
      
      <div className="bg-white rounded-lg shadow-sm p-6">
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
                          placeholder="17:00"
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
    </div>
  );
};

export default DeviationForm;
