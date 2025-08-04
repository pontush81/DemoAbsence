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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        {/* Sjuk/VAB - Action-oriented create button */}
        <Link href="/deviations/new?type=sick">
          <Button 
            size="lg" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 sm:py-8 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 min-h-[80px] sm:min-h-[100px]"
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center space-x-1">
                <span className="material-icons text-white text-2xl sm:text-3xl">medical_services</span>
                <span className="material-icons text-white text-lg sm:text-xl">add</span>
              </div>
              <div className="text-center">
                <div className="font-bold text-sm sm:text-base leading-tight">
                  Rapportera Sjuk/VAB
                </div>
                <div className="text-xs sm:text-sm opacity-90 mt-1">
                  Sjukdom eller vård av barn
                </div>
              </div>
            </div>
          </Button>
        </Link>

        {/* Övertid - Action-oriented create button */}
        <Link href="/deviations/new?type=overtime">
          <Button 
            size="lg" 
            variant="outline"
            className="w-full border-2 border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 py-6 sm:py-8 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 min-h-[80px] sm:min-h-[100px]"
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center space-x-1">
                <span className="material-icons text-indigo-700 text-2xl sm:text-3xl">schedule</span>
                <span className="material-icons text-indigo-700 text-lg sm:text-xl">add</span>
              </div>
              <div className="text-center">
                <div className="font-bold text-sm sm:text-base leading-tight">
                  Rapportera Övertid
                </div>
                <div className="text-xs sm:text-sm opacity-80 mt-1">
                  Extra arbetstid utöver schema
                </div>
              </div>
            </div>
          </Button>
        </Link>

        {/* Planerad ledighet - Action-oriented create button */}
        <Link href="/leave/new">
          <Button 
            size="lg" 
            variant="outline"
            className="w-full border-2 border-green-300 bg-white text-green-700 hover:bg-green-100 hover:border-green-400 py-6 sm:py-8 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 min-h-[80px] sm:min-h-[100px]"
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center space-x-1">
                <div className="text-xl sm:text-2xl">🌴</div>
                <span className="material-icons text-green-700 text-lg sm:text-xl">add</span>
              </div>
              <div className="text-center">
                <div className="font-bold text-sm sm:text-base leading-tight">
                  Ansök om Ledighet
                </div>
                <div className="text-xs sm:text-sm opacity-80 mt-1">
                  Semester, föräldraledighet, etc.
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