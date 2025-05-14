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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { insertLeaveRequestSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { apiService } from "@/lib/apiService";
import { useStore } from "@/lib/store";
import { format } from "date-fns";

// Extend the schema with custom validation
const leaveFormSchema = insertLeaveRequestSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  leaveType: z.string().min(1, "Leave type is required"),
  scope: z.string().min(1, "Scope is required"),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "End date must be on or after start date",
  path: ["endDate"],
});

type LeaveFormValues = z.infer<typeof leaveFormSchema>;

interface LeaveFormProps {
  leaveRequestId?: number;
  onCancel?: () => void;
}

const LeaveForm = ({ leaveRequestId, onCancel }: LeaveFormProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useStore();
  const [status, setStatus] = useState<"draft" | "pending">("pending");
  
  // Fetch leave request if editing
  const { data: leaveRequest, isLoading: isLoadingLeaveRequest } = useQuery({
    queryKey: ['/api/leave-requests', leaveRequestId],
    queryFn: () => leaveRequestId ? apiService.getLeaveRequest(leaveRequestId) : null,
    enabled: !!leaveRequestId,
  });
  
  // Form setup with default values
  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      employeeId: user.currentUser?.employeeId || '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      leaveType: '',
      scope: 'full-day',
      customStartTime: null,
      customEndTime: null,
      comment: '',
      status: 'pending',
    },
  });
  
  // Update form when leave request data loads
  useState(() => {
    if (leaveRequest) {
      form.reset({
        employeeId: leaveRequest.employeeId,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        leaveType: leaveRequest.leaveType,
        scope: leaveRequest.scope,
        customStartTime: leaveRequest.customStartTime,
        customEndTime: leaveRequest.customEndTime,
        comment: leaveRequest.comment || '',
        status: leaveRequest.status,
      });
    }
  });
  
  // Watch scope to conditionally show custom time inputs
  const scope = form.watch('scope');
  const showCustomTimeInputs = scope === 'custom';
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: LeaveFormValues) => 
      apiRequest('POST', '/api/leave-requests', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      toast({
        title: status === "pending" ? t('leave.submitSuccess') : t('leave.draftSaved'),
        description: status === "pending" 
          ? t('leave.submitSuccessDescription') 
          : t('leave.draftSavedDescription'),
      });
      setLocation('/leave');
    },
    onError: (error) => {
      toast({
        title: t('leave.submitError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: LeaveFormValues) => 
      apiRequest('PATCH', `/api/leave-requests/${leaveRequestId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      toast({
        title: status === "pending" ? t('leave.updateSuccess') : t('leave.draftSaved'),
        description: status === "pending" 
          ? t('leave.updateSuccessDescription') 
          : t('leave.draftSavedDescription'),
      });
      setLocation('/leave');
    },
    onError: (error) => {
      toast({
        title: t('leave.updateError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (data: LeaveFormValues) => {
    // Add status to the data
    const submitData = {
      ...data,
      status,
      // Add current timestamp if submitting (not for draft)
      ...(status === "pending" && { submitted: new Date().toISOString() }),
    };
    
    if (leaveRequestId) {
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
      setLocation('/leave');
    }
  };
  
  const isLoading = isLoadingLeaveRequest;
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('leave.applyTitle')}</h1>
        <p className="text-muted-foreground">{t('leave.applyDescription')}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="leaveType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leave.leaveType')} *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading || isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('leave.selectLeaveType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="vacation">{t('leave.vacation')}</SelectItem>
                      <SelectItem value="comp-leave">{t('leave.compLeave')}</SelectItem>
                      <SelectItem value="unpaid-leave">{t('leave.unpaidLeave')}</SelectItem>
                      <SelectItem value="parental-leave">{t('leave.parentalLeave')}</SelectItem>
                      <SelectItem value="study-leave">{t('leave.studyLeave')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('leave.startDate')} *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isLoading || isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('leave.endDate')} *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isLoading || isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leave.scope')} *</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      className="flex flex-wrap gap-4"
                      disabled={isLoading || isPending}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full-day" id="full-day" />
                        <Label htmlFor="full-day">{t('leave.fullDay')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="morning" id="morning" />
                        <Label htmlFor="morning">{t('leave.morning')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="afternoon" id="afternoon" />
                        <Label htmlFor="afternoon">{t('leave.afternoon')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="custom" />
                        <Label htmlFor="custom">{t('leave.customTime')}</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {showCustomTimeInputs && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('deviations.startTime')} *</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          value={field.value || ''} 
                          onChange={field.onChange} 
                          disabled={isLoading || isPending} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('deviations.endTime')} *</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          value={field.value || ''} 
                          onChange={field.onChange} 
                          disabled={isLoading || isPending} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leave.comment')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('leave.commentPlaceholder')} 
                      className="resize-none"
                      rows={3}
                      {...field}
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

export default LeaveForm;
