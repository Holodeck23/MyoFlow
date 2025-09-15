import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertTriangle, TrendingUp, Settings } from 'lucide-react';

interface KleinunternehmerWidgetProps {
  language: 'en' | 'de';
}

export function KleinunternehmerWidget({ language }: KleinunternehmerWidgetProps) {
  const currentRevenue = 27400;
  const threshold = 35000;
  const percentage = Math.round((currentRevenue / threshold) * 100);
  const remaining = threshold - currentRevenue;
  const forecastWeeks = 6.2;

  const getStatusColor = () => {
    if (percentage >= 95) return 'destructive';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

  const getStatusText = () => {
    if (percentage >= 95) return language === 'de' ? 'Kritisch' : 'Critical';
    if (percentage >= 80) return language === 'de' ? 'Warnung' : 'Warning';
    return language === 'de' ? 'Normal' : 'Normal';
  };

  const translations = {
    en: {
      title: 'Small Business VAT Status',
      subtitle: 'YTD Revenue vs Threshold',
      currentText: `YTD €${currentRevenue.toLocaleString()} of €${threshold.toLocaleString()} threshold (${percentage}%).`,
      forecastText: `Forecast: threshold in ${forecastWeeks} weeks.`,
      remainingText: `€${remaining.toLocaleString()} remaining`,
      configureThreshold: 'Configure threshold',
      viewReport: 'View report',
      whatHappens: 'What happens if I exceed?',
      statusLabel: 'Status'
    },
    de: {
      title: 'Kleinunternehmer-Status',
      subtitle: 'Jahresumsatz vs. Grenzwert',
      currentText: `Bisher €${currentRevenue.toLocaleString()} von €${threshold.toLocaleString()}-Grenze (${percentage}%).`,
      forecastText: `Prognose: in ${forecastWeeks} Wochen erreicht.`,
      remainingText: `€${remaining.toLocaleString()} verbleibend`,
      configureThreshold: 'Grenzwert konfigurieren',
      viewReport: 'Bericht anzeigen',
      whatHappens: 'Was passiert bei Überschreitung?',
      statusLabel: 'Status'
    }
  };

  const t = translations[language];

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {percentage >= 80 && <AlertTriangle className="w-5 h-5 text-warning" />}
              {t.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
          <Badge variant={getStatusColor()} className="gap-1">
            <TrendingUp className="w-3 h-3" />
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>€{currentRevenue.toLocaleString()}</span>
            <span className="text-muted-foreground">€{threshold.toLocaleString()}</span>
          </div>
          <Progress value={percentage} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{percentage}%</span>
            <span>{t.remainingText}</span>
          </div>
        </div>

        <div className="bg-muted/30 p-3 rounded-lg space-y-1">
          <p className="text-sm">{t.currentText}</p>
          <p className="text-sm font-medium text-warning">{t.forecastText}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="gap-2 justify-center sm:justify-start">
            <Settings className="w-4 h-4" />
            {t.configureThreshold}
          </Button>
          <Button variant="outline" size="sm" className="justify-center sm:justify-start">
            {t.viewReport}
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground justify-center sm:justify-start">
            {t.whatHappens}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}