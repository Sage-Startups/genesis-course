import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Crown, Zap, Rocket, Gift, Star, Building } from "lucide-react";
import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";

const Plan = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      icon: <Gift className="h-6 w-6" />,
      features: [
        "1 course per month",
        "Basic AI course generation",
        "Standard templates",
        "Email support"
      ],
      buttonText: "Continue Free",
      variant: "outline" as const,
      popular: false
    },
    {
      name: "Basic",
      price: "$49",
      period: "month",
      description: "For individual creators",
      icon: <Star className="h-6 w-6" />,
      features: [
        "3 courses per month",
        "Advanced AI generation",
        "Custom templates",
        "Priority email support",
        "Advanced analytics",
        "Export to PDF/SCORM"
      ],
      buttonText: "Choose Basic",
      variant: "default" as const,
      popular: false
    },
    {
      name: "Premium",
      price: "$199",
      period: "month",
      description: "For professional educators",
      icon: <Crown className="h-6 w-6" />,
      features: [
        "Unlimited courses",
        "Premium AI models",
        "White-label options",
        "Live chat support",
        "Advanced integrations",
        "Team collaboration",
        "Custom branding"
      ],
      buttonText: "Choose Premium",
      variant: "hero" as const,
      popular: true
    },
    {
      name: "Lifetime",
      price: "$1999",
      period: "lifetime",
      description: "One-time payment, lifetime access",
      icon: <Crown className="h-6 w-6" />,
      features: [
        "Unlimited courses",
        "Custom AI training",
        "Dedicated account manager",
        "24/7 phone support",
        "API access",
        "SSO integration",
        "Custom deployment",
        "Advanced security"
      ],
      buttonText: "Choose Lifetime",
      variant: "default" as const,
      popular: false
    }
  ];

  const handleTierSelection = async (tierName: string) => {
    if (tierName === "Free") {
      // For free tier, just redirect to main page
      navigate("/");
      return;
    }

    // For paid tiers, you would implement Stripe checkout here
    console.log(`Selected tier: ${tierName}`);
    // TODO: Implement Stripe checkout integration
    
    // For now, just redirect to home
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-6 py-20">
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-primary-foreground hover:text-accent-light transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Choose Your <span className="bg-gradient-accent bg-clip-text text-transparent">Perfect Plan</span>
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Welcome {user?.email}! Select the plan that best fits your course creation needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`relative ${tier.popular ? 'ring-2 ring-accent shadow-glow' : 'shadow-strong'} bg-card/95 backdrop-blur-sm`}>
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-accent text-accent-foreground">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-lg ${tier.popular ? 'bg-gradient-accent' : 'bg-secondary'}`}>
                    {tier.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {tier.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">/{tier.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-success shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={tier.variant}
                  className="w-full"
                  onClick={() => handleTierSelection(tier.name)}
                >
                  {tier.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-white/80 text-sm">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Plan;