import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { apiService } from '@/lib/apiService';
import { useI18n } from '@/lib/i18n';

interface ImportedSchedule {
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  status: string;
}

interface ImportResult {
  message: string;
  schedules: ImportedSchedule[];
  count: number;
}

export default function ScheduleImport() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ImportedSchedule[] | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setImportResult(null);
      setPreviewData(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const fileContent = await file.text();
      const response = await fetch('/api/paxml/import-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ xmlContent: fileContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to preview schedules');
      }

      const result: ImportResult = await response.json();
      setPreviewData(result.schedules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const fileContent = await file.text();
      const response = await fetch('/api/paxml/import-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ xmlContent: fileContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import schedules');
      }

      const result: ImportResult = await response.json();
      setImportResult(result);
      setPreviewData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import schedules');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importera Schema från PAXML</CardTitle>
          <CardDescription>
            Ladda upp en PAXML-fil som innehåller schematransaktioner för att importera anställdas scheman
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="xml-file">Välj PAXML-fil</Label>
            <Input
              id="xml-file"
              type="file"
              accept=".xml"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </div>

          {file && (
            <div className="flex gap-2">
              <Button
                onClick={handlePreview}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Förhandsgranskar...' : 'Förhandsgranska'}
              </Button>
              <Button
                onClick={handleImport}
                disabled={isLoading || !previewData}
              >
                {isLoading ? 'Importerar...' : 'Importera'}
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {importResult && (
            <Alert>
              <AlertDescription>
                {importResult.message} - {importResult.count} scheman importerade
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle>Förhandsgranska Schema</CardTitle>
            <CardDescription>
              {previewData.length} scheman hittades i filen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Anställd</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Datum</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Starttid</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Sluttid</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Rast</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((schedule, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{schedule.employeeId}</td>
                      <td className="border border-gray-300 px-4 py-2">{schedule.date}</td>
                      <td className="border border-gray-300 px-4 py-2">{schedule.startTime}</td>
                      <td className="border border-gray-300 px-4 py-2">{schedule.endTime}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {schedule.breakStart} - {schedule.breakEnd}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 10 && (
                <p className="mt-2 text-sm text-gray-600">
                  Visar första 10 av {previewData.length} scheman
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
