import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Users, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function QuoteLabor() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const serviceAreaId = searchParams.get("area") || "";
  const address = searchParams.get("address") || "";

  const [hours, setHours] = useState<number>(2);
  const [calculating, setCalculating] = useState(false);

  // Calculate quote mutation
  const calculateQuote = trpc.pricing.calculateLaborOnly.useMutation({
    onSuccess: (quote) => {
      // Store quote in sessionStorage and navigate to quote display
      sessionStorage.setItem("currentQuote", JSON.stringify(quote));
      sessionStorage.setItem("quoteAddress", address);
      setLocation("/quote/review");
    },
    onError: (error) => {
      console.error("Quote calculation failed:", error);
    },
  });

  const handleCalculateQuote = () => {
    if (hours < 2) {
      return;
    }

    setCalculating(true);
    calculateQuote.mutate({
      serviceAreaId,
      hours,
      distanceMiles: 5, // TODO: Calculate actual distance from address
    });
  };

  const handleHoursChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 2) {
      setHours(numValue);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => setLocation("/quote")}
          className="mb-6"
        >
          ← Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Labor Only Service</CardTitle>
                <CardDescription>Select how many hours of help you need</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Address Display */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                <strong>Service Location:</strong> {address}
              </p>
            </div>

            {/* Hours Selection */}
            <div className="space-y-3">
              <Label htmlFor="hours" className="text-base font-semibold">
                How many hours do you need? (2-hour minimum)
              </Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setHours(Math.max(2, hours - 0.5))}
                  disabled={hours <= 2}
                >
                  -
                </Button>
                <Input
                  id="hours"
                  type="number"
                  min="2"
                  step="0.5"
                  value={hours}
                  onChange={(e) => handleHoursChange(e.target.value)}
                  className="text-center text-xl font-semibold w-24"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setHours(hours + 0.5)}
                >
                  +
                </Button>
                <span className="text-gray-600">hours</span>
              </div>
              <p className="text-sm text-gray-600">
                You can adjust the time in 30-minute increments. Additional time can be
                requested during the job if needed.
              </p>
            </div>

            {/* Quick Hour Buttons */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Quick select:</Label>
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 6, 8].map((h) => (
                  <Button
                    key={h}
                    variant={hours === h ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHours(h)}
                  >
                    {h} hours
                  </Button>
                ))}
              </div>
            </div>

            {/* Info Alerts */}
            <div className="space-y-3">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>What's included:</strong> Professional labor help with loading,
                  unloading, moving, or organizing. You provide the truck or dumpster.
                </AlertDescription>
              </Alert>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Time extensions:</strong> Need more time? You can request
                  additional hours during the job. Your driver will update the time and
                  you'll be charged accordingly.
                </AlertDescription>
              </Alert>
            </div>

            {/* Error Display */}
            {calculateQuote.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to calculate quote. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {/* Calculate Button */}
            <Button
              onClick={handleCalculateQuote}
              disabled={hours < 2 || calculating || calculateQuote.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {calculating || calculateQuote.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                "Get Your Quote"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
