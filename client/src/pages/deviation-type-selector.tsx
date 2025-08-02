import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Link } from 'wouter';

export default function DeviationTypeSelector() {
  const { t } = useI18n();

  return (
    <div className="container mx-auto p-6 max-w-4xl">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Oplanerad frånvaro - Primary/Prominent */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="h-20 w-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                <span className="material-icons text-3xl">schedule</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Oplanerad frånvaro
              </h2>
              <p className="text-gray-600 mb-4">
                Rapportera direkt och skicka till chef
              </p>
            </div>

            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-orange-500 text-sm">sick</span>
                  Sjukdom
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-icons text-blue-500 text-sm">child_care</span>
                  VAB
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-icons text-green-500 text-sm">more_time</span>
                  Övertid
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-icons text-orange-500 text-sm">access_time</span>
                  Kom sent
                </div>
              </div>
            </div>

            <Link href="/deviations/new">
              <Button 
                size="lg" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span className="material-icons mr-2">edit</span>
                <span className="hidden sm:inline">Registrera oplanerad frånvaro</span>
                <span className="sm:hidden">Registrera</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Planerad frånvaro - Secondary */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-md hover:shadow-lg transition-all duration-200">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                <span className="material-icons text-3xl">event_available</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Planerad frånvaro
              </h2>
              <p className="text-gray-600 mb-4">
                Ansök om godkännande i förväg
              </p>
            </div>

            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-blue-500 text-sm">beach_access</span>
                  Semester
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-icons text-green-500 text-sm">family_restroom</span>
                  Föräldraledighet
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-icons text-purple-500 text-sm">work_off</span>
                  Tjänstledighet
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-icons text-orange-500 text-sm">event</span>
                  Annan ledighet
                </div>
              </div>
            </div>

            <Link href="/leave/new">
              <Button 
                size="lg" 
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 py-4 text-lg font-semibold transition-all duration-200"
              >
                <span className="material-icons mr-2">event_note</span>
                <span className="hidden sm:inline">Ansök om planerad ledighet</span>
                <span className="sm:hidden">Ansök</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Help section */}
      <Card className="mt-6 bg-gray-50">
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-600">
            <strong>Oplanerad:</strong> Rapporteras direkt • <strong>Planerad:</strong> Kräver godkännande i förväg
          </div>
        </CardContent>
      </Card>
    </div>
  );
}