import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Zap, Star } from "lucide-react";

const pricingPlans = [
  {
    name: "Free Trial",
    price: "$0",
    period: "one-time",
    description: "Perfect for testing our platform",
    features: [
      "1 course generation",
      "All export formats (PDF, DOCX, TXT)",
      "Basic course editor",
      "7-day access",
      "Email support"
    ],
    cta: "Start Free Trial",
    variant: "outline" as const,
    popular: false,
    icon: Zap
  },
  {
    name: "Start",
    price: "$49",
    period: "per month",
    description: "Great for individual creators",
    features: [
      "3 courses per month",
      "All export formats",
      "Advanced course editor",
      "CRM dashboard",
      "Priority email support",
      "Course analytics",
      "Custom branding"
    ],
    cta: "Get Started",
    variant: "default" as const,
    popular: false,
    icon: Star
  },
  {
    name: "Pro",
    price: "$199",
    period: "per month",
    description: "For professional educators & businesses",
    features: [
      "Unlimited course generation",
      "All export formats",
      "Advanced course editor",
      "Full CRM dashboard",
      "Priority support + phone",
      "Advanced analytics",
      "White-label options",
      "API access",
      "Team collaboration"
    ],
    cta: "Go Pro",
    variant: "hero" as const,
    popular: true,
    icon: Crown
  },
  {
    name: "Lifetime",
    price: "$1,999",
    period: "one-time payment",
    description: "Unlimited access forever",
    features: [
      "Unlimited course generation",
      "All export formats",
      "Advanced course editor",
      "Full CRM dashboard",
      "Lifetime updates",
      "Premium support",
      "All future features",
      "Commercial license",
      "Reseller rights"
    ],
    cta: "Get Lifetime Access",
    variant: "premium" as const,
    popular: false,
    icon: Crown
  }
];

const Pricing = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Choose Your
            <span className="block bg-gradient-accent bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start with our free trial and upgrade as your course creation needs grow. 
            All plans include our core AI generation technology.
          </p>
        </div>

        {/* Pricing grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Card
                key={index}
                className={`relative p-8 text-center transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular 
                    ? 'shadow-glow border-accent/50 bg-gradient-card' 
                    : 'shadow-medium hover:shadow-strong bg-gradient-card'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium shadow-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan icon and name */}
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-accent rounded-lg mb-4">
                    <Icon className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <span className="text-4xl md:text-5xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">/{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 text-left">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <Button 
                  variant={plan.variant} 
                  size="lg" 
                  className="w-full text-base py-3 h-auto"
                >
                  {plan.cta}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            All plans include a 30-day money-back guarantee. Need a custom plan?{" "}
            <Button variant="link" className="p-0 h-auto text-accent">
              Contact us
            </Button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;