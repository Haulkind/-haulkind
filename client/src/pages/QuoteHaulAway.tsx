import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Truck, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";

const VOLUME_OPTIONS = [
  { tier: "1_8", label: "1/8 Truck Load", cubicYards: 3, description: "Small items, few bags" },
  { tier: "1_4", label: "1/4 Truck Load", cubicYards: 6, description: "Couch, mattress, or 10-15 bags" },
  { tier: "1_2", label: "1/2 Truck Load", cubicYards: 12, description: "Multiple furniture pieces" },
  { tier: "3_4", label: "3/4 Truck Load", cubicYards: 18, description: "Room full of items" },
  { tier: "full", label: "Full Truck Load", cubicYards: 24, description: "Entire apartment or garage" },
];

export default function QuoteHaulAway() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const serviceAreaId = searchParams.get("area") || "";
  const address = searchParams.get("address") || "";

  const [volumeTier, setVolumeTier] = useState<string>("");
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [calculating, setCalculating] = useState(false);

  // Fetch available addons
  const addonsQuery = trpc.pricing.getAddons.useQuery(
    { serviceAreaId },
    { enabled: !!serviceAreaId }
  );

  // Calculate quote mutation
  const calculateQuote = trpc.pricing.calculateHaulAway.useMutation({
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
    if (!volumeTier) {
      return;
    }

    const selectedVolume = VOLUME_OPTIONS.find((v) => v.tier === volumeTier);
    if (!selectedVolume) return;

    setCalculating(true);
    calculateQuote.mutate({
      serviceAreaId,
      volumeCubicYards: selectedVolume.cubicYards,
      distanceMiles: 5, // TODO: Calculate actual distance from address
      addonIds: selectedAddons,
    });
  };

  const toggleAddon = (addonId: number) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
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
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Haul Away Service</CardTitle>
                <CardDescription>Select your load size and any add-ons</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Address Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Service Location:</strong> {address}
              </p>
            </div>

            {/* Volume Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">How much do you need removed?</Label>
              <RadioGroup value={volumeTier} onValueChange={setVolumeTier}>
                {VOLUME_OPTIONS.map((option) => (
                  <div
                    key={option.tier}
                    className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <RadioGroupItem value={option.tier} id={option.tier} className="mt-1" />
                    <Label htmlFor={option.tier} className="cursor-pointer flex-1">
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        ~{option.cubicYards} cubic yards
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Add-ons */}
            {addonsQuery.data && addonsQuery.data.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Add-ons (optional)</Label>
                <div className="space-y-2">
                  {addonsQuery.data.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex items-start space-x-3 border rounded-lg p-4"
                    >
                      <Checkbox
                        id={`addon-${addon.id}`}
                        checked={selectedAddons.includes(addon.id)}
                        onCheckedChange={() => toggleAddon(addon.id)}
                      />
                      <Label
                        htmlFor={`addon-${addon.id}`}
                        className="cursor-pointer flex-1"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{addon.name}</div>
                            <div className="text-sm text-gray-600">{addon.description}</div>
                          </div>
                          <div className="font-semibold text-blue-600">
                            +${addon.price.toFixed(2)}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your quote will include disposal costs up to the cap for your load size. 
                Any additional disposal fees will be reimbursed with receipt.
              </AlertDescription>
            </Alert>

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
              disabled={!volumeTier || calculating || calculateQuote.isPending}
              className="w-full"
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
