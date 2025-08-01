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

// Helper function to calculate duration between two times
const calculateDuration = (startTime: string, endTime: string): string => {
  try {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    if (end <= start) {
      return "Ogiltig tidsperiod";
    }
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours === 0) {
      return `${diffMinutes} min`;
    } else if (diffMinutes === 0) {
      return `${diffHours} tim`;
    } else {
      return `${diffHours} tim ${diffMinutes} min`;
    }
  } catch {
    return "Ogiltig tid";
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
  
  // Fetch deviation if editing
  const { data: deviation, isLoading: isLoadingDeviation } = useQuery({
    queryKey: ['/api/deviations', deviationId],
    queryFn: () => deviationId ? apiService.getDeviation(deviationId) : null,
    enabled: !!deviationId,
  });
  
  // Form setup with default values
  const form = useForm<DeviationFormValues>({
    resolver: zodResolver(deviationFormSchema),
    defaultValues: {
      employeeId: user.currentUser?.employeeId || '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '',
      endTime: '',
      timeCode: '',
      comment: '',
      status: 'pending',
    },
  });
  
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
                      {timeCodes?.map((code) => (
                        <SelectItem key={code.code} value={code.code}>
                          {code.code} - {code.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
