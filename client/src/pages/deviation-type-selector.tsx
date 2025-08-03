import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Link } from 'wouter';
import DeviationList from '@/components/deviations/deviation-list';

export default function DeviationTypeSelector() {
  const { t } = useI18n();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avvikelser</h1>
          <p className="text-gray-600 mt-1">Hantera dina tidrapporteringsavvikelser</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Oplanerad frånvaro - Primary */}
        <Link href="/deviations/new">
          <Button 
            size="lg" 
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 sm:py-6 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-2 sm:space-x-3">
              <div className="text-2xl sm:text-3xl">🚫</div>
              <div className="text-center">
                <div className="font-bold text-lg sm:text-xl">
                  Frånvaro
                </div>
                <div className="text-xs text-orange-100 opacity-80 hidden sm:block">
                  Sjuk • VAB • Övertid
                </div>
              </div>
            </div>
          </Button>
        </Link>

        {/* Planerad frånvaro - Secondary */}
        <Link href="/leave/new">
          <Button 
            size="lg" 
            variant="outline"
            className="w-full border-2 border-blue-300 bg-white text-blue-700 hover:bg-blue-100 hover:border-blue-400 py-4 sm:py-6 text-base sm:text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-2 sm:space-x-3">
              <div className="text-2xl sm:text-3xl">🌴</div>
              <div className="text-center">
                <div className="font-bold text-lg sm:text-xl">
                  Ledighet
                </div>
                <div className="text-xs text-blue-600 opacity-70 hidden sm:block">
                  Semester • Föräldraledighet
                </div>
              </div>
            </div>
          </Button>
        </Link>
      </div>

      {/* Deviation List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="material-icons text-gray-600">list</span>
            <span>Dina avvikelser</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DeviationList />
        </CardContent>
      </Card>
    </div>
  );
}