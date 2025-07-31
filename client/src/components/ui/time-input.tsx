import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

interface TimeInputProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

// Generate common work hours (6:00 - 23:00 in 15-minute intervals)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 6; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      options.push({
        value: timeString,
        label: timeString
      });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ value = '', onChange, disabled = false, placeholder = 'HH:MM', className, id, name, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update internal state when external value changes
    useEffect(() => {
      setInputValue(value);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (timeRegex.test(newValue) || newValue === '') {
        onChange?.(newValue);
      }
    };

    const handlePresetSelect = (selectedTime: string) => {
      setInputValue(selectedTime);
      onChange?.(selectedTime);
      setIsOpen(false);
      inputRef.current?.focus();
    };

    const handleInputBlur = () => {
      // Format the time if it's valid but incomplete (e.g., "9:30" -> "09:30")
      if (inputValue) {
        const parts = inputValue.split(':');
        if (parts.length === 2) {
          const hour = parts[0].padStart(2, '0');
          const minute = parts[1].padStart(2, '0');
          const formattedTime = `${hour}:${minute}`;
          
          // Validate the formatted time
          const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
          if (timeRegex.test(formattedTime)) {
            setInputValue(formattedTime);
            onChange?.(formattedTime);
          }
        }
      }
    };

    return (
      <div className="relative">
        <div className="flex gap-1">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("font-mono text-center", className)}
            id={id}
            name={name}
            {...props}
          />
          
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                className="px-2 shrink-0"
                aria-label="Välj vanlig tid"
              >
                <span className="material-icons text-sm">schedule</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
              <div className="max-h-[200px] overflow-y-auto">
                <div className="p-2 border-b">
                  <p className="text-sm font-medium text-muted-foreground">Vanliga arbetstider</p>
                </div>
                <div className="p-1">
                  {timeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handlePresetSelect(option.value)}
                      className={cn(
                        "w-full text-left px-2 py-1 text-sm rounded hover:bg-accent hover:text-accent-foreground font-mono",
                        inputValue === option.value && "bg-accent text-accent-foreground"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="mt-1">
          <p className="text-xs text-muted-foreground">
            Format: HH:MM (t.ex. 08:30)
          </p>
        </div>
      </div>
    );
  }
);

TimeInput.displayName = 'TimeInput';

export { TimeInput }; 