import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
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

// Personal info form schema
const personalInfoSchema = z.object({
  personnummer: z.string().min(1, { message: "Personnummer required" }),
  firstName: z.string().min(1, { message: "First name required" }),
  lastName: z.string().min(1, { message: "Last name required" }),
  careOfAddress: z.string().optional(),
  streetAddress: z.string().min(1, { message: "Street address required" }),
  postalCode: z.string().min(5, { message: "Valid postal code required" }),
  city: z.string().min(1, { message: "City required" }),
  country: z.string().min(1, { message: "Country required" }),
  phoneNumber: z.string().optional(),
  email: z.string().email({ message: "Valid email required" }).optional(),
  workEmail: z.string().email({ message: "Valid work email required" }).optional(),
  preferredEmail: z.enum(["personal", "work"]),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

const PersonalInfoForm = () => {
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
  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      personnummer: "",
      firstName: "",
      lastName: "",
      careOfAddress: "",
      streetAddress: "",
      postalCode: "",
      city: "",
      country: "Sverige",
      phoneNumber: "",
      email: "",
      workEmail: "",
      preferredEmail: "work",
    },
  });
  
  // Update form when employee data loads
  useEffect(() => {
    if (employee) {
      form.reset({
        personnummer: employee.personnummer,
        firstName: employee.firstName,
        lastName: employee.lastName,
        careOfAddress: employee.careOfAddress || "",
        streetAddress: employee.streetAddress,
        postalCode: employee.postalCode,
        city: employee.city,
        country: employee.country,
        phoneNumber: employee.phoneNumber || "",
        email: employee.email || "",
        workEmail: employee.workEmail || "",
        preferredEmail: employee.preferredEmail === "personal" ? "personal" : "work",
      });
    }
  }, [employee, form]);
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: PersonalInfoFormValues) => 
      apiRequest('PATCH', `/api/employees/${employeeId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: t('settings.updateSuccess'),
        description: t('settings.personalInfoUpdated'),
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
  const onSubmit = (data: PersonalInfoFormValues) => {
    if (employeeId) {
      updateMutation.mutate(data);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 8 }).map((_, index) => (
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
            name="personnummer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.personnummer')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.firstName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.lastName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="careOfAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.careOfAddress')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="streetAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.streetAddress')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.postalCode')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.city')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.country')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.phoneNumber')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.personalEmail')}</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="workEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.workEmail')}</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
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

export default PersonalInfoForm;
