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
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 sm:py-6 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            <div className="flex items-center justify-center space-x-2 sm:space-x-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                <span className="material-icons text-lg sm:text-xl">schedule</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-sm sm:text-base">
                  <span className="hidden sm:inline">Registrera oplanerad frånvaro</span>
                  <span className="sm:hidden">Oplanerad frånvaro</span>
                </div>
                <div className="text-xs sm:text-sm text-orange-100 opacity-90">
                  Sjuk • VAB • Övertid • Kom sent
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
            className="w-full border-2 border-blue-300 bg-white text-blue-700 hover:bg-blue-100 hover:border-blue-400 py-3 sm:py-6 text-base sm:text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center justify-center space-x-2 sm:space-x-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                <span className="material-icons text-lg sm:text-xl text-blue-600">event_available</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-sm sm:text-base">
                  <span className="hidden sm:inline">Ansök om planerad ledighet</span>
                  <span className="sm:hidden">Planerad ledighet</span>
                </div>
                <div className="text-xs sm:text-sm text-blue-600 opacity-80">
                  Semester • Föräldraledighet • Tjänstledighet
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