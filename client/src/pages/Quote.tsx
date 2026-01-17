import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, AlertCircle, Truck, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Quote() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"location" | "service" | "details">("location");
  const [address, setAddress] = useState("");
  const [serviceType, setServiceType] = useState<"HAUL_AWAY" | "LABOR_ONLY">("HAUL_AWAY");
  const [serviceAreaId, setServiceAreaId] = useState<string>("");
  const [serviceAreaName, setServiceAreaName] = useState<string>("");
  const [checkingCoverage, setCheckingCoverage] = useState(false);
  const [coverageError, setCoverageError] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  // Check coverage query
  const coverageQuery = trpc.serviceAreas.checkCoverage.useQuery(
    {
      latitude: coordinates?.lat || 0,
      longitude: coordinates?.lon || 0,
    },
    {
      enabled: !!coordinates,
    }
  );

  // Handle coverage query results
  useEffect(() => {
    if (coverageQuery.data) {
      if (coverageQuery.data.covered && coverageQuery.data.serviceArea) {
        setServiceAreaId(coverageQuery.data.serviceArea.id);
        setServiceAreaName(coverageQuery.data.serviceArea.name);
        setStep("service");
      } else {
        setCoverageError(
          "Sorry, we don't currently serve this area. We operate in PA, NY, and NJ."
        );
      }
      setCheckingCoverage(false);
    }
    if (coverageQuery.error) {
      setCoverageError("Unable to check coverage. Please try again.");
      setCheckingCoverage(false);
    }
  }, [coverageQuery.data, coverageQuery.error]);

  // Check service area coverage
  const handleCheckCoverage = () => {
    if (!address.trim()) {
      setCoverageError("Please enter your address");
      return;
    }

    setCheckingCoverage(true);
    setCoverageError("");

    // TODO: Use Google Maps Geocoding API to convert address to coordinates
    // For now, using mock coordinates (Philadelphia)
    const mockLat = 39.9526;
    const mockLon = -75.1652;

    setCoordinates({ lat: mockLat, lon: mockLon });
  };

  const handleServiceTypeSelect = () => {
    // Navigate to appropriate calculator page
    if (serviceType === "HAUL_AWAY") {
      setLocation(`/quote/haul-away?area=${serviceAreaId}&address=${encodeURIComponent(address)}`);
    } else {
      setLocation(`/quote/labor?area=${serviceAreaId}&address=${encodeURIComponent(address)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "location"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              1
            </div>
            <div className="w-16 h-1 bg-gray-200">
              <div
                className={`h-full bg-blue-600 transition-all ${
                  step !== "location" ? "w-full" : "w-0"
                }`}
              />
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "service"
                  ? "bg-blue-600 text-white"
                  : step === "details"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              2
            </div>
            <div className="w-16 h-1 bg-gray-200">
              <div
                className={`h-full bg-blue-600 transition-all ${
                  step === "details" ? "w-full" : "w-0"
                }`}
              />
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "details"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              3
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Location</span>
            <span>Service</span>
            <span>Details</span>
          </div>
        </div>

        {/* Step 1: Location Check */}
        {step === "location" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Check Service Availability
              </CardTitle>
              <CardDescription>
                Enter your address to see if we serve your area
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Your Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, Philadelphia, PA 19103"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckCoverage()}
                />
                <p className="text-xs text-gray-500">
                  We serve areas in Pennsylvania, New York, and New Jersey
                </p>
              </div>

              {coverageError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{coverageError}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleCheckCoverage}
                disabled={checkingCoverage}
                className="w-full"
              >
                {checkingCoverage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking Coverage...
                  </>
                ) : (
                  "Check Availability"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Service Type Selection */}
        {step === "service" && (
          <Card>
            <CardHeader>
              <CardTitle>Select Service Type</CardTitle>
              <CardDescription>
                Service area: <strong>{serviceAreaName}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={serviceType}
                onValueChange={(value) => setServiceType(value as typeof serviceType)}
              >
                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="HAUL_AWAY" id="haul_away" className="mt-1" />
                  <Label htmlFor="haul_away" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">Haul Away Service</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      We remove and dispose of your junk. Volume-based pricing with
                      disposal costs included up to cap.
                    </p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="LABOR_ONLY" id="labor_only" className="mt-1" />
                  <Label htmlFor="labor_only" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <span className="font-semibold">Labor Only Service</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Get help with heavy lifting and moving. Hourly rate with 2-hour
                      minimum. You provide truck or dumpster.
                    </p>
                  </Label>
                </div>
              </RadioGroup>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("location")} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleServiceTypeSelect} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
