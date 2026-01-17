import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, MapPin, Calendar, Clock } from "lucide-react";

export default function QuoteReview() {
  const [, setLocation] = useLocation();
  const [quote, setQuote] = useState<any>(null);
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    // Load quote from sessionStorage
    const storedQuote = sessionStorage.getItem("currentQuote");
    const storedAddress = sessionStorage.getItem("quoteAddress");

    if (!storedQuote) {
      // No quote found, redirect to start
      setLocation("/quote");
      return;
    }

    setQuote(JSON.parse(storedQuote));
    setAddress(storedAddress || "");
  }, [setLocation]);

  const handleBookService = () => {
    // TODO: Implement checkout flow
    setLocation("/checkout");
  };

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  const isHaulAway = quote.serviceType === "HAUL_AWAY";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Your Quote is Ready!</h1>
          <p className="text-gray-600">
            Review the details below and book your service when you're ready
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Quote Details */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium">Service Location</div>
                    <div className="text-sm text-gray-600">{address}</div>
                    <div className="text-sm text-gray-500">{quote.serviceAreaName}</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="font-medium mb-2">
                    {isHaulAway ? "Haul Away Service" : "Labor Only Service"}
                  </div>
                  {isHaulAway ? (
                    <div className="text-sm text-gray-600">
                      <div>Load Size: {quote.volumeTierLabel}</div>
                      <div>Volume: {quote.volumeCubicYards} cubic yards</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <div>Duration: {quote.hours} hours</div>
                      <div>Rate: ${quote.hourlyRate}/hour</div>
                    </div>
                  )}
                </div>

                {isHaulAway && quote.disposalCapMessage && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      {quote.disposalCapMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {!isHaulAway && quote.note && (
                  <Alert>
                    <AlertDescription className="text-sm">{quote.note}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                    1
                  </div>
                  <div>
                    <div className="font-medium">Book & Pay</div>
                    <div className="text-sm text-gray-600">
                      Secure your booking with payment
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                    2
                  </div>
                  <div>
                    <div className="font-medium">Driver Assignment</div>
                    <div className="text-sm text-gray-600">
                      We'll find the best available driver for your job
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                    3
                  </div>
                  <div>
                    <div className="font-medium">Service Day</div>
                    <div className="text-sm text-gray-600">
                      Track your driver in real-time and get the job done
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Price Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quote.lineItems.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.description}</span>
                    <span className="font-medium">${item.amount.toFixed(2)}</span>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">${quote.total.toFixed(2)}</span>
                </div>

                <Button onClick={handleBookService} className="w-full" size="lg">
                  Book This Service
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setLocation("/quote")}
                  className="w-full"
                >
                  Start Over
                </Button>

                <div className="text-xs text-center text-gray-500 pt-2">
                  <p>✓ No hidden fees</p>
                  <p>✓ Insured drivers</p>
                  <p>✓ Same-day service available</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
