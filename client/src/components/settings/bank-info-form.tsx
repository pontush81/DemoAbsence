import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { apiService } from "@/lib/apiService";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Bank info form schema
const bankInfoSchema = z.object({
  bankClearingNumber: z.string().min(4, { message: "Valid clearing number required" }),
  bankAccountNumber: z.string().min(6, { message: "Valid account number required" }),
  bankBIC: z.string().optional(),
  bankCountryCode: z.string().min(2, { message: "Country code required" }),
  bankIBAN: z.string().optional(),
});

type BankInfoFormValues = z.infer<typeof bankInfoSchema>;

const BankInfoForm = () => {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user } = useStore();
  const employeeId = user.currentUser?.employeeId;
  
  // Fetch employee data
  const { data: employee, isLoading } = useQuery({
    queryKey: ['/api/employees', employeeId],
    queryFn: () => employeeId 
      ? apiService.getCurrentEmployee()
      : Promise.resolve(null),
    enabled: !!employeeId,
  });
  
  // Form setup
  const form = useForm<BankInfoFormValues>({
    resolver: zodResolver(bankInfoSchema),
    defaultValues: {
      bankClearingNumber: "",
      bankAccountNumber: "",
      bankBIC: "",
      bankCountryCode: "SE",
      bankIBAN: "",
    },
  });
  
  // Update form when employee data loads
  if (employee && !form.formState.isDirty) {
    form.reset({
      bankClearingNumber: employee.bankClearingNumber || "",
      bankAccountNumber: employee.bankAccountNumber || "",
      bankBIC: employee.bankBIC || "",
      bankCountryCode: employee.bankCountryCode || "SE",
      bankIBAN: employee.bankIBAN || "",
    });
  }
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: BankInfoFormValues) => 
      apiRequest('PATCH', `/api/employees/${employeeId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: t('settings.updateSuccess'),
        description: t('settings.bankInfoUpdated'),
      });
    },
    onError: (error) => {
      toast({
        title: t('settings.updateError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (data: BankInfoFormValues) => {
    if (employeeId) {
      updateMutation.mutate(data);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="bankClearingNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.bankClearingNumber')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bankAccountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.bankAccountNumber')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bankCountryCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.bankCountryCode')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bankBIC"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.bankBIC')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bankIBAN"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.bankIBAN')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button 
          type="submit" 
          className="bg-accent hover:bg-accent-dark text-white"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <span className="material-icons animate-spin mr-2">refresh</span>
          ) : (
            <span className="material-icons mr-2">save</span>
          )}
          {t('action.save')}
        </Button>
      </form>
    </Form>
  );
};

export default BankInfoForm;
